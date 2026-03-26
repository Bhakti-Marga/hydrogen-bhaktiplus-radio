/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as StorefrontAPI from "@shopify/hydrogen/storefront-api-types";

export type MoneyFragment = Pick<
  StorefrontAPI.MoneyV2,
  "currencyCode" | "amount"
>;

export type CartLineFragment = Pick<
  StorefrontAPI.CartLine,
  "id" | "quantity"
> & {
  attributes: Array<Pick<StorefrontAPI.Attribute, "key" | "value">>;
  cost: {
    totalAmount: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    amountPerQuantity: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
    >;
  };
  merchandise: Pick<
    StorefrontAPI.ProductVariant,
    "id" | "availableForSale" | "requiresShipping" | "title"
  > & {
    compareAtPrice?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
    >;
    price: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    image?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
    >;
    product: Pick<StorefrontAPI.Product, "handle" | "title" | "id" | "vendor">;
    selectedOptions: Array<
      Pick<StorefrontAPI.SelectedOption, "name" | "value">
    >;
  };
};

export type CartLineComponentFragment = Pick<
  StorefrontAPI.ComponentizableCartLine,
  "id" | "quantity"
> & {
  attributes: Array<Pick<StorefrontAPI.Attribute, "key" | "value">>;
  cost: {
    totalAmount: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    amountPerQuantity: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
    >;
  };
  merchandise: Pick<
    StorefrontAPI.ProductVariant,
    "id" | "availableForSale" | "requiresShipping" | "title"
  > & {
    compareAtPrice?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
    >;
    price: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    image?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
    >;
    product: Pick<StorefrontAPI.Product, "handle" | "title" | "id" | "vendor">;
    selectedOptions: Array<
      Pick<StorefrontAPI.SelectedOption, "name" | "value">
    >;
  };
};

export type CartApiQueryFragment = Pick<
  StorefrontAPI.Cart,
  "updatedAt" | "id" | "checkoutUrl" | "totalQuantity" | "note"
> & {
  appliedGiftCards: Array<
    Pick<StorefrontAPI.AppliedGiftCard, "lastCharacters"> & {
      amountUsed: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    }
  >;
  buyerIdentity: Pick<
    StorefrontAPI.CartBuyerIdentity,
    "countryCode" | "email" | "phone"
  > & {
    customer?: StorefrontAPI.Maybe<
      Pick<
        StorefrontAPI.Customer,
        "id" | "email" | "firstName" | "lastName" | "displayName"
      >
    >;
  };
  lines: {
    nodes: Array<
      | (Pick<StorefrontAPI.CartLine, "id" | "quantity"> & {
          attributes: Array<Pick<StorefrontAPI.Attribute, "key" | "value">>;
          cost: {
            totalAmount: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
            amountPerQuantity: Pick<
              StorefrontAPI.MoneyV2,
              "currencyCode" | "amount"
            >;
            compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
            >;
          };
          merchandise: Pick<
            StorefrontAPI.ProductVariant,
            "id" | "availableForSale" | "requiresShipping" | "title"
          > & {
            compareAtPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
            >;
            price: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                "id" | "url" | "altText" | "width" | "height"
              >
            >;
            product: Pick<
              StorefrontAPI.Product,
              "handle" | "title" | "id" | "vendor"
            >;
            selectedOptions: Array<
              Pick<StorefrontAPI.SelectedOption, "name" | "value">
            >;
          };
        })
      | (Pick<StorefrontAPI.ComponentizableCartLine, "id" | "quantity"> & {
          attributes: Array<Pick<StorefrontAPI.Attribute, "key" | "value">>;
          cost: {
            totalAmount: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
            amountPerQuantity: Pick<
              StorefrontAPI.MoneyV2,
              "currencyCode" | "amount"
            >;
            compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
            >;
          };
          merchandise: Pick<
            StorefrontAPI.ProductVariant,
            "id" | "availableForSale" | "requiresShipping" | "title"
          > & {
            compareAtPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
            >;
            price: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                "id" | "url" | "altText" | "width" | "height"
              >
            >;
            product: Pick<
              StorefrontAPI.Product,
              "handle" | "title" | "id" | "vendor"
            >;
            selectedOptions: Array<
              Pick<StorefrontAPI.SelectedOption, "name" | "value">
            >;
          };
        })
    >;
  };
  cost: {
    subtotalAmount: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    totalAmount: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    totalDutyAmount?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
    >;
    totalTaxAmount?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
    >;
  };
  attributes: Array<Pick<StorefrontAPI.Attribute, "key" | "value">>;
  discountCodes: Array<
    Pick<StorefrontAPI.CartDiscountCode, "code" | "applicable">
  >;
};

export type MenuItemFragment = Pick<
  StorefrontAPI.MenuItem,
  "id" | "resourceId" | "tags" | "title" | "type" | "url"
>;

export type ChildMenuItemFragment = Pick<
  StorefrontAPI.MenuItem,
  "id" | "resourceId" | "tags" | "title" | "type" | "url"
>;

export type ParentMenuItemFragment = Pick<
  StorefrontAPI.MenuItem,
  "id" | "resourceId" | "tags" | "title" | "type" | "url"
> & {
  items: Array<
    Pick<
      StorefrontAPI.MenuItem,
      "id" | "resourceId" | "tags" | "title" | "type" | "url"
    >
  >;
};

export type MenuFragment = Pick<StorefrontAPI.Menu, "id"> & {
  items: Array<
    Pick<
      StorefrontAPI.MenuItem,
      "id" | "resourceId" | "tags" | "title" | "type" | "url"
    > & {
      items: Array<
        Pick<
          StorefrontAPI.MenuItem,
          "id" | "resourceId" | "tags" | "title" | "type" | "url"
        >
      >;
    }
  >;
};

export type ShopFragment = Pick<
  StorefrontAPI.Shop,
  "id" | "name" | "description"
> & {
  primaryDomain: Pick<StorefrontAPI.Domain, "url">;
  brand?: StorefrontAPI.Maybe<{
    logo?: StorefrontAPI.Maybe<{
      image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, "url">>;
    }>;
  }>;
};

export type HeaderQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  headerMenuHandle: StorefrontAPI.Scalars["String"]["input"];
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type HeaderQuery = {
  shop: Pick<StorefrontAPI.Shop, "id" | "name" | "description"> & {
    primaryDomain: Pick<StorefrontAPI.Domain, "url">;
    brand?: StorefrontAPI.Maybe<{
      logo?: StorefrontAPI.Maybe<{
        image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, "url">>;
      }>;
    }>;
  };
  menu?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Menu, "id"> & {
      items: Array<
        Pick<
          StorefrontAPI.MenuItem,
          "id" | "resourceId" | "tags" | "title" | "type" | "url"
        > & {
          items: Array<
            Pick<
              StorefrontAPI.MenuItem,
              "id" | "resourceId" | "tags" | "title" | "type" | "url"
            >
          >;
        }
      >;
    }
  >;
};

export type MetaobjectFragment = Pick<
  StorefrontAPI.Metaobject,
  "id" | "type" | "handle"
> & {
  fields: Array<
    Pick<StorefrontAPI.MetaobjectField, "key" | "value" | "type"> & {
      reference?: StorefrontAPI.Maybe<
        | {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText">
            >;
          }
        | (Pick<StorefrontAPI.Metaobject, "id" | "type"> & {
            fields: Array<
              Pick<StorefrontAPI.MetaobjectField, "key" | "value" | "type">
            >;
          })
      >;
      references?: StorefrontAPI.Maybe<{
        nodes: Array<
          | {
              image?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.Image, "url" | "altText">
              >;
            }
          | (Pick<StorefrontAPI.Metaobject, "id" | "type"> & {
              fields: Array<
                Pick<
                  StorefrontAPI.MetaobjectField,
                  "key" | "value" | "type"
                > & {
                  reference?: StorefrontAPI.Maybe<{
                    image?: StorefrontAPI.Maybe<
                      Pick<
                        StorefrontAPI.Image,
                        "url" | "altText" | "height" | "width"
                      >
                    >;
                  }>;
                }
              >;
            })
        >;
      }>;
    }
  >;
};

export type PageQueryVariables = StorefrontAPI.Exact<{
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  handle: StorefrontAPI.Scalars["String"]["input"];
}>;

export type PageQuery = {
  page?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Page, "handle" | "id" | "title" | "body"> & {
      seo?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Seo, "description" | "title">
      >;
    }
  >;
};

export type PolicyFragment = Pick<
  StorefrontAPI.ShopPolicy,
  "body" | "handle" | "id" | "title" | "url"
>;

export type PolicyWithDefaultFragment = Pick<
  StorefrontAPI.ShopPolicyWithDefault,
  "body" | "handle" | "id" | "title" | "url"
>;

export type PolicyQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  privacyPolicy: StorefrontAPI.Scalars["Boolean"]["input"];
  refundPolicy: StorefrontAPI.Scalars["Boolean"]["input"];
  shippingPolicy: StorefrontAPI.Scalars["Boolean"]["input"];
  termsOfService: StorefrontAPI.Scalars["Boolean"]["input"];
  subscriptionPolicy: StorefrontAPI.Scalars["Boolean"]["input"];
}>;

export type PolicyQuery = {
  shop: {
    privacyPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, "body" | "handle" | "id" | "title" | "url">
    >;
    shippingPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, "body" | "handle" | "id" | "title" | "url">
    >;
    termsOfService?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, "body" | "handle" | "id" | "title" | "url">
    >;
    refundPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, "body" | "handle" | "id" | "title" | "url">
    >;
    subscriptionPolicy?: StorefrontAPI.Maybe<
      Pick<
        StorefrontAPI.ShopPolicyWithDefault,
        "body" | "handle" | "id" | "title" | "url"
      >
    >;
  };
};

export type StoreRobotsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type StoreRobotsQuery = { shop: Pick<StorefrontAPI.Shop, "id"> };

export type FaqsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  handle: StorefrontAPI.MetaobjectHandleInput;
}>;

export type FaqsQuery = {
  metaobject?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metaobject, "id" | "type" | "handle"> & {
      fields: Array<
        Pick<StorefrontAPI.MetaobjectField, "key" | "value" | "type"> & {
          reference?: StorefrontAPI.Maybe<
            | {
                image?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, "url" | "altText">
                >;
              }
            | (Pick<StorefrontAPI.Metaobject, "id" | "type"> & {
                fields: Array<
                  Pick<StorefrontAPI.MetaobjectField, "key" | "value" | "type">
                >;
              })
          >;
          references?: StorefrontAPI.Maybe<{
            nodes: Array<
              | {
                  image?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.Image, "url" | "altText">
                  >;
                }
              | (Pick<StorefrontAPI.Metaobject, "id" | "type"> & {
                  fields: Array<
                    Pick<
                      StorefrontAPI.MetaobjectField,
                      "key" | "value" | "type"
                    > & {
                      reference?: StorefrontAPI.Maybe<{
                        image?: StorefrontAPI.Maybe<
                          Pick<
                            StorefrontAPI.Image,
                            "url" | "altText" | "height" | "width"
                          >
                        >;
                      }>;
                    }
                  >;
                })
            >;
          }>;
        }
      >;
    }
  >;
};

export type HeroQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  handle: StorefrontAPI.MetaobjectHandleInput;
}>;

export type HeroQuery = {
  metaobject?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metaobject, "id" | "type" | "handle"> & {
      fields: Array<
        Pick<StorefrontAPI.MetaobjectField, "key" | "value" | "type"> & {
          reference?: StorefrontAPI.Maybe<
            | {
                image?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, "url" | "altText">
                >;
              }
            | (Pick<StorefrontAPI.Metaobject, "id" | "type"> & {
                fields: Array<
                  Pick<StorefrontAPI.MetaobjectField, "key" | "value" | "type">
                >;
              })
          >;
          references?: StorefrontAPI.Maybe<{
            nodes: Array<
              | {
                  image?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.Image, "url" | "altText">
                  >;
                }
              | (Pick<StorefrontAPI.Metaobject, "id" | "type"> & {
                  fields: Array<
                    Pick<
                      StorefrontAPI.MetaobjectField,
                      "key" | "value" | "type"
                    > & {
                      reference?: StorefrontAPI.Maybe<{
                        image?: StorefrontAPI.Maybe<
                          Pick<
                            StorefrontAPI.Image,
                            "url" | "altText" | "height" | "width"
                          >
                        >;
                      }>;
                    }
                  >;
                })
            >;
          }>;
        }
      >;
    }
  >;
};

export type PlatformFeaturesQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  handle: StorefrontAPI.MetaobjectHandleInput;
}>;

export type PlatformFeaturesQuery = {
  metaobject?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metaobject, "id" | "type" | "handle"> & {
      fields: Array<
        Pick<StorefrontAPI.MetaobjectField, "key" | "value" | "type"> & {
          reference?: StorefrontAPI.Maybe<
            | {
                image?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, "url" | "altText">
                >;
              }
            | (Pick<StorefrontAPI.Metaobject, "id" | "type"> & {
                fields: Array<
                  Pick<StorefrontAPI.MetaobjectField, "key" | "value" | "type">
                >;
              })
          >;
          references?: StorefrontAPI.Maybe<{
            nodes: Array<
              | {
                  image?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.Image, "url" | "altText">
                  >;
                }
              | (Pick<StorefrontAPI.Metaobject, "id" | "type"> & {
                  fields: Array<
                    Pick<
                      StorefrontAPI.MetaobjectField,
                      "key" | "value" | "type"
                    > & {
                      reference?: StorefrontAPI.Maybe<{
                        image?: StorefrontAPI.Maybe<
                          Pick<
                            StorefrontAPI.Image,
                            "url" | "altText" | "height" | "width"
                          >
                        >;
                      }>;
                    }
                  >;
                })
            >;
          }>;
        }
      >;
    }
  >;
};

interface GeneratedQueryTypes {
  "#graphql\n  fragment Shop on Shop {\n    id\n    name\n    description\n    primaryDomain {\n      url\n    }\n    brand {\n      logo {\n        image {\n          url\n        }\n      }\n    }\n  }\n  query Header(\n    $country: CountryCode\n    $headerMenuHandle: String!\n    $language: LanguageCode\n  ) @inContext(language: $language, country: $country) {\n    shop {\n      ...Shop\n    }\n    menu(handle: $headerMenuHandle) {\n      ...Menu\n    }\n  }\n  #graphql\n  fragment MenuItem on MenuItem {\n    id\n    resourceId\n    tags\n    title\n    type\n    url\n  }\n  fragment ChildMenuItem on MenuItem {\n    ...MenuItem\n  }\n  fragment ParentMenuItem on MenuItem {\n    ...MenuItem\n    items {\n      ...ChildMenuItem\n    }\n  }\n  fragment Menu on Menu {\n    id\n    items {\n      ...ParentMenuItem\n    }\n  }\n\n": {
    return: HeaderQuery;
    variables: HeaderQueryVariables;
  };
  "#graphql\n  query Page(\n    $language: LanguageCode,\n    $country: CountryCode,\n    $handle: String!\n  )\n  @inContext(language: $language, country: $country) {\n    page(handle: $handle) {\n      handle\n      id\n      title\n      body\n      seo {\n        description\n        title\n      }\n    }\n  }\n": {
    return: PageQuery;
    variables: PageQueryVariables;
  };
  "#graphql\n  fragment Policy on ShopPolicy {\n    body\n    handle\n    id\n    title\n    url\n  }\n  fragment PolicyWithDefault on ShopPolicyWithDefault {\n    body\n    handle\n    id\n    title\n    url\n  }\n  query Policy(\n    $country: CountryCode\n    $language: LanguageCode\n    $privacyPolicy: Boolean!\n    $refundPolicy: Boolean!\n    $shippingPolicy: Boolean!\n    $termsOfService: Boolean!\n    $subscriptionPolicy: Boolean!\n  ) @inContext(language: $language, country: $country) {\n    shop {\n      privacyPolicy @include(if: $privacyPolicy) {\n        ...Policy\n      }\n      shippingPolicy @include(if: $shippingPolicy) {\n        ...Policy\n      }\n      termsOfService @include(if: $termsOfService) {\n        ...Policy\n      }\n      refundPolicy @include(if: $refundPolicy) {\n        ...Policy\n      }\n      subscriptionPolicy @include(if: $subscriptionPolicy) {\n        ...PolicyWithDefault\n      }\n    }\n  }\n": {
    return: PolicyQuery;
    variables: PolicyQueryVariables;
  };
  "#graphql\n  query StoreRobots($country: CountryCode, $language: LanguageCode)\n   @inContext(country: $country, language: $language) {\n    shop {\n      id\n    }\n  }\n": {
    return: StoreRobotsQuery;
    variables: StoreRobotsQueryVariables;
  };
  "#graphql\n  query Faqs(\n    $country: CountryCode\n    $language: LanguageCode\n    $handle: MetaobjectHandleInput!\n  ) @inContext(language: $language, country: $country) {\n    metaobject(handle: $handle) {\n      ...Metaobject\n    }\n  }\n  #graphql\n  fragment Metaobject on Metaobject {\n    id\n    type\n    handle\n    fields {\n      key\n      value\n      type\n      reference {\n        ... on MediaImage {\n          image {\n            url\n            altText\n          }\n        }\n        ... on Metaobject {\n          id\n          type\n          fields {\n            key\n            value\n            type\n          }\n        }\n      }\n      references(first: 100) {\n        nodes {\n          ... on MediaImage {\n            image {\n              url\n              altText\n            }\n          }\n          ... on Metaobject {\n            id\n            type\n            fields {\n              key\n              value\n              type\n              reference {\n                ... on MediaImage {\n                  image {\n                    url\n                    altText\n                    height\n                    width\n                  }\n                }\n              }\n            }       \n          }\n        }\n      }\n    }\n  }\n\n": {
    return: FaqsQuery;
    variables: FaqsQueryVariables;
  };
  "#graphql\n  query Hero(\n    $country: CountryCode\n    $language: LanguageCode\n    $handle: MetaobjectHandleInput!\n  ) @inContext(language: $language, country: $country) {\n    metaobject(handle: $handle) {\n      ...Metaobject\n    }\n  }\n  #graphql\n  fragment Metaobject on Metaobject {\n    id\n    type\n    handle\n    fields {\n      key\n      value\n      type\n      reference {\n        ... on MediaImage {\n          image {\n            url\n            altText\n          }\n        }\n        ... on Metaobject {\n          id\n          type\n          fields {\n            key\n            value\n            type\n          }\n        }\n      }\n      references(first: 100) {\n        nodes {\n          ... on MediaImage {\n            image {\n              url\n              altText\n            }\n          }\n          ... on Metaobject {\n            id\n            type\n            fields {\n              key\n              value\n              type\n              reference {\n                ... on MediaImage {\n                  image {\n                    url\n                    altText\n                    height\n                    width\n                  }\n                }\n              }\n            }       \n          }\n        }\n      }\n    }\n  }\n\n": {
    return: HeroQuery;
    variables: HeroQueryVariables;
  };
  "#graphql\n  query PlatformFeatures(\n    $country: CountryCode\n    $language: LanguageCode\n    $handle: MetaobjectHandleInput!\n  ) @inContext(language: $language, country: $country) {\n    metaobject(handle: $handle) {\n      ...Metaobject\n    }\n  }\n  #graphql\n  fragment Metaobject on Metaobject {\n    id\n    type\n    handle\n    fields {\n      key\n      value\n      type\n      reference {\n        ... on MediaImage {\n          image {\n            url\n            altText\n          }\n        }\n        ... on Metaobject {\n          id\n          type\n          fields {\n            key\n            value\n            type\n          }\n        }\n      }\n      references(first: 100) {\n        nodes {\n          ... on MediaImage {\n            image {\n              url\n              altText\n            }\n          }\n          ... on Metaobject {\n            id\n            type\n            fields {\n              key\n              value\n              type\n              reference {\n                ... on MediaImage {\n                  image {\n                    url\n                    altText\n                    height\n                    width\n                  }\n                }\n              }\n            }       \n          }\n        }\n      }\n    }\n  }\n\n": {
    return: PlatformFeaturesQuery;
    variables: PlatformFeaturesQueryVariables;
  };
}

interface GeneratedMutationTypes {}

declare module "@shopify/hydrogen" {
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
