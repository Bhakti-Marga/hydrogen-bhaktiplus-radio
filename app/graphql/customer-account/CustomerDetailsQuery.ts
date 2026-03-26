// NOTE: https://shopify.dev/docs/api/customer/latest/objects/Customer
export const CUSTOMER_FRAGMENT = `#graphql
  fragment Customer on Customer {
    id
    firstName
    lastName
    emailAddress {
      emailAddress
    }
    tags
    defaultAddress {
      address1
      address2
      city
      province
      country
      zip
    }
    orders(first: 10, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          number
          createdAt
          financialStatus
          totalPrice {
            amount
            currencyCode
          }
          totalRefunded {
            amount
            currencyCode
          }
          lineItems(first: 1) {
            edges {
              node {
                title
                variantTitle
              }
            }
          }
        }
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/customer/latest/queries/customer
export const CUSTOMER_DETAILS_QUERY = `#graphql
  query CustomerDetails {
    customer {
      ...Customer
    }
  }
  ${CUSTOMER_FRAGMENT}
` as const;
