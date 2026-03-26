import { type LoaderFunctionArgs, useLoaderData, type MetaFunction } from "react-router";
import { type Shop } from "@shopify/hydrogen/storefront-api-types";
import { Link } from "~/components";
import type { LanguageCode as ShopifyLanguageCode, CountryCode as ShopifyCountryCode } from "@shopify/hydrogen/storefront-api-types";
import { localeContext } from "~/lib/middleware";

type SelectedPolicies = keyof Pick<
  Shop,
  | "privacyPolicy"
  | "shippingPolicy"
  | "termsOfService"
  | "refundPolicy"
  | "subscriptionPolicy"
>;

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.policy.title ?? ""}` }];
};

export async function loader({ params, context }: LoaderFunctionArgs) {
  if (!params.handle) {
    throw new Response("No handle was passed in", { status: 404 });
  }

  const policyName = params.handle.replace(
    /-([a-z])/g,
    (_: unknown, m1: string) => m1.toUpperCase(),
  ) as SelectedPolicies;

  // Use determined locale from middleware (includes user preferences)
  const { language, countryCode } = context.get(localeContext);

  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: false,
      shippingPolicy: false,
      termsOfService: false,
      refundPolicy: false,
      subscriptionPolicy: false,
      [policyName]: true,
      language: language?.toUpperCase() as ShopifyLanguageCode || context.storefront.i18n?.language,
      country: countryCode?.toUpperCase() as ShopifyCountryCode || context.storefront.i18n?.country,
    },
  });

  const policy = data.shop?.[policyName];

  if (!policy) {
    throw new Response("Could not find the policy", { status: 404 });
  }

  return { policy };
}

export default function Policy() {
  const { policy } = useLoaderData<typeof loader>();

  return (
    <div className="page rte bg-white text-brand-dark py-80 px-16">
      <div className="max-w-lg mx-auto">
        <h1>{policy.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: policy.body }} />
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/Shop
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  fragment PolicyWithDefault on ShopPolicyWithDefault {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
    $subscriptionPolicy: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
      subscriptionPolicy @include(if: $subscriptionPolicy) {
        ...PolicyWithDefault
      }
    }
  }
` as const;
