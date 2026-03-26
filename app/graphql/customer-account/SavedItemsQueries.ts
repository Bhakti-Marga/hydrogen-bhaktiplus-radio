export const SAVED_ITEMS_QUERY = `#graphql
  query SavedItemsQuery {
    customer {
      id
      metafield(namespace: "custom", key: "saved_items") {
        id
        value
        type
      }
    }
  }
` as const;

export const SAVED_ITEMS_SET_MUTATION = `#graphql
  mutation SavedItemsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        value
        type
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;
