/**
 * Debug API route to inspect translations
 * Access at: /api/debug-translations or /api/debug-translations?lang=de&country=de
 */
import { type LoaderFunctionArgs } from "react-router";
import { TRANSLATIONS_QUERY } from "~/graphql/translations.query";
import { getShopifyLanguageCode } from "~/lib/locale";
import type {
  CountryCode as ShopifyCountryCode,
  LanguageCode as ShopifyLanguageCode,
} from "@shopify/hydrogen/storefront-api-types";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const storefront = context.storefront;

  // Get query params for testing different locales
  const testLang = url.searchParams.get('lang') || 'en';
  const testCountry = url.searchParams.get('country') || 'us';

  // Compute Shopify-compatible language code
  const shopifyLanguage = getShopifyLanguageCode(testLang as any, testCountry as any);
  const shopifyCountry = testCountry.toUpperCase();

  // Helper to fetch all translations with pagination (Shopify max is 250 per request)
  async function fetchAllTranslations(
    country: ShopifyCountryCode,
    lang: ShopifyLanguageCode
  ): Promise<{ nodes: any[]; pagesFetched: number }> {
    const allNodes: any[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;
    let pagesFetched = 0;

    while (hasNextPage) {
      pagesFetched++;
      const queryResult: { metaobjects?: { nodes?: any[]; pageInfo?: { hasNextPage?: boolean; endCursor?: string | null } } } = await storefront.query(TRANSLATIONS_QUERY, {
        variables: {
          country,
          language: lang,
          cursor,
        },
      });

      const nodes = queryResult.metaobjects?.nodes || [];
      allNodes.push(...nodes);

      hasNextPage = queryResult.metaobjects?.pageInfo?.hasNextPage ?? false;
      cursor = queryResult.metaobjects?.pageInfo?.endCursor ?? null;
    }

    return { nodes: allNodes, pagesFetched };
  }

  // Fetch all translations with pagination
  const { nodes: metaobjectNodes, pagesFetched } = await fetchAllTranslations(
    shopifyCountry as ShopifyCountryCode,
    shopifyLanguage as ShopifyLanguageCode
  );

  // Also get the storefront i18n context for comparison
  const storefrontI18n = storefront.i18n;

  // Transform the metaobjects
  const translations: Record<string, string> = {};
  metaobjectNodes.forEach((node: any) => {
    const key = node.fields.find((f: any) => f.key === "key")?.value;
    const text = node.fields.find((f: any) => f.key === "text")?.value;
    if (key && text) {
      translations[key.replace(/\s+/g, "_")] = text;
    }
  });

  const result = {
    debug: {
      requestedLocale: {
        lang: testLang,
        country: testCountry,
      },
      shopifyQuery: {
        language: shopifyLanguage,
        country: shopifyCountry,
      },
      storefrontI18n,
      pagination: {
        pagesFetched,
        nodesPerPage: 250,
      },
    },
    metaobjectsCount: metaobjectNodes.length,
    translationsCount: Object.keys(translations).length,
    sampleKeys: Object.keys(translations).slice(0, 10),
    sampleTranslations: Object.fromEntries(
      Object.entries(translations).slice(0, 10)
    ),
    fullTranslations: translations,
  };

  return new Response(JSON.stringify(result, null, 2), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

