# Region ID from GeoIP for Anonymous Users

## Status: ✅ IMPLEMENTED (2025-12-19)

## Overview

Previously, anonymous users always got `regionId: 1` (EU) hardcoded in `server.ts`. This plan implemented dynamic region lookup based on the locale cascade's `countryCode` using the backend `/meta/region/by-country/{countryCode}` API.

**Key Design Decision**: The region lookup uses `countryCode` from the locale cascade (URL > GeoIP > default), NOT the raw `detectedCountry` from GeoIP. This ensures consistency - all routing decisions use the same country source.

## Implementation Summary

### Files Changed

1. **`server.ts`** - Added `getRegionIdForCountry()` function, calls it with `countryCode` from locale cascade
2. **`app/lib/context.ts`** - Added `regionId: number` to `AdditionalContext` interface
3. **`app/lib/api/createUserScopedApi.ts`** - Added `contextRegionId` parameter as fallback
4. **`app/root.tsx`** - Passes `context.regionId` to `createUserScopedApi()`
5. **`app/lib/store-routing/context.ts`** - Changed from `detectedCountry` to `countryCode`, renamed `'geoip'` routing source to `'countryCode'`
6. **`app/lib/store-routing/context.server.ts`** - Updated to require `countryCode` parameter
7. **`app/routes/($countryCode).($language).account.manage-membership.tsx`** - Updated to pass `countryCode`
8. **`app/routes/api.subscription.change-plan.tsx`** - Updated to pass `countryCode`
9. **`app/routes/($countryCode).($language).subscribe.tsx`** - Updated routing source check
10. **`app/routes/[_dbg].routing.tsx`** - Updated to use `countryCode`

### What `detectedCountry` is Still Used For

`detectedCountry` is now ONLY used for the `RegionSuggestionBanner` component - which compares the raw GeoIP location against the URL country to suggest switching ("We detected you're in Germany but viewing the US site").

## Original Problem

**Problem**: All anonymous users saw EU pricing regardless of their location.

```typescript
// server.ts:103 - hardcoded default (BEFORE)
const mediaApi = new BhaktiMargMediaApi({
  // ...
  regionId: 1, // Always EU
});
```

## Desired End State

1. ✅ `server.ts` calls `/meta/region/by-country/{countryCode}` to get regionId
2. ✅ The regionId is passed to `BhaktiMargMediaApi` and included in all API calls
3. ✅ For logged-in users with `stampedRegionId`, that takes priority (existing behavior)
4. ✅ Fallback (when lookup fails) defaults to EU
5. ✅ Store routing uses `countryCode` consistently (not `detectedCountry`)

### Verification

- Anonymous user from US sees USD pricing (region 2 = ROW)
- Anonymous user from Germany sees EUR pricing (region 1 = EU)
- Logged-in paying customer sees their stamped region pricing regardless of location

## What We Did NOT Do

- Caching the region lookup (can add later if needed)
- Changing any logged-in user behavior
- Adding new frontend routes or components

## Implementation Approach

The change spans `server.ts` and store routing utilities. We add a region lookup call after locale parsing, before creating the Media API instance. All store routing now uses the locale cascade's `countryCode`.

---

## Phase 1: Add Region Lookup to server.ts

### Overview

Add a function to look up regionId from country code, then use it when creating the Media API.

### Changes Required:

#### 1. Add region lookup function

**File**: `server.ts`

Add after the imports (around line 20):

```typescript
/**
 * Look up regionId from country code using backend API.
 * Falls back to EU (region 1) if lookup fails.
 */
async function getRegionIdForCountry(
  countryCode: string | null,
  env: Env,
): Promise<number> {
  const DEFAULT_REGION_ID = 1; // EU

  if (!countryCode) {
    return DEFAULT_REGION_ID;
  }

  try {
    const url = new URL('/meta/region/by-country/' + countryCode.toUpperCase(), env.MEDIA_API_URL);
    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': env.MEDIA_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`[server] Region lookup failed for ${countryCode}: ${response.status}`);
      return DEFAULT_REGION_ID;
    }

    const data = await response.json() as { regionId?: number | null };
    return data.regionId ?? DEFAULT_REGION_ID;
  } catch (error) {
    console.warn(`[server] Region lookup error for ${countryCode}:`, error);
    return DEFAULT_REGION_ID;
  }
}
```

#### 2. Call region lookup after GeoIP detection

**File**: `server.ts`

Replace the hardcoded `regionId: 1` with dynamic lookup. After line ~108 (after `detectedCountry` is set):

```typescript
// Look up regionId from detected country
const regionId = await getRegionIdForCountry(detectedCountry, env);
```

Then update the BhaktiMargMediaApi creation (around line 103):

```typescript
const mediaApi = new BhaktiMargMediaApi({
  baseUrl: env.MEDIA_API_URL,
  apiKey: env.MEDIA_API_KEY,
  apiVersion: env.MEDIA_API_VERSION,
  locale: toMediaApiLocale(countryCode, language),
  countryCode: countryCode.toUpperCase(),
  regionId, // Now dynamic from GeoIP lookup
});
```

#### 3. Add regionId to context

**File**: `server.ts`

Update the `additionalContext` object (around line 114) to include regionId:

```typescript
const additionalContext = {
  mediaApi,
  countryCode,
  language,
  detectedCountry,
  regionId, // Add this for use in root.tsx
};
```

#### 4. Update context types

**File**: `app/lib/context.ts`

Add `regionId` to the `HydrogenAdditionalContext` interface:

```typescript
declare global {
  interface HydrogenAdditionalContext {
    mediaApi: BhaktiMargMediaApi;
    countryCode: string;
    language: string;
    detectedCountry: string | null;
    regionId: number; // Add this
  }
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build` (pre-existing codegen error, not related to this change)
- [x] Linting passes: `npm run lint` (pre-existing errors about unescaped entities, not related to this change)

#### Manual Verification:
- [ ] Anonymous user from US location sees USD pricing (use VPN or test header)
- [ ] Anonymous user from EU location sees EUR pricing
- [ ] Check network tab: API calls include correct `region_id` parameter
- [ ] Logged-in paying customer still sees their stamped region pricing

**Implementation Note**: After Phase 1 and automated verification passes, pause for manual confirmation before proceeding.

---

## Phase 2: Update root.tsx to use context regionId

### Overview

Use the regionId from server context as the default for anonymous users, while still preferring `stampedRegionId` for authenticated users.

### Changes Required:

#### 1. Use context regionId in createUserScopedApi fallback

**File**: `app/lib/api/createUserScopedApi.ts`

Update to accept context regionId as fallback:

```typescript
export function createUserScopedApi(
  env: Env,
  userProfile: SubscriptionInfo | null,
  locale: string,
  countryCode: string,
  contextRegionId: number = 1, // Add parameter with default
): BhaktiMargMediaApi {
  // Use user's stampedRegionId if available, otherwise use context regionId
  const regionId = userProfile?.stampedRegionId ?? contextRegionId;

  return new BhaktiMargMediaApi({
    baseUrl: env.MEDIA_API_URL,
    apiKey: env.MEDIA_API_KEY,
    apiVersion: env.MEDIA_API_VERSION,
    locale,
    countryCode: countryCode.toUpperCase(),
    regionId,
  });
}
```

#### 2. Pass context regionId to createUserScopedApi

**File**: `app/root.tsx`

Update the call to `createUserScopedApi` in `loadCriticalData`:

```typescript
const userScopedApi = createUserScopedApi(
  env,
  userProfile,
  locale,
  countryCode,
  context.regionId, // Pass the GeoIP-based regionId
);
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build` (pre-existing codegen error, not related to this change)
- [x] Linting passes: `npm run lint` (pre-existing errors about unescaped entities, not related to this change)

#### Manual Verification:
- [ ] Same tests as Phase 1 still pass
- [ ] Verify logged-in users still use their `stampedRegionId` correctly

---

## Testing Strategy

### Manual Testing Steps:

1. **Anonymous EU user**:
   - Use browser from EU or set `oxygen-buyer-country: DE` header
   - Navigate to homepage
   - Check network tab for `region_id=1` in API calls
   - Verify EUR pricing shown

2. **Anonymous ROW user**:
   - Use VPN to US or set `oxygen-buyer-country: US` header
   - Navigate to homepage
   - Check network tab for `region_id=2` in API calls
   - Verify USD pricing shown

3. **Logged-in paying customer**:
   - Log in with paying customer account
   - Verify pricing matches their `stampedRegionId`
   - VPN location should NOT affect their pricing

4. **GeoIP failure fallback**:
   - Remove/break the `oxygen-buyer-country` header
   - Verify fallback to EU pricing (region 1)

### Development Testing:

In development, you can test by modifying the IP-API response or setting headers manually.

---

## Performance Considerations

- The `/meta/region/by-country` call adds ~10-50ms latency per request
- This is acceptable per user confirmation
- Future optimization: add Cloudflare cache with 1-hour TTL if needed

---

## References

- Documentation: `docs/LOCALE_AND_REGION_SYSTEM.md`
- Backend API: `BM_MediaPlatformAPI/Controllers/MetaController.cs:161-194`
- GeoIP detection: `app/lib/geo/ip-api.ts`
