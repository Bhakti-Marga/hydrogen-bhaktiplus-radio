// NOTE: https://shopify.dev/docs/api/customer/latest/queries/customer
export const CUSTOMER_ACCOUNT_QUERY = `#graphql
  query CustomerAccount {
    customer {
      id
      firstName
      lastName
      emailAddress {
        emailAddress
      }
      defaultAddress {
        address1
        address2
        city
        country
        zip
      }
    }
  }
` as const;
