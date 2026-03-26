/**
 * Shopify Integration Utilities
 *
 * Maps our country/language system to Shopify's i18n format.
 */

import type { CountryCode, LanguageCode, ShopifyI18n } from "./types";
import type {
  LanguageCode as ShopifyLanguageCode,
  CountryCode as ShopifyCountryCode,
} from "@shopify/hydrogen/storefront-api-types";
import { getCountry } from "./config";

/**
 * Special language codes that require regional variants for Shopify @inContext
 * 
 * Shopify uses underscore-separated language codes for regional variants:
 * - PT_PT, PT_BR for Portuguese
 * - ZH_CN, ZH_TW for Chinese
 * 
 * The language code itself contains the region (e.g., ZH_CN), and we also
 * pass the country for proper context.
 */
const SHOPIFY_LOCALE_OVERRIDES: Record<string, { language: ShopifyLanguageCode; country: ShopifyCountryCode }> = {
  pt: { language: 'PT_PT' as ShopifyLanguageCode, country: 'PT' as ShopifyCountryCode },  // Portuguese (Portugal)
  zh: { language: 'ZH_CN' as ShopifyLanguageCode, country: 'CN' as ShopifyCountryCode },  // Chinese (Simplified)
};

/**
 * Get Shopify locale parameters for @inContext directive
 * 
 * Some languages like Portuguese (pt-PT) and Chinese (zh-CN) require BOTH
 * language AND a specific country code to return correct translations.
 * 
 * @param languageCode - The user's language code (e.g., 'pt', 'en', 'de')
 * @returns Object with language (always) and country (when required for the language)
 */
export function getShopifyLocaleForTranslations(languageCode: string): { 
  language: ShopifyLanguageCode; 
  country?: ShopifyCountryCode;
} {
  const override = SHOPIFY_LOCALE_OVERRIDES[languageCode.toLowerCase()];
  if (override) {
    return override;
  }
  return { language: languageCode.toUpperCase() as ShopifyLanguageCode };
}

/**
 * Convert our country/language to Shopify's i18n format
 *
 * Shopify expects:
 * - language: LanguageCode (uppercase, e.g., "EN", "FR")
 * - country: CountryCode (uppercase, e.g., "US", "FR")
 */
export function toShopifyI18n(countryCode: CountryCode, languageCode: LanguageCode): ShopifyI18n {
  return {
    language: languageCode.toUpperCase(),
    country: countryCode.toUpperCase(),
  };
}

/**
 * Get Shopify-compatible language code for translations query
 *
 * Shopify uses uppercase ISO 639-1 codes (e.g., "EN", "FR", "DE")
 * This is a simple uppercase conversion since Shopify codes match ISO 639-1
 */
export function getShopifyLanguageCode(
  languageCode: LanguageCode,
  _countryCode?: CountryCode,
): string {
  return languageCode.toUpperCase();
}

/**
 * Get the locale string for the Media API
 *
 * The Media API expects format like "en-US", "fr-FR"
 */
export function toMediaApiLocale(countryCode: CountryCode, languageCode: LanguageCode): string {
  return `${languageCode.toLowerCase()}-${countryCode.toUpperCase()}`;
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  countryCode: CountryCode,
  languageCode: LanguageCode,
): string {
  const country = getCountry(countryCode);
  if (!country) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  // Create locale string for Intl (e.g., "en-US", "fr-FR")
  const intlLocale = `${languageCode}-${countryCode.toUpperCase()}`;

  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: country.currency,
  }).format(amount);
}
