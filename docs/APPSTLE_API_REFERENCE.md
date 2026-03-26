# Appstle Membership Admin API - Reference

**Base URL:** `https://membership-admin.appstle.com`
**Auth:** Header `X-API-Key: <api-key>` (required for all endpoints)

---

## Core Endpoints for Account Page

### 1. List Customer Subscriptions

```
GET /api/external/v2/subscription-contract-details
```

**Purpose:** Fetch all subscriptions for a customer

**Query Parameters:**

- `pageable` (required): `{page:0,size:10,sort:["id,desc"]}`
- `status` (optional): `"active"` | `"paused"` | `"cancelled"`
- `customerEmail` (optional): Filter by email
- `customerId` (optional): Filter by customer ID
- `subscriptionContractId` (optional): Get specific contract
- `fromNextDate`, `toNextDate` (optional): Filter by billing date range

**Response:** `Array<SubscriptionContractDetailsDTO>`

**Key Fields:**

```typescript
{
  subscriptionContractId: number;
  status: "active" | "paused" | "cancelled"; // lowercase
  customerId: number;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  orderAmount: number; // subscription price
  currencyCode: string;
  billingPolicyInterval: "MONTH" | "YEAR"; // uppercase
  billingPolicyIntervalCount: number;
  nextBillingDate: string; // ISO 8601
  createdAt: string;
  activatedOn: string;
  pausedOn: string | null;
  cancelledOn: string | null;
  autoCharge: boolean;
  minCycles: number;
  maxCycles: number;
}
```

---

### 2. Get Contract Details

```
GET /api/external/v2/subscription-contracts/contract-external/{contractId}
```

**Purpose:** Get full details for a single subscription contract

**Path Parameters:**

- `contractId` (required): Subscription contract ID

**Response:** Full `SubscriptionContract` object with nested GraphQL-like structure

**Key Nested Objects:**

- `billingPolicy`: Frequency and intervals
- `deliveryPolicy`: Delivery schedules
- `lines.edges`: Line items (products/variants)
- `customerPaymentMethod`: Payment details
- `deliveryMethod`: Shipping method
- `customer`: Customer info
- `billingAttempts`: Payment history

**Use Case:** Get complete contract info before making updates

---

### 3. Change Subscription Plan

```
PUT /api/external/v2/subscription-contract-update-variant
```

**Purpose:** Change subscription variant (plan upgrade/downgrade)

**Query Parameters:**

- `contractId` (required): Contract ID
- `newVariantId` (required): New Shopify variant ID
- `oldVariantId` (optional): Current variant ID (for validation)
- `oldLineId` (optional): Current line item ID

**Response:** Updated `SubscriptionContract`

**Variant IDs (from constants):**

```typescript
{
  live: '55782682689915',      // €10/month
  core: '55782682722683',      // €20/month
  premium: '55782682755451',   // €50/month
  supporter: '55782682788219'  // €200/month
}
```

---

### 4. Update Subscription Status

```
PUT /api/external/v2/subscription-contracts-update-status
```

**Purpose:** Pause, resume, or cancel subscription

**Query Parameters:**

- `contractId` (required): Contract ID
- `status` (required): `"ACTIVE"` | `"PAUSED"` | `"CANCELLED"` (uppercase)

**Response:** 200 OK (empty body)

**Status Actions:**

- `"PAUSED"`: Pause subscription (can be resumed later)
- `"ACTIVE"`: Resume subscription
- `"CANCELLED"`: Cancel subscription

**Reactivation Behavior (IMPORTANT):**

| Current Status | nextBillingDate | Can Reactivate? | Notes                             |
| -------------- | --------------- | --------------- | --------------------------------- |
| PAUSED         | Any             | Yes             | Always works                      |
| CANCELLED      | In the future   | Yes             | Contract still active in Shopify  |
| CANCELLED      | In the past     | No              | Returns "Contract does not exist" |

The Appstle API allows reactivating a CANCELLED contract **only if** its `nextBillingDate` is still in the future. This is because:

- When a subscription is cancelled, it remains active until the end of the current billing period
- During this grace period, the contract still exists in Shopify and can be reactivated
- Once `nextBillingDate` passes, the contract is fully terminated in Shopify and cannot be reactivated

**Determining Reactivation Eligibility:**

```typescript
const canReactivate =
  contract.status === "PAUSED" ||
  (contract.status === "CANCELLED" &&
    new Date(contract.nextBillingDate) > new Date());
```

**Current Code Locations:**

- `app/components/Account/MembershipCard.tsx` - Checks `nextBillingDate > now` before showing reactivate UI
- `app/routes/router.tsx` - Handles reactivation requests (needs the same check)
- `app/components/SubscriptionTier/SubscriptionTierLanding.tsx` - Shows reactivate button for cancelled plans

---

## Additional Endpoints

### 5. Get Customer with Subscriptions (GraphQL-like)

```
GET /api/external/v2/subscription-customers/{customerId}
```

**Purpose:** Get customer data with full subscription contract details in GraphQL format

**Path Parameters:**

- `customerId` (required): Shopify customer ID (numeric, e.g., `7096263966878`)

**Response:** Full customer object with nested `subscriptionContracts` in GraphQL format

**Key Response Structure:**

```json
{
  "__typename": "Customer",
  "id": "gid://shopify/Customer/7096263966878",
  "productSubscriberStatus": "CANCELLED" | "ACTIVE" | "PAUSED",
  "tags": ["appstle_subscription_active_customer", "Bhakti+ Supporter", ...],
  "subscriptionContracts": {
    "__typename": "SubscriptionContractConnection",
    "nodes": [
      {
        "__typename": "SubscriptionContract",
        "id": "gid://shopify/SubscriptionContract/112805773691",
        "createdAt": "2025-05-22T09:46:18Z",
        "nextBillingDate": "2025-11-10T10:14:22Z",
        "status": "CANCELLED",
        "deliveryPrice": {
          "__typename": "MoneyV2",
          "amount": "0.0"
        },
        "lastPaymentStatus": "SUCCEEDED",
        "billingPolicy": {
          "__typename": "SubscriptionBillingPolicy",
          "interval": "MONTH",
          "intervalCount": 1
        },
        "lines": {
          "__typename": "SubscriptionLineConnection",
          "nodes": [
            {
              "__typename": "SubscriptionLine",
              "id": "gid://shopify/SubscriptionLine/...",
              "sellingPlanId": "gid://shopify/SellingPlan/710532858235",
              "sellingPlanName": "Bhakti+ Supporter",
              "productId": "gid://shopify/Product/15247882715515",
              "sku": "ME-BP-013",
              "title": "Bhakti+ access plan",
              "variantId": "gid://shopify/ProductVariant/55782682788219",
              "quantity": 1,
              "lineDiscountedPrice": {
                "__typename": "MoneyV2",
                "amount": "200.0",
                "currencyCode": "EUR"
              },
              "variantImage": {
                "__typename": "Image",
                "transformedSrc": "https://cdn.shopify.com/..."
              },
              "variantTitle": "Supporter",
              "currentPrice": {
                "__typename": "MoneyV2",
                "amount": "200.0",
                "currencyCode": "EUR"
              }
            }
          ],
          "pageInfo": {
            "__typename": "PageInfo",
            "hasPreviousPage": false,
            "hasNextPage": false,
            "startCursor": "...",
            "endCursor": "..."
          }
        },
        "customerPaymentMethod": {
          "__typename": "CustomerPaymentMethod",
          "instrument": {
            "__typename": "CustomerCreditCard",
            "brand": "visa",
            "expiresSoon": true,
            "expiryMonth": 12,
            "expiryYear": 2023,
            "firstDigits": "424242",
            "lastDigits": "4242",
            "maskedNumber": "•••• •••• •••• 4242",
            "name": "gg",
            "revocable": true
          }
        },
        "originOrder": null,
        "customer": {
          "__typename": "Customer",
          "id": "gid://shopify/Customer/7096263966878"
        }
      }
    ],
    "pageInfo": {
      "__typename": "PageInfo",
      "hasPreviousPage": false,
      "hasNextPage": false,
      "startCursor": "...",
      "endCursor": "..."
    }
  }
}
```

**Use Case:** Get complete customer subscription data including payment method details, line items with prices, and selling plan information

**Important Notes:**

- Returns data in GraphQL format with `__typename` fields
- Uses `nodes` array format (not `edges`) - contracts and line items are direct arrays
- IDs are Shopify GIDs (e.g., `gid://shopify/Customer/123`)
- Status values are uppercase (`CANCELLED`, `ACTIVE`, `PAUSED`)
- Payment method includes card details (masked number, brand, expiry)
- Line items include product images, SKUs, and pricing
- Includes `pageInfo` for pagination support

---

### 6. Get Customer Subscriptions by ID (Simple)

```
GET /api/external/v2/subscription-customers-detail/valid/{customerId}
```

**Purpose:** Alternative endpoint to fetch subscriptions using customer ID (simplified format)

**Path Parameters:**

- `customerId` (required): Shopify customer ID

**Response:** `Array<SubscriptionContractDetailsDTO>`

---

### 7. Update Next Billing Date

```
PUT /api/external/v2/subscription-contracts-update-billing-date
```

**Query Parameters:**

- `contractId` (required): Contract ID
- `nextBillingDate` (required): ISO 8601 date-time

**Response:** Updated `SubscriptionContract`

**Use Case:** Allow customers to reschedule billing

---

### 8. Skip Next Order

```
PUT /api/external/v2/subscription-billing-attempts/skip-order/{id}
```

**Path Parameters:**

- `id` (required): Billing attempt ID

**Query Parameters:**

- `subscriptionContractId` (optional): Contract ID
- `isPrepaid` (optional): Default `false`

**Use Case:** Skip upcoming billing cycle

---

### 9. Get Fulfillment History

```
GET /api/external/v2/subscription-contract-details/subscription-fulfillments/{contractId}
```

**Purpose:** Get order/invoice history for subscription

**Path Parameters:**

- `contractId` (required): Contract ID

**Response:** Order object with fulfillment history

**Use Case:** Display invoice table on account page

---

## Important Behavioral Notes

### Status Value Formats

- **List endpoint returns:** lowercase (`"active"`, `"paused"`, `"cancelled"`)
- **Detail endpoint returns:** uppercase (`"ACTIVE"`, `"PAUSED"`, `"CANCELLED"`)
- **Update endpoints expect:** uppercase (`"ACTIVE"`, `"PAUSED"`, `"CANCELLED"`)

### Cancellation and Reactivation

1. **No dedicated cancel endpoint** - use status update with `CANCELLED`
2. **PAUSED subscriptions** can always be reactivated by setting status to `ACTIVE`
3. **CANCELLED subscriptions** can only be reactivated if `nextBillingDate` is in the future (see table in Section 4)
4. Track `pausedFromActive` field to know previous state

**Grace Period:** When a user cancels, they retain access until the end of their current billing period. During this time, they can reactivate. After `nextBillingDate` passes, they must subscribe again through checkout.

### Plan Changes

- Changes take effect on next billing cycle
- Use Shopify variant IDs (see constants)
- New price reflected in `orderAmount` field
- Returns full updated contract

### Subscription Tiers (Derived from Price)

- €200+/month = Supporter
- €50+/month = Premium
- €20+/month = Core
- €10+/month = Live
- <€10 = Unsubscribed

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (invalid API key)
- `404`: Not found
- `500`: Server error

---

**Document Version:** 2.1
**Source:** `appstle-api.json` OpenAPI Specification
**Last Updated:** January 19, 2026
