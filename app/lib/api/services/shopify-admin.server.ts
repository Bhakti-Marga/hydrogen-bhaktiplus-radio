/**
 * Shopify Admin API Services
 *
 * Server-only utilities for querying Shopify Admin API across stores.
 * Used for cross-store data fetching (e.g., orders from ROW store for US users).
 *
 * ============================================================
 * WARNING: This module contains SECRETS and must remain server-only.
 * The .server.ts suffix ensures it won't be bundled for the client.
 * ============================================================
 */

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

/**
 * GraphQL query for fetching customer orders via Admin API
 * NOTE: No #graphql tag - this is Admin API, not Storefront API (codegen validates against Storefront)
 */
const ADMIN_CUSTOMER_ORDERS_QUERY = `
  query getCustomerOrders($customerId: ID!) {
    customer(id: $customerId) {
      id
      orders(first: 20, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            totalRefundedSet {
              shopMoney {
                amount
                currencyCode
              }
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
  }
`;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Order data structure returned from Admin API
 */
interface AdminOrder {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string;
  totalPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  totalRefundedSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        variantTitle: string | null;
      };
    }>;
  };
}

/**
 * Transformed order for frontend consumption
 */
export interface CustomerOrder {
  id: string;
  name: string;
  orderNumber: string;
  date: string;
  amount: number;
  currencyCode: string;
  status: string;
  planName: string;
  refundedAmount?: number;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch customer orders from Shopify Admin API
 *
 * @param customerId - Shopify customer ID (numeric, will be converted to GID)
 * @param storeDomain - Shopify store domain (e.g., "guruconnect-108.myshopify.com")
 * @param adminApiToken - Shopify Admin API access token
 * @returns Array of transformed orders
 */
export async function fetchCustomerOrders(
  customerId: string,
  storeDomain: string,
  adminApiToken: string
): Promise<CustomerOrder[]> {
  const customerGid = `gid://shopify/Customer/${customerId}`;

  console.log("[ShopifyAdmin] Fetching orders for customer:", customerGid, "from store:", storeDomain);

  const response = await fetch(`https://${storeDomain}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminApiToken,
    },
    body: JSON.stringify({
      query: ADMIN_CUSTOMER_ORDERS_QUERY,
      variables: { customerId: customerGid },
    }),
  });

  if (!response.ok) {
    throw new Error(`Admin API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as {
    data?: {
      customer?: {
        orders?: {
          edges?: Array<{ node: AdminOrder }>;
        };
      };
    };
    errors?: unknown[];
  };

  if (data.errors) {
    console.error("[ShopifyAdmin] GraphQL errors:", data.errors);
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  const orders: AdminOrder[] = data.data?.customer?.orders?.edges?.map(
    (edge) => edge.node
  ) || [];

  // Transform orders to frontend format
  return orders.map((order): CustomerOrder => {
    const planName = order.lineItems?.edges[0]?.node?.variantTitle ||
                     order.lineItems?.edges[0]?.node?.title ||
                     'Membership';

    const refundedAmount = parseFloat(order.totalRefundedSet?.shopMoney?.amount || '0');

    // Extract numeric ID from GID (e.g., "gid://shopify/Order/12262310871419" -> "12262310871419")
    const orderNumber = order.id.split('/').pop() || order.id;

    return {
      id: order.id,
      name: order.name,
      orderNumber,
      date: order.createdAt,
      amount: parseFloat(order.totalPriceSet.shopMoney.amount),
      currencyCode: order.totalPriceSet.shopMoney.currencyCode,
      status: order.displayFinancialStatus,
      planName,
      refundedAmount: refundedAmount > 0 ? refundedAmount : undefined,
    };
  });
}
