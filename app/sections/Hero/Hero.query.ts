import { METAOBJECT_FRAGMENT } from "~/lib/fragments";

export const HERO_METAOBJECT_TYPE = "section_hero";

export const HERO_QUERY = `#graphql
  query Hero(
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
