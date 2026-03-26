# Subscription Plan Changes - Reference Document

**Last Updated:** December 2, 2025
**Purpose:** Source of truth for all subscription plan change scenarios and state management

---

## Overview

### Plans (Ordered by Tier)

| Tier | Monthly Price | Yearly Price | Monthly Variant ID | Yearly Variant ID |
|------|---------------|--------------|--------------------|--------------------|
| Live | €10/month | €100/year | 55782682689915 | 55950232977787 |
| Core | €20/month | €200/year | 55782682722683 | 55950233010555 |
| Premium | €50/month | €500/year | 55782682755451 | 55950233043323 |
| Supporter | €200/month | €2000/year | 55782682788219 | 55950233076091 |

### Tier Hierarchy

```
Live < Core < Premium < Supporter
```

### Systems Involved

| System | Role | What It Stores |
|--------|------|----------------|
| **Shopify** | Billing infrastructure | SubscriptionContract, variant, nextBillingDate, **Customer tags** |
| **Appstle** | Subscription management | Wraps Shopify, handles billing attempts, dunning, emails, **manages customer tags** |
| **Media Platform API** | Access control | Effective tier overrides, customer entitlements |

### Customer Tags

Appstle manages Shopify customer tags based on subscription status. Tags are updated **at billing date**, not immediately.

| Tier | Monthly Tag | Yearly Tag |
|------|-------------|------------|
| Live | `live-member` | `live-member-yearly` |
| Core | `core-member` | `core-member-yearly` |
| Premium | `premium-member` | `premium-member-yearly` |
| Supporter | `supporter-member` | `supporter-member-yearly` |

**Tag Logic in App:**
- Having either `core-member` OR `core-member-yearly` = Core tier from customer tags
- Same pattern for all tiers (monthly or yearly tag → same tier access)
- Media API effective tier override takes precedence over customer tag tier

**Important:** Customer tags reflect the **contract tier**, not the effective tier. During upgrades, the tag won't change until the next billing date (even though Media API override grants immediate access).

### Key Behaviors

- **Upgrades (tier increase):** Prorated charge immediate, Media API override for immediate access, **same frequency only**
- **All other changes:** Scheduled for next billing date (downgrades, frequency changes, or both)
- **Cancellations:** Applied at end of membership term; Appstle handles removing customer tags at term end
- **Scheduled changes replace each other:** Only one pending change at a time; new change replaces previous

### Plan Change Rules

| Change Type | When It Applies | Proration? | Override? | Restrictions |
|-------------|-----------------|------------|-----------|--------------|
| **Upgrade** (tier ↑) | Immediate access | Yes | Yes | Same frequency only |
| **Downgrade** (tier ↓) | Next billing | No | No | Any frequency allowed |
| **Frequency change** | Next billing | No | No | Any tier change allowed (except upgrade) |
| **Upgrade + frequency** | ❌ Not allowed | - | - | Must do as 2 operations |

**Why upgrade + frequency is not allowed in one operation:**
- Upgrades require proration calculation based on current vs new price
- Mixing tier and frequency change complicates proration math
- Solution: Upgrade first (immediate), then schedule frequency change (next billing)

### Important: Appstle Contract Update Timing

Appstle only updates "perks" (customer tags, etc.) at the **end of the original contract period**, not immediately. This means:
- For upgrades: Contract variant changes at next billing, but user needs access NOW
- Solution: Media API stores effective tier override for immediate access
- At next billing: Appstle updates contract, override expires, contract tier = effective tier

### Scheduled Change Replacement

When a user makes any non-upgrade change, it **replaces** any existing scheduled change:
- No complex state tracking of multiple pending changes
- User's most recent choice wins
- Simplifies both implementation and user mental model

---

## Definitions

| Term | Definition |
|------|------------|
| **Contract Tier** | The tier stored in Shopify/Appstle subscription contract |
| **Effective Tier** | The tier the user should have access to (may differ from contract during transitions) |
| **Proration** | Partial charge for remaining days when upgrading mid-cycle |
| **Billing Cycle** | The period between billing dates (30 days for monthly, 365 for yearly) |
| **Next Billing Date** | When Appstle will attempt to charge and the contract renews |

---

## Case Reference Table

### Legend

- **Immediate:** Change takes effect now
- **Scheduled:** Change takes effect at next billing date
- **Override:** Media API stores temporary tier override
- **Sync:** Media API override expires, contract tier becomes effective tier

---

## Case 1: New Subscription (No Plan → Plan)

**Scenario:** User has no active subscription, purchases a new plan.

| Step | User Action | Appstle State | Shopify State | Media API State |
|------|-------------|---------------|---------------|-----------------|
| 1 | User completes checkout for Core Monthly | Contract created: `Core`, status: `ACTIVE` | Contract created, variant: Core Monthly, Tag: `core-member` added | No override needed |
| 2 | - | nextBillingDate set to +30 days | - | effectiveTier = contract tier |

**Implementation:**
- Handled entirely by Shopify checkout + Appstle webhook
- **Appstle adds customer tag on successful subscription creation** (e.g., `core-member` for monthly, `core-member-yearly` for yearly)
- No custom logic needed

---

## Case 2: Upgrade Same Frequency (Plan A → Plan B, Monthly)

**Scenario:** User upgrades from Core Monthly (€20) to Premium Monthly (€50) on day 15 of 30-day cycle.

| Step | User Action | Appstle State | Shopify State | Media API State |
|------|-------------|---------------|---------------|-----------------|
| 1 | User clicks "Upgrade to Premium" | Contract: `Core` | Contract: `Core`, Tag: `core-member` | effectiveTier: `Core` |
| 2 | System calculates proration: €15 | - | - | - |
| 3 | System creates draft order for €15, auto-charges | - | DraftOrder created & completed | - |
| 4 | System calls Appstle API to update variant | Contract scheduled to update to `Premium` at next billing | Contract: `Core`, Tag: `core-member` (unchanged) | - |
| 5 | System creates Media API override | - | - | **Override created:** effectiveTier: `Premium`, until: nextBillingDate |
| 6 | User has Premium access immediately | Contract: `Core`, pending: `Premium` | Contract: `Core`, Tag: `core-member` | effectiveTier: `Premium` (from override) |
| 7 | Next billing date arrives | Contract: `Premium`, bills €50 | Contract: `Premium`, Tag: `premium-member` | Override expires, effectiveTier: `Premium` (from contract) |

**Proration Formula:**
```
proratedCharge = (newPrice - oldPrice) × (daysRemaining / cycleDays)
                = (€50 - €20) × (15 / 30)
                = €15
```

**Implementation:**
- Use **Appstle API** `updateSubscriptionVariant` (NOT Shopify Admin API directly)
- Create DraftOrder for proration, complete with `paymentPending: false`
- **Media API override required** for immediate access (Appstle only updates perks at billing date)

**Why Appstle API instead of Shopify Admin API?**
- Appstle manages business logic (dunning, emails, billing attempts)
- Direct Shopify API calls can desync Appstle's internal state
- Appstle will update Shopify contract at the appropriate time

---

## Case 3: Downgrade Same Frequency (Plan B → Plan A, Monthly)

**Scenario:** User downgrades from Premium Monthly (€50) to Core Monthly (€20) on day 15 of 30-day cycle.

| Step | User Action | Appstle State | Shopify State | Media API State |
|------|-------------|---------------|---------------|-----------------|
| 1 | User clicks "Downgrade to Core" | Contract: `Premium` | Contract: `Premium`, Tag: `premium-member` | effectiveTier: `Premium` |
| 2 | System calls Appstle API `updateSubscriptionVariant` | Schedules change for next billing | Contract: `Premium`, Tag: `premium-member` (unchanged) | effectiveTier: `Premium` |
| 3 | User continues with Premium access until billing date | Contract: `Premium`, pending change to `Core` | Contract: `Premium`, Tag: `premium-member` | effectiveTier: `Premium` |
| 4 | Next billing date arrives | Appstle bills €20, updates contract to `Core` | Contract: `Core`, Tag: `core-member` | effectiveTier: `Core` |

**Implementation:**
- Use Appstle API (they handle scheduled changes)
- No proration (user keeps Premium until paid period ends)
- No Media API override needed (they keep current tier until renewal)

**Note:** User has already paid for Premium until next billing. No refund issued.

---

## Case 4: Frequency Change Same Tier (Monthly → Yearly)

**Scenario:** User changes from Core Monthly (€20/mo) to Core Yearly (€200/yr) on day 15 of 30-day cycle.

| Step | User Action | Appstle State | Shopify State | Media API State |
|------|-------------|---------------|---------------|-----------------|
| 1 | User clicks "Switch to Yearly" | Contract: `Core Monthly` | Contract: `Core Monthly`, Tag: `core-member` | effectiveTier: `Core` |
| 2 | System calls Appstle API to schedule variant change | Schedules `Core Yearly` for next billing | Contract: `Core Monthly`, Tag: `core-member` | effectiveTier: `Core` |
| 3 | User continues with Core Monthly until billing date | Contract: `Core Monthly`, pending: `Core Yearly` | - | effectiveTier: `Core` |
| 4 | Next billing date arrives | Bills €200, contract updates to `Core Yearly` | Contract: `Core Yearly`, Tag: `core-member-yearly` | effectiveTier: `Core` |

**Implementation:**
- Frequency changes are always **scheduled** (no immediate effect)
- No proration, no override needed
- User pays full yearly price at next billing
- Simple: just schedule the variant change via Appstle API

---

## Case 5: Frequency Change Same Tier (Yearly → Monthly)

**Scenario:** User changes from Core Yearly to Core Monthly, 6 months into yearly contract.

| Step | User Action | Appstle State | Shopify State | Media API State |
|------|-------------|---------------|---------------|-----------------|
| 1 | User clicks "Switch to Monthly" | Contract: `Core Yearly` | Contract: `Core Yearly`, Tag: `core-member-yearly` | effectiveTier: `Core` |
| 2 | System calls Appstle API to schedule change | Schedules `Core Monthly` for end of yearly term | Contract: `Core Yearly`, Tag: `core-member-yearly` | effectiveTier: `Core` |
| 3 | User continues with yearly contract until it ends | Contract: `Core Yearly`, pending: `Core Monthly` | - | effectiveTier: `Core` |
| 4 | Yearly term ends | Appstle bills €20 monthly, updates contract | Contract: `Core Monthly`, Tag: `core-member` | effectiveTier: `Core` |

**Implementation:**
- Frequency changes are always **scheduled** for end of current term
- No refund for unused yearly portion (user committed to the year)
- No proration, no override needed
- Simple: just schedule the variant change via Appstle API

---

## Case 6: Cancel Subscription

**Scenario:** User cancels their Premium Monthly subscription on day 15.

| Step | User Action | Appstle State | Shopify State | Media API State |
|------|-------------|---------------|---------------|-----------------|
| 1 | User clicks "Cancel Subscription" | Contract: `Premium`, status: `ACTIVE` | Contract: `ACTIVE`, Tag: `premium-member` | effectiveTier: `Premium` |
| 2 | System calls Appstle API with status `CANCELLED` | Contract status: `CANCELLED` | Contract: `CANCELLED`, Tag: `premium-member` (unchanged) | - |
| 3 | - | No future billing | - | Create override: effectiveTier: `Premium`, until: nextBillingDate |
| 4 | User keeps Premium access until paid period ends | - | Tag: `premium-member` (still present) | effectiveTier: `Premium` (override active) |
| 5 | Original billing date arrives | Appstle removes tag | Tag: removed | Override expires, effectiveTier: `none` |

**Implementation:**
- Call Appstle to cancel (permanent, cannot be undone)
- Store override in Media API to maintain access until paid period ends
- Override expires automatically at original next billing date
- **Appstle removes customer tag at term end**

**Important:** Cancelled contracts CANNOT be reactivated. User must purchase new subscription.

---

## Case 7: Pause Subscription

**Scenario:** User pauses their Core Monthly subscription.

| Step | User Action | Appstle State | Shopify State | Media API State |
|------|-------------|---------------|---------------|-----------------|
| 1 | User clicks "Pause Subscription" | Contract: `Core`, status: `ACTIVE` | Contract: `ACTIVE`, Tag: `core-member` | effectiveTier: `Core` |
| 2 | System calls Appstle API with status `PAUSED` | Contract status: `PAUSED` | Contract: `PAUSED`, Tag: `core-member` (unchanged) | - |
| 3 | - | Billing suspended | - | Create override: effectiveTier: `Core`, until: nextBillingDate |
| 4 | User keeps access until paid period ends | - | Tag: `core-member` (still present) | effectiveTier: `Core` |
| 5 | Paid period ends | Appstle removes tag | Tag: removed | Override expires, effectiveTier: `none` |

**Implementation:**
- Call Appstle to pause
- CAN be resumed later (unlike cancel)
- Store override in Media API for remaining access
- **Appstle removes customer tag at term end**

---

## Case 8: Resume Paused Subscription

**Scenario:** User resumes their paused Core subscription.

| Step | User Action | Appstle State | Shopify State | Media API State |
|------|-------------|---------------|---------------|-----------------|
| 1 | User clicks "Resume Subscription" | Contract: `Core`, status: `PAUSED` | Contract: `PAUSED`, Tag: (removed or still present) | effectiveTier: `none` or expired |
| 2 | System calls Appstle API with status `ACTIVE` | Contract status: `ACTIVE` | Contract: `ACTIVE` | - |
| 3 | Appstle triggers billing attempt | Bills €20, sets nextBillingDate | Tag: `core-member` (re-added) | - |
| 4 | - | - | - | Clear any override, effectiveTier = contract tier |

**Implementation:**
- Call Appstle to resume (sets status to ACTIVE)
- Appstle handles billing attempt
- **Appstle re-adds customer tag on successful billing**
- Clear Media API overrides

---

## Case 9: Upgrade Then Downgrade Before Billing

**Scenario:** User on Core (€20) upgrades to Premium (€50) on day 10, then downgrades back to Core on day 20. Billing is on day 30.

| Step | Day | User Action | Appstle State | Shopify State | Media API State |
|------|-----|-------------|---------------|---------------|-----------------|
| 1 | 0 | - | Contract: `Core`, nextBilling: day 30 | Contract: `Core` | effectiveTier: `Core` |
| 2 | 10 | Upgrade to Premium | - | - | - |
| 3 | 10 | Proration charged: €20 (20 days × €1/day) | Schedules Premium for day 30 | Contract: `Core` | **Override:** effectiveTier: `Premium` until day 30 |
| 4 | 20 | Downgrade to Core | Schedules Core for day 30 (replaces Premium) | Contract: `Core` | effectiveTier: `Premium` (override still active) |
| 5 | 20-30 | User has Premium access | Contract: `Core`, pending: `Core` | Contract: `Core` | effectiveTier: `Premium` (from override) |
| 6 | 30 | Billing date | Bills €20 (Core), contract stays Core | Contract: `Core` | Override expires, effectiveTier: `Core` |

**Financial Summary:**
- Day 0-10: Paid €20 for Core month
- Day 10: Paid €20 proration for Premium upgrade
- Day 30: Paid €20 for new Core month
- **Total paid:** €60 for effectively Premium access days 10-30, Core otherwise

**Implementation:**
- Upgrade: Proration charge + Appstle API + Media API override
- Downgrade: Scheduled via Appstle API (replaces pending upgrade)
- Media API override provides Premium access until billing date

---

## Case 10: Downgrade Then Upgrade Before Billing

**Scenario:** User on Premium (€50) downgrades to Core (€20) on day 10, then upgrades to Supporter (€200) on day 20. Billing is on day 30.

| Step | Day | User Action | Appstle State | Shopify State | Media API State |
|------|-----|-------------|---------------|---------------|-----------------|
| 1 | 0 | - | Contract: `Premium`, nextBilling: day 30 | Contract: `Premium` | effectiveTier: `Premium` |
| 2 | 10 | Downgrade to Core | Schedules Core for day 30 | Contract: `Premium` | effectiveTier: `Premium` |
| 3 | 20 | Upgrade to Supporter | Schedules Supporter for day 30 (replaces Core) | Contract: `Premium` | - |
| 4 | 20 | Proration charged: €50 (10 days × €5/day) | - | - | **Override:** effectiveTier: `Supporter` until day 30 |
| 5 | 30 | Billing date | Bills €200 (Supporter), contract updates | Contract: `Supporter` | Override expires, effectiveTier: `Supporter` |

**Key Logic:**
- Upgrade replaces any pending downgrade in Appstle
- Proration calculated from current contract tier (Premium), not pending tier (Core)
- Media API override provides immediate Supporter access

**Implementation:**
- When processing upgrade, Appstle replaces pending changes
- Calculate proration from actual current contract tier
- Create Media API override for immediate access

---

## Case 11: Multiple Upgrades Before Billing

**Scenario:** User on Live (€10) upgrades to Core (€20) on day 10, then to Premium (€50) on day 20. Billing is on day 30.

| Step | Day | User Action | Appstle State | Shopify State | Media API State |
|------|-----|-------------|---------------|---------------|-----------------|
| 1 | 0 | - | Contract: `Live`, nextBilling: day 30 | Contract: `Live` | effectiveTier: `Live` |
| 2 | 10 | Upgrade to Core | Schedules Core for day 30 | Contract: `Live` | - |
| 3 | 10 | Proration: €6.67 (20 days × €0.33/day) | - | - | **Override:** effectiveTier: `Core` until day 30 |
| 4 | 20 | Upgrade to Premium | Schedules Premium for day 30 (replaces Core) | Contract: `Live` | - |
| 5 | 20 | Proration: €10 (10 days × €1/day) | - | - | **Override updated:** effectiveTier: `Premium` until day 30 |
| 6 | 30 | Billing date | Bills €50 (Premium), contract updates | Contract: `Premium` | Override expires, effectiveTier: `Premium` |

**Financial Summary:**
- Day 0: Paid €10 for Live month
- Day 10: Paid €6.67 proration for Core
- Day 20: Paid €10 proration for Premium
- Day 30: Paid €50 for Premium month
- **Total:** €76.67

**Implementation:**
- Each upgrade replaces previous pending upgrade in Appstle
- Proration calculated from **current override tier** (if active) or contract tier
- Media API override updated with each upgrade

---

## Case 12: Tier + Frequency Upgrade — NOT ALLOWED

**Scenario:** User on Live Monthly (€10/mo) wants to upgrade to Premium Yearly (€500/yr).

**This is NOT allowed in a single operation** because:
- Upgrades require proration calculation
- Mixing tier and frequency complicates the math
- Which price do we prorate from/to? Monthly or yearly?

**Instead, user must do two operations:**

| Step | User Action | Result |
|------|-------------|--------|
| 1 | Upgrade Live Monthly → Premium Monthly | Proration charged, override created, Premium access immediate |
| 2 | Change frequency Premium Monthly → Premium Yearly | Scheduled for next billing |
| 3 | Next billing date | Contract becomes Premium Yearly, override expires |

**UI Implementation:**
- When user is on Live Monthly and selects "Premium", only show Premium Monthly option
- After upgrade completes (or with override active), show frequency change options
- Or: Show Premium Yearly but explain "First upgrade to Premium Monthly, then switch to yearly"

---

## Case 13: Tier + Frequency Downgrade — ALLOWED

**Scenario:** User on Supporter Yearly (€2000/yr) downgrades to Live Monthly (€10/mo) with 6 months remaining.

**This IS allowed** because both tier downgrade and frequency change are scheduled operations. No proration complexity.

| Step | User Action | Appstle State | Shopify State | Media API State |
|------|-------------|---------------|---------------|-----------------|
| 1 | User clicks "Live Monthly" | Contract: `Supporter Yearly` | Contract: `Supporter Yearly`, Tag: `supporter-member-yearly` | effectiveTier: `Supporter` |
| 2 | System schedules combined change | Pending: `Live Monthly` for end of yearly term | Contract: `Supporter Yearly`, Tag: `supporter-member-yearly` | effectiveTier: `Supporter` |
| 3 | User keeps Supporter for remaining 6 months | Contract: `Supporter Yearly`, pending: `Live Monthly` | - | effectiveTier: `Supporter` |
| 4 | Yearly term ends | Bills €10, updates contract | Contract: `Live Monthly`, Tag: `live-member` | effectiveTier: `Live` |

**Implementation:**
- Combined downgrade + frequency change = single scheduled operation
- No proration (user keeps current plan until term ends)
- No override needed (user keeps Supporter access)
- No refund for remaining yearly term (user committed to the year)

---

## Case 14: Cancel During Pending Upgrade Proration

**Scenario:** User upgrades, proration payment fails, then they cancel.

| Step | User Action | Appstle State | Shopify State | Media API State |
|------|-------------|---------------|---------------|-----------------|
| 1 | Upgrade to Premium | - | - | - |
| 2 | Proration charge fails | Contract NOT updated | Contract: `Core` (unchanged) | effectiveTier: `Core` |
| 3 | User cancels subscription | Contract: `CANCELLED` | Contract: `CANCELLED` | Override until paid period ends |

**Implementation:**
- If proration fails, don't update contract
- User stays on current tier
- Cancel proceeds normally

---

## Case 15: Cancel During Pending Downgrade

**Scenario:** User has Premium, schedules downgrade to Core, then cancels before billing date.

| Step | User Action | Appstle State | Shopify State | Media API State |
|------|-------------|---------------|---------------|-----------------|
| 1 | Downgrade to Core scheduled | Pending: `Core` | Contract: `Premium` | effectiveTier: `Premium` |
| 2 | User cancels subscription | Pending cleared, status: `CANCELLED` | Contract: `CANCELLED` | Override: `Premium` until original billing date |
| 3 | Paid period ends | - | - | Override expires |

**Implementation:**
- Cancel clears any pending changes
- User keeps Premium access until original billing date

---

## Case 16: Multiple Changes Before Billing (Scheduled Replacement Demo)

**Scenario:** User on Core Monthly makes multiple changes before their billing date, demonstrating how scheduled changes replace each other.

**Starting state:** Core Monthly, accessEndsAt = Day 30

| Day | User Action | Media API `tier` | Media API `scheduled*` | Appstle Scheduled | What User Sees |
|-----|-------------|------------------|------------------------|-------------------|----------------|
| 0 | - | `Core` | - | `Core Monthly` | "Core Monthly" |
| 5 | **Upgrade to Premium** | `Premium` | - | `Premium Monthly` | "Premium Monthly" |
| 10 | **Change to Yearly** | `Premium` | `scheduledFrequency: yearly` | `Premium Yearly` | "Premium, switching to Yearly on Day 30" |
| 15 | **Downgrade to Live Yearly** | `Premium` | `scheduledTier: Live, scheduledFrequency: yearly` | `Live Yearly` | "Premium access, switching to Live Yearly on Day 30" |
| 20 | **Downgrade to Live Monthly** | `Premium` | `scheduledTier: Live, scheduledFrequency: monthly` | `Live Monthly` | "Premium access, switching to Live Monthly on Day 30" |
| 30 | **Billing webhook** | `Live` | cleared | `Live Monthly` | "Live Monthly" |

**Key observations:**

1. **Upgrade (Day 5):** Only operation that updates `tier` immediately
   - Proration charged: (€50 - €20) × (25/30) = €25
   - Media API: `tier` = `Premium` (immediate)
   - Appstle schedules: `Premium Monthly`

2. **Frequency change (Day 10):** Updates `scheduledFrequency`
   - No charge (scheduled)
   - Media API: `scheduledFrequency` = `yearly`
   - Appstle scheduled: `Premium Yearly` (replaces `Premium Monthly`)

3. **Downgrade + frequency (Day 15):** Replaces scheduled fields
   - No charge (scheduled)
   - Media API: `scheduledTier` = `Live`, `scheduledFrequency` = `yearly`
   - Appstle scheduled: `Live Yearly` (replaces `Premium Yearly`)

4. **Downgrade (Day 20):** Replaces scheduled fields again
   - No charge (scheduled)
   - Media API: `scheduledTier` = `Live`, `scheduledFrequency` = `monthly`
   - Appstle scheduled: `Live Monthly` (replaces `Live Yearly`)

5. **Billing webhook (Day 30):** Applies scheduled changes
   - Appstle bills €10 for `Live Monthly`
   - Webhook updates Media API: `tier` = `Live`, `frequency` = `monthly`
   - Clears `scheduledTier` and `scheduledFrequency`
   - Sets new `accessEndsAt`

**Financial summary:**
- Day 0: Already paid €20 for Core Monthly
- Day 5: Paid €25 proration for Premium upgrade
- Day 30: Paid €10 for Live Monthly
- **Total:** €55 for Premium access Days 5-30, then Live

**Why `tier` stays Premium through downgrades:**
- User paid €25 proration to upgrade to Premium
- That payment covers Premium access until Day 30
- Scheduling a downgrade only updates `scheduledTier`
- `tier` field = what user can access NOW

**Implementation notes:**
- Each scheduled change just updates `scheduled*` fields in Media API
- Each scheduled change calls Appstle API (replaces previous)
- Billing webhook applies scheduled → current and clears scheduled
- Only upgrades modify the `tier` field directly

---

## State Management Summary

### When to Update Media API Access

| Scenario | Media API Update | Reason |
|----------|------------------|--------|
| New subscription | Create record via webhook | `tier` = purchased tier |
| Upgrade | Update `tier` immediately | User needs immediate access |
| Downgrade (scheduled) | Set `scheduledTier` | Applied at billing via webhook |
| Frequency change | Set `scheduledFrequency` | Applied at billing via webhook |
| Cancel | Set `status` = cancelled | `accessEndsAt` determines when access stops |
| Pause | Set `status` = paused | `accessEndsAt` determines when access stops |
| Resume | Set `status` = active | Webhook will update on billing success |
| Billing success | Apply scheduled, extend `accessEndsAt` | Via webhook |

**Note:** Customer tags are managed by Appstle only for cancellation (tag removal at term end). We do NOT rely on customer tags for access control.

### Media API Access Schema

The Media API database is the **sole source of truth** for access control. We don't query Appstle for access checks.

```typescript
interface CustomerAccess {
  // Identifiers
  customerId: string;           // Media API customer ID
  shopifyCustomerId: string;    // Shopify customer GID

  // Current access (source of truth for access control)
  tier: 'live' | 'core' | 'premium' | 'supporter' | null;
  frequency: 'monthly' | 'yearly' | null;
  status: 'active' | 'paused' | 'cancelled' | 'none';
  accessEndsAt: Date | null;    // End of current paid period

  // Scheduled changes (applied at next billing via webhook)
  scheduledTier: 'live' | 'core' | 'premium' | 'supporter' | null;
  scheduledFrequency: 'monthly' | 'yearly' | null;

  // External references (for API calls + future-proofing)
  appstleContractId: string | null;
  shopifySubscriptionContractId: string | null;  // Shopify GID

  createdAt: Date;
  updatedAt: Date;
}
```

### Access Check Logic

```typescript
function getEffectiveTier(customerId: string): Tier | null {
  const access = await mediaApi.getCustomerAccess(customerId);

  // No record or no tier
  if (!access?.tier) return null;

  // Access period expired
  if (access.accessEndsAt && new Date() > access.accessEndsAt) return null;

  return access.tier;
}

function hasAccess(customerId: string, requiredTier: Tier): boolean {
  const tier = await getEffectiveTier(customerId);
  if (!tier) return false;
  return tierLevel(tier) >= tierLevel(requiredTier);
}
```

---

## Integration Points

### Outbound: We → Appstle

These are API calls we make when the user takes an action in our UI.

| User Action | Appstle API Call | Media API Update |
|-------------|------------------|------------------|
| **Upgrade** | `updateSubscriptionVariant(contractId, newVariantId, sellingPlanId)` | `tier` = newTier (immediate) |
| **Downgrade** | `updateSubscriptionVariant(contractId, newVariantId, sellingPlanId)` | `scheduledTier` = newTier |
| **Frequency change** | `updateSubscriptionVariant(contractId, newVariantId, sellingPlanId)` | `scheduledFrequency` = newFrequency |
| **Cancel** | `updateStatus(contractId, 'CANCELLED')` | `status` = cancelled |
| **Pause** | `updateStatus(contractId, 'PAUSED')` | `status` = paused |
| **Resume** | `updateStatus(contractId, 'ACTIVE')` | `status` = active |

### Inbound: Appstle/Shopify → Us (Webhooks)

These webhooks update our database when Appstle processes billing events.

| Webhook | Source | What We Update |
|---------|--------|----------------|
| `membership.created` | Appstle | Create CustomerAccess record |
| `membership.billing-success` | Appstle | Apply scheduled changes, extend `accessEndsAt` |
| `membership.cancelled` | Appstle | `tier` = null, `status` = cancelled |
| `subscription_billing_attempts/success` | Shopify (backup) | Same as billing-success (future-proofing) |

### Webhook Handlers

**1. New Subscription Created**
```typescript
// Webhook: Appstle membership.created
async function handleSubscriptionCreated(event: AppstleMembershipCreated) {
  await mediaApi.upsertCustomerAccess({
    customerId: event.customerId,
    shopifyCustomerId: event.shopifyCustomerId,
    tier: getTierFromVariant(event.variantId),
    frequency: getFrequencyFromVariant(event.variantId),
    status: 'active',
    accessEndsAt: new Date(event.nextBillingDate),
    scheduledTier: null,
    scheduledFrequency: null,
    appstleContractId: event.contractId,
    shopifySubscriptionContractId: event.shopifySubscriptionContractId,
  });
}
```

**2. Billing Success (Renewal)**
```typescript
// Webhook: Appstle membership.billing-success
async function handleBillingSuccess(event: AppstleBillingSuccess) {
  const access = await mediaApi.getCustomerAccess(event.customerId);
  if (!access) return;

  await mediaApi.updateCustomerAccess({
    customerId: event.customerId,
    // Apply any scheduled changes
    tier: access.scheduledTier ?? access.tier,
    frequency: access.scheduledFrequency ?? access.frequency,
    // Clear scheduled changes
    scheduledTier: null,
    scheduledFrequency: null,
    // Extend access period
    accessEndsAt: new Date(event.nextBillingDate),
    status: 'active',
  });
}
```

**3. Subscription Cancelled/Expired**
```typescript
// Webhook: Appstle membership.cancelled
async function handleSubscriptionCancelled(event: AppstleMembershipCancelled) {
  await mediaApi.updateCustomerAccess({
    customerId: event.customerId,
    tier: null,
    frequency: null,
    status: 'cancelled',
    scheduledTier: null,
    scheduledFrequency: null,
    // accessEndsAt stays as-is (they have access until then)
  });
}
```

### Sync Diagram

```
┌─────────────┐     User Action      ┌─────────────┐
│   Browser   │ ──────────────────▶  │  Our API    │
└─────────────┘                      └──────┬──────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
            ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
            │   Media API   │       │    Appstle    │       │    Shopify    │
            │   Database    │       │               │       │  (proration)  │
            └───────────────┘       └───────┬───────┘       └───────────────┘
                    ▲                       │
                    │      Webhooks         │
                    └───────────────────────┘
                    membership.billing-success
                    membership.cancelled
```

---

## API Implementation Reference

### Upgrade Flow

```typescript
async function handleUpgrade(customerId, newTier, newVariantId, newSellingPlanId) {
  // 1. Get current access details
  const access = await mediaApi.getCustomerAccess(customerId);
  const currentPrice = TIER_PRICES[access.tier][access.frequency];
  const newPrice = TIER_PRICES[newTier][access.frequency];  // Same frequency

  // 2. Calculate proration
  const daysRemaining = getDaysUntil(access.accessEndsAt);
  const cycleDays = access.frequency === 'yearly' ? 365 : 30;
  const proration = (newPrice - currentPrice) * (daysRemaining / cycleDays);

  // 3. Charge proration immediately via Shopify draft order
  const draftOrder = await shopifyAdmin.draftOrderCreate({
    customerId: access.shopifyCustomerId,
    lineItems: [{
      title: `Upgrade: ${access.tier} → ${newTier} (prorated)`,
      quantity: 1,
      originalUnitPrice: proration.toFixed(2)
    }]
  });
  await shopifyAdmin.draftOrderComplete(draftOrder.id, { paymentPending: false });

  // 4. Schedule contract update via Appstle API
  await appstleApi.updateSubscriptionVariant(
    access.appstleContractId,
    newVariantId,
    newSellingPlanId
  );

  // 5. Update Media API for immediate access
  await mediaApi.updateCustomerAccess({
    customerId,
    tier: newTier,  // Immediate access
    // accessEndsAt stays the same (proration covers until original billing date)
  });

  return {
    success: true,
    proratedAmount: proration,
    newTier,
    effectiveImmediately: true,
  };
}
```

### Downgrade Flow

```typescript
async function handleDowngrade(customerId, newTier, newFrequency, newVariantId, newSellingPlanId) {
  const access = await mediaApi.getCustomerAccess(customerId);

  // 1. Schedule change via Appstle API
  await appstleApi.updateSubscriptionVariant(
    access.appstleContractId,
    newVariantId,
    newSellingPlanId
  );

  // 2. Store scheduled change in Media API (applied via billing webhook)
  await mediaApi.updateCustomerAccess({
    customerId,
    scheduledTier: newTier,
    scheduledFrequency: newFrequency,
    // tier stays the same until billing
  });

  return {
    success: true,
    currentTier: access.tier,
    scheduledTier: newTier,
    effectiveDate: access.accessEndsAt,
    message: `Your plan will change to ${newTier} on ${formatDate(access.accessEndsAt)}`
  };
}
```

### Frequency Change Flow

```typescript
async function handleFrequencyChange(customerId, newFrequency, newVariantId, newSellingPlanId) {
  const access = await mediaApi.getCustomerAccess(customerId);

  // 1. Schedule change via Appstle API
  await appstleApi.updateSubscriptionVariant(
    access.appstleContractId,
    newVariantId,
    newSellingPlanId
  );

  // 2. Store scheduled change in Media API
  await mediaApi.updateCustomerAccess({
    customerId,
    scheduledFrequency: newFrequency,
  });

  return {
    success: true,
    currentFrequency: access.frequency,
    scheduledFrequency: newFrequency,
    effectiveDate: access.accessEndsAt,
  };
}
```

### Cancel Flow

```typescript
async function handleCancel(customerId) {
  const access = await mediaApi.getCustomerAccess(customerId);

  // 1. Cancel in Appstle
  await appstleApi.updateStatus(access.appstleContractId, 'CANCELLED');

  // 2. Update Media API - access continues until accessEndsAt
  await mediaApi.updateCustomerAccess({
    customerId,
    status: 'cancelled',
    scheduledTier: null,      // Clear any pending changes
    scheduledFrequency: null,
    // tier and accessEndsAt stay the same - user has access until then
  });

  return {
    success: true,
    accessUntil: access.accessEndsAt
  };
}
```

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-02 | Claude | Initial document creation |
| 2025-12-02 | Claude | Updated upgrade flow: use Appstle API (not Shopify Admin API), added Media API overrides for immediate access, clarified cancellation timing behavior |
| 2025-12-02 | Claude | Added Customer Tags section and tracking throughout case scenarios |
| 2025-12-02 | Claude | Updated to actual tag names (live-member, core-member, etc. with -yearly variants) |
| 2025-12-02 | Claude | Simplified frequency change rules: all non-upgrades scheduled, upgrade+frequency not allowed, added Case 16 demo |
| 2025-12-03 | Claude | Replaced override system with CustomerAccess table as sole source of truth; added integration points and webhook handlers |
