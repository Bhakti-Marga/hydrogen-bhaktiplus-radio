/**
 * Store Context - SERVER-ONLY
 *
 * ============================================================
 * WARNING: This module contains SECRETS and SENSITIVE DATA.
 * NEVER import this file in client-side code.
 * NEVER return StoreContextServer from loaders.
 * ============================================================
 *
 * The .server.ts suffix ensures React Router will not bundle
 * this file for the client, but the naming convention provides
 * additional safety for developers.
 *
 * ## When to Use
 *
 * Use `getServerStoreContext()` in route loaders when you need to:
 * - Query Appstle subscription APIs
 * - Access the user's billing customer ID
 * - Perform any store-specific server-side operation
 *
 * ## Example
 *
 * ```typescript
 * // In a route loader:
 * import { getServerStoreContext } from '~/lib/store-routing/context.server';
 * import { userProfileContext } from '~/lib/middleware';
 *
 * export async function loader({ context }: LoaderFunctionArgs) {
 *   const userProfile = context.get(userProfileContext);
 *   const serverContext = getServerStoreContext(userProfile, context.env);
 *
 *   // Handle users with no billing info (never subscribed) - this is valid!
 *   if (!serverContext.billingCustomerId) {
 *     return { subscriptions: null };
 *   }
 *
 *   // Use for Appstle queries
 *   const subscriptions = await getCustomerSubscriptions(
 *     serverContext.billingCustomerId,
 *     serverContext.appstleApiKey
 *   );
 *
 *   // NEVER return serverContext from the loader!
 *   return { subscriptions };
 * }
 * ```
 */

import type { SubscriptionInfo } from '~/lib/api/types';
import { determineStore } from './context';

/**
 * SERVER-ONLY store context.
 *
 * ============================================================
 * DO NOT return this from loaders or expose to the client!
 * ============================================================
 *
 * Contains sensitive data:
 * - Appstle API keys (secrets)
 * - Admin API tokens (secrets)
 * - Billing customer ID (PII)
 */
export interface StoreContextServer {
  /**
   * Customer ID in the user's BILLING store (from Media API).
   *
   * This is NOT the EU auth store customer ID!
   * Use this for all Appstle API queries and Admin API order queries.
   *
   * Will be null if user has never subscribed.
   */
  billingCustomerId: string | null;

  /**
   * Appstle API key for the user's billing store.
   *
   * NEVER expose this to the client!
   */
  appstleApiKey: string;

  /**
   * Shopify Admin API token for the user's billing store.
   * Used for querying customer orders across stores.
   *
   * NEVER expose this to the client!
   */
  adminApiToken: string;

  /**
   * Shopify store domain for the user's billing store.
   * Used for Admin API requests.
   */
  storeDomain: string;

  /**
   * Which store type was determined.
   * Duplicated here for convenience in server-side logic.
   */
  storeType: 'eu' | 'row';
}

/**
 * Compute SERVER-ONLY store context.
 *
 * ============================================================
 * NEVER return this from loaders!
 * Use only for server-side operations like Appstle API calls.
 * ============================================================
 *
 * @param userProfile - User profile from Media API (or null for anonymous)
 * @param env - Environment variables (contains API keys)
 * @param countryCode - Country code from locale cascade (URL > GeoIP > default)
 * @returns StoreContextServer - for server-side use only
 *
 * @example
 * ```typescript
 * const serverContext = getServerStoreContext(userProfile, env, countryCode);
 *
 * // Users without billing info (never subscribed) are valid - handle gracefully
 * if (!serverContext.billingCustomerId) {
 *   return { subscriptions: null, canManageSubscription: false };
 * }
 *
 * const subscriptions = await getCustomerSubscriptions(
 *   serverContext.billingCustomerId,
 *   serverContext.appstleApiKey
 * );
 * ```
 */
export function getServerStoreContext(
  userProfile: SubscriptionInfo | null,
  env: Env,
  countryCode: string
): StoreContextServer {
  const { storeType } = determineStore(userProfile, countryCode);

  // Get the correct Appstle API key for the user's billing store
  const appstleApiKey = storeType === 'eu'
    ? (env.APPSTLE_API_KEY || '')
    : (env.APPSTLE_API_KEY_ROW || '');

  // Get the correct Admin API token for the user's billing store
  const adminApiToken = storeType === 'eu'
    ? (env.PRIVATE_ADMIN_API_TOKEN || '')
    : (env.PRIVATE_ADMIN_API_TOKEN_ROW || '');

  // Get the correct store domain for the user's billing store
  const storeDomain = storeType === 'eu'
    ? (env.PUBLIC_STORE_DOMAIN || '')
    : (env.PUBLIC_STORE_DOMAIN_ROW || '');

  // Get the billing customer ID from Media API
  // This is the customer ID in their BILLING store, not the EU auth store!
  // NOTE: billingCustomerId can be null for users who have never subscribed - this is valid!
  const billingCustomerId = userProfile?.shopifyCustomerId
    ? String(userProfile.shopifyCustomerId)
    : null;

  return {
    billingCustomerId,
    appstleApiKey,
    adminApiToken,
    storeDomain,
    storeType,
  };
}
