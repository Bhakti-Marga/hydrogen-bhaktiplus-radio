# Bhakti+ My Account - Implementation Guide

## 📋 Executive Summary

This guide defines requirements for integrating the Bhakti+ My Account portal into the Hydrogen-based Shopify storefront. The portal provides subscription management, purchase history, and account security features.

**Target Implementation:** 4 account pages with responsive navigation
**Design Pattern:** Desktop sidebar + Mobile bottom tabs
**Integration:** Direct Shopify + Appstle API (source of truth)

---

## 🎨 Design System Compliance

**Follow existing design system:**
- Colors: `bg-brand-dark`, `text-white`, `text-grey-light`, `text-brand`, `text-gold`
- Spacing: Tailwind scale (8, 12, 16, 24, 32, 48, 60, 64px)
- Border radius: `rounded-md`, `rounded-lg`, `rounded-full`
- Breakpoints: `desktop` (1024px), `tablet` (768px)

**Note:** Invoice status badges currently use hardcoded green (#4CAF50) as the design system lacks a success color. Replace when available.

---

## 🏗️ Architecture Overview

### Pages & Routes

1. **`/account/manage-membership`** - Subscription dashboard
   - Current plan details, billing info, invoice history
   - Actions: Upgrade plan, cancel subscription

2. **`/account/purchases`** - Non-subscription purchases
   - Product grid with category filtering
   - Purchase status and metadata

3. **`/account/transactions`** - Transaction history
   - All transactions with payment details
   - Invoice download capability

4. **`/account/security`** - Account settings
   - Account info, password management
   - Privacy settings

### Data Flow

```
┌─────────────────────────────────────────┐
│         My Account Pages                │
│  (Manage Membership, Purchases, etc.)   │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼────────┐   ┌──────▼────────────┐
│ Shopify        │   │ Appstle API       │
│ Customer API   │   │ (Direct)          │
│ - Orders       │   │ - Subscriptions   │
│ - Customer     │   │ - Contracts       │
│ - Addresses    │   │ - Modifications   │
└────────────────┘   └───────────────────┘
```

**Note:** Media API provides cached data for main app. Account pages must query Shopify + Appstle directly for real-time accuracy.

---

## 📐 Layout Requirements

### Desktop Layout (≥1024px)

```
┌────────────────────────────────────────────────────┐
│  Container (max-width: 1440px, centered)          │
│                                                    │
│  ┌──────────────┬─────────────────────────────┐  │
│  │              │                             │  │
│  │  Sidebar     │   Page Content              │  │
│  │  (280px)     │   (flex-grow)               │  │
│  │              │                             │  │
│  │  Greeting    │   • Page heading            │  │
│  │  ────────    │   • Sections with cards     │  │
│  │  ☰ Nav Item  │   • Tables, forms, etc.     │  │
│  │  ☰ Nav Item  │                             │  │
│  │  ☰ Nav Item  │                             │  │
│  │  ☰ Nav Item  │                             │  │
│  │              │                             │  │
│  └──────────────┴─────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Sidebar Navigation:**
- Fixed width (280px)
- Personalized greeting (customer first name)
- 4 nav links with active state highlighting
- Active: Brand color background + bold
- Hover: Grey background transition

### Mobile Layout (<1024px)

```
┌────────────────────────────────────────┐
│  Greeting (top)                        │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │                                  │ │
│  │   Page Content (full width)      │ │
│  │                                  │ │
│  │   • Stacked cards                │ │
│  │   • Full-width tables            │ │
│  │   • Horizontal scroll if needed  │ │
│  │                                  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Fixed Bottom Tab Bar (64px)    │ │
│  │  📋 | 🛍️ | 💳 | 🔒             │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Bottom Tab Bar:**
- Fixed position at bottom, full width
- 4 equal-width tabs with icons + labels
- Active: Brand color, Inactive: Grey light
- Hidden on desktop

---

## 🔧 Technical Implementation

### Phase 1: Foundation

**Environment Variables:**
```
APPSTLE_API_KEY=<existing>
MEDIAPLATFORM_SUBSCRIPTION_SHOPIFY_PRODUCT_ID=15247882715515
```

**Constants** (`app/lib/constants.ts`):
```typescript
// Product IDs to exclude from "My Purchases"
SUBSCRIPTION_PRODUCT_IDS = [
  '15247882715515'  // Main subscription product
]

// Shopify variant IDs for subscription tiers
PLAN_VARIANT_IDS = {
  live: '55782682689915',
  core: '55782682722683',
  premium: '55782682755451',
  supporter: '55782682788219',
}

APPSTLE_API_BASE = 'https://membership-admin.appstle.com'
```

### Phase 2: Appstle API Service

**File:** `app/lib/api/services/appstle.ts`

**Required Functions:**

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `getMemberships(customerId, apiKey)` | GET `/api/external/v2/subscription-contract-details` | Fetch all subscriptions for customer |
| `getContractDetails(contractId, apiKey)` | GET `/api/external/v2/subscription-contract/{contractId}` | Get single contract details |
| `updateSubscriptionVariant(...)` | PUT `/api/external/v2/subscription-contract-update-variant` | Change subscription plan |
| `cancelSubscription(contractId, apiKey)` | PUT `/api/external/v2/subscription-contract-cancel` | Cancel subscription |

**Data Types:**
- `AppstleContract`: subscriptionContractId, customerId, status, orderAmount, billingPolicyInterval, nextBillingDate, lines.edges
- `AppstleMembershipsResponse`: counts (total, active, paused, cancelled) + contracts array

**Auth:** All requests require `X-API-Key` header

### Phase 3: Subscription Utilities

**File:** `app/lib/utils/subscription.ts`

**Required Functions:**

| Function | Logic |
|----------|-------|
| `deriveSubscriptionTierFromContract(contract)` | amount ≥200→supporter, ≥50→premium, ≥20→core, ≥10→live, else→unsubscribed |
| `getPlanNameFromVariantId(variantId)` | Reverse lookup in PLAN_VARIANT_IDS |
| `formatRenewalDate(dateString)` | Format as "Month Day, Year" |
| `getVariantIdFromPlanName(planName)` | Lookup in PLAN_VARIANT_IDS |

---

## 📄 Page Requirements

### 1. Manage Membership Page

**Route:** `app/routes/$(locale).account.manage-membership.tsx`

**Loader Data:**
- Fetch memberships from Appstle API
- Find active contract
- Derive subscription tier from contract amount
- Return: `{ memberships, activeContract, subscriptionTier }`

**Page Sections:**

#### Current Subscription Card
- **Empty state:** "No active subscription" message
- **Active state:**
  - Plan name + price (e.g., "Premium plan - €50.00 per month")
  - Renewal date
  - Actions: "Cancel subscription" + "Upgrade plan" buttons
  - Clicking buttons opens respective modals

#### Payment Method Card
- **Display:** Card type + last 4 digits (masked: "Visa •••• 0000")
- **Action:** "Manage payment" button → links to Shopify account page
- **Note:** Read-only, editing happens on Shopify

#### Billing Address Card
- **Display:** Customer name + default address (street, city, country, zip)
- **Action:** "Edit address" button → links to Shopify account page
- **Note:** Read-only, editing happens on Shopify

#### Invoice History Table
- **Columns:** Date | Amount | Status | Plan
- **Status badges:** Colored pill badges (paid=green, pending=gold, etc.)
- **Mobile:** Horizontal scroll enabled
- **Future:** Load from Shopify Orders API (currently placeholder data)

#### Plan Change Modal
**Trigger:** Click "Upgrade plan" button

**Layout:**
- Modal title: "Change your plan"
- 2×2 grid of plan cards (Live, Core, Premium, Supporter)
- Each card shows: name, price, feature list
- Current plan: Disabled + "Current plan" badge
- Selected plan: Highlighted with brand color border
- Actions: "Cancel" + "Confirm" buttons
- On confirm: Submit to action handler with new variant ID

#### Cancel Subscription Modal
**Trigger:** Click "Cancel subscription" button

**Layout:**
- Modal title: "Cancel subscription"
- Warning message about losing access
- Actions: "Keep subscription" + "Yes, cancel" (red) buttons
- On confirm: Submit cancellation to action handler

**Action Handler:**
- Handle "changePlan" action: Get contract details, update variant via Appstle API
- Handle "cancelSubscription" action: Cancel via Appstle API
- Return success/failure response

---

### 2. My Purchases Page

**Route:** `app/routes/$(locale).account.purchases.tsx`

**Requirements:**
- Display non-subscription products only (filter by SUBSCRIPTION_PRODUCT_IDS)
- Grid layout with product cards
- Show: product image, name, purchase date, status
- Filter by category (dropdown or tabs)
- Empty state: "No purchases yet" message

---

### 3. Transactions Page

**Route:** `app/routes/$(locale).account.transactions.tsx`

**Requirements:**
- List all transactions (table format)
- Columns: Date | Description | Amount | Payment Method | Status
- Download invoice button per row
- Filter by date range
- Pagination if needed
- Empty state: "No transactions" message

---

### 4. Security Page

**Route:** `app/routes/$(locale).account.security.tsx`

**Requirements:**

**Account Information Section:**
- Display: Email, name, account creation date
- Read-only display

**Password Management Section:**
- Button: "Change password" → links to Shopify account page
- Note: Password changes happen on Shopify for security

**Privacy Settings Section:**
- Email preferences (if applicable)
- Marketing consent toggles (if applicable)
- Note: Check what's available via Shopify API

---

## 🌐 Translation Keys

**File:** `app/lib/translations/keys.ts`

Add these keys (with Shopify metaobjects):

```typescript
// Navigation
account_manage_membership
account_my_purchases
account_transactions
account_security

// Manage Membership
account_current_subscription
account_payment_method
account_billing_shipping
account_invoice_history
account_no_active_subscription
account_cancel_subscription
account_upgrade_plan
account_subscription_renews
account_change_plan
account_cancel_confirmation
account_keep_subscription
account_cancel_confirm
account_manage_payment
account_edit_address

// Invoice Table
account_invoice_date
account_invoice_amount
account_invoice_status
account_invoice_plan

// Common
cancel
confirm
processing
```

---

## ✅ Implementation Checklist

### Phase 1: Foundation ✅
- [x] Add environment variables
- [x] Update constants.ts
- [x] Create Appstle API service
- [x] Create subscription utilities

### Phase 2: Layout & Navigation ✅
- [x] Update account parent route
- [x] Create AccountLayout component
- [x] Create AccountSidebar component
- [x] Create AccountMobileNav component
- [x] Add account.css styles

### Phase 3: Manage Membership Page
- [ ] Create manage-membership route
- [ ] Create MembershipCard component
- [ ] Create PaymentMethodCard component
- [ ] Create InvoiceTable component
- [ ] Create PlanChangeModal component
- [ ] Create CancelSubscriptionModal component
- [ ] Add action handler

### Phase 4: Additional Pages
- [ ] Create purchases page (stub)
- [ ] Create transactions page (stub)
- [ ] Create security page (stub)

### Phase 5: Translations
- [ ] Add translation keys to keys.ts
- [ ] Create Shopify metaobjects
- [ ] Test in multiple locales

### Phase 6: Testing
- [ ] Test plan changes with Appstle API
- [ ] Test subscription cancellation
- [ ] Test mobile responsive layout
- [ ] Test navigation
- [ ] Verify Shopify links
- [ ] Add loading states
- [ ] Add error handling

---

## 📱 Responsive Behavior

| Breakpoint | Sidebar | Content | Navigation |
|------------|---------|---------|------------|
| Desktop (≥1024px) | Visible (280px fixed) | Flex-grow beside sidebar | Sidebar only |
| Mobile (<1024px) | Hidden | Full width | Fixed bottom tabs |

**Mobile Considerations:**
- Add bottom padding (80px) to content for tab bar clearance
- Tables scroll horizontally if needed
- Cards stack vertically
- Modals adjust to smaller viewports

---

## 🔗 External Links

- [Shopify Customer Account API](https://shopify.dev/docs/api/customer)
- [Appstle Membership API](https://membership-admin.appstle.com/api/docs)
- [Hydrogen Framework](https://shopify.dev/docs/custom-storefronts/hydrogen)

---

**Document Version:** 3.0 (Requirements-Focused)
**Last Updated:** October 16, 2025
**Purpose:** Define WHAT to build, not HOW to build it
