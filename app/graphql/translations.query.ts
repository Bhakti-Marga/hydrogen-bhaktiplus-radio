/**
 * GraphQL query to fetch translations from Shopify metaobjects.
 * 
 * Fetches all metaobjects of type "translation" which contain:
 * - key: The translation identifier (e.g., "homepage latest releases title")
 * - value: The actual translation text (e.g., "Latest Releases")
 * 
 * Uses pagination to fetch all translations (Shopify max is 250 per request).
 * 
 * See docs/TRANSLATIONS.md for complete translation system documentation.
 */
export const TRANSLATIONS_QUERY = `#graphql
  query Translations(
    $country: CountryCode
    $language: LanguageCode
    $cursor: String
  ) @inContext(language: $language, country: $country) {
    metaobjects(first: 250, type: "translation", after: $cursor) {
      nodes {
        id
        type
        fields {
          key
          value
          type
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
` as const; 