# Locale and Region System

This document describes the locale, country, and region system as of December 2025.

## Overview

The system has two related but distinct concepts:

1. **Locale (Country + Language)** - Controls UI display, translations, and URL routing
2. **Region ID** - Controls pricing and Shopify store selection (1=EU, 2=ROW)

**Key Principle**: Region ID is determined server-side for ALL users (logged-in and anonymous) and passed to all API calls. There is no client-side region routing.

### Language Preference

Language preference follows a cascade with URL having highest priority:

| Priority | Source | Description |
|----------|--------|-------------|
| 1 | **URL** | Language code in URL path (e.g., `/us/fr/`) - always wins if present |
| 2 | **Server Preferences** | API-backed preference for logged-in users (`/user/preferences`) |
| 3 | **Cookie** | `preferredLanguage` cookie (essential cookie for all users) |
| 4 | **Country Default** | Country's default language |

When a user selects a language from the dropdown:
1. The page navigates to the new language URL with `?setPreferredLanguage=xx` param
2. On load, the preference is saved to:
   - **Cookie** (always, for all users - essential cookie, no consent required)
   - **API** (if logged in, via `PUT /user/preferences`)
3. The query param is removed from the URL

The cookie-based approach means:
- The **server** reads the `preferredLanguage` cookie on every request
- Language is determined server-side in `determineLocale()` - no client-side redirect needed
- Users get the correct language immediately on first render (no flash of wrong content)

## Key Files

| File | Purpose |
|------|---------|
| `app/lib/locale/config.ts` | Supported countries and languages |
| `app/lib/locale/url.utils.ts` | URL parsing and building |
| `app/lib/geo/ip-api.ts` | GeoIP detection |
| `server.ts` | Request entry, region lookup, context creation |
| `app/root.tsx` | Locale cascade, user profile/preferences handling |
| `app/lib/api/createUserScopedApi.ts` | User-scoped API with regionId |
| `app/lib/store-routing/context.ts` | Store routing logic (stampedShopId → stampedRegionId → countryCode) |
| `app/contexts/UserPreferencesProvider.tsx` | User preferences context (language, etc.) backed by API |
| `app/lib/api/services/user.ts` | User service with `getPreferences()` and `updatePreferences()` methods |
| `app/routes/api.user.preferences.tsx` | API route for preference updates from client |

---

## Region ID Determination

Region ID is determined at the **server level** for every request using the following priority chain:

### Priority Chain (Store Routing)

| Priority | Source | Description |
|----------|--------|-------------|
| 1 | `stampedShopId` | Direct shop ID from backend (most authoritative for region-locked users) |
| 2 | `stampedRegionId` | Backend-computed region from `stampedCountryCode` or `userSelectCountryCode` |
| 3 | `countryCode` | Country from locale cascade (URL > userSelectCountryCode > GeoIP > default) |
| 4 | Default | Fallback to ROW (region 2) |

### For Region-Locked Users (have stampedRegionId)

Users with a `stampedRegionId` are locked to their region:
- Their region is set by the backend based on their country selection or Stamped.io integration
- URL locale prefixes are stripped (redirected from `/de/satsangs` to `/satsangs`)
- The CountrySelector is hidden in Header/Footer/MobileNav

### For Non-Region-Locked Users (no stampedRegionId)

Users without `stampedRegionId` follow the locale cascade:
- URL locale takes precedence (visiting `/de/satsangs` gives German/EU pricing)
- User-selected country is respected if set
- Falls back to GeoIP detection
- Can change region via CountrySelector

### Fallback
If region lookup fails, default to `regionId: 1` (EU).

---

## Request Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REQUEST FLOW                                     │
└─────────────────────────────────────────────────────────────────────────┘

Request arrives
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ server.ts                                                                │
│                                                                          │
│  1. Parse locale from URL (locale cascade)                               │
│     parseLocaleFromRequest(request) → { countryCode, language }          │
│     Cascade: URL prefix > GeoIP detection > default (us/en)              │
│                                                                          │
│  2. Detect user's actual country (GeoIP) - for suggestion banner only    │
│     getRequestGeolocation(request) → detectedCountry                     │
│     - Production: Uses 'oxygen-buyer-country' header (Cloudflare)        │
│     - Development: Uses ip-api.com lookup                                │
│                                                                          │
│  3. Look up region from countryCode (NOT detectedCountry)                │
│     GET /meta/region/by-country/{countryCode} → regionId                 │
│     - Uses countryCode from locale cascade for consistency               │
│     - Fallback: regionId = 1 (EU) if lookup fails                        │
│                                                                          │
│  4. Create Media API with regionId                                       │
│     new BhaktiMargMediaApi({ regionId, locale, countryCode })            │
│                                                                          │
│  5. Pass both countryCode and detectedCountry to context                 │
│     - countryCode: Used for all routing and API calls                    │
│     - detectedCountry: Only for RegionSuggestionBanner                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ root.tsx loader()                                                        │
│                                                                          │
│  1. getAuthenticatedUser() → userProfile                                 │
│                                                                          │
│  2. Check if user is region-locked (has stampedRegionId)                 │
│     If stampedRegionId exists AND URL has locale prefix:                 │
│     → Redirect to URL without locale prefix (prevents region hopping)    │
│                                                                          │
│  3. Determine store context via getClientStoreContext()                  │
│     Priority: stampedShopId → stampedRegionId → countryCode → default    │
│                                                                          │
│  4. createUserScopedApi(userProfile, contextRegionId)                    │
│     Uses user's stampedRegionId if available, else context regionId      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ API Calls                                                                │
│                                                                          │
│  All API calls include region_id parameter:                              │
│  GET /memberships?region_id=1&locale=en-us                               │
│  GET /satsangs?region_id=2&locale=en-us                                  │
│                                                                          │
│  This ensures correct pricing and Shopify store selection.               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Important: countryCode vs detectedCountry

| Variable | Source | Used For |
|----------|--------|----------|
| `countryCode` | Locale cascade (URL > userSelectCountryCode > GeoIP > default) | Region lookup, store routing, API calls |
| `detectedCountry` | Raw GeoIP only | RegionSuggestionBanner (comparing actual location to URL) |

**Design Principle**: All routing and pricing decisions use `countryCode` from the locale cascade. This ensures consistency - if a user visits `/de/satsangs`, they get German pricing regardless of their actual location.

---

## URL Format

URLs optionally include locale prefixes for country and language:

```
/{countryCode?}/{language?}/{path}
```

### Examples

| URL | Country | Language | Notes |
|-----|---------|----------|-------|
| `/` | `us` (default) | `en` | No prefix, uses defaults |
| `/satsangs` | `us` (default) | `en` | Path only |
| `/fr` | `fr` | `fr` | Country prefix (uses country's default language) |
| `/fr/satsangs` | `fr` | `fr` | Country + path |
| `/ca/fr/satsangs` | `ca` | `fr` | Explicit country + language |
| `/de/en/satsangs` | `de` | `en` | German country, English language |

**Important**: For non-region-locked users, the URL locale controls pricing. For region-locked users (with `stampedRegionId`), URL locale prefixes are stripped.

---

## Region ID Values

| Region ID | Name | Currency | Shopify Store |
|-----------|------|----------|---------------|
| 1 | EU (Europe) | EUR | EU store |
| 2 | ROW (Rest of World) | USD | ROW store |

### Backend API: `/meta/region/by-country/{countryCode}`

```
GET /meta/region/by-country/DE

Response:
{
  "countryCode": "DE",
  "countryName": "Germany",
  "regionId": 1,
  "regionName": "Europe",
  "shopifyShopId": 12345678
}
```

---

## Locale Cascade (Display Country)

For UI display purposes (translations, country selector), the effective country follows this cascade:

| Priority | Source | Condition |
|----------|--------|-----------|
| 1 | **URL** | URL has valid country prefix |
| 2 | **User Selection** | User has `userSelectCountryCode` in profile |
| 3 | **GeoIP** | Detected country is valid |
| 4 | **Default** | Fallback to `us` / `en` |

**Note**: This cascade is for display/UI only. Region ID for API calls is determined by `stampedRegionId` (if present) or this cascade.

---

## User States

### Anonymous User

| Aspect | Value | Source |
|--------|-------|--------|
| Display Country | URL or GeoIP or default | Locale cascade |
| Language | Country's default or URL | Locale cascade |
| Region ID | From countryCode lookup | `/meta/region/by-country` |
| Pricing | Based on region | EUR (1) or USD (2) |
| Can Change Region? | Yes | Via URL or CountrySelector |

### Logged-In User Without stampedRegionId

| Aspect | Value | Source |
|--------|-------|--------|
| Display Country | URL or userSelectCountryCode or GeoIP | Locale cascade |
| Region ID | From countryCode lookup | `/meta/region/by-country` |
| Pricing | Based on region | EUR (1) or USD (2) |
| Can Change Region? | Yes | Via URL or CountrySelector |

**Note**: Non-region-locked logged-in users behave like anonymous users for region determination.

### Logged-In User With stampedRegionId (Region-Locked)

| Aspect | Value | Source |
|--------|-------|--------|
| Display Country | Based on stampedCountryCode | `userProfile.stampedCountryCode` |
| Region ID | From profile | `userProfile.stampedRegionId` |
| Pricing | Based on stamped region | EUR (1) or USD (2) |
| Can Change Region? | No | CountrySelector hidden, URL prefixes stripped |

**Special behavior**: Region-locked users visiting URLs with locale prefixes (e.g., `/de/satsangs`) are redirected to the path without prefix (`/satsangs`). This prevents region-hopping via URL manipulation.

---

## Store Routing Sources

The `storeContext.routingSource` indicates how the region was determined:

| Source | Description | Region Locked? |
|--------|-------------|----------------|
| `stampedShopId` | Direct shop ID from backend | Yes |
| `stampedRegionId` | Region from stampedCountryCode or userSelectCountryCode | Yes |
| `countryCode` | Country from locale cascade | No |
| `default` | Fallback to ROW | No |

Components use `routingSource` to decide whether to show the CountrySelector:
- If `stampedShopId` or `stampedRegionId`: Hide CountrySelector (region is locked)
- Otherwise: Show CountrySelector (user can change region)

---

## Supported Countries

From `app/lib/locale/config.ts`:

| Code | Name | Default Language | Available Languages |
|------|------|------------------|---------------------|
| `us` | United States | `en` | en, es |
| `gb` | United Kingdom | `en` | en |
| `ca` | Canada | `en` | en, fr |
| `in` | India | `en` | en, hi |
| `fr` | France | `fr` | fr, en |
| `de` | Germany | `de` | de, en |
| `es` | Spain | `es` | es, en |
| `it` | Italy | `it` | it, en |
| `pt` | Portugal | `pt` | pt, en |
| `br` | Brazil | `pt` | pt, en |
| `jp` | Japan | `ja` | ja, en |
| `cn` | China | `zh` | zh, en |
| `ru` | Russia | `ru` | ru, en |
| `pl` | Poland | `pl` | pl, en |
| `cz` | Czech Republic | `cs` | cs, en |
| `gr` | Greece | `el` | el, en |
| `ro` | Romania | `ro` | ro, en |

---

## API Endpoints

### Frontend: `POST /api/user/select-region`

Persists user's country selection (for logged-in users only).

**Request:**
```json
{
  "countryCode": "de"
}
```

**Response (logged in):**
```json
{
  "success": true,
  "persisted": true,
  "userSelectCountryCode": "DE"
}
```

### Backend: `GET /meta/region/by-country/{countryCode}`

Maps country code to region information.

**Response:**
```json
{
  "countryCode": "DE",
  "countryName": "Germany",
  "regionId": 1,
  "regionName": "Europe",
  "shopifyShopId": 12345678
}
```

### Backend: `GET /user/profile`

Returns user profile with region fields:

```json
{
  "subscriptionTier": "premium",
  "isPayingCustomer": true,
  "stampedRegionId": 1,
  "stampedRegionName": "Europe",
  "stampedShopId": 123,
  "stampedCountryCode": "DE",
  "userSelectCountryCode": "FR"
}
```

**Note**: `shopifyBillingCountry` and `shopifyLastKnownBillingCountry` are no longer used for region routing. Only `stampedRegionId` and `stampedShopId` determine region locking.

---

## Summary

| Concept | Source | Default | Purpose |
|---------|--------|---------|---------|
| **Display Country** | URL > userSelectCountryCode > GeoIP > Default | `us` | UI, translations |
| **Language** | URL > Server Preferences > Cookie > Country default | `en` | Translations |
| **Region ID** | stampedRegionId (if locked) or countryCode lookup | `1` (EU) | Pricing, Shopify store |
| **Currency** | Region ID | EUR | Display prices |
| **Region Locked?** | Has stampedRegionId | No | Determines if user can change region |

**Key architectural decisions**:
1. Region ID is always determined server-side and included in all API calls
2. Users with `stampedRegionId` are region-locked (can't change via URL or CountrySelector)
3. Users without `stampedRegionId` can change region via URL locale prefix or CountrySelector
4. `shopifyBillingCountry` and related fields are NOT used for region routing
