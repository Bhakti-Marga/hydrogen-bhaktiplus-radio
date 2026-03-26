/**
 * Authentication and Locale Middleware
 *
 * This middleware runs once per request (in the root route) and sets context values
 * that all child loaders can access. It replaces the pattern of each route calling
 * getAuthenticatedUser() independently.
 *
 * What this middleware does:
 * 1. Determines locale FIRST using the cascade (URL > user preference > cookie > geoIP)
 * 2. Creates a bootstrap API for user profile fetching
 * 3. Calls getAuthenticatedUser() once per request
 * 4. Creates userScopedMediaApi with the CORRECT determined locale
 * 5. Sets context values for all child loaders to access
 *
 * Child loaders can access these values via context.get():
 *   const userProfile = context.get(userProfileContext);
 *   const mediaApi = context.get(userScopedMediaApiContext);
 *   const locale = context.get(localeContext);
 *
 * Performance benefits:
 * - Before: N loaders × (Shopify API + Media API) = 2N API calls per page load
 * - After: 1 middleware × (Shopify API + Media API) = 2 API calls per page load
 */

import type { MiddlewareFunction } from 'react-router';
import { getAuthenticatedUser } from '~/lib/auth.server';
import { determineLocale } from '~/lib/locale/determineLocale.server';
import { hasCountryCodePrefix, toMediaApiLocale } from '~/lib/locale';
import type { CountryCode, LanguageCode } from '~/lib/locale';
import { createUserScopedApi } from '~/lib/api/createUserScopedApi';
import { BhaktiMargMediaApi } from '~/lib/api';

/**
 * Cookie name for the "include unpublished content" flag.
 * This is synced from sessionStorage by the client-side admin controls.
 */
export const INCLUDE_UNPUBLISHED_COOKIE = 'bp_include_unpublished';
import {
  userProfileContext,
  userScopedMediaApiContext,
  userContext,
  subscriptionTierContext,
  videosInProgressCountContext,
  localeContext,
  type DeterminedLocaleContext,
} from './contexts';

/**
 * Authentication and locale middleware.
 *
 * This middleware:
 * 1. Determines locale FIRST using the cascade
 * 2. Calls getAuthenticatedUser() once per request
 * 3. Creates userScopedMediaApi with the determined locale
 * 4. Sets context values for all child loaders to access
 *
 * Child loaders can access these values via context.get():
 *   const userProfile = context.get(userProfileContext);
 *   const mediaApi = context.get(userScopedMediaApiContext);
 *   const locale = context.get(localeContext);
 */
export const authMiddleware: MiddlewareFunction = async ({
  request,
  context,
}) => {
  // Get existing context values from server.ts
  // Note: urlCountryCode/urlLanguage are URL-parsed values, not the final determined locale
  const {
    urlCountryCode,
    urlLanguage,
    detectedCountry,
    preferredLanguageCookie,
    regionId: contextRegionId,
    env,
  } = context;

  // Determine locale FIRST using cascade (before creating userScopedMediaApi)
  // This ensures the Media API uses the correct locale from user preferences/cookies,
  // not just what was parsed from the URL
  const url = new URL(request.url);
  const urlHasLocalePrefix = hasCountryCodePrefix(url.pathname);
  const urlLocale = urlHasLocalePrefix
    ? { countryCode: urlCountryCode as CountryCode, language: urlLanguage as LanguageCode }
    : null;

  // First pass: determine locale without userProfile (we don't have it yet)
  // This handles URL locale, detected country, and preferred language cookie
  const preliminaryLocale = determineLocale(
    urlLocale?.countryCode ?? null,
    urlLocale?.language ?? null,
    null, // userProfile not available yet
    detectedCountry,
    preferredLanguageCookie,
  );

  // Create a bootstrap API for fetching user profile
  // Uses preliminary locale - the profile fetch doesn't need user-specific locale
  const bootstrapLocale = toMediaApiLocale(
    preliminaryLocale.countryCode as CountryCode,
    preliminaryLocale.language as LanguageCode,
  );
  const bootstrapApi = new BhaktiMargMediaApi({
    baseUrl: env.MEDIA_API_URL,
    apiKey: env.MEDIA_API_KEY,
    apiVersion: env.MEDIA_API_VERSION,
    locale: bootstrapLocale,
    countryCode: preliminaryLocale.countryCode.toUpperCase(),
    regionId: contextRegionId ?? 1,
  });

  // Run auth flow once for this request
  const {
    user,
    subscriptionTier,
    videosInProgressCount,
    userProfile,
  } = await getAuthenticatedUser(context, env, request, bootstrapApi);

  // Second pass: re-determine locale with userProfile for the final result
  // This allows userProfile.preferredLanguage to be considered
  const determinedLocale = determineLocale(
    urlLocale?.countryCode ?? null,
    urlLocale?.language ?? null,
    userProfile,
    detectedCountry,
    preferredLanguageCookie,
  );

  // Create userScopedMediaApi with the CORRECT determined locale
  const finalLocale = toMediaApiLocale(
    determinedLocale.countryCode as CountryCode,
    determinedLocale.language as LanguageCode,
  );

  // Check for include unpublished content cookie (set by admin controls via sessionStorage sync)
  const cookieHeader = request.headers.get('Cookie') || '';
  const includeUnpublishedCookie = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith(`${INCLUDE_UNPUBLISHED_COOKIE}=`));
  const includeUnpublishedContent = includeUnpublishedCookie?.includes('true') ?? false;

  const userScopedMediaApi = createUserScopedApi(
    env,
    userProfile,
    finalLocale,
    determinedLocale.countryCode,
    contextRegionId ?? 1,
    { includeUnpublishedContent },
  );

  // Set context values for child loaders
  context.set(userProfileContext, userProfile);
  context.set(userScopedMediaApiContext, userScopedMediaApi);
  context.set(userContext, user);
  context.set(subscriptionTierContext, subscriptionTier);
  context.set(videosInProgressCountContext, videosInProgressCount);
  context.set(localeContext, determinedLocale as DeterminedLocaleContext);
};
