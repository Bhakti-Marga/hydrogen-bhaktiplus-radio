// Virtual entry point for the app
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import * as remixBuild from "virtual:react-router/server-build";
import { storefrontRedirect } from "@shopify/hydrogen";
import { createRequestHandler } from "@shopify/hydrogen/oxygen";

/**
 * IMPORTANT: Sentry import strategy for Cloudflare Workers with MiniOxygen
 *
 * This file runs in Cloudflare Workers (production) and MiniOxygen (local development).
 * There's a critical compatibility issue with how Sentry packages are imported:
 *
 * Problem:
 * - Importing from @sentry/cloudflare directly causes Vite to pull in async.ts
 * - async.ts contains Node.js-specific async_hooks which breaks MiniOxygen
 * - MiniOxygen is Shopify's local development server that emulates Cloudflare Workers
 *
 * Solution:
 * - Import from specific submodules: @sentry/cloudflare/request (for wrapRequestHandler)
 * - Import from @sentry/core (for captureException)
 * - These submodules avoid pulling in the problematic async.ts dependency
 *
 * DO NOT import from:
 * - @sentry/cloudflare (breaks MiniOxygen)
 * - @sentry/react-router (resolves to client build in this context)
 *
 * This ensures compatibility with both local development and production deployment.
 */
import { wrapRequestHandler } from "@sentry/cloudflare/request";
import { captureException } from "@sentry/core";

import { createHydrogenRouterContext } from "~/lib/context";
import {
  generateRequestId,
  logRequestIn,
  logRequestOut,
  logRedirect,
  getDebugParams,
} from "~/lib/logger";
import {
  parseLocaleFromRequest,
  hasCountryCodePrefix,
} from "~/lib/locale";
import { getRequestGeolocation } from "~/lib/geo";

/** Cookie name for preferred language (essential cookie) */
const PREFERRED_LANGUAGE_COOKIE = 'preferredLanguage';

/**
 * Parse a specific cookie value from the Cookie header.
 */
function getCookieValue(request: Request, cookieName: string): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split('=');
    if (name === cookieName) {
      return valueParts.join('=') || null;
    }
  }
  return null;
}

/**
 * Look up regionId from country code using backend API.
 * Falls back to EU (region 1) if lookup fails.
 */
async function getRegionIdForCountry(
  countryCode: string | null,
  env: Env,
): Promise<number> {
  const DEFAULT_REGION_ID = 1; // EU

  if (!countryCode) {
    return DEFAULT_REGION_ID;
  }

  try {
    const url = new URL('/meta/region/by-country/' + countryCode.toUpperCase(), env.MEDIA_API_URL);
    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': env.MEDIA_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`[server] Region lookup failed for ${countryCode}: ${response.status}`);
      return DEFAULT_REGION_ID;
    }

    const data = await response.json() as { regionId?: number | null };
    return data.regionId ?? DEFAULT_REGION_ID;
  } catch (error) {
    console.warn(`[server] Region lookup error for ${countryCode}:`, error);
    return DEFAULT_REGION_ID;
  }
}

/**
 * Export a fetch handler in module format.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    return wrapRequestHandler(
      {
        options: {
          dsn: env.SENTRY_DSN || '',
          environment: env.ENVIRONMENT || 'development',
          tracesSampleRate: 0.05,
          integrations: [],
          enableLogs: false
        },
        request: request as any,
        context: executionContext
      },
      async () => {
        const startTime = Date.now();
        const url = new URL(request.url);
        const requestId = generateRequestId();

        // Extract debug params for redirect chain tracking
        const debugParams = getDebugParams(url);

        // Parse country and language from URL (needed for logging)
        const { countryCode, language } = parseLocaleFromRequest(request);

        // Log incoming request - single line format
        logRequestIn({
          id: requestId,
          method: request.method,
          path: url.pathname,
          query: url.search || undefined,
          region: countryCode,
          lang: language,
          debugFrom: debugParams.debugFrom,
          debugRid: debugParams.debugRid,
        });

        try {
          // Get detected country from geolocation (oxygen-buyer-country header)
          const geoForContext = getRequestGeolocation(request);
          const detectedCountry = geoForContext.countryCode?.toUpperCase() || null;

          // Look up regionId from locale cascade: URL > GeoIP > default
          // - If URL has locale prefix (e.g., /de/satsangs), use that country code
          // - Otherwise, use GeoIP detected country for anonymous users
          // - Logged-in users with stampedRegionId will override this in user-scoped API instances
          const urlHasLocalePrefix = hasCountryCodePrefix(url.pathname);
          const countryForRegion = urlHasLocalePrefix ? countryCode : (detectedCountry || countryCode);
          const regionId = await getRegionIdForCountry(countryForRegion, env);

          // Read preferred language from cookie (essential cookie for all users)
          const preferredLanguageCookie = getCookieValue(request, PREFERRED_LANGUAGE_COOKIE);

          // Create context object
          // Note: mediaApi is NOT created here - use userScopedMediaApi from middleware instead
          // Note: Country preference is not persisted in cookies.
          // For logged-out users, we show a suggestion banner per-session.
          // For logged-in users, country will be determined by billing address.
          // IMPORTANT: urlCountryCode/urlLanguage are raw URL-parsed values.
          // Use context.get(localeContext) for the determined locale with user preferences.
          const additionalContext = {
            urlCountryCode: countryCode,
            urlLanguage: language,
            detectedCountry,
            regionId,
            preferredLanguageCookie,
          };

          // Create Hydrogen context once (creates session, cache, storefront/customer account clients)
          const hydrogenContext = await createHydrogenRouterContext(
            request,
            env,
            executionContext,
            additionalContext,
          );

          /**
           * Create a React Router request handler and pass
           * Hydrogen's Storefront client to the loader context.
           */
          const handleRequest = createRequestHandler({
            build: remixBuild,
            mode: process.env.NODE_ENV,
            getLoadContext: () => hydrogenContext,
          });

          const response = await handleRequest(request);
          const duration = Date.now() - startTime;

          // Check if response is a redirect
          const isRedirect = response.status >= 300 && response.status < 400;
          const redirectLocation = response.headers.get('Location');

          if (isRedirect && redirectLocation) {
            // Log redirect from route handler
            logRedirect({
              id: requestId,
              from: url.pathname,
              to: redirectLocation,
              status: response.status,
              reason: 'route_handler',
              region: countryCode,
              lang: language,
            });
          }

          // Log completed request - single line format
          logRequestOut({
            id: requestId,
            method: request.method,
            path: url.pathname,
            status: response.status,
            duration,
          });

          if (hydrogenContext.session.isPending) {
            response.headers.set(
              "Set-Cookie",
              await hydrogenContext.session.commit(),
            );
          }

          if (response.status === 404) {
            /**
             * Check for redirects only when there's a 404 from the app.
             * If the redirect doesn't exist, then `storefrontRedirect`
             * will pass through the 404 response.
             */
            return storefrontRedirect({
              request,
              response,
              storefront: hydrogenContext.storefront,
            });
          }

          return response;
        } catch (error) {
          const duration = Date.now() - startTime;

          // Log error request - single line format
          logRequestOut({
            id: requestId,
            method: request.method,
            path: url.pathname,
            status: 500,
            duration,
            error: error instanceof Error ? error.message : String(error),
          });

          captureException(error);
          return new Response("An unexpected error occurred", { status: 500 });
        }
      }
    );
  },
};
