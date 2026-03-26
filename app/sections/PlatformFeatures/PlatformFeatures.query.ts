import { METAOBJECT_FRAGMENT } from "~/lib/fragments";

export const PLATFORM_FEATURES_METAOBJECT_TYPE = "section_platform_features";

export const PLATFORM_FEATURES_QUERY = `#graphql
  query PlatformFeatures(
    $country: CountryCode
    $language: LanguageCode
    $handle: MetaobjectHandleInput!
  ) @inContext(language: $language, country: $country) {
    metaobject(handle: $handle) {
      ...Metaobject
    }
  }
  ${METAOBJECT_FRAGMENT}
` as const;
