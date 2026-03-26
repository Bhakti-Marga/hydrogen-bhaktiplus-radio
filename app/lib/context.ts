import { createHydrogenContext } from "@shopify/hydrogen";
import { AppSession } from "~/lib/session";
import { CART_QUERY_FRAGMENT } from "~/lib/fragments";
import type { CountryCode, LanguageCode } from "~/lib/locale";
import {
  toShopifyI18n,
} from "~/lib/locale";

/**
 * Additional context passed to all loaders
 *
 * IMPORTANT: For locale data, use context.get(localeContext) from middleware.
 * The urlCountryCode/urlLanguage values below are raw URL-parsed values and
 * do NOT include user preferences or cookie values.
 *
 * Note: We don't persist country preference in cookies. For logged-out users,
 * we show a suggestion banner when detected country differs from URL country.
 * For logged-in users, country preference will come from their billing address.
 *
 * IMPORTANT: mediaApi is NOT included here. Use userScopedMediaApi from middleware
 * (via context.get(userScopedMediaApiContext)) to ensure correct regionId is used.
 */
interface AdditionalContext {
  /** URL-parsed country code - use context.get(localeContext) for determined locale */
  urlCountryCode: CountryCode;
  /** URL-parsed language - use context.get(localeContext) for determined locale */
  urlLanguage: LanguageCode;
  detectedCountry: string | null;
  regionId: number;
  /** User's preferred language from cookie (essential cookie for all users) */
  preferredLanguageCookie: string | null;
}

// Augment global Hydrogen context type
declare global {
  interface HydrogenAdditionalContext extends AdditionalContext {}
}

/**
 * The context implementation is separate from server.ts
 * so that type can be extracted for HydrogenRouterContext
 */
export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
  additionalContext: AdditionalContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open("hydrogen"),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  // Get Shopify i18n config from URL-parsed country/language
  const { urlCountryCode, urlLanguage } = additionalContext;
  const shopifyI18n = toShopifyI18n(urlCountryCode, urlLanguage);

  const i18nConfig: { language: string; country?: string } = {
    language: shopifyI18n.language,
    country: shopifyI18n.country,
  };

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      i18n: i18nConfig as any,
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
    },
    additionalContext,
  );

  return hydrogenContext;
}

// Re-export types for convenience
export type { AdditionalContext };
