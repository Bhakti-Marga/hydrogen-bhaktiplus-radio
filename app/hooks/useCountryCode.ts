import { useRootLoaderData } from "~/hooks";
import {
  DEFAULT_COUNTRY,
  DEFAULT_LANGUAGE,
  getCountry,
  type CountryCode,
  type LanguageCode,
  type Country,
  type Language,
} from "~/lib/locale";

interface UseCountryCodeResult {
  countryCode: CountryCode;
  language: LanguageCode;
  countryConfig: Country | undefined;
  languageConfig: Language | undefined;
  urlPrefix: string;
  urlHasLocalePrefix: boolean;
  buildUrl: (path: string) => string;
}

/**
 * Get current country and language from root loader data
 *
 * @returns Country and language codes, configs, and URL helpers
 */
export function useCountryCode(): UseCountryCodeResult {
  const rootData = useRootLoaderData();

  const countryCode = (rootData?.countryCode ?? DEFAULT_COUNTRY) as CountryCode;
  const language = (rootData?.language ?? DEFAULT_LANGUAGE) as LanguageCode;
  const urlHasLocalePrefix = rootData?.urlHasLocalePrefix ?? false;
  const urlPrefix = rootData?.urlLocalePrefix ?? "";

  const countryConfig = getCountry(countryCode);
  // Get language config from supportedLanguages (fetched from Media API)
  const languageConfig = rootData?.supportedLanguages?.find(
    (l: Language) => l.code === language
  );

  return {
    countryCode,
    language,
    countryConfig,
    languageConfig,
    urlPrefix,
    urlHasLocalePrefix,
    // Build URLs: only add country prefix if URL already has one
    buildUrl: (path: string) => {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      if (!urlHasLocalePrefix) {
        return normalizedPath === "/" ? "/" : normalizedPath;
      }
      return `/${countryCode}${normalizedPath === "/" ? "" : normalizedPath}`;
    },
  };
}
