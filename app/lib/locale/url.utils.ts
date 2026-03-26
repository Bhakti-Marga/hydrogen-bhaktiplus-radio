/**
 * URL Parsing & Building Utilities
 *
 * Handles the Apple-style URL format: /{countryCode}/{language?}/path
 */

import type { CountryCode, LanguageCode, ParsedLocale } from "./types";
import {
  DEFAULT_COUNTRY,
  DEFAULT_LANGUAGE,
  COUNTRY_MAP,
  VALID_LANGUAGE_CODES,
  getCountry,
  isValidCountryCode,
  isValidLanguage,
  getEffectiveLanguage,
} from "./config";

/**
 * URL Locale Validation Result
 */
export interface UrlLocaleValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Set of all valid locale codes (countries + languages)
 * Used to determine if a URL segment could be a locale attempt
 */
const ALL_LOCALE_CODES = new Set([
  ...COUNTRY_MAP.keys(),
  ...VALID_LANGUAGE_CODES,
]);

/**
 * Valid content path segments (first segment after optional locale)
 * These are the actual route names from app/routes/
 */
const VALID_CONTENT_PATHS = new Set([
  'account',
  'api',
  'catalog',
  'checkout',
  'commentaries',
  'content-availability',
  'faqs',
  'livestreams',
  'my',
  'my-bhakti-plus', // Legacy path - redirects to /my
  'pages',
  'pilgrimages',
  'policies',
  'purchase',
  'router',
  'satsangs',
  'search',
  'talks',
  'test',
  'video',
  'welcome',
  'support',
  // Special routes
  '_dbg',
  'robots.txt',
  'sitemap.xml',
  // Internal routes
  '__manifest',
  'graphiql',
  'subrequest-profiler',
]);

/**
 * Check if a string could be a locale code attempt
 * Returns true if it's either:
 * - A valid country code
 * - A valid language code
 * - A short string (2-4 chars) that looks like a locale attempt
 */
function couldBeLocaleCode(segment: string): boolean {
  const lower = segment.toLowerCase();
  // Check against our explicit maps first
  if (ALL_LOCALE_CODES.has(lower)) {
    return true;
  }
  // Short strings (2-4 chars, letters only) could be locale attempts
  return /^[a-z]{2,4}$/i.test(segment);
}

/**
 * Check if a segment is a valid content path
 */
function isValidContentPath(segment: string): boolean {
  return VALID_CONTENT_PATHS.has(segment.toLowerCase());
}

/**
 * Validate URL locale segments for 404 detection
 *
 * This function determines whether a URL has valid locale segments.
 * It should be called in route loaders to detect invalid URLs early.
 *
 * Rules:
 * 1. Root "/" is always valid
 * 2. First segment that is a valid country code → check second segment
 * 3. First segment that is a valid content path (videos, satsangs, etc.) → valid
 * 4. First segment that's a valid language but NOT a country → 404 (language-only URL)
 * 5. Second segment that could be a locale must be a valid language code
 * 6. Any other first segment → 404 (invalid path)
 *
 * @param pathname - URL pathname to validate
 * @returns Validation result with reason if invalid
 */
export function validateUrlLocale(pathname: string): UrlLocaleValidation {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    // Root path "/" - always valid
    return { valid: true };
  }

  const firstSegment = segments[0].toLowerCase();

  // Case 1: Valid country code
  if (isValidCountryCode(firstSegment)) {
    // Check second segment if present
    if (segments.length >= 2) {
      const secondSegment = segments[1].toLowerCase();

      // Only validate second segment if it could be a locale code
      if (couldBeLocaleCode(secondSegment)) {
        // Second segment looks like a language code - just check it's valid
        if (!isValidLanguage(secondSegment)) {
          return { valid: false, reason: `Invalid language code: ${secondSegment}` };
        }
        // Any valid language is allowed in any country
      }
      // Second segment doesn't look like a locale - that's fine, it's content
    }

    return { valid: true };
  }

  // Case 2: Valid content path (videos, satsangs, account, etc.)
  if (isValidContentPath(firstSegment)) {
    return { valid: true };
  }

  // Case 3: Valid language code but NOT a country code (language-only URL)
  if (isValidLanguage(firstSegment)) {
    return {
      valid: false,
      reason: `Invalid path: /${firstSegment}`,
    };
  }

  // Case 4: Invalid first segment - not a country, not a content path
  return { valid: false, reason: `Invalid path: /${firstSegment}` };
}

/**
 * Parse country and language from a URL pathname
 *
 * Examples:
 * - "/" → { countryCode: "us", language: "en", restOfPath: "/" }
 * - "/fr/" → { countryCode: "fr", language: "fr", restOfPath: "/" }
 * - "/ca/fr/" → { countryCode: "ca", language: "fr", restOfPath: "/" }
 * - "/ca/fr/video" → { countryCode: "ca", language: "fr", restOfPath: "/video" }
 * - "/video" → { countryCode: "us", language: "en", restOfPath: "/video" }
 */
export function parseLocaleFromUrl(pathname: string): ParsedLocale {
  const segments = pathname.split("/").filter(Boolean);

  // No segments = default country/language
  if (segments.length === 0) {
    const countryCode = DEFAULT_COUNTRY;
    return {
      countryCode,
      language: getEffectiveLanguage(null),
      restOfPath: "/",
    };
  }

  const firstSegment = segments[0].toLowerCase();

  // Check if first segment is a valid country
  if (!isValidCountryCode(firstSegment)) {
    // Not a country - treat entire path as content under default country
    const countryCode = DEFAULT_COUNTRY;
    return {
      countryCode,
      language: getEffectiveLanguage(null),
      restOfPath: pathname.startsWith("/") ? pathname : `/${pathname}`,
    };
  }

  const countryCode = firstSegment as CountryCode;
  const country = getCountry(countryCode)!;

  // Check if second segment is a valid language (any language is allowed)
  if (segments.length >= 2) {
    const secondSegment = segments[1].toLowerCase();

    if (isValidLanguage(secondSegment)) {
      // /{countryCode}/{language}/... format
      const languageCode = secondSegment as LanguageCode;
      const restSegments = segments.slice(2);
      const restOfPath = restSegments.length > 0 ? `/${restSegments.join("/")}` : "/";

      return {
        countryCode,
        language: languageCode,
        restOfPath,
      };
    }
  }

  // /{countryCode}/... format (no explicit language)
  const restSegments = segments.slice(1);
  const restOfPath = restSegments.length > 0 ? `/${restSegments.join("/")}` : "/";

  return {
    countryCode,
    language: DEFAULT_LANGUAGE,
    restOfPath,
  };
}

/**
 * Build a URL path from country, language, and path
 *
 * Rules:
 * - If language is the global default (English), omit it from URL
 * - Always include country prefix
 *
 * Examples:
 * - buildUrl("us", "en", "/video") → "/us/video"
 * - buildUrl("fr", "en", "/video") → "/fr/video"
 * - buildUrl("ca", "fr", "/video") → "/ca/fr/video"
 * - buildUrl("de", "de", "/video") → "/de/de/video"
 */
export function buildUrl(
  countryCode: CountryCode,
  languageCode: LanguageCode,
  path: string = "/",
): string {
  const country = getCountry(countryCode);
  if (!country) {
    // Fallback to just the path if country is invalid
    return path.startsWith("/") ? path : `/${path}`;
  }

  // Normalize path
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const pathWithoutLeadingSlash = normalizedPath === "/" ? "" : normalizedPath;

  // If language is the global default, omit it
  if (languageCode === DEFAULT_LANGUAGE) {
    return `/${countryCode}${pathWithoutLeadingSlash}`;
  }

  // Include explicit language
  return `/${countryCode}/${languageCode}${pathWithoutLeadingSlash}`;
}

/**
 * Get the URL prefix for a country
 * (without trailing content path)
 *
 * Simplified: always returns /{countryCode} - we don't use explicit language paths
 */
export function getUrlPrefix(countryCode: CountryCode): string {
  return `/${countryCode}`;
}

/**
 * Check if a path has a country code prefix
 */
export function hasCountryCodePrefix(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return false;
  return isValidCountryCode(segments[0].toLowerCase());
}

/**
 * Remove country/language prefix from a path
 */
export function stripLocalePrefix(pathname: string): string {
  const { restOfPath } = parseLocaleFromUrl(pathname);
  return restOfPath;
}

/**
 * Replace country/language in an existing URL
 */
export function replaceLocale(
  pathname: string,
  newCountryCode: CountryCode,
  newLanguage: LanguageCode,
): string {
  const { restOfPath } = parseLocaleFromUrl(pathname);
  return buildUrl(newCountryCode, newLanguage, restOfPath);
}

/**
 * Parse country/language from a Request object
 */
export function parseLocaleFromRequest(request: Request): ParsedLocale {
  const url = new URL(request.url);
  return parseLocaleFromUrl(url.pathname);
}
