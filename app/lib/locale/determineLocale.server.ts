/**
 * Locale Determination Utility for Route Loaders
 *
 * This module provides a shared utility for determining the correct locale
 * in child route loaders. It implements the same cascade as the root loader
 * but can be called from any route loader.
 *
 * LANGUAGE PRIORITY (highest to lowest):
 * 1. URL explicit language (always wins if present)
 * 2. Server preferences (API-backed preferredLanguage for logged-in users)
 * 3. Cookie preference (essential cookie for all users)
 * 4. Country's default language
 *
 * COUNTRY PRIORITY (highest to lowest):
 * 1. URL explicit country
 * 2. User-selected country (from CountrySelector, persisted in backend)
 * 3. GeoIP detection
 * 4. Default fallback
 */

import type { AppLoadContext } from "react-router";
import type { CountryCode, LanguageCode } from "./types";
import type { SubscriptionInfo } from "~/lib/api/types";
import { isValidCountryCode, getEffectiveLanguage } from "./config";
import { hasCountryCodePrefix } from "./url.utils";
import { localeContext, userProfileContext } from "~/lib/middleware";

/**
 * Locale determination result
 */
export interface DeterminedLocale {
  countryCode: CountryCode;
  language: LanguageCode;
  source: 'url' | 'user_selection' | 'user_preferences' | 'cookie' | 'geoip' | 'default';
}

/**
 * Determine locale using the unified cascade.
 *
 * This is the core logic that applies the priority cascade for both
 * country and language determination.
 */
export function determineLocale(
  urlCountryCode: CountryCode | null,
  urlLanguage: LanguageCode | null,
  userProfile: SubscriptionInfo | null | undefined,
  detectedCountry: string | null,
  cookiePreferredLanguage: string | null,
): DeterminedLocale {
  // Get preferred language from userProfile (from /user/profile API - already fetched in getAuthenticatedUser)
  // This is more efficient than fetching userPreferences separately
  const serverPreferredLanguage = userProfile?.preferredLanguage?.toLowerCase() as LanguageCode | null;
  // Cookie preference (for all users - essential cookie)
  const cookieLanguage = cookiePreferredLanguage?.toLowerCase() as LanguageCode | null;
  // Combined preference: server > cookie
  const preferredLanguage = serverPreferredLanguage || cookieLanguage;

  // 1. URL explicit locale (highest priority)
  if (urlCountryCode && isValidCountryCode(urlCountryCode)) {
    // For language: URL language > server preference > cookie > country default
    if (urlLanguage) {
      return {
        countryCode: urlCountryCode,
        language: urlLanguage,
        source: 'url',
      };
    }
    // No URL language, use preferences or country default
    const language = preferredLanguage || getEffectiveLanguage(null);
    return {
      countryCode: urlCountryCode,
      language,
      source: serverPreferredLanguage ? 'user_preferences' : cookieLanguage ? 'cookie' : 'url',
    };
  }

  // 2. User-selected country (from CountrySelector, persisted in backend as userSelectCountryCode)
  if (userProfile?.userSelectCountryCode) {
    const countryCodeLower = userProfile.userSelectCountryCode.toLowerCase();
    if (isValidCountryCode(countryCodeLower)) {
      const language = preferredLanguage || getEffectiveLanguage(null);
      return {
        countryCode: countryCodeLower as CountryCode,
        language,
        source: serverPreferredLanguage ? 'user_preferences' : cookieLanguage ? 'cookie' : 'user_selection',
      };
    }
  }

  // 3. GeoIP detection
  if (detectedCountry) {
    const countryCodeLower = detectedCountry.toLowerCase();
    if (isValidCountryCode(countryCodeLower)) {
      const language = preferredLanguage || getEffectiveLanguage(null);
      return {
        countryCode: countryCodeLower as CountryCode,
        language,
        source: serverPreferredLanguage ? 'user_preferences' : cookieLanguage ? 'cookie' : 'geoip',
      };
    }
  }

  // 4. Default fallback
  return {
    countryCode: 'us',
    language: preferredLanguage || 'en',
    source: serverPreferredLanguage ? 'user_preferences' : cookieLanguage ? 'cookie' : 'default',
  };
}

/**
 * Options for getDeterminedLocale
 */
export interface GetDeterminedLocaleOptions {
  /**
   * If provided, the user profile data will be used for locale determination.
   * Pass this if you've already fetched the user profile to avoid duplicate fetches.
   */
  userProfile?: SubscriptionInfo | null;
}

/**
 * Get the determined locale for a route loader.
 *
 * This function first tries to get the locale from middleware context (fastest path).
 * If middleware context is not available, it falls back to running the full cascade.
 *
 * IMPORTANT: With the middleware pattern, you should prefer using context.get(localeContext)
 * directly in your loaders instead of calling this function.
 *
 * @param context - The app load context
 * @param request - The current request (only needed for fallback path)
 * @param options - Optional configuration
 * @returns The determined locale with source information
 *
 * @example
 * ```typescript
 * // Preferred: Use middleware context directly
 * import { localeContext } from '~/lib/middleware';
 *
 * export async function loader({ context }: LoaderFunctionArgs) {
 *   const { language, countryCode } = context.get(localeContext);
 *   // ...
 * }
 *
 * // Legacy: Use this helper (works with or without middleware)
 * export async function loader({ context, request }: LoaderFunctionArgs) {
 *   const { language, countryCode } = await getDeterminedLocale(context, request);
 *   // ...
 * }
 * ```
 */
export async function getDeterminedLocale(
  context: AppLoadContext,
  request: Request,
  options?: GetDeterminedLocaleOptions,
): Promise<DeterminedLocale> {
  // Try to get from middleware context first (faster, no async)
  try {
    const localeFromContext = (context as any).get(localeContext);
    if (localeFromContext) {
      return localeFromContext;
    }
  } catch {
    // context.get not available or localeContext not set
  }

  // Fallback: run the locale cascade manually
  const {
    countryCode: contextCountryCode,
    language: contextLanguage,
    detectedCountry,
    preferredLanguageCookie,
  } = context;

  // Check if URL has explicit locale
  const url = new URL(request.url);
  const urlHasLocalePrefix = hasCountryCodePrefix(url.pathname);

  const urlLocale = urlHasLocalePrefix
    ? { countryCode: contextCountryCode as CountryCode, language: contextLanguage as LanguageCode }
    : null;

  // Get user profile - either from options, middleware context, or null
  let userProfile = options?.userProfile;
  if (userProfile === undefined) {
    try {
      userProfile = (context as any).get(userProfileContext);
    } catch {
      userProfile = null;
    }
  }

  return determineLocale(
    urlLocale?.countryCode ?? null,
    urlLocale?.language ?? null,
    userProfile,
    detectedCountry,
    preferredLanguageCookie,
  );
}
