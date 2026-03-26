/**
 * Country & Language System
 *
 * This module provides a clean separation of country (country/market) and language.
 *
 * URL Format: /{countryCode}/{language?}/path
 *
 * Examples:
 * - /us/          → United States, English
 * - /fr/          → France, French
 * - /ca/          → Canada, English
 * - /ca/fr/       → Canada, French
 * - /in/          → India, English
 * - /in/hi/       → India, Hindi
 */

// Types
export type {
  CountryCode,
  LanguageCode,
  CurrencyCode,
  Country,
  Language,
  ParsedLocale,
  UserLocalePreferences,
  ShopifyI18n,
} from "./types";

// Config
export {
  DEFAULT_COUNTRY,
  DEFAULT_LANGUAGE,
  SUPPORTED_COUNTRIES,
  COUNTRY_MAP,
  VALID_LANGUAGE_CODES,
  getCountry,
  isValidCountryCode,
  isValidLanguage,
  getEffectiveLanguage,
} from "./config";

// URL utilities
export {
  parseLocaleFromUrl,
  parseLocaleFromRequest,
  buildUrl,
  getUrlPrefix,
  hasCountryCodePrefix,
  stripLocalePrefix,
  replaceLocale,
  validateUrlLocale,
  type UrlLocaleValidation,
} from "./url.utils";

// Shopify utilities
export {
  toShopifyI18n,
  getShopifyLanguageCode,
  getShopifyLocaleForTranslations,
  toMediaApiLocale,
  formatCurrency,
} from "./shopify.utils";

// Detection utilities
export {
  parseAcceptLanguage,
  parseAcceptLanguageCountry,
  mapGeoIpToCountryCode,
  detectLocaleForAnonymousUser,
} from "./detection.utils";
