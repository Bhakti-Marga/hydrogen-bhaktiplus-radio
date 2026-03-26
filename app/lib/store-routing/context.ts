/**
 * Store Context - Client/Server Separation
 *
 * IMPORTANT: This module provides store-specific configuration with EXPLICIT
 * separation between client-safe and server-only data.
 *
 * ## Architecture
 *
 * We have two Shopify stores (EU and ROW) but a single Hydrogen deployment.
 * Users authenticate through EU store but may have subscriptions in either store.
 *
 * ## Security Boundary
 *
 * - `StoreContextClient` - SAFE to serialize to browser (checkout domains, store type)
 * - `StoreContextServer` - NEVER expose to client (API keys, billing customer IDs)
 *
 * ## Usage
 *
 * ```typescript
 * // In root loader (returns to client):
 * const storeContext = getClientStoreContext(userProfile, countryCode, env);
 * return { storeContext, ... };
 *
 * // In child route loaders (server-only, for Appstle calls):
 * import { getServerStoreContext } from '~/lib/store-routing/context.server';
 * const serverContext = getServerStoreContext(userProfile, env);
 * const subscriptions = await getCustomerSubscriptions(
 *   serverContext.billingCustomerId,
 *   serverContext.appstleApiKey
 * );
 * ```
 *
 * @see docs/MULTI_STORE_ARCHITECTURE.md for full architecture details
 */

import type { StoreType } from './config';
import { getStoreForCountry, getCheckoutDomain } from './config';
import type { SubscriptionInfo } from '~/lib/api/types';

/**
 * Known Shopify store IDs mapped to store types.
 * Used to determine store from stampedShopId returned by Media API.
 */
export const STORE_ID_TO_TYPE: Record<number, StoreType> = {
  63036457118: 'eu',    // EU store (guruconnect-108)
  94051631378: 'row',   // ROW store (guruconnect-108-row)
} as const;

/**
 * How the store type was determined, in priority order.
 * Useful for debugging and logging.
 */
export type StoreRoutingSource =
  | 'stampedShopId'             // Direct store ID from stampedRegionId (most authoritative for paying customers)
  | 'stampedRegionId'           // Backend-computed region from stampedCountryCode or userSelectCountryCode
  | 'countryCode'               // Country from locale cascade (URL > GeoIP > default)
  | 'default';                   // Fallback to ROW

/**
 * Convert region ID to store type.
 * Region IDs: 1=EU, 2=ROW
 */
function regionIdToStoreType(regionId: number): StoreType {
  return regionId === 1 ? 'eu' : 'row';
}

/**
 * CLIENT-SAFE store context.
 *
 * This type is SAFE to serialize and send to the browser.
 * It contains only public information needed for UI rendering.
 *
 * Exposed via root loader as `storeContext`.
 */
export interface StoreContextClient {
  /** Which store the user belongs to: 'eu' or 'row' */
  storeType: StoreType;

  /** How the store was determined (for debugging) */
  routingSource: StoreRoutingSource;

  /** The checkout domain for building cart/checkout URLs */
  checkoutDomain: string;
}

/**
 * Compute CLIENT-SAFE store context.
 *
 * Call this in the root loader and return the result.
 * The returned object is safe to serialize to the browser.
 *
 * @param userProfile - User profile from Media API (or null for anonymous)
 * @param countryCode - Country code from locale cascade (URL > GeoIP > default)
 * @param env - Environment variables
 * @returns StoreContextClient - safe to return from loaders
 *
 * @example
 * ```typescript
 * // In root loader:
 * const storeContext = getClientStoreContext(userProfile, countryCode, env);
 * return { storeContext, user, subscriptionTier };
 * ```
 */
export function getClientStoreContext(
  userProfile: SubscriptionInfo | null,
  countryCode: string,
  env: Env
): StoreContextClient {
  const { storeType, routingSource } = determineStore(userProfile, countryCode);

  return {
    storeType,
    routingSource,
    checkoutDomain: getCheckoutDomain(storeType, env),
  };
}

/**
 * Internal helper to determine store type with priority chain.
 * Used by both client and server context functions.
 *
 * Priority chain:
 * 1. stampedShopId - Direct store ID from backend (most authoritative for paying customers)
 * 2. stampedRegionId - Backend-computed region from stampedCountryCode or userSelectCountryCode
 * 3. countryCode - Country from locale cascade (URL > GeoIP > default)
 * 4. default - Fallback to ROW
 *
 * @param userProfile - User profile from Media API (or null for anonymous)
 * @param countryCode - Country code from locale cascade (URL > GeoIP > default), or null to skip country-based routing
 */
export function determineStore(
  userProfile: SubscriptionInfo | null,
  countryCode: string | null
): { storeType: StoreType; routingSource: StoreRoutingSource } {
  // Priority 1: Direct store ID from stampedShopId (most authoritative for paying customers)
  if (userProfile?.stampedShopId) {
    const storeType = STORE_ID_TO_TYPE[userProfile.stampedShopId];
    if (storeType) {
      return { storeType, routingSource: 'stampedShopId' };
    }
  }

  // Priority 2: stampedRegionId - Backend-computed region from stampedCountryCode or userSelectCountryCode
  // This ensures user's manual region selection is respected before falling back to GeoIP
  if (userProfile?.stampedRegionId) {
    return {
      storeType: regionIdToStoreType(userProfile.stampedRegionId),
      routingSource: 'stampedRegionId',
    };
  }

  // Priority 3: Country code from locale cascade (URL > GeoIP > default)
  if (countryCode) {
    return {
      storeType: getStoreForCountry(countryCode),
      routingSource: 'countryCode',
    };
  }

  // Default: ROW store
  return { storeType: 'row', routingSource: 'default' };
}

/**
 * Get human-readable region display name
 */
export function getRegionDisplayName(storeType: StoreType): string {
  return storeType === 'eu' ? 'EU' : 'International';
}

/**
 * Get human-readable explanation of how the region was determined.
 * Used to help users understand why they see a particular region.
 */
export function getRoutingSourceDescription(routingSource: StoreRoutingSource): string {
  switch (routingSource) {
    case 'stampedShopId':
    case 'stampedRegionId':
      return 'Based on your selected region';
    case 'countryCode':
      return 'Based on your location';
    case 'default':
    default:
      return '';
  }
}
