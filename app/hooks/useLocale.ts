import { useCountryCode } from "./useCountryCode";

/**
 * @deprecated Use useCountryCode() instead. This hook is kept for backwards compatibility.
 *
 * Returns a locale-like object built from country/language for components that
 * haven't been migrated yet.
 */
export function useLocale() {
  const { countryCode, language, countryConfig, urlPrefix } = useCountryCode();

  // Return an object that mimics the old I18nLocale shape for backwards compatibility
  return {
    language: language.toUpperCase(),
    country: countryCode.toUpperCase(),
    currency: countryConfig?.currency || "USD",
    pathPrefix: urlPrefix,
    label: `${language.toUpperCase()} (${countryCode.toUpperCase()})`,
  };
}
