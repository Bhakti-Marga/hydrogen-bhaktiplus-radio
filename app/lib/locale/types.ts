/**
 * Country & Language Types
 *
 * These types define the core concepts for our internationalization system.
 * Country (country/market) and Language are separate, independent concepts.
 */

/**
 * Supported country codes (ISO 3166-1 alpha-2, lowercase)
 */
export type CountryCode =
  | "us"
  | "gb"
  | "ca"
  | "in"
  | "fr"
  | "de"
  | "es"
  | "it"
  | "pt"
  | "br"
  | "jp"
  | "cn"
  | "ru"
  | "pl"
  | "cz"
  | "gr"
  | "ro";

/**
 * Supported language codes (ISO 639-1, lowercase)
 */
export type LanguageCode =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "hi"
  | "ja"
  | "zh"
  | "ru"
  | "pl"
  | "cs"
  | "el"
  | "ro";

/**
 * Supported currency codes (ISO 4217)
 */
export type CurrencyCode =
  | "USD"
  | "GBP"
  | "CAD"
  | "INR"
  | "EUR"
  | "BRL"
  | "JPY"
  | "CNY"
  | "RUB"
  | "PLN"
  | "CZK"
  | "RON";

/**
 * Country (Country/Market) definition
 *
 * A country determines:
 * - Currency and pricing
 * - Product availability
 * - Shipping options
 * - Legal/regulatory content
 */
export interface Country {
  code: CountryCode;
  name: string;
  nativeName: string;
  currency: CurrencyCode;
}

/**
 * Language definition
 *
 * A language determines:
 * - UI text and translations
 * - Content language preference
 */
export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  shopifyCode: string;
}

/**
 * Parsed URL state
 */
export interface ParsedLocale {
  countryCode: CountryCode;
  language: LanguageCode;
  restOfPath: string;
}

/**
 * User's country/language preferences (stored in cookies)
 */
export interface UserLocalePreferences {
  countryCode: CountryCode | null;
  languageCode: LanguageCode | null;
  countryConfirmed: boolean;
}

/**
 * Shopify i18n format
 */
export interface ShopifyI18n {
  language: string;
  country: string;
}
