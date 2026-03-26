# Multi-Store Architecture: Authentication & Commerce

This document explains how bhakti.plus handles authentication and commerce across multiple Shopify stores.

---

## Overview

bhakti.plus is a **single Hydrogen deployment** that serves all users globally, but uses **two Shopify stores** for regional commerce. The architecture separates authentication (AuthN) from commerce/billing.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              bhakti.plus                                        │
│                         (Single Hydrogen App)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    AUTHENTICATION LAYER                                 │   │
│   │                                                                         │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │              EU Shopify Store (guruconnect-108)                 │   │   │
│   │   │                                                                 │   │   │
│   │   │   • Customer Account API (OAuth)                                │   │   │
│   │   │   • ALL users log in through this store                         │   │   │
│   │   │   • Provides: email address (primary identifier)                │   │   │
│   │   │   • DO NOT use: customer ID, tags, or other data from this      │   │   │
│   │   │                                                                 │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      │ email                                    │
│                                      ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                       MEDIA PLATFORM API                                │   │
│   │                                                                         │   │
│   │   • Identifies users by EMAIL (not Shopify customer ID)                 │   │
│   │   • Returns: subscriptionTier, ppv, watch history, preferences          │   │
│   │   • Returns: shopifyBillingShopId (which store user pays through)       │   │
│   │   • Returns: shopifyCustomerId (from their billing store)               │   │
│   │   • Source of truth for user entitlements                               │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## The Two Shopify Stores

### 1. EU Store (`guruconnect-108`)

| Aspect | Details |
|--------|---------|
| **Purpose** | Authentication + EU Commerce |
| **Domain** | Connected to Customer Account API |
| **Currency** | EUR |
| **Who** | EU customers (billing + subscriptions) |
| **Customer Account API** | YES - used for ALL user authentication |
| **Appstle Subscriptions** | YES - manages EU subscriptions |

### 2. ROW Store (`guruconnect-108-row`)

| Aspect | Details |
|--------|---------|
| **Purpose** | US + Rest of World Commerce |
| **Domain** | Separate Shopify store |
| **Currency** | USD |
| **Who** | Non-EU customers (billing + subscriptions) |
| **Customer Account API** | NO - not connected to Hydrogen |
| **Appstle Subscriptions** | YES - manages ROW subscriptions (same config as EU) |

---

## Authentication Flow

```
┌──────────────┐      ┌────────────────────────┐      ┌─────────────────────┐
│              │      │     EU Shopify Store   │      │   Media Platform    │
│    User      │      │   (Customer Account    │      │        API          │
│              │      │         API)           │      │                     │
└──────┬───────┘      └───────────┬────────────┘      └──────────┬──────────┘
       │                          │                               │
       │  1. Click "Log In"       │                               │
       │─────────────────────────▶│                               │
       │                          │                               │
       │  2. OAuth redirect       │                               │
       │◀─────────────────────────│                               │
       │                          │                               │
       │  3. User authenticates   │                               │
       │  (creates account if     │                               │
       │   needed in EU store)    │                               │
       │─────────────────────────▶│                               │
       │                          │                               │
       │  4. OAuth callback       │                               │
       │     (session created)    │                               │
       │◀─────────────────────────│                               │
       │                          │                               │
       │                          │  5. Query customer data       │
       │                          │     (email, firstName, etc)   │
       │                          │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─▶│
       │                          │                               │
       │                          │  6. GET /user/profile         │
       │                          │     { email: "user@x.com" }   │
       │                          │                               │
       │                          │  7. Returns:                  │
       │                          │     - subscriptionTier        │
       │                          │     - shopifyBillingShopId    │
       │                          │     - shopifyCustomerId       │
       │                          │     - ppv, preferences, etc   │
       │                          │◀─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
       │                          │                               │
       │  8. User is logged in    │                               │
       │     with entitlements    │                               │
       │◀─────────────────────────│                               │
       │                          │                               │
```

### Key Points

1. **Single Login System**: All users authenticate through the EU store's Customer Account API
2. **Email is Primary Identifier**: After OAuth, we extract the user's email and use it to query the Media API
3. **Media API is Source of Truth**: User entitlements (subscriptionTier, PPV, etc.) come from Media API, not Shopify
4. **EU Store Customer Data is NOT Used**: We don't use tags, customer ID, or subscription data from the EU store directly

---

## Commerce Flow (Subscriptions)

### EU Users

```
User in EU → Log in via EU Store → Subscribe via EU Store → Appstle (EU) manages subscription
                    │                        │
                    │                        ▼
                    │              ┌─────────────────────┐
                    │              │   EU Shopify Store  │
                    │              │   (guruconnect-108) │
                    │              │                     │
                    │              │   • Customer account│
                    │              │   • Orders          │
                    │              │   • Subscriptions   │
                    │              │   • Payment methods │
                    │              └─────────────────────┘
                    │
                    └─── Same store for both auth and commerce
```

### ROW (US + Rest of World) Users

```
User in US → Log in via EU Store → Subscribe via ROW Store → Appstle (ROW) manages subscription
                    │                        │
                    │                        ▼
                    │              ┌─────────────────────────┐
                    │              │    ROW Shopify Store    │
                    │              │  (guruconnect-108-row)  │
                    │              │                         │
                    │              │   • Customer account    │
                    │              │   • Orders              │
                    │              │   • Subscriptions       │
                    │              │   • Payment methods     │
                    │              └─────────────────────────┘
                    │
                    └─── TWO accounts: EU (auth only) + ROW (commerce)
```

### Consequence: Dual Accounts for ROW Users

ROW users end up with **two Shopify customer accounts**:

| Account | Purpose | Contains |
|---------|---------|----------|
| EU Store Account | Authentication only | Email, basic profile |
| ROW Store Account | Commerce | Orders, subscriptions, payment methods, billing address |

This is a known limitation of the current architecture.

---

## Where Data Lives

### User Identity

```typescript
// From EU Store Customer Account API (auth layer)
{
  email: "user@example.com",       // ✅ USE THIS - primary identifier
  firstName: "John",               // ✅ USE THIS - display name
  lastName: "Doe",                 // ✅ USE THIS - display name

  // ❌ DO NOT USE these from EU store:
  // shopifyCustomerId - this is EU store ID, not commerce store
  // tags - these are EU store tags, not subscription status
}
```

### User Entitlements

```typescript
// From Media Platform API (/user/profile)
{
  subscriptionTier: "premium",              // ✅ Source of truth for access
  ppv: ["pilgrimage-2024"],                 // ✅ PPV content access
  shopifyBillingShopId: 123456,             // ✅ Which store (EU or ROW)
  shopifyCustomerId: 789012,                // ✅ Customer ID in billing store
  shopifyBillingCountry: "US",              // ✅ Billing country
  isPayingCustomer: true,                   // ✅ Has placed orders
  videosInProgressCount: 5,                 // ✅ Watch history
}
```

### Subscription Management

```typescript
// Appstle API - must use correct store's API key
{
  // EU Store (guruconnect-108)
  EU_APPSTLE_API_KEY: "xxx",

  // ROW Store (guruconnect-108-row)
  ROW_APPSTLE_API_KEY: "yyy",
}

// When managing subscriptions, determine which API key to use based on:
// 1. shopifyBillingShopId from Media API
// 2. or billingCountry routing logic
```

---

## Region Routing for Checkout

When a user wants to subscribe, we route them to the correct store:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REGION ROUTING LOGIC                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. Check: Does user have existing billing country?                    │
│     └─ YES → Use their billing store (shopifyBillingShopId)           │
│     └─ NO  → Continue to step 2                                        │
│                                                                        │
│  2. Check: URL region parameter?                                       │
│     └─ /eu/* routes → EU Store checkout                                │
│     └─ /us/* routes → ROW Store checkout                               │
│     └─ No region   → Continue to step 3                                │
│                                                                        │
│  3. Check: GeoIP detection                                             │
│     └─ EU country   → EU Store checkout                                │
│     └─ Other        → ROW Store checkout                               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Product Parity

Both stores have **identical product configurations**:

| Item | EU Store | ROW Store |
|------|----------|-----------|
| Membership Product | Bhakti+ access plan | Bhakti+ access plan |
| Variants | Live, Core, Premium, Supporter | Live, Core, Premium, Supporter |
| Selling Plans | Monthly, Yearly | Monthly, Yearly |
| Appstle Config | Same rules, different API keys | Same rules, different API keys |

**Important**: Variant IDs and Selling Plan IDs are **different** between stores, even though products are equivalent.

```typescript
// EU Store IDs
const EU_VARIANTS = {
  live: '55782682689915',
  core: '55782682722683',
  premium: '55782682755451',
  supporter: '55782682788219',
};

// ROW Store IDs (different!)
const ROW_VARIANTS = {
  live: '...',  // Different ID
  core: '...',  // Different ID
  premium: '...',  // Different ID
  supporter: '...',  // Different ID
};
```

---

## Code Architecture

### Auth Server (`app/lib/auth.server.ts`)

```typescript
export async function getAuthenticatedUser(context, env, request) {
  // 1. Check login via EU Store Customer Account API
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (!isLoggedIn) return { user: null, subscriptionTier: "unsubscribed" };

  // 2. Get basic info from EU Store (email only matters)
  const { data } = await context.customerAccount.query(CUSTOMER_DETAILS_QUERY);
  const email = data?.customer?.emailAddress?.emailAddress;

  // 3. Get entitlements from Media API (source of truth)
  const userProfile = await context.mediaApi.user.getUserProfile({ email });

  // 4. Return combined user object
  return {
    user: {
      email,
      firstName: data?.customer?.firstName,
      lastName: data?.customer?.lastName,
      shopifyCustomerId: userProfile.shopifyCustomerId,  // From billing store!
      billingCountry: userProfile.shopifyBillingCountry,
      ppv: userProfile.ppv,
    },
    subscriptionTier: userProfile.subscriptionTier,
  };
}
```

### Why We Don't Use Two Customer Account APIs

Shopify's Customer Account API is configured at the Hydrogen app level:

```typescript
// server.ts - only ONE customerAccount client
const { storefront, customerAccount, cart } = createHydrogenContext({
  env,
  request,
  // This binds to ONE store's Customer Account API
});
```

To use two Customer Account APIs would require:
1. Two separate Hydrogen deployments, OR
2. Complex runtime client switching (session management nightmare)

Our approach (single auth layer + Media API for entitlements) is simpler and more maintainable.

---

## Store Context Utilities

To prevent scattered conditionals for store-specific logic, we provide centralized utility functions with explicit client/server separation.

### File Structure

```
app/lib/store-routing/
├── config.ts           # Country lists, getStoreForCountry, getCheckoutDomain
├── context.ts          # Client-safe: StoreContextClient, getClientStoreContext
├── context.server.ts   # Server-only: StoreContextServer, getServerStoreContext
└── index.ts            # Re-exports
```

### Client-Safe Context (StoreContextClient)

Used in the root loader to provide store info to React components:

```typescript
// In root loader:
import { getClientStoreContext } from '~/lib/store-routing';

// Uses countryCode from locale cascade, NOT raw detectedCountry
const storeContext = getClientStoreContext(userProfile, countryCode, env);
return { storeContext, ... };

// In components:
const { storeContext } = useRootLoaderData();
// storeContext.storeType: 'eu' | 'row'
// storeContext.checkoutDomain: string
// storeContext.routingSource: how store was determined
```

**Safe to expose**: Contains only public info (store type, checkout domain).

### Server-Only Context (StoreContextServer)

Used in route loaders for Appstle API calls:

```typescript
// In route loaders:
import { getServerStoreContext } from '~/lib/store-routing/context.server';

// countryCode is required - comes from context.countryCode
const serverContext = getServerStoreContext(userProfile, env, countryCode);
const subscriptions = await getCustomerSubscriptions(
  serverContext.billingCustomerId,
  serverContext.appstleApiKey
);

// NEVER return serverContext from loaders!
```

**Never expose**: Contains API keys and billing customer IDs.

### Why This Separation?

1. **TypeScript enforces safety**: `StoreContextServer` type should never appear in loader return types
2. **File naming**: `.server.ts` suffix prevents client bundling
3. **Clear documentation**: JSDoc comments explain the security boundary
4. **Single source of truth**: Store determination logic in one place

### Store Determination Priority

The `determineStore()` function uses this priority chain:

1. **shopifyBillingShopId** - Direct store ID from Media API (most authoritative)
2. **shopifyBillingCountry** - Current billing country
3. **shopifyLastKnownBillingCountry** - Historical billing country
4. **countryCode** - Country from locale cascade (URL > GeoIP > default)
5. **Default** - Falls back to ROW store

**Important**: The fallback uses `countryCode` from the locale cascade, NOT raw `detectedCountry` from GeoIP. This ensures consistent behavior - if a user visits `/de/videos`, they get routed to the EU store regardless of their actual location. The raw `detectedCountry` is only used for the RegionSuggestionBanner (to suggest switching when location differs from URL).

---

## Future Considerations

### Single Customer Account

If Shopify supports multi-store customer accounts in the future, or if we consolidate to a single store, the architecture could simplify:

```
Future State (hypothetical):
┌─────────────────────────────────────────────────────┐
│            Single Shopify Store                     │
│                                                     │
│   • Single customer account per user                │
│   • Multi-currency support                          │
│   • Regional pricing via Shopify Markets            │
│   • Single Appstle configuration                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Alternative: Separate Deployments

Another approach would be separate Hydrogen apps per region:

```
eu.bhakti.plus  → EU Hydrogen App  → EU Store (auth + commerce)
app.bhakti.plus → ROW Hydrogen App → ROW Store (auth + commerce)
```

This would eliminate dual accounts but adds deployment complexity.

---

## Summary

| Component | What | Where |
|-----------|------|-------|
| Authentication | Customer Account API OAuth | EU Store (all users) |
| User Identity | Email address | EU Store → Media API |
| Entitlements | subscriptionTier, PPV | Media API (source of truth) |
| EU Commerce | Orders, subscriptions, payments | EU Store |
| ROW Commerce | Orders, subscriptions, payments | ROW Store |
| Subscription Management | Appstle API | Both stores (different API keys) |

**Key Takeaway**: Think of the EU Store's Customer Account API as a pure authentication layer. After login, use the email to query the Media API for everything else.
