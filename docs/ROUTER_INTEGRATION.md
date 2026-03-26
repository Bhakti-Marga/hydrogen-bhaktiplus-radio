# Bhakti+ Router Integration Guide

## Overview

The Bhakti+ Router (`/router`) is the central entry point for all user actions that require:
- Authentication
- Store selection (EU/US)
- Checkout redirection

**Base URL:** `https://bhakti.plus/router`

---

## URL Structure

```
https://bhakti.plus/router?intent={INTENT}&{PARAMS}
```

---

## Intents

### 1. Login (`intent=login`)

Redirect user to login, then back to a specific page.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `intent` | ✅ | `login` |
| `return_to` | ❌ | Path to redirect after login (default: `/app`) |

**Examples:**

```
# Login and go to homepage
https://bhakti.plus/router?intent=login

# Login and go to My Account
https://bhakti.plus/router?intent=login&return_to=/my

# Login and go to a specific video
https://bhakti.plus/router?intent=login&return_to=/watch/123
```

---

### 2. Subscribe (`intent=subscribe`)

Purchase a membership subscription.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `intent` | ✅ | `subscribe` |
| `membership_id` | ✅ | `live` \| `premium` \| `supporter` |
| `billing_period` | ❌ | `monthly` \| `yearly` (default: `monthly`) |

**Examples:**

```
# Premium Monthly
https://bhakti.plus/router?intent=subscribe&membership_id=premium&billing_period=monthly

# Premium Yearly
https://bhakti.plus/router?intent=subscribe&membership_id=premium&billing_period=yearly

# Live Monthly
https://bhakti.plus/router?intent=subscribe&membership_id=live&billing_period=monthly

# Supporter Yearly
https://bhakti.plus/router?intent=subscribe&membership_id=supporter&billing_period=yearly
```

---

### 3. Product (`intent=product`)

Purchase a single content item (talk, pilgrimage, commentary).

| Parameter | Required | Description |
|-----------|----------|-------------|
| `intent` | ✅ | `product` |
| `content_type` | ✅ | `talks` \| `pilgrimages` \| `commentaries` |
| `content_id` | ✅ | ID of the content from the API |

**Examples:**

```
# Buy a Talk (ID: 125)
https://bhakti.plus/router?intent=product&content_type=talks&content_id=125

# Buy a Virtual Pilgrimage (ID: 42)
https://bhakti.plus/router?intent=product&content_type=pilgrimages&content_id=42

# Buy a Commentary (ID: 8)
https://bhakti.plus/router?intent=product&content_type=commentaries&content_id=8
```

---

### 4. Catalog (`intent=catalog`)

Redirect to the catalog page (identifies user region first).

| Parameter | Required | Description |
|-----------|----------|-------------|
| `intent` | ✅ | `catalog` |

**Example:**

```
https://bhakti.plus/router?intent=catalog
```

---

## Quick Reference

### Membership Links

| Plan | Period | URL |
|------|--------|-----|
| Premium | Monthly | `https://bhakti.plus/router?intent=subscribe&membership_id=premium&billing_period=monthly` |
| Premium | Yearly | `https://bhakti.plus/router?intent=subscribe&membership_id=premium&billing_period=yearly` |
| Live | Monthly | `https://bhakti.plus/router?intent=subscribe&membership_id=live&billing_period=monthly` |
| Live | Yearly | `https://bhakti.plus/router?intent=subscribe&membership_id=live&billing_period=yearly` |
| Supporter | Monthly | `https://bhakti.plus/router?intent=subscribe&membership_id=supporter&billing_period=monthly` |
| Supporter | Yearly | `https://bhakti.plus/router?intent=subscribe&membership_id=supporter&billing_period=yearly` |

### Common Pages

| Action | URL |
|--------|-----|
| Login | `https://bhakti.plus/router?intent=login` |
| My Account | `https://bhakti.plus/router?intent=login&return_to=/my` |
| Manage Membership | `https://bhakti.plus/router?intent=login&return_to=/account/manage-membership` |
| Catalog | `https://bhakti.plus/router?intent=catalog` |
| Logout | `https://bhakti.plus/router?intent=logout` |
| Account Profile | `https://bhakti.plus/router?intent=account&return_to=/profile` |

---

## Logout Intent

The logout intent handles **dual-store logout** for users who have accounts on both EU and US stores.

### URL Format

```
https://bhakti.plus/router?intent=logout
https://bhakti.plus/router?intent=logout&return_to=/
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `intent` | Yes | Must be `logout` |
| `return_to` | No | Where to redirect after logout. Default: `/` |

### Flow

For **EU users**:
1. Log out from EU store (Customer Account API)
2. Redirect to `return_to` destination

For **US users**:
1. Log out from EU store (Customer Account API)
2. Redirect to US store logout (`account-us.bhakti.plus/logout`)
3. US store logs out
4. Redirect to `return_to` destination

### Usage

```html
<!-- Form-based logout (POST) -->
<form method="post" action="/account/logout">
  <button type="submit">Logout</button>
</form>

<!-- Link-based logout (GET via router) -->
<a href="/router?intent=logout">Logout</a>
```

> **Note**: The `/account/logout` action also handles dual-store logout automatically.

---

## Frontend Implementation

### React/JavaScript Example

```javascript
// Helper function to build router URLs
function buildRouterUrl(intent, params = {}) {
  const url = new URL('https://bhakti.plus/router');
  url.searchParams.set('intent', intent);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      url.searchParams.set(snakeKey, String(value));
    }
  });
  
  return url.toString();
}

// Usage examples:

// Login
buildRouterUrl('login');
// → https://bhakti.plus/router?intent=login

// Login with return path
buildRouterUrl('login', { returnTo: '/my' });
// → https://bhakti.plus/router?intent=login&return_to=/my

// Subscribe Premium Monthly
buildRouterUrl('subscribe', { 
  membershipId: 'premium', 
  billingPeriod: 'monthly' 
});
// → https://bhakti.plus/router?intent=subscribe&membership_id=premium&billing_period=monthly

// Buy a Talk
buildRouterUrl('product', { 
  contentType: 'talks', 
  contentId: 125 
});
// → https://bhakti.plus/router?intent=product&content_type=talks&content_id=125
```

### Using with API Data

When displaying content from the API, use the `id` field to build purchase links:

```javascript
// Fetch talks from API
const talks = await fetch('https://media-api.bhaktimarga.org/talks?api_version=latest&locale=en-US')
  .then(res => res.json());

// Build purchase link for each talk
talks.forEach(talk => {
  const purchaseUrl = buildRouterUrl('product', {
    contentType: 'talks',
    contentId: talk.id
  });
  
  console.log(`${talk.title}: ${purchaseUrl}`);
});
```

---

## Router Flow

```
User clicks link
       ↓
   /router
       ↓
  Logged in? ──No──→ Show login page
       ↓ Yes
  Has region? ──No──→ Show country selection
       ↓ Yes
  Build checkout URL
       ↓
  Redirect to correct store (EU/US)
```

---

## Notes

1. **Authentication**: If the user is not logged in, they will be prompted to log in first.

2. **Region Detection**: New users will be asked to select their country. This determines which Shopify store (EU or US) they will be redirected to.

3. **Direct Links**: These URLs can be used anywhere - emails, mobile apps, marketing pages, etc.

4. **Tracking**: All router actions are logged for analytics purposes.

---

## API Reference

### Content Types

| Type | API Endpoint | Example ID Field |
|------|--------------|------------------|
| Talks | `/talks` | `talk.id` |
| Pilgrimages | `/pilgrimages` | `pilgrimage.id` |
| Commentaries | `/commentaries` | `commentary.id` |

### Membership IDs

| ID | Description |
|----|-------------|
| `live` | Live streaming access |
| `premium` | Full content library |
| `supporter` | Premium + supporter benefits |

### Billing Periods

| Period | Description |
|--------|-------------|
| `monthly` | Billed every month |
| `yearly` | Billed annually (discounted) |





