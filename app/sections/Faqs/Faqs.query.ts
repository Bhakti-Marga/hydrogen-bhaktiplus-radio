import { METAOBJECT_FRAGMENT } from "~/lib/fragments";

export const FAQS_METAOBJECT_TYPE = "section_faqs";

export const FAQS_QUERY = `#graphql
  query Faqs(
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
