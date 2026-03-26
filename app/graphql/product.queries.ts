/*
 * STOREFRONT API QUERIES -----------------------------------------------------
 */

// Docs: https://shopify.dev/docs/api/storefront/latest/queries/product

export const GENERIC_FILE_FRAGMENT = `#graphql
  fragment genericFile on GenericFile {
    alt
    url
  }
` as const;

export const MEDIA_IMAGE_FRAGMENT = `#graphql
  fragment mediaImage on MediaImage {
    image {
      altText
      height
      width
      url
    }
  }
` as const;

export const VIDEO_FRAGMENT = `#graphql
  fragment video on Video {
    alt
    mediaContentType
    previewImage {
      url
    }
    sources {
      format
      height
      width
      url
    }
  }
` as const;

export const METAFIELD_VARIANT_FRAGMENT = `#graphql
  fragment metafieldVariant on ProductVariant {
    id
    title
    availableForSale
    sku
    product {
      id
      title
      handle
    }
    price {
      currencyCode
      amount
    }
    compareAtPrice {
      currencyCode
      amount
    }
    selectedOptions {
      name
      value
    }
  }
` as const;

export const METAFIELD_PRODUCT_FRAGMENT = `#graphql
  fragment metafieldProduct on Product {
    id
    title
    handle
    vendor
    productType
    tags
    descriptionHtml
    featuredImage {
      altText
      height
      id
      url
      width
    }
    options {
      name
      optionValues {
        id
        name
      }
    }
    media(first: 3) {
      nodes {
        alt
        id
        mediaContentType
        previewImage {
          altText
          height
          id
          url
          width
        }
        ... on Video {
          sources {
            height
            url
            width
            mimeType
          }
        }
      }
    }
    variants(first: 250) {
      nodes {
        ... on ProductVariant {
          ...metafieldVariant
        }
      }
    }
  }
  ${METAFIELD_VARIANT_FRAGMENT}
` as const;

export const METAOBJECT_FRAGMENT = `#graphql
  fragment metaobject on Metaobject {
    handle
    fields {
      key
      type
      value
      reference {
        ... on MediaImage {
          ...mediaImage
        }

        ... on GenericFile {
          ...genericFile
        }
      }
    }
  }

  ${GENERIC_FILE_FRAGMENT}
  ${MEDIA_IMAGE_FRAGMENT}
` as const;

export const METAFIELD_FRAGMENT = `#graphql
fragment metafield on Metafield {
    createdAt
    description
    id
    key
    namespace
    type
    updatedAt
    value
    reference {
      ... on Product {
        ...metafieldProduct
      }
      ... on Metaobject {
        ...metaobject
      }
      ... on GenericFile {
        ...genericFile
      }
      ... on Video {
        ...video
      }
      ... on MediaImage {
        ...mediaImage
      }
    }
    references(first: 20) {
      edges {
        node {
          ... on Product {
            ...metafieldProduct
          }
          ... on Metaobject {
            ...metaobject
          }
          ... on MediaImage {
            ...mediaImage
          }
        }
      }
    }
  }
  ${METAOBJECT_FRAGMENT}
  ${METAFIELD_PRODUCT_FRAGMENT}
` as const;

export const VARIANT_FRAGMENT = `#graphql
  fragment variantFragment on ProductVariant {
    id
    title
    availableForSale
    sku
    image {
      altText
      height
      id
      url
      width
    }
    price {
      currencyCode
      amount
    }
    compareAtPrice {
      currencyCode
      amount
    }
    selectedOptions {
      name
      value
    }
    product {
      handle
      id
      title
    }
  }
` as const;

export const PRODUCT_FRAGMENT = `#graphql
  fragment productFragment on Product {
    id
    title
    handle
    vendor
    description
    descriptionHtml
    productType
    publishedAt
    tags
    metafields(identifiers: [{namespace: "seed", key: "subscription_features"}, {namespace: "seed", key: "subscription_access"}]) {
      namespace
      key
      value
      references(first: 20) {
        edges {
          node {
            ... on Metaobject {
              ...metaobject
            }
          }
        }
      }
    }
    collections(first: 250) {
      nodes {
        handle
      }
    }
    featuredImage {
      altText
      height
      id
      url
      width
    }
    priceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
      minVariantPrice {
        amount
        currencyCode
      }
    }
    media(first: 250) {
      nodes {
        alt
        id
        mediaContentType
        previewImage {
          altText
          height
          id
          url
          width
          }
        ... on Video {
          sources {
            height
            url
            width
            mimeType
          }
        }
        ... on ExternalVideo {
          originUrl
        }
        ... on Model3d {
          sources {
            mimeType
            url
          }
        }
      }
    }
    options {
      name
      optionValues {
        id
        name
      }
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
      ... on ProductVariant {
          ...variantFragment
        }
    }
    variants(first: 250) {
      nodes {
        ... on ProductVariant {
          ...variantFragment
        }
      }
    }
    seo {
      description
      title
    }

  }
  ${VARIANT_FRAGMENT}
  ${METAOBJECT_FRAGMENT}
` as const;

export const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment productItemFragment on Product {
    id
    title
    handle
    productType
    tags
    metafields(identifiers: [{namespace: "seed", key: "subscription_features"}, {namespace: "seed", key: "subscription_access"}, {namespace: "seed", key: "subscription_yearly_price"}]) {
      namespace
      key
      value
      references(first: 20) {
        edges {
          node {
            ... on Metaobject {
              ...metaobject
            }
          }
        }
      }
    }
    priceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
      minVariantPrice {
        amount
        currencyCode
      }
    }

    variants(first: 100) {
      nodes {
        ... on ProductVariant {
            ...variantFragment
          }
      }
    }
  }
  ${METAOBJECT_FRAGMENT}
  ${VARIANT_FRAGMENT}
` as const;

export const PRODUCT_QUERY = `#graphql
  query product(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ... on Product {
        ...productFragment
      }
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

export const PRODUCT_ITEM_QUERY = `#graphql
  query product(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ... on Product {
        ...productItemFragment
      }
    }
  }
  ${PRODUCT_ITEM_FRAGMENT}
` as const;

export const PRODUCT_METAFIELDS_QUERY = `#graphql
  query product(
    $handle: String!
    $key: String!
    $namespace: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      metafields(identifiers: {key: $key, namespace: $namespace}) {
        ...metafield
      }
    }
  }
  ${METAFIELD_FRAGMENT}
` as const;

export const PRODUCTS_QUERY = `#graphql
  query Products(
    $query: String
    $first: Int
    $reverse: Boolean
    $country: CountryCode
    $language: LanguageCode
    $sortKey: ProductSortKeys
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: $sortKey, reverse: $reverse, query: $query, after: $endCursor) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      nodes {
        ... on Product {
          ...productItemFragment
        }
      }
    }
  }
  ${PRODUCT_ITEM_FRAGMENT}
` as const;

export const PRODUCT_FEED_QUERY = `#graphql
  query Products(
    $first: Int!
    $cursor: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: $first, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on Product {
          ...productItemFragment
        }
      }
    }
  }
  ${PRODUCT_ITEM_FRAGMENT}
` as const;

export const PRODUCT_RECOMMENDATIONS_QUERY = `#graphql
  query productRecommendations(
      $productId: ID!
      $intent: ProductRecommendationIntent
      $country: CountryCode
      $language: LanguageCode
    ) @inContext(country: $country, language: $language) {
      productRecommendations(productId: $productId, intent: $intent) {
        ... on Product {
          ...productItemFragment
        }
    }
  }
  ${PRODUCT_ITEM_FRAGMENT}
` as const;

export const PRODUCT_BY_ID_QUERY = `#graphql
  query product($id: ID!) {
    product(id: $id) {
      id
      title
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      selectedOrFirstAvailableVariant(
        selectedOptions: []
        ignoreUnknownOptions: true
        caseInsensitiveMatch: true
      ) {
        id
        price {
          amount
          currencyCode
        }
      }
    }
  }
` as const;

export const PRODUCT_DETAIL_QUERY = `#graphql
  query product($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      description
      descriptionHtml
      featuredImage {
        altText
        height
        id
        url
        width
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      options {
        name
        values
      }
      variants(first: 250) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
          image {
            altText
            height
            id
            url
            width
          }
        }
      }
    }
  }
` as const;

export const COLLECTION_QUERY = `#graphql
  query collection($id: ID!, $first: Int = 4) {
    collection(id: $id) {
      id
      title
      description
      products(first: $first) {
        nodes {
          id
          title
          handle
          featuredImage {
            altText
            height
            id
            url
            width
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 1) {
            nodes {
              id
              availableForSale
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
` as const;
