# Bhakti Plus Router

Central routing system for directing users to the correct Shopify store (EU/US) based on their region.

## Overview

The router (`/router`) is the entry point for all purchase and authentication flows. It:

1. **Identifies the user** via Shopify Customer Account API
2. **Resolves the region** from the Media API (or asks user to select country)
3. **Redirects to the correct store** with the appropriate checkout URL

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BHAKTI PLUS ROUTER                          │
│                      /router?intent=...                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   User logged in?       │
                    └─────────────────────────┘
                         │              │
                        NO             YES
                         │              │
                         ▼              ▼
              ┌──────────────┐   ┌─────────────────┐
              │ Show Login   │   │ Check region    │
              │ Page         │   │ (Media API)     │
              └──────────────┘   └─────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                  FOUND            NOT_FOUND           ERROR
                    │                  │                  │
                    ▼                  ▼                  ▼
           ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
           │ Show loading │   │ Show country │   │ Show retry   │
           │ + redirect   │   │ selection    │   │ page         │
           └──────────────┘   └──────────────┘   └──────────────┘
                    │                  │
                    ▼                  ▼
           ┌──────────────────────────────────────────────┐
           │              REDIRECT TO STORE               │
           │  EU → checkout.bhakti.plus                   │
           │  US → us.bhakti.plus                         │
           └──────────────────────────────────────────────┘
```

## URL Parameters

| Parameter | Required | Values | Description |
|-----------|----------|--------|-------------|
| `intent` | Yes | `login`, `subscribe`, `product`, `catalog` | Action type |
| `membership_id` | For subscribe | `live`, `premium`, `supporter` | Membership plan |
| `billing_period` | For subscribe | `monthly`, `yearly` | Billing frequency |
| `content_type` | For product | `pilgrimages`, `commentaries`, `talks` | Content category |
| `content_id` | For product | number | Content ID |
| `return_to` | Optional | path | Redirect path after login |

## Example URLs

### Login
```
/router?intent=login&return_to=/app
/router?intent=login&return_to=/account/manage-membership
```

### Subscribe (Memberships)
```
/router?intent=subscribe&membership_id=live&billing_period=monthly
/router?intent=subscribe&membership_id=premium&billing_period=yearly
/router?intent=subscribe&membership_id=supporter&billing_period=monthly
```

### Product (Individual Content)
```
/router?intent=product&content_type=talks&content_id=125
/router?intent=product&content_type=pilgrimages&content_id=25
/router?intent=product&content_type=commentaries&content_id=20
```

### Catalog
```
/router?intent=catalog
```

## Store Routing

### EU Store (`checkout.bhakti.plus`)
- Uses standard Shopify `/cart/add` URL
- Format: `/cart/add?id={VARIANT_ID}&quantity=1&selling_plan={SELLING_PLAN_ID}&return_to=/checkout`
- Login via: `/customer_authentication/login?return_to=...`

### US Store (`us.bhakti.plus`)
- Uses custom checkout router page `/pages/addtemp`
- Format: `/pages/addtemp?variant={VARIANT_ID}&qty=1&plan={SELLING_PLAN_ID}`
- Login via: `/customer_authentication/login?return_to=...`

#### US Store `/pages/addtemp` Code

This page handles cart clearing, adding items, and redirecting to checkout:

```html
<div style="padding:24px;text-align:center">
  <h2>Preparing your checkout…</h2>
  <p>Please wait a moment.</p>
</div>

<script>
(async () => {
  const url = new URL(window.location.href);
  const variant = url.searchParams.get("variant");
  const qty = parseInt(url.searchParams.get("qty") || "1", 10);
  const plan = url.searchParams.get("plan"); // Optional for simple products

  // Only variant is required, plan is optional
  if (!variant) {
    window.location.href = "/cart";
    return;
  }

  // Clear cart
  await fetch("/cart/clear.js", { method: "POST", headers: { "Accept": "application/json" } });

  // Build cart item
  const item = {
    id: Number(variant),
    quantity: qty,
  };
  
  // Add selling_plan only if provided (subscriptions)
  if (plan) {
    item.selling_plan = Number(plan);
  }

  // Add to cart
  const res = await fetch("/cart/add.js", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ items: [item] })
  });

  if (!res.ok) {
    window.location.href = "/cart";
    return;
  }

  window.location.href = "/checkout";
})();
</script>
```

## API Integration

### Media API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /user/check-region?email=...` | Check if user exists and get region |
| `POST /user/select-region` | Register user's country/region |
| `GET /memberships?region_id=...` | Get membership Shopify IDs |
| `GET /{content_type}/{id}?region_id=...` | Get product Shopify IDs |

### Region IDs
- `1` = EU Store
- `2` = US Store

## Country to Region Mapping

### EU Countries (→ EU Store)
Albania, Andorra, Austria, Belarus, Belgium, Bosnia and Herzegovina, Bulgaria, Croatia, Cyprus, Czech Republic, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Iceland, Ireland, Italy, Kosovo, Latvia, Liechtenstein, Lithuania, Luxembourg, Malta, Moldova, Monaco, Montenegro, Netherlands, North Macedonia, Norway, Poland, Portugal, Romania, San Marino, Serbia, Slovakia, Slovenia, Spain, Sweden, Switzerland, **Turkey**, Ukraine, United Kingdom, Vatican City

### Rest of World (→ US Store)
All other countries including USA, Canada, Latin America, Asia, Africa, Middle East, etc.

## Router States & UI

### 1. Need Login
Shows when user is not authenticated.
- Displays "Welcome to Bhakti+" message
- Link to Shopify login with return URL

### 2. Need Country
Shows when user is new (no region assigned).
- Displays country selection grouped by continent
- User selection is saved permanently

### 3. Redirecting
Shows animated loading with steps:
1. ✓ Checking your account
2. ✓ Determining your region
3. ● Preparing checkout
4. ○ Redirecting to EU/US Store

Auto-redirects after ~2.5 seconds.

### 4. API Error
Shows when Media API fails.
- "Something went wrong" message
- "Try Again" button

## Monitoring

All router actions are logged to:
```
POST https://authbhaktiplus-mob.bmdatahub.org/router/api/?action=log
```

Logged data includes:
- `email`
- `intent`
- `action_type` (redirect, need_login, need_country, api_error)
- `resolved_region`
- `redirect_url`
- `is_new_user`
- `country_code` (for new users)

## Configuration

```typescript
const CONFIG = {
  api: {
    baseUrl: "https://media-api.bhaktimarga.org",
    userKey: "...",      // For user endpoints
    productsKey: "...",  // For product/membership endpoints
  },
  stores: {
    EU: {
      url: "https://checkout.bhakti.plus",
      regionId: 1,
    },
    US: {
      url: "https://us.bhakti.plus",
      regionId: 2,
      checkoutRouter: "/pages/addtemp",
    },
  },
  paths: {
    login: "/customer_authentication/login",
  },
};
```

## File Location

```
app/routes/router.tsx
```

## Related Files

- `app/styles/components/router.css` - Router page styles
- `app/graphql/customer-account/CustomerAccountQuery.ts` - GraphQL query for customer email
- `app/routes/($countryCode).($language).welcome.tsx` - Mobile welcome page
- `app/routes/($countryCode).($language).catalog.tsx` - Mobile catalog page

## Testing URLs

### Development (ngrok)
```
https://router.bhaktimarga.ngrok.dev/router?intent=subscribe&membership_id=premium&billing_period=monthly
```

### Production
```
https://bhakti.plus/router?intent=subscribe&membership_id=premium&billing_period=monthly
```
