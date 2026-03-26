import { Badge, BadgeType, SubscriptionTier, ContentType, ContentTypeId } from "./types";
import { DEFAULT_COUNTRY, DEFAULT_LANGUAGE, type CountryCode, type LanguageCode } from "./locale";

/**
 * Stable empty values to prevent unnecessary re-renders
 * Use these instead of inline [] or {} to maintain referential equality
 *
 * Example:
 * ❌ Bad:  <Component items={data || []} />  // New array every render!
 * ✅ Good: <Component items={data ?? EMPTY_ARRAY} />  // Same reference
 */
export const EMPTY_ARRAY: readonly any[] = Object.freeze([]);
export const EMPTY_OBJECT: Readonly<Record<string, never>> = Object.freeze({});

export const SHOPIFY_SUBSCRIPTION_PRODUCTS_HANDLES = {
  LIVE: "unlimited-live-recording-access-09-99",
  PREMIUM: "unlimited-platinum-access-plan-49-99-monthly",
  SUPPORTER: "unlimited-sponsored-access-plan-200-monthly",
};

export const CUSTOMER_SUBSCRIPTION_TIER_TAGS = {
  LIVE: "live-member",
  PREMIUM: "premium-member",
  SUPPORTER: "supporter-member",
};

export const SUBSCRIPTION_TIERS = {
  UNSUBSCRIBED: "unsubscribed" as SubscriptionTier,
  LIVE: "live" as SubscriptionTier,
  PREMIUM: "premium" as SubscriptionTier,
  SUPPORTER: "supporter" as SubscriptionTier,
};

/**
 * Tiers to filter out from content requirements.
 * Content marked with these tiers will have them ignored for access checks.
 * This is a temporary measure - when we want to enable a tier, remove it from this array.
 *
 * Current state: "supporter" tier is disabled until we're ready to launch it.
 */
export const DISABLED_CONTENT_TIERS: SubscriptionTier[] = ["supporter"];

export const SATSANG_CATEGORIES_ID = {
  GOD: 1,
  SAINTS: 2,
  BHAKTI: 6,
  HAPPINESS: 10,
};

export const BADGE_STYLES: Record<BadgeType, Badge | null> = {
  supporter: {
    type: "supporter",
    text: "Supporter",
    backgroundColor: "purple",
    textColor: "gold",
    borderColor: "gold",
  },
  premium: {
    type: "premium",
    text: "Premium",
    backgroundColor: "gold",
    textColor: "purple",
  },
};

/**
 * @deprecated Use DEFAULT_COUNTRY and DEFAULT_LANGUAGE from locale module instead
 */
export const DEFAULT_LOCALE = Object.freeze({
  label: "United States (USD $)",
  language: "EN",
  country: "US",
  currency: "USD",
  pathPrefix: "/us",
});

// Re-export new defaults for convenience
export { DEFAULT_COUNTRY, DEFAULT_LANGUAGE };

/**
 * Content Type Mappings
 * Maps ContentTypeId (numbers) to ContentType (strings)
 */

export const CONTENT_TYPE_ID_TO_TYPE = {
  1: "satsang",
  2: "commentary",
  3: "pilgrimage",
  5: "live",
  6: "talk",
} as const satisfies Record<ContentTypeId, ContentType>;

export const CONTENT_TYPE_TO_ID = {
  satsang: 1,
  commentary: 2,
  pilgrimage: 3,
  live: 5,
  talk: 6,
} as const satisfies Partial<Record<ContentType, ContentTypeId>>;

/**
 * Subscription Product IDs
 * These are used to exclude subscription products from purchases list
 */
export const SUBSCRIPTION_PRODUCT_IDS = [
  '15247882715515',  // Main subscription product
  '14902816375163',
  '14902811525499',
  '14902804513147',
  '7583685836958',
] as const;

/**
 * Subscription Plan Variant IDs (Monthly)
 * Maps plan names to Shopify variant IDs for checkout
 * Data sourced from Shopify Admin API on 2025-12-13
 */
export const PLAN_VARIANT_IDS = {
  live: '55782682689915',
  premium: '55782682755451',
  supporter: '55782682788219',  // All-Inclusive
} as const;

/**
 * Subscription Plan Variant IDs (Yearly)
 * Data sourced from Shopify Admin API on 2025-12-13
 */
export const PLAN_VARIANT_IDS_YEARLY = {
  live: '55950232977787',
  premium: '55950233043323',
  supporter: '55950233076091',  // All-Inclusive
} as const;

/**
 * Subscription Selling Plan IDs (Monthly)
 * Maps plan names to Shopify selling plan IDs for checkout
 * Data sourced from Shopify Admin API on 2025-12-16
 */
export const PLAN_SELLING_PLAN_IDS = {
  live: '710532792699',       // Live Monthly
  premium: '710532825467',    // Premium Monthly
  supporter: '710532858235',  // All-Inclusive Monthly (displayed as "All-Inclusive")
} as const;

/**
 * Subscription Selling Plan IDs (Yearly)
 * Data sourced from Shopify Admin API on 2025-12-16
 */
export const PLAN_SELLING_PLAN_IDS_YEARLY = {
  live: '710592430459',       // Live Yearly
  premium: '710592463227',    // Premium Yearly
  supporter: '710592495995',  // All-Inclusive Yearly (displayed as "All-Inclusive")
} as const;

/**
 * Main subscription product configuration
 */
export const SUBSCRIPTION_PRODUCT_HANDLE = 'bhakti-access-plan';
export const SUBSCRIPTION_PRODUCT_ID = '15247882715515';

/**
 * Store-specific subscription configurations
 * Each store has its own product variants and selling plans
 *
 * EU store uses the default variant/selling plan IDs
 * ROW store requires separate product configuration
 *
 * Keys follow pattern: {tier}{Interval} e.g., liveMonthly, premiumYearly
 */
export const STORE_SUBSCRIPTION_CONFIG = {
  eu: {
    variantIds: {
      liveMonthly: '55782682689915',
      liveYearly: '55950232977787',
      premiumMonthly: '55782682755451',
      premiumYearly: '55950233043323',
      supporterMonthly: '55782682788219',
      supporterYearly: '55950233076091',
    },
    sellingPlanIds: {
      liveMonthly: '710532792699',
      liveYearly: '710592430459',
      premiumMonthly: '710532825467',
      premiumYearly: '710592463227',
      supporterMonthly: '710532858235',
      supporterYearly: '710592495995',
    },
  },
  row: {
    variantIds: {
      liveMonthly: '51804380528914',
      liveYearly: '51804380627218',
      premiumMonthly: '51804380561682',
      premiumYearly: '51804380659986',
      supporterMonthly: '51804380594450',
      supporterYearly: '51804380692754',
    },
    sellingPlanIds: {
      liveMonthly: '694896984338',
      liveYearly: '694897082642',
      premiumMonthly: '694897017106',
      premiumYearly: '694897115410',
      supporterMonthly: '694897049874',
      supporterYearly: '694897148178',
    },
  },
} as const;

export type BillingInterval = 'monthly' | 'yearly';
export type PlanKey = `${Exclude<SubscriptionTier, 'unsubscribed'>}${Capitalize<BillingInterval>}`;

export type StoreSubscriptionConfig = typeof STORE_SUBSCRIPTION_CONFIG;

/**
 * Appstle API Configuration
 */
export const APPSTLE_API_BASE = 'https://membership-admin.appstle.com';

/**
 * Mobile App Configuration
 */
export const MOBILE_APP = {
  /** Deep link URL scheme for opening the app */
  DEEP_LINK_SCHEME: 'bhaktiplus://',
  /** iOS App Store URL */
  APP_STORE_URL: 'https://apps.apple.com/app/id6749066246',
  /** Android Play Store URL */
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=org.bhaktimarga.bhaktiplus',
  /** iOS bundle identifier */
  IOS_BUNDLE_ID: 'org.bhaktimarga.BhaktiPlusApp',
  /** Android package name */
  ANDROID_PACKAGE_NAME: 'org.bhaktimarga.bhaktiplus',
  /** Deep link paths for navigation - maps web paths to app deep links */
  DEEP_LINKS: {
    '/': 'bhaktiplus://home',
    '/livestreams': 'bhaktiplus://livestreams',
    '/satsangs': 'bhaktiplus://satsangs',
    '/commentaries': 'bhaktiplus://commentaries',
    '/pilgrimages': 'bhaktiplus://pilgrimages',
    '/talks': 'bhaktiplus://talks',
  } as Record<string, string>,
  FINGERPRINT: 'F1:88:30:F3:92:6E:F1:DD:ED:52:9C:D5:48:32:F9:F0:8A:32:03:26:54:A9:08:28:1F:5D:F5:F0:6A:1E:8E:39',
  FINGERPRINT_2: '9E:BA:00:9C:67:D6:59:C8:10:99:E2:2B:B4:00:A1:0E:8A:E9:15:70:5C:36:0A:68:37:F9:64:75:F5:76:B0:83'
} as const;

/**
 * Centralized z-index layer system.
 *
 * All z-index values in the app should reference these constants
 * to prevent stacking context conflicts. Values are Tailwind classes.
 *
 * Scale (lowest to highest):
 *   content    (5)      - Section-level stacking (carousels, cards)
 *   sticky      (9997)  - Sticky sub-navigation (e.g. SatsangsNav)
 *   headerMenu  (9998)  - Header mega menu dropdown
 *   accountMenu (9999)  - Account/profile dropdown (above mega menu)
 *   header      (10000) - Site header / floating toolbars
 *   modal       (10100) - Standard modals & overlays
 *   critical    (10200) - Critical / confirmation modals
 *   debug       (99999) - Debug tools only
 */
export const Z_INDEX = {
  /** Section-level stacking for carousels, content rows */
  content: 'z-[5]',
  /** Sticky sub-navigation bars (below header) */
  sticky: 'z-[9997]',
  /** Header mega menu portals */
  headerMenu: 'z-[9998]',
  /** Account/profile dropdown - above mega menu */
  accountMenu: 'z-[9999]',
  /** Site header, staging toolbar, floating UI */
  header: 'z-[10000]',
  /** Standard modals and overlays - above all page UI */
  modal: 'z-[10100]',
  /** Critical/confirmation modals - above standard modals */
  critical: 'z-[10200]',
  /** Debug/dev tools only */
  debug: 'z-[99999]',
} as const;
