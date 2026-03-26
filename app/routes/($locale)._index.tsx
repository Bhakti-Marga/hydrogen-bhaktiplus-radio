import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {getSeoMeta} from '@shopify/hydrogen';

import {RadioHomepage} from '~/components/RadioHomepage';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const {params, context} = args;
  const {language, country} = context.storefront.i18n;

  if (
    params.locale &&
    params.locale.toLowerCase() !== `${language}-${country}`.toLowerCase()
  ) {
    throw new Response(null, {status: 404});
  }

  const criticalData = await loadCriticalData(args);

  return defer({...criticalData});
}

async function loadCriticalData({context, request}: LoaderFunctionArgs) {
  const [{shop}] = await Promise.all([
    context.storefront.query(HOMEPAGE_SEO_QUERY),
  ]);

  return {
    shop,
    seo: seoPayload.home({url: request.url}),
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Homepage() {
  return <RadioHomepage />;
}

const HOMEPAGE_SEO_QUERY = `#graphql
  query homepageSeo($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    shop {
      name
      description
    }
  }
` as const;
