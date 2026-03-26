import { MetaFunction, type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import type { LanguageCode as ShopifyLanguageCode, CountryCode as ShopifyCountryCode } from "@shopify/hydrogen/storefront-api-types";
import { localeContext } from "~/lib/middleware";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.page.title ?? ""}` }];
};

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return { ...deferredData, ...criticalData };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({
  context,
  request,
  params,
}: LoaderFunctionArgs) {
  if (!params.handle) {
    throw new Error("Missing page handle");
  }

  // Use determined locale from middleware (includes user preferences)
  const { language, countryCode } = context.get(localeContext);

  const [{ page }] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
        language: language?.toUpperCase() as ShopifyLanguageCode || context.storefront.i18n?.language,
        country: countryCode?.toUpperCase() as ShopifyCountryCode || context.storefront.i18n?.country,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    page,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({ context }: LoaderFunctionArgs) {
  return {};
}

export default function Page() {
  const { page } = useLoaderData<typeof loader>();

  return (
    <div className="page rte bg-white text-brand-dark py-80 px-16">
      <div className="max-w-lg mx-auto">
        <h1>{page.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: page.body }} />
      </div>
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      handle
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const;
