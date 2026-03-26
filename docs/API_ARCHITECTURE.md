# API Architecture: Shopify vs Media Platform API

This document clarifies which API to use for different data needs. **The Media Platform API is the primary data source for almost everything.** Shopify APIs are only used for a narrow set of commerce and authentication concerns.

## TL;DR

| Need | API | Notes |
|------|-----|-------|
| Video content | **Media Platform API** | Satsangs, lives, commentaries, pilgrimages, talks |
| User subscription tier | **Media Platform API** | Source of truth for access control |
| Watch history | **Media Platform API** | Progress, completed, in-progress |
| User profile | **Media Platform API** | Region, billing customer ID |
| Search | **Media Platform API** | Content search, trending, history |
| Membership plans | **Media Platform API** | Plans with localized pricing |
| Login/logout | Shopify Customer Account API | OAuth flow only |
| User email | Shopify Customer Account API | Bridge to Media API identity |
| UI translations | Shopify Storefront API | Metaobjects (legacy) |
| CMS content | Shopify Storefront API | Hero, FAQs (legacy) |
| Products for checkout | Shopify Storefront API | Subscription products |

---

## The Golden Rule

> **If it's content or user data, use the Media Platform API.**
> **If it's authentication or checkout, use Shopify.**

---

## Media Platform API (Use for Almost Everything)

The Media Platform API at `context.mediaApi` is the **source of truth** for:

### Content Data
```typescript
// ✅ CORRECT - All video content comes from Media API
const satsangs = await mediaApi.satsangs.getFeatured();
const lives = await mediaApi.lives.getLatestReleases({ limit: 4 });
const commentaries = await mediaApi.commentaries.getAll();
const pilgrimages = await mediaApi.pilgrimages.getAll();
const talks = await mediaApi.talks.getAll();
```

### User Data
```typescript
// ✅ CORRECT - User profile from Media API
const userProfile = await mediaApi.user.getUserProfile({ email });
// Returns: { subscriptionTier, billingCustomerId, region, ... }

// ✅ CORRECT - Watch history from Media API
const watchHistory = await mediaApi.user.getWatchHistory({ email });
const inProgress = await mediaApi.user.getInProgressVideos({ email });
```

### Subscription & Access Control
```typescript
// ✅ CORRECT - Subscription tier from Media API
const { subscriptionTier } = await mediaApi.user.getUserProfile({ email });
// subscriptionTier is THE source of truth for content access

// ✅ CORRECT - Membership plans from Media API
const plans = await mediaApi.memberships.getAll();
```

### Search
```typescript
// ✅ CORRECT - Search via Media API
const results = await mediaApi.search.query({ q: 'bhakti' });
const trending = await mediaApi.search.getTrending();
```

---

## Shopify Customer Account API (Authentication Only)

The Customer Account API at `context.customerAccount` is used **only for authentication**.

### What It's For
```typescript
// ✅ CORRECT - Check if user is logged in
const isLoggedIn = await customerAccount.isLoggedIn();

// ✅ CORRECT - Get user email (to query Media API)
const { data } = await customerAccount.query(CUSTOMER_ACCOUNT_QUERY);
const email = data.customer.emailAddress?.emailAddress;

// ✅ CORRECT - Login/logout flows
await customerAccount.login();
await customerAccount.logout();
```

### What It's NOT For
```typescript
// ❌ WRONG - Don't get subscription info from Shopify
const tier = customer.tags.find(t => t.includes('member')); // NO!

// ❌ WRONG - Don't get user profile from Shopify
const profile = customer.metafields; // NO!

// ❌ WRONG - Don't track watch history in Shopify
const watched = customer.orders; // NO!
```

---

## Shopify Storefront API (Minimal Usage)

The Storefront API at `context.storefront` is used for **Shopify-native content only**.

### Acceptable Uses
```typescript
// ✅ OK - UI translations stored as metaobjects
const translations = await storefront.query(TRANSLATIONS_QUERY);

// ✅ OK - Product data for checkout
const product = await storefront.query(PRODUCT_QUERY, {
  variables: { handle: 'premium' }
});

// ✅ OK - Footer menu structure
const footer = await storefront.query(FOOTER_QUERY);

// ✅ OK - Static CMS pages
const page = await storefront.query(PAGE_QUERY);
```

### Never Use For
```typescript
// ❌ WRONG - Don't query video content from Shopify
const videos = await storefront.query(VIDEOS_QUERY); // NO!

// ❌ WRONG - Don't get user data from Shopify
const user = await storefront.query(USER_QUERY); // NO!
```

---

## Identity Bridge Pattern

The email from Shopify Customer Account API bridges to the Media Platform API:

```
┌─────────────────────────┐     ┌─────────────────────────┐
│  Shopify Customer       │     │  Media Platform API     │
│  Account API            │     │                         │
│                         │     │                         │
│  customerAccount.query()│────▶│  mediaApi.user.get      │
│  → email                │     │  Profile({ email })     │
│                         │     │  → subscriptionTier     │
│                         │     │  → billingCustomerId    │
│                         │     │  → region               │
└─────────────────────────┘     └─────────────────────────┘
```

```typescript
// 1. Get email from Shopify (authentication)
const { data } = await customerAccount.query(CUSTOMER_ACCOUNT_QUERY);
const email = data.customer.emailAddress?.emailAddress;

// 2. Get user data from Media API (source of truth)
const userProfile = await mediaApi.user.getUserProfile({ email });
const { subscriptionTier, billingCustomerId } = userProfile;
```

---

## API Service Reference

The Media Platform API client provides these services:

| Service | Endpoint | Data |
|---------|----------|------|
| `mediaApi.satsangs` | `/satsangs` | Satsang content, categories, featured |
| `mediaApi.lives` | `/lives` | Live streams, featured, status |
| `mediaApi.commentaries` | `/commentaries` | Commentary series and videos |
| `mediaApi.pilgrimages` | `/pilgrimages` | Pilgrimage series and videos |
| `mediaApi.talks` | `/talks` | Talk content |
| `mediaApi.search` | `/search` | Search, history, trending |
| `mediaApi.user` | `/user` | Profile, watch history, purchases |
| `mediaApi.video` | `/video` | Individual video data |
| `mediaApi.memberships` | `/memberships` | Membership plans with pricing |

---

## Code Locations

- **Media API Client**: `app/lib/api/index.ts`
- **Media API Services**: `app/lib/api/services/`
- **Storefront Queries**: `app/graphql/`
- **Customer Account Queries**: `app/graphql/customer-account/`
- **Auth Utilities**: `app/lib/auth.server.ts`

---

## Summary

1. **Media Platform API** = Content + User Data + Subscriptions
2. **Shopify Customer Account API** = Authentication only (get email)
3. **Shopify Storefront API** = Products for checkout + legacy CMS

When in doubt, use the Media Platform API.
