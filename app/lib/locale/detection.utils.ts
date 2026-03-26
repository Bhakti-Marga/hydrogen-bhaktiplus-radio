/**
 * Locale Detection Utilities
 *
 * Handles automatic detection of country and language for anonymous users
 * based on GeoIP (oxygen-buyer-country header) and Accept-Language header.
 */

import type { CountryCode, LanguageCode } from "./types";
import {
  isValidCountryCode,
  isValidLanguage,
  DEFAULT_LANGUAGE,
} from "./config";

/**
 * Parse Accept-Language header entries with their quality values
 *
 * Accept-Language format: "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7"
 * Returns entries sorted by quality (highest first)
 */
function parseAcceptLanguageEntries(header: string | null): Array<{ lang: string; country: string | null; q: number }> {
  if (!header) return [];

  return header
    .split(",")
    .map((part) => {
      const [langTag, qPart] = part.trim().split(";");
      const q = qPart ? parseFloat(qPart.replace("q=", "")) : 1.0;
      const parts = langTag.split("-");
      const lang = parts[0].toLowerCase();
      const country = parts[1]?.toLowerCase() || null;
      return { lang, country, q };
    })
    .sort((a, b) => b.q - a.q);
}

/**
 * Parse Accept-Language header and return best matching language code
 *
 * Accept-Language format: "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7"
 */
export function parseAcceptLanguage(header: string | null): LanguageCode | null {
  const entries = parseAcceptLanguageEntries(header);

  // Return first valid language code
  for (const { lang } of entries) {
    if (isValidLanguage(lang)) {
      return lang as LanguageCode;
    }
  }

  return null;
}

/**
 * Extract country from Accept-Language header country codes
 * e.g., "de-DE" → "de", "en-GB" → "gb", "en-US" → "us"
 */
export function parseAcceptLanguageCountry(header: string | null): CountryCode | null {
  const entries = parseAcceptLanguageEntries(header);

  // Return first valid country from country codes
  for (const { country } of entries) {
    if (country && isValidCountryCode(country)) {
      return country as CountryCode;
    }
  }

  return null;
}

/**
 * Map GeoIP country code to supported country code
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "FR", "DE")
 * @returns Matching CountryCode or null if unsupported
 */
export function mapGeoIpToCountryCode(
  countryCode: string | null,
): CountryCode | null {
  if (!countryCode) return null;

  const normalized = countryCode.toLowerCase();
  if (isValidCountryCode(normalized)) {
    return normalized as CountryCode;
  }

  return null;
}

/**
 * Determine best country and language for an anonymous user
 *
 * Priority for country detection:
 * 1. GeoIP country header (oxygen-buyer-country)
 * 2. Accept-Language country code (e.g., "de-DE" → "de")
 * 3. null (no redirect, let user stay on root)
 */
export function detectLocaleForAnonymousUser(
  geoipCountry: string | null,
  acceptLanguageHeader: string | null,
): { countryCode: CountryCode | null; language: LanguageCode } {
  // 1. Try to determine country from GeoIP
  let countryCode = mapGeoIpToCountryCode(geoipCountry);

  // 2. If no GeoIP, try to extract country from Accept-Language country code
  if (!countryCode) {
    countryCode = parseAcceptLanguageCountry(acceptLanguageHeader);
  }

  // 3. Determine language from Accept-Language
  const preferredLanguage = parseAcceptLanguage(acceptLanguageHeader);

  // 4. Return country with preferred language or default
  return { countryCode, language: preferredLanguage || DEFAULT_LANGUAGE };
}
