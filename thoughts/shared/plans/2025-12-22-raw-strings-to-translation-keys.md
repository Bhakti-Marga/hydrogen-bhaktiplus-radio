# Raw Strings to Translation Keys Implementation Plan

## Overview

Convert all hardcoded user-facing strings in the codebase to use the translation system (`useTranslations()` hook with keys defined in `app/lib/translations/keys.ts`).

## Current State Analysis

- Translation system exists with ~200 keys in `app/lib/translations/keys.ts`
- Components access translations via `const { strings } = useTranslations()`
- Pattern: `strings.key_name` for type-safe access
- Dynamic strings use `{placeholder}` or `{{PLACEHOLDER}}` with `.replace()`
- Plan names (Premium, Core, Live, Supporter) are NOT translated per existing convention

## Desired End State

- All user-facing strings use the translation system
- New translation keys added to `app/lib/translations/keys.ts`
- Strings displayed in UI can be localized via Shopify metaobjects
- Dynamic strings follow existing `{placeholder}` pattern

## What We're NOT Doing

- Translating brand names (Bhakti+, Bhakti Marga, etc.)
- Translating plan names (Premium, Core, Live, Supporter)
- Translating technical/developer-facing messages (console logs, error codes)
- Translating meta tags or SEO content (separate concern)
- Adding translations to Shopify (that's a content management task)

---

## Phase 1: Document All Strings Requiring Translation

### Overview
Create a comprehensive markdown document listing every hardcoded string that needs translation, including:
- File path and line number
- The current hardcoded string
- Where it's displayed (UI context)
- Whether it's dynamic (contains variables)
- Proposed translation key name

### Approach
Spawn multiple sub-agents to search different areas of the codebase in parallel, then consolidate findings into a single document.

### Output File
`thoughts/shared/research/2025-12-22-strings-requiring-translation.md`

### Success Criteria

#### Automated Verification:
- [x] Output file exists at specified path
- [x] File contains all required sections (components, routes, modals, etc.)

#### Manual Verification:
- [x] User reviews the document and confirms/adjusts which strings need translation
- [x] User approves moving to Phase 2

**User decisions:**
- Skip FAQ placeholder data
- Skip Plan Benefits Data (~50 items - will come from CMS later)
- Keep region names as-is (Europe, Americas, Asia Pacific, etc.)
- Keep country names in native form

**Implementation Note**: After completing Phase 1, pause for user review and approval before proceeding to Phase 2.

---

## Phase 2: Implement Translation Keys

### Overview
Based on the approved document from Phase 1:
1. Add all new translation keys to `app/lib/translations/keys.ts`
2. Update each file to use the translation system

### Changes Required

#### 1. Update Translation Keys Dictionary
**File**: `app/lib/translations/keys.ts`
**Changes**: Add all new keys with English fallback values, organized by category

#### 2. Update Components/Routes
For each file identified in Phase 1:
- Import `useTranslations` if not already imported
- Get `strings` from the hook
- Replace hardcoded strings with `strings.key_name`
- For dynamic strings, use `.replace('{placeholder}', value)` pattern

### Progress (Complete - 2025-12-23)

#### Completed Files:
**Translation Keys Dictionary:**
- [x] `app/lib/translations/keys.ts` - Added ~180 new translation keys

**Modal Components:**
- [x] `app/components/Modal/AccessModal.tsx`
- [x] `app/components/Modal/ComingSoonModal.tsx`
- [x] `app/components/SubscriptionModal.tsx`
- [x] `app/components/Account/CancelSubscriptionModal.tsx`
- [x] `app/components/Account/AccountSubscriptionModal.tsx`

**Account Components:**
- [x] `app/components/Account/AccountMobileHeader.tsx`
- [x] `app/components/Account/AccountLayout.tsx`
- [x] `app/components/Account/AccountMobileNav.tsx`
- [x] `app/components/Account/InvoiceTable.tsx`
- [x] `app/components/Account/BillingAddressCard.tsx`
- [x] `app/components/Account/PaymentMethodCard.tsx`
- [x] `app/components/Account/MembershipCard.tsx`

**Account Routes:**
- [x] `app/routes/($countryCode).($language).account.security.tsx`
- [x] `app/routes/($countryCode).($language).account.transactions.tsx`
- [x] `app/routes/($countryCode).($language).account.purchases.tsx`
- [x] `app/routes/($countryCode).($language).account.bhakti-plus-catalog.tsx`

**Header Components:**
- [x] `app/components/Header/MobileHeader.tsx`
- [x] `app/components/Header/MobileNav.tsx`
- [x] `app/components/Header/ProfileMenu.tsx`
- [x] `app/components/Header/Search.tsx`

**Support & Welcome Pages:**
- [x] `app/routes/($countryCode).($language).support.tsx`
- [x] `app/routes/($countryCode).($language).welcome.tsx`
- [x] `app/routes/$.tsx` (404 page)

**Homepage Components:**
- [x] `app/components/Homepage/PrelaunchWelcomeSection.tsx`
- [x] `app/components/Homepage/PrelaunchSignupCTA.tsx`
- [x] `app/components/Homepage/LivesArchive.tsx`
- [x] `app/components/Homepage/PrelaunchHomepage.tsx`

**Video & Content Routes:**
- [x] `app/routes/($countryCode).($language).video.tsx`

**Miscellaneous:**
- [x] `app/components/RegionSuggestionBanner/RegionSuggestionBanner.tsx`

**Router & Subscription Flow:**
- [x] `app/routes/router.tsx` (~75 strings - largest file, most complex)

**Content Index Pages:**
- [x] `app/routes/($countryCode).($language).satsangs._index.tsx`
- [x] `app/routes/($countryCode).($language).commentaries._index.tsx`
- [x] `app/routes/($countryCode).($language).pilgrimages._index.tsx`
- [x] `app/routes/($countryCode).($language).talks._index.tsx`
- [x] `app/routes/($countryCode).($language).livestreams._index.tsx`

**Content Detail Pages:**
- [x] `app/routes/($countryCode).($language).satsangs.$categoryId_.tsx`
- [x] `app/routes/($countryCode).($language).satsangs.all.tsx`
- [x] `app/routes/($countryCode).($language).satsangs.$categoryId.subcategories.$subcategoryId.tsx`
- [x] `app/routes/($countryCode).($language).commentaries.$slug.tsx`
- [x] `app/routes/($countryCode).($language).talks.all.tsx`
- [x] `app/routes/($countryCode).($language).pilgrimages.$slug.tsx`

**Additional Components:**
- [x] `app/components/Homepage/shared-components.tsx`
- [x] `app/components/Card/ContentCard.tsx`

#### Remaining Files:
- [x] All files identified in Phase 1 research document have been updated
- Note: Minor hardcoded strings may exist in edge cases; these can be addressed as discovered

### Success Criteria

#### Automated Verification:
- [x] Linting passes: `npm run lint` (only pre-existing warnings, no new errors from translation changes)
- [x] TypeScript compiles: `npm run typecheck` (pre-existing type errors unrelated to translation changes; no new errors introduced)
- [ ] Build succeeds: `npm run build` (pre-existing codegen error unrelated to translation work)

#### Manual Verification:
- [ ] UI displays correctly with translated strings
- [ ] Dynamic strings render with correct values (plan names, dates, amounts, counts)
- [ ] No visual regressions in affected components

### Implementation Complete - Awaiting Manual Verification

All identified hardcoded strings from Phase 1 have been converted to use the translation system. The implementation added ~180 new translation keys and updated 35+ files across:
- Modal components (5 files)
- Account components (7 files)
- Account routes (4 files)
- Header components (4 files)
- Support & Welcome pages (3 files)
- Homepage components (4 files)
- Router & subscription flow (1 file - largest with ~75 strings)
- Content index pages (5 files)
- Content detail pages (6 files)
- Additional components (2 files)

---

## Translation Key Naming Convention

Follow existing patterns in `keys.ts`:
- Format: `section_subsection_element`
- Examples:
  - `modal_subscription_title`
  - `account_membership_current_subscription`
  - `support_faq_title`
  - `router_error_already_subscribed`

## Dynamic String Pattern

For strings with variables:
```typescript
// In keys.ts
subscription_paused_message: 'Your {planName} plan is paused. Resume it to continue.',

// In component
strings.subscription_paused_message.replace('{planName}', planName)
```

## References

- Translation system docs: `docs/TRANSLATIONS.md`
- Translation keys: `app/lib/translations/keys.ts`
- Translation provider: `app/contexts/TranslationsProvider.tsx`
