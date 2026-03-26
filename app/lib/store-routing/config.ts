/**
 * Multi-Store Checkout Routing Configuration
 *
 * Architecture Overview:
 * ----------------------
 * We operate two Shopify stores (EU and ROW) but serve a single frontend domain (bhakti.plus).
 *
 * Key insight: The frontend app doesn't need to know about different backend store domains.
 * The only thing that varies between stores for the frontend is the CHECKOUT DOMAIN -
 * where customers are redirected to complete their purchase.
 *
 * - PUBLIC_STORE_DOMAIN: The Shopify backend store domain (e.g., "guruconnect-108.myshopify.com")
 *   This is always the EU store. Used only for: CSP headers, Hydrogen internals, API context.
 *   The ROW store domain is never exposed to the frontend.
 *
 * - PUBLIC_CHECKOUT_DOMAIN: Customer-facing checkout for EU store
 * - PUBLIC_CHECKOUT_DOMAIN_ROW: Customer-facing checkout for ROW store
 *
 * The /subscribe route determines which checkout domain to use based on:
 * 1. User's stampedShopId (from backend region assignment)
 * 2. User's stampedRegionId (from stampedCountryCode or userSelectCountryCode)
 * 3. GeoIP detection (fallback for anonymous users)
 */

export type StoreType = 'eu' | 'row';

/**
 * European countries that route to the EU store.
 * Includes EU 27 member states, EEA, UK, and other European countries.
 *
 * WHY THIS IS A STATIC LIST (not fetched from the API):
 *
 * 1. Performance on the main load path — This list is used by `determineStore()`
 *    (priority 3: countryCode fallback) which runs in the root loader on every
 *    page load for anonymous users. An API call here would add latency to every
 *    first page view. For logged-in users, stampedShopId/stampedRegionId take
 *    priority so this list is not consulted at all.
 *
 * 2. Rarely changes — Country-to-region mappings are a business decision that
 *    changes at most a few times per year. The overhead of an API endpoint,
 *    caching strategy, loading states, and error handling is not justified for
 *    data this stable.
 *
 * 3. Also used in router.tsx for first-login country selection — When a new user
 *    picks their country, getRegionForCountry() uses this list to determine the
 *    immediate redirect target (EU vs ROW checkout) before stampedRegionId is
 *    available on subsequent requests.
 *
 * IMPORTANT: This list must stay in sync with the backend's country-to-region
 * mapping (the same mapping queried via GET /meta/region/by-country/:countryCode).
 * If they diverge, a new user's first-login redirect could target the wrong store,
 * even though subsequent requests (using stampedRegionId) would be correct.
 *
 * Last synced with backend: 2026-02-11 (44 countries, removed BY/XK)
 */
export const EU_STORE_COUNTRIES: readonly string[] = [
  // EU 27 Member States
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
  // EEA non-EU
  'IS', // Iceland
  'LI', // Liechtenstein
  'NO', // Norway
  // UK (post-Brexit, still routes to EU store)
  'GB', // United Kingdom
  // Other European countries
  'AL', // Albania
  'AD', // Andorra
  'BA', // Bosnia and Herzegovina
  'MD', // Moldova
  'MC', // Monaco
  'ME', // Montenegro
  'MK', // North Macedonia
  'SM', // San Marino
  'RS', // Serbia
  'CH', // Switzerland
  'TR', // Turkey
  'UA', // Ukraine
  'VA', // Vatican City
] as const;

/**
 * Set for O(1) lookup performance
 */
const EU_COUNTRIES_SET = new Set(EU_STORE_COUNTRIES);

/**
 * Determine which store to use based on country code
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "US", "DE", "GB")
 * @returns 'eu' for EU store, 'row' for Rest of World store
 */
export function getStoreForCountry(countryCode: string | null | undefined): StoreType {
  if (!countryCode) return 'row';
  return EU_COUNTRIES_SET.has(countryCode.toUpperCase()) ? 'eu' : 'row';
}

/**
 * Get the checkout domain for a given store type
 *
 * This is the customer-facing domain where users are redirected for checkout.
 * Each Shopify store has its own checkout domain.
 *
 * @param storeType - 'eu' or 'row'
 * @param env - Environment variables
 * @returns The Shopify checkout domain for building cart/checkout URLs
 */
export function getCheckoutDomain(storeType: StoreType, env: Env): string {
  return storeType === 'eu' ? env.PUBLIC_CHECKOUT_DOMAIN : env.PUBLIC_CHECKOUT_DOMAIN_ROW;
}
