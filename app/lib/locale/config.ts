/**
 * Country & Language Configuration
 *
 * Single source of truth for all supported countries and languages.
 */

import type { Country, CountryCode, LanguageCode } from "./types";

/**
 * Default country when none specified (bare domain `/`)
 */
export const DEFAULT_COUNTRY: CountryCode = "us";

/**
 * Default language (used as fallback)
 */
export const DEFAULT_LANGUAGE: LanguageCode = "en";

/**
 * All supported countries with their configuration
 */
export const SUPPORTED_COUNTRIES: Country[] = [
  { code: "us", name: "United States", nativeName: "United States", currency: "USD" },
  { code: "gb", name: "United Kingdom", nativeName: "United Kingdom", currency: "GBP" },
  { code: "ca", name: "Canada", nativeName: "Canada", currency: "CAD" },
  { code: "in", name: "India", nativeName: "भारत", currency: "INR" },
  { code: "fr", name: "France", nativeName: "France", currency: "EUR" },
  { code: "de", name: "Germany", nativeName: "Deutschland", currency: "EUR" },
  { code: "es", name: "Spain", nativeName: "España", currency: "EUR" },
  { code: "it", name: "Italy", nativeName: "Italia", currency: "EUR" },
  { code: "pt", name: "Portugal", nativeName: "Portugal", currency: "EUR" },
  { code: "br", name: "Brazil", nativeName: "Brasil", currency: "BRL" },
  { code: "jp", name: "Japan", nativeName: "日本", currency: "JPY" },
  { code: "cn", name: "China", nativeName: "中国", currency: "CNY" },
  { code: "ru", name: "Russia", nativeName: "Россия", currency: "RUB" },
  { code: "pl", name: "Poland", nativeName: "Polska", currency: "PLN" },
  { code: "cz", name: "Czech Republic", nativeName: "Česko", currency: "CZK" },
  { code: "gr", name: "Greece", nativeName: "Ελλάδα", currency: "EUR" },
  { code: "ro", name: "Romania", nativeName: "România", currency: "RON" },
];

/**
 * Valid language codes for URL validation
 * Note: Full language details (name, nativeName) are fetched from Media API
 */
export const VALID_LANGUAGE_CODES: Set<string> = new Set([
  "en", "es", "fr", "de", "it", "pt", "hi", "ja", "zh", "ru", "pl", "cs", "el", "ro",
  // Additional languages supported by Media API
  "bg", "hr", "nl", "hu", "ko", "lt", "mk", "sr", "sk", "sl", "sv", "tr", "uk", "vi",
  "ar", "he",
]);

/**
 * Quick lookup map for countries
 */
export const COUNTRY_MAP = new Map<string, Country>(
  SUPPORTED_COUNTRIES.map((c) => [c.code, c]),
);

/**
 * Get country by code
 */
export function getCountry(code: string): Country | undefined {
  return COUNTRY_MAP.get(code.toLowerCase());
}

/**
 * Check if a country code is valid
 */
export function isValidCountryCode(code: string): code is CountryCode {
  return COUNTRY_MAP.has(code.toLowerCase());
}

/**
 * Check if a language code is valid
 */
export function isValidLanguage(code: string): code is LanguageCode {
  return VALID_LANGUAGE_CODES.has(code.toLowerCase());
}

/**
 * Get the effective language from a language code.
 * If specified language is valid, use it; otherwise use global default.
 */
export function getEffectiveLanguage(
  languageCode: LanguageCode | null,
): LanguageCode {
  if (languageCode && isValidLanguage(languageCode)) {
    return languageCode;
  }

  return DEFAULT_LANGUAGE;
}
