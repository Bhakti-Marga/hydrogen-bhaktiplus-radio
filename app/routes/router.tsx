/**
 * BHAKTI PLUS ROUTER
 * ==================
 * Central entry point for routing users to the correct store (EU/US)
 * and managing subscription operations via Appstle API.
 *
 * Flow:
 * 1. Check if user is logged in
 * 2. Get user's region from API
 * 3. If new user → country selection
 * 4. Redirect to correct store with checkout URL
 *
 * Membership Operations (ALL via GET - sensitive data fetched via API):
 * - GET /router?intent=membership&op=get               → Fetch current subscriptions (JSON)
 * - GET /router?intent=membership&op=update&tier=X     → Upgrade/downgrade to tier X
 * - GET /router?intent=membership&op=cancel            → Cancel subscription
 * - GET /router?intent=membership&op=reactivate        → Reactivate paused subscription
 *
 * Orders Operations:
 * - GET /router?intent=orders                          → Fetch customer orders from correct store (JSON)
 */

import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router";
import { useLoaderData, useNavigation, Form } from "react-router";
import { useEffect, useState } from "react";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { CUSTOMER_ACCOUNT_QUERY } from "~/graphql/customer-account/CustomerAccountQuery";
import imageLogo from "~/assets/logo.png";
import { EU_STORE_COUNTRIES } from "~/lib/store-routing";
import {
  getCustomerSubscriptions,
  updateSubscriptionVariant,
  cancelSubscription,
  reactivateSubscription,
  scheduleSubscriptionDowngrade,
  cancelPendingDowngrade,
  type AppstleCustomerResponse,
  type AppstleSubscriptionContract,
} from "~/lib/api/services/appstle";
import { STORE_SUBSCRIPTION_CONFIG } from "~/lib/constants";
import type { SubscriptionTier } from "~/lib/types";
import { BhaktiMargMediaApi } from "~/lib/api";
import {
  userProfileContext,
  userContext,
  localeContext,
} from "~/lib/middleware/contexts";
import { getServerStoreContext } from "~/lib/store-routing/context.server";
import { fetchCustomerOrders } from "~/lib/api/services/shopify-admin.server";

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  stores: {
    EU: {
      url: "https://checkout.bhakti.plus",
      regionId: 1,
    },
    US: {
      url: "https://us.bhakti.plus",
      regionId: 2,
      checkoutRouter: "/pages/addtemp", // Custom page for cart handling
    },
  },
  paths: {
    login: "/customer_authentication/login",
    checkout: "/checkout",
  },
} as const;

// =============================================================================
// TYPES
// =============================================================================

const ALLOWED_INTENTS = [
  "login",
  "subscribe",
  "product",
  "catalog",
  "membership",
  "error",
  "account",
  "logout",
  "orders",
] as const;
const CONTENT_TYPES = ["pilgrimages", "commentaries", "talks"] as const;
const MEMBERSHIP_IDS = ["live", "premium", "supporter"] as const;
const BILLING_PERIODS = ["monthly", "yearly"] as const;
const MEMBERSHIP_OPS = [
  "get",
  "update",
  "cancel",
  "pause",
  "reactivate",
  "update_payment",
  "cancel_downgrade",
] as const;

type Intent = (typeof ALLOWED_INTENTS)[number];
type ContentType = (typeof CONTENT_TYPES)[number];
type MembershipId = (typeof MEMBERSHIP_IDS)[number];
type BillingPeriod = (typeof BILLING_PERIODS)[number];
type MembershipOp = (typeof MEMBERSHIP_OPS)[number];
type Region = "EU" | "US";

// Appstle API base URL
const APPSTLE_API_BASE = "https://membership-admin.appstle.com";

// =============================================================================
// MEMBERSHIP TIER CONFIGURATION
// =============================================================================

/**
 * Plan levels for upgrade/downgrade detection
 * Higher number = higher tier
 */
const PLAN_LEVELS: Record<SubscriptionTier, number> = {
  unsubscribed: 0,
  live: 10,
  premium: 20,
  supporter: 30,
};

/**
 * Variant ID to tier mapping for both EU and ROW stores
 * Used to determine current tier from Appstle subscription data
 */
interface VariantTierInfo {
  tier: SubscriptionTier;
  billing: BillingPeriod;
}

function buildVariantToTierMap(): Map<string, VariantTierInfo> {
  const map = new Map<string, VariantTierInfo>();

  // EU store variants
  const euConfig = STORE_SUBSCRIPTION_CONFIG.eu;
  map.set(euConfig.variantIds.liveMonthly, {
    tier: "live",
    billing: "monthly",
  });
  map.set(euConfig.variantIds.liveYearly, { tier: "live", billing: "yearly" });
  map.set(euConfig.variantIds.premiumMonthly, {
    tier: "premium",
    billing: "monthly",
  });
  map.set(euConfig.variantIds.premiumYearly, {
    tier: "premium",
    billing: "yearly",
  });
  map.set(euConfig.variantIds.supporterMonthly, {
    tier: "supporter",
    billing: "monthly",
  });
  map.set(euConfig.variantIds.supporterYearly, {
    tier: "supporter",
    billing: "yearly",
  });

  // ROW store variants
  const rowConfig = STORE_SUBSCRIPTION_CONFIG.row;
  map.set(rowConfig.variantIds.liveMonthly, {
    tier: "live",
    billing: "monthly",
  });
  map.set(rowConfig.variantIds.liveYearly, { tier: "live", billing: "yearly" });
  map.set(rowConfig.variantIds.premiumMonthly, {
    tier: "premium",
    billing: "monthly",
  });
  map.set(rowConfig.variantIds.premiumYearly, {
    tier: "premium",
    billing: "yearly",
  });
  map.set(rowConfig.variantIds.supporterMonthly, {
    tier: "supporter",
    billing: "monthly",
  });
  map.set(rowConfig.variantIds.supporterYearly, {
    tier: "supporter",
    billing: "yearly",
  });

  return map;
}

const VARIANT_TO_TIER_MAP = buildVariantToTierMap();

/**
 * Get tier info from variant ID (handles both GID and numeric formats)
 */
function getTierFromVariantId(variantId: string): VariantTierInfo | null {
  // Extract numeric ID if it's a GID format
  const numericId = variantId.includes("/")
    ? variantId.split("/").pop() || variantId
    : variantId;

  return VARIANT_TO_TIER_MAP.get(numericId) || null;
}

/**
 * Get variant ID for a target tier based on region and current billing period
 * Keeps the same billing period as the current subscription
 */
function getVariantIdForTier(
  targetTier: MembershipId,
  region: Region,
  billingPeriod: BillingPeriod,
): string | null {
  const storeType = region === "EU" ? "eu" : "row";
  const config = STORE_SUBSCRIPTION_CONFIG[storeType];

  // Build the key like "premiumMonthly" or "liveYearly"
  const capitalizedBilling =
    billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1);
  const planKey =
    `${targetTier}${capitalizedBilling}` as keyof typeof config.variantIds;

  return config.variantIds[planKey] || null;
}

/**
 * Check if a downgrade is forbidden based on business rules:
 *
 * CURRENT RULES:
 * - Supporter tier -> anything lower is ALWAYS forbidden (supporter is a commitment)
 * - Cross-billing-frequency downgrades are forbidden (e.g., premium monthly -> live yearly)
 * - Same-billing-frequency downgrades are ALLOWED (scheduled for end of billing period)
 *   e.g., premium monthly -> live monthly, premium yearly -> live yearly
 */
function isDowngradeForbidden(
  currentTier: SubscriptionTier,
  currentBilling: BillingPeriod,
  targetTier: SubscriptionTier,
  targetBilling: BillingPeriod,
): boolean {
  // Use the existing PLAN_LEVELS constant for comparison
  const currentLevel = PLAN_LEVELS[currentTier] || 0;
  const targetLevel = PLAN_LEVELS[targetTier] || 0;

  // Not a downgrade? Not forbidden
  if (targetLevel >= currentLevel) {
    return false;
  }

  // Supporter -> anything lower is always forbidden
  if (currentTier === "supporter") {
    return true;
  }

  // Cross-billing-frequency downgrades are forbidden
  // (e.g., premium monthly -> live yearly)
  if (currentBilling !== targetBilling) {
    return true;
  }

  // Same-billing-frequency downgrades are allowed
  // (will be scheduled for end of billing period)
  return false;
}

/**
 * Check if a billing period change is forbidden
 * Rule: YEARLY -> MONTHLY is always forbidden (must contact support)
 */
function isBillingChangeForbidden(
  currentBilling: BillingPeriod,
  targetBilling: BillingPeriod,
): boolean {
  // Yearly to Monthly is forbidden
  if (currentBilling === "yearly" && targetBilling === "monthly") {
    return true;
  }
  return false;
}

/**
 * Determine if this is an upgrade or downgrade
 */
function getChangeType(
  currentTier: SubscriptionTier,
  targetTier: SubscriptionTier,
): "upgrade" | "downgrade" | "same" {
  const currentLevel = PLAN_LEVELS[currentTier] || 0;
  const targetLevel = PLAN_LEVELS[targetTier] || 0;

  if (targetLevel > currentLevel) return "upgrade";
  if (targetLevel < currentLevel) return "downgrade";
  return "same";
}

interface RouterParams {
  intent: Intent;
  returnTo?: string;
  contentType?: ContentType;
  contentId?: number;
  membershipId?: MembershipId;
  billingPeriod?: BillingPeriod;
  // Membership operation parameters (all via GET)
  op?: MembershipOp;
  tier?: MembershipId; // Target tier for update (live, premium, supporter)
  billing?: BillingPeriod; // Target billing period (monthly, yearly) - if not set, keeps current
}

// Membership operation result (for displaying result page)
interface MembershipOperationResult {
  success: boolean;
  operation: "upgrade" | "downgrade" | "cancel" | "pause" | "reactivate";
  message: string;
  needsContact: boolean;
  returnTo: string;
  email: string;
  fromTier?: SubscriptionTier;
  toTier?: SubscriptionTier;
  // True if user is already on the requested plan (no change needed)
  alreadyOnPlan?: boolean;
  // Billing info (shown after successful operations)
  billing?: {
    nextBillingDate: string;
    amount: string;
    currencyCode: string;
    interval: "MONTH" | "YEAR";
  };
}

// Error codes for checkout errors
const ERROR_CODES = {
  checkout_failed: "We couldn't prepare your checkout. Please try again.",
  product_unavailable: "This product is currently unavailable.",
  cart_error: "There was an issue with your cart. Please try again.",
  invalid_plan: "The selected plan is not available.",
  already_subscribed:
    "You already have an active subscription. Please manage your existing membership from your account.",
  payment_failed:
    "Payment could not be processed. Please check your payment details and try again.",
  session_expired: "Your session has expired. Please try again.",
  unknown: "An unexpected error occurred. Please try again.",
} as const;

type ErrorCode = keyof typeof ERROR_CODES;

// Loader data types
type LoaderData =
  | { action: "need_login"; params: RouterParams }
  | { action: "need_country"; email: string; params: RouterParams }
  | { action: "api_error"; retryUrl: string }
  | {
    action: "redirecting";
    region: Region;
    redirectUrl: string;
    email: string;
  }
  | { action: "membership_result"; result: MembershipOperationResult }
  | {
    action: "membership_processing";
    email: string;
    op: MembershipOp;
    originalUrl: string;
  }
  | {
    action: "checkout_error";
    errorCode: ErrorCode;
    returnTo: string;
    customMessage?: string;
    cartEmail?: string;
  }
  | { error: string };

// Membership API response types (for JSON responses)
interface MembershipSubscription {
  id: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED" | "EXPIRED" | "FAILED";
  tier: SubscriptionTier;
  billing: BillingPeriod;
  nextBillingDate: string;
  price: string;
  currencyCode: string;
  // Payment status info
  paymentStatus?: {
    lastPaymentStatus: "SUCCEEDED" | "FAILED" | null;
    paymentFailed: boolean;
    requiresAction: boolean;
    failureReason?: string;
  };
  // Card info
  paymentMethod?: {
    brand: string;
    lastDigits: string;
    expiresSoon: boolean;
    expiryMonth: number;
    expiryYear: number;
    isExpired: boolean;
  };
}

interface MembershipGetResponse {
  success: boolean;
  subscriptions: MembershipSubscription[];
}

// =============================================================================
// ROUTE HANDLE - Skip layout (standalone page)
// =============================================================================

export const handle = { skipLayout: true };

// =============================================================================
// COUNTRY DATA
// =============================================================================

// Derived from EU_STORE_COUNTRIES (app/lib/store-routing/config.ts).
// Used by getRegionForCountry() below to determine the immediate redirect
// target when a new user selects their country, before stampedRegionId is
// available. See config.ts for why this is a static list and sync requirements.
const EU_COUNTRY_CODES = new Set(
  EU_STORE_COUNTRIES.map((c) => c.toUpperCase()),
);

// Static list of countries shown in the first-login country selector UI.
// This is the full set of supported countries grouped by geographic region.
// The EU/ROW classification is NOT determined by which group a country appears
// in here — it's determined by EU_STORE_COUNTRIES above. A country can appear
// under "Europe" in this UI list but still route to ROW (e.g., Belarus).
//
// Last synced with backend: 2026-02-11 (200 countries, excludes AQ Antarctica)
const COUNTRY_REGIONS = [
  {
    name: "Europe",
    countries: [
      { code: "AL", name: "Albania" },
      { code: "AD", name: "Andorra" },
      { code: "AM", name: "Armenia" },
      { code: "AT", name: "Austria" },
      { code: "AZ", name: "Azerbaijan" },
      { code: "BY", name: "Belarus" },
      { code: "BE", name: "Belgium" },
      { code: "BA", name: "Bosnia and Herzegovina" },
      { code: "BG", name: "Bulgaria" },
      { code: "HR", name: "Croatia" },
      { code: "CY", name: "Cyprus" },
      { code: "CZ", name: "Czech Republic" },
      { code: "DK", name: "Denmark" },
      { code: "EE", name: "Estonia" },
      { code: "FI", name: "Finland" },
      { code: "FR", name: "France" },
      { code: "GE", name: "Georgia" },
      { code: "DE", name: "Germany" },
      { code: "GR", name: "Greece" },
      { code: "HU", name: "Hungary" },
      { code: "IS", name: "Iceland" },
      { code: "IE", name: "Ireland" },
      { code: "IT", name: "Italy" },
      { code: "KZ", name: "Kazakhstan" },
      { code: "KG", name: "Kyrgyzstan" },
      { code: "LV", name: "Latvia" },
      { code: "LI", name: "Liechtenstein" },
      { code: "LT", name: "Lithuania" },
      { code: "LU", name: "Luxembourg" },
      { code: "MT", name: "Malta" },
      { code: "MD", name: "Moldova" },
      { code: "MC", name: "Monaco" },
      { code: "MN", name: "Mongolia" },
      { code: "ME", name: "Montenegro" },
      { code: "NL", name: "Netherlands" },
      { code: "MK", name: "North Macedonia" },
      { code: "NO", name: "Norway" },
      { code: "PL", name: "Poland" },
      { code: "PT", name: "Portugal" },
      { code: "RO", name: "Romania" },
      { code: "RU", name: "Russia" },
      { code: "SM", name: "San Marino" },
      { code: "RS", name: "Serbia" },
      { code: "SK", name: "Slovakia" },
      { code: "SI", name: "Slovenia" },
      { code: "ES", name: "Spain" },
      { code: "SE", name: "Sweden" },
      { code: "CH", name: "Switzerland" },
      { code: "TJ", name: "Tajikistan" },
      { code: "TR", name: "Turkey" },
      { code: "TM", name: "Turkmenistan" },
      { code: "UA", name: "Ukraine" },
      { code: "GB", name: "United Kingdom" },
      { code: "UZ", name: "Uzbekistan" },
      { code: "VA", name: "Vatican City" },
    ],
  },
  {
    name: "Americas",
    countries: [
      { code: "AI", name: "Anguilla" },
      { code: "AG", name: "Antigua and Barbuda" },
      { code: "AR", name: "Argentina" },
      { code: "AW", name: "Aruba" },
      { code: "BS", name: "Bahamas" },
      { code: "BB", name: "Barbados" },
      { code: "BZ", name: "Belize" },
      { code: "BM", name: "Bermuda" },
      { code: "BO", name: "Bolivia" },
      { code: "BR", name: "Brazil" },
      { code: "CA", name: "Canada" },
      { code: "KY", name: "Cayman Islands" },
      { code: "CL", name: "Chile" },
      { code: "CO", name: "Colombia" },
      { code: "CR", name: "Costa Rica" },
      { code: "CU", name: "Cuba" },
      { code: "DM", name: "Dominica" },
      { code: "DO", name: "Dominican Republic" },
      { code: "EC", name: "Ecuador" },
      { code: "SV", name: "El Salvador" },
      { code: "GD", name: "Grenada" },
      { code: "GT", name: "Guatemala" },
      { code: "GY", name: "Guyana" },
      { code: "HT", name: "Haiti" },
      { code: "HN", name: "Honduras" },
      { code: "JM", name: "Jamaica" },
      { code: "MX", name: "Mexico" },
      { code: "NI", name: "Nicaragua" },
      { code: "PA", name: "Panama" },
      { code: "PY", name: "Paraguay" },
      { code: "PE", name: "Peru" },
      { code: "KN", name: "Saint Kitts and Nevis" },
      { code: "LC", name: "Saint Lucia" },
      { code: "VC", name: "Saint Vincent and the Grenadines" },
      { code: "SR", name: "Suriname" },
      { code: "TT", name: "Trinidad and Tobago" },
      { code: "US", name: "United States" },
      { code: "UY", name: "Uruguay" },
      { code: "VE", name: "Venezuela" },
    ],
  },
  {
    name: "Asia Pacific",
    countries: [
      { code: "AF", name: "Afghanistan" },
      { code: "AS", name: "American Samoa" },
      { code: "AU", name: "Australia" },
      { code: "BD", name: "Bangladesh" },
      { code: "BT", name: "Bhutan" },
      { code: "BN", name: "Brunei" },
      { code: "KH", name: "Cambodia" },
      { code: "CN", name: "China" },
      { code: "FJ", name: "Fiji" },
      { code: "HK", name: "Hong Kong" },
      { code: "IN", name: "India" },
      { code: "ID", name: "Indonesia" },
      { code: "IR", name: "Iran" },
      { code: "JP", name: "Japan" },
      { code: "KI", name: "Kiribati" },
      { code: "KR", name: "South Korea" },
      { code: "LA", name: "Laos" },
      { code: "MO", name: "Macau" },
      { code: "MY", name: "Malaysia" },
      { code: "MV", name: "Maldives" },
      { code: "MH", name: "Marshall Islands" },
      { code: "FM", name: "Micronesia" },
      { code: "MM", name: "Myanmar" },
      { code: "NR", name: "Nauru" },
      { code: "NP", name: "Nepal" },
      { code: "NZ", name: "New Zealand" },
      { code: "PK", name: "Pakistan" },
      { code: "PW", name: "Palau" },
      { code: "PG", name: "Papua New Guinea" },
      { code: "PH", name: "Philippines" },
      { code: "WS", name: "Samoa" },
      { code: "SG", name: "Singapore" },
      { code: "SB", name: "Solomon Islands" },
      { code: "LK", name: "Sri Lanka" },
      { code: "TW", name: "Taiwan" },
      { code: "TH", name: "Thailand" },
      { code: "TL", name: "Timor-Leste" },
      { code: "TO", name: "Tonga" },
      { code: "TV", name: "Tuvalu" },
      { code: "VU", name: "Vanuatu" },
      { code: "VN", name: "Vietnam" },
    ],
  },
  {
    name: "Middle East & Africa",
    countries: [
      { code: "DZ", name: "Algeria" },
      { code: "AO", name: "Angola" },
      { code: "BH", name: "Bahrain" },
      { code: "BJ", name: "Benin" },
      { code: "BW", name: "Botswana" },
      { code: "BF", name: "Burkina Faso" },
      { code: "BI", name: "Burundi" },
      { code: "CM", name: "Cameroon" },
      { code: "CV", name: "Cape Verde" },
      { code: "CF", name: "Central African Republic" },
      { code: "TD", name: "Chad" },
      { code: "KM", name: "Comoros" },
      { code: "CG", name: "Congo" },
      { code: "CD", name: "Congo, Democratic Republic" },
      { code: "CI", name: "C\u00f4te d'Ivoire" },
      { code: "DJ", name: "Djibouti" },
      { code: "EG", name: "Egypt" },
      { code: "GQ", name: "Equatorial Guinea" },
      { code: "ER", name: "Eritrea" },
      { code: "ET", name: "Ethiopia" },
      { code: "GA", name: "Gabon" },
      { code: "GM", name: "Gambia" },
      { code: "GH", name: "Ghana" },
      { code: "GN", name: "Guinea" },
      { code: "GW", name: "Guinea-Bissau" },
      { code: "IQ", name: "Iraq" },
      { code: "IL", name: "Israel" },
      { code: "JO", name: "Jordan" },
      { code: "KE", name: "Kenya" },
      { code: "KW", name: "Kuwait" },
      { code: "LB", name: "Lebanon" },
      { code: "LS", name: "Lesotho" },
      { code: "LR", name: "Liberia" },
      { code: "LY", name: "Libya" },
      { code: "MG", name: "Madagascar" },
      { code: "MW", name: "Malawi" },
      { code: "ML", name: "Mali" },
      { code: "MR", name: "Mauritania" },
      { code: "MU", name: "Mauritius" },
      { code: "MA", name: "Morocco" },
      { code: "MZ", name: "Mozambique" },
      { code: "NA", name: "Namibia" },
      { code: "NE", name: "Niger" },
      { code: "NG", name: "Nigeria" },
      { code: "OM", name: "Oman" },
      { code: "QA", name: "Qatar" },
      { code: "RW", name: "Rwanda" },
      { code: "ST", name: "Sao Tome and Principe" },
      { code: "SA", name: "Saudi Arabia" },
      { code: "SN", name: "Senegal" },
      { code: "SC", name: "Seychelles" },
      { code: "SL", name: "Sierra Leone" },
      { code: "SO", name: "Somalia" },
      { code: "ZA", name: "South Africa" },
      { code: "SS", name: "South Sudan" },
      { code: "SD", name: "Sudan" },
      { code: "SY", name: "Syria" },
      { code: "TZ", name: "Tanzania" },
      { code: "TG", name: "Togo" },
      { code: "TN", name: "Tunisia" },
      { code: "UG", name: "Uganda" },
      { code: "AE", name: "United Arab Emirates" },
      { code: "YE", name: "Yemen" },
      { code: "ZM", name: "Zambia" },
      { code: "ZW", name: "Zimbabwe" },
    ],
  },
] as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getRegionForCountry(countryCode: string): Region {
  return EU_COUNTRY_CODES.has(countryCode.toUpperCase()) ? "EU" : "US";
}

function getStoreConfig(region: Region) {
  return CONFIG.stores[region];
}

/**
 * Get the app origin from the request
 * In production: https://bhakti.plus
 * In development: https://router.bhaktimarga.ngrok.dev or http://localhost:3000
 */
function getAppOrigin(request: Request): string {
  const url = new URL(request.url);
  return url.origin;
}

/**
 * Get Appstle API key based on region
 */
function getAppstleApiKey(env: Env, region: Region): string {
  return region === "EU"
    ? env.APPSTLE_API_KEY || ""
    : env.APPSTLE_API_KEY_ROW || "";
}

/**
 * Pause a subscription (set status to PAUSED)
 * Uses Appstle API directly since this is router-specific
 *
 * API Behavior:
 * - Returns empty response (200 OK) on success
 * - Returns JSON error on failure
 */
async function pauseSubscription(
  contractId: string,
  apiKey: string,
): Promise<{ success: boolean; message: string }> {
  if (!contractId || !apiKey) {
    console.error("[Router] pauseSubscription: missing contractId or apiKey");
    return { success: false, message: "Missing required parameters" };
  }

  const url = `${APPSTLE_API_BASE}/api/external/v2/subscription-contracts-update-status`;
  const params = new URLSearchParams({
    contractId,
    status: "PAUSED",
  });

  console.log(
    "[Router] Calling Appstle pause API:",
    `${url}?contractId=${contractId}&status=PAUSED`,
  );

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(`${url}?${params}`, {
      method: "PUT",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("[Router] Appstle pause response status:", response.status);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          // Try to parse as JSON for detailed error
          try {
            const errorJson = JSON.parse(errorText) as { detail?: string; message?: string };
            errorMessage =
              errorJson.detail || errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText.substring(0, 200); // Limit error text length
          }
        }
      } catch {
        // Ignore read errors
      }
      console.error("[Router] Appstle pause error:", errorMessage);
      return { success: false, message: errorMessage };
    }

    // Success: Appstle returns empty 200 OK
    return { success: true, message: "Subscription paused successfully" };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Router] Pause subscription timeout");
      return { success: false, message: "Request timed out" };
    }
    console.error("[Router] Pause subscription error:", error);
    return {
      success: false,
      message: "Network error while pausing subscription",
    };
  }
}

/**
 * Transform Appstle subscription to normalized format
 * Includes payment status and card info for dunning management
 */
function transformSubscription(
  contract: AppstleSubscriptionContract,
): MembershipSubscription | null {
  const line = contract.lines?.nodes?.[0];
  if (!line) return null;

  const variantId = line.variantId.split("/").pop() || line.variantId;
  const tierInfo = getTierFromVariantId(variantId);

  // Check payment status
  const lastPaymentStatus = contract.lastPaymentStatus || null;
  const paymentFailed =
    lastPaymentStatus === "FAILED" || contract.status === "FAILED";

  // Check card expiration
  const paymentMethod = contract.customerPaymentMethod?.instrument;
  let isExpired = false;
  if (paymentMethod?.expiryYear && paymentMethod?.expiryMonth) {
    const now = new Date();
    const expiryDate = new Date(
      paymentMethod.expiryYear,
      paymentMethod.expiryMonth,
      0,
    ); // Last day of expiry month
    isExpired = now > expiryDate;
  }

  return {
    id: contract.id.split("/").pop() || contract.id,
    status: contract.status,
    tier: tierInfo?.tier || "unsubscribed",
    billing: tierInfo?.billing || "monthly",
    nextBillingDate: contract.nextBillingDate,
    price: line.currentPrice?.amount || "0",
    currencyCode: line.currentPrice?.currencyCode || "EUR",
    // Payment status
    paymentStatus: {
      lastPaymentStatus,
      paymentFailed,
      requiresAction:
        paymentFailed || isExpired || paymentMethod?.expiresSoon || false,
      failureReason: paymentFailed
        ? "Payment failed. Please update your payment method."
        : undefined,
    },
    // Card info (if available)
    paymentMethod: paymentMethod
      ? {
        brand: paymentMethod.brand,
        lastDigits: paymentMethod.lastDigits,
        expiresSoon: paymentMethod.expiresSoon || false,
        expiryMonth: paymentMethod.expiryMonth,
        expiryYear: paymentMethod.expiryYear,
        isExpired,
      }
      : undefined,
  };
}

/**
 * Validate subscription belongs to customer
 */
function findSubscriptionById(
  customerData: AppstleCustomerResponse,
  subscriptionId: string,
): AppstleSubscriptionContract | null {
  const contracts = customerData.subscriptionContracts?.nodes || [];
  return (
    contracts.find((c) => {
      const contractId = c.id.split("/").pop() || c.id;
      return contractId === subscriptionId;
    }) || null
  );
}

/**
 * Find the first active subscription for a customer
 * Prioritizes ACTIVE status, then falls back to any subscription
 */
function findActiveSubscription(
  customerData: AppstleCustomerResponse,
): AppstleSubscriptionContract | null {
  const contracts = customerData.subscriptionContracts?.nodes || [];

  // First try to find an ACTIVE subscription
  const active = contracts.find((c) => c.status === "ACTIVE");
  if (active) return active;

  // Fallback to PAUSED (can be reactivated)
  const paused = contracts.find((c) => c.status === "PAUSED");
  if (paused) return paused;

  // Last resort: any subscription
  return contracts[0] || null;
}

/**
 * Extract billing info from subscription contract
 * Handles various response formats from Appstle API
 */
function extractBillingInfo(
  contract: AppstleSubscriptionContract,
): MembershipOperationResult["billing"] | undefined {
  if (!contract) {
    console.warn("[Router] extractBillingInfo: no contract provided");
    return undefined;
  }

  const line = contract.lines?.nodes?.[0];

  // nextBillingDate is required for billing info
  if (!contract.nextBillingDate) {
    console.warn("[Router] extractBillingInfo: no nextBillingDate");
    return undefined;
  }

  // Get price info with fallbacks
  const amount =
    line?.currentPrice?.amount || line?.lineDiscountedPrice?.amount || "0";
  const currencyCode =
    line?.currentPrice?.currencyCode ||
    line?.lineDiscountedPrice?.currencyCode ||
    "USD";

  // Get billing interval with fallback
  const interval = contract.billingPolicy?.interval;
  const billingInterval: "MONTH" | "YEAR" =
    interval === "YEAR" ? "YEAR" : "MONTH";

  return {
    nextBillingDate: contract.nextBillingDate,
    amount,
    currencyCode,
    interval: billingInterval,
  };
}

// =============================================================================
// MONITORING
// =============================================================================

interface LogData {
  // Required fields
  email: string;
  intent: Intent;
  action_type:
  | "redirect"
  | "need_login"
  | "need_country"
  | "api_error"
  | "error"
  | "membership_forbidden"
  | "membership_update_success"
  | "membership_update_failed"
  | "membership_cancel_success"
  | "membership_cancel_failed"
  | "membership_pause_success"
  | "membership_pause_failed"
  | "membership_reactivate_success"
  | "membership_reactivate_failed"
  | "membership_cancel_downgrade_success"
  | "membership_cancel_downgrade_failed";
  // Optional fields
  resolved_region?: Region;
  redirect_url?: string;
  return_to?: string;
  was_new_user?: boolean;
  country_selected?: string;
  membership_id?: MembershipId;
  billing_period?: BillingPeriod;
  content_type?: ContentType;
  content_id?: number;
  error_message?: string;
  referer?: string;
  // Membership operation fields
  membership_operation?: string;
  from_tier?: SubscriptionTier;
  to_tier?: string;
  from_billing?: BillingPeriod;
  to_billing?: string;
  reason?: string;
  access_end_date?: string;
  previous_status?: string;
}

async function logAction(data: LogData, env: Env): Promise<void> {
  // Skip if monitoring not configured
  if (!env.ROUTER_MONITORING_URL || !env.ROUTER_MONITORING_KEY) {
    return;
  }

  try {
    // Clean undefined values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    await fetch(`${env.ROUTER_MONITORING_URL}?action=log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.ROUTER_MONITORING_KEY,
      },
      body: JSON.stringify(cleanData),
    });
  } catch (error) {
    console.error("[Router] Log failed:", error);
  }
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

type CheckRegionResult =
  | { status: "found"; region: Region; userId?: number }
  | { status: "not_found" }
  | { status: "error" };

async function checkUserRegion(
  email: string,
  env: Env,
): Promise<CheckRegionResult> {
  try {
    const url = new URL(`${env.MEDIA_API_URL}/user/check-region`);
    url.searchParams.set("email", email);
    url.searchParams.set("api_version", "latest");
    url.searchParams.set("locale", "en-US");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json", "x-api-key": env.MEDIA_API_KEY },
    });

    if (!response.ok) return { status: "error" };

    const data = (await response.json()) as {
      stampedRegionId?: number;
      error?: string;
    };

    if (data.error === "User not found") return { status: "not_found" };
    if (data.error) return { status: "error" };

    if (data.stampedRegionId) {
      const regionMap: Record<number, Region> = { 1: "EU", 2: "US" };
      return {
        status: "found",
        region: regionMap[data.stampedRegionId] || "US",
      };
    }

    return { status: "not_found" };
  } catch {
    return { status: "error" };
  }
}

/**
 * Helper function to wait for a specified time
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Register user region with retry and verification
 * After registration, waits for the API to propagate the data
 */
async function registerUserRegion(
  email: string,
  countryCode: string,
  env: Env,
): Promise<boolean> {
  try {
    console.log("[Router] Registering user region:", { email, countryCode });

    const response = await fetch(`${env.MEDIA_API_URL}/user/select-region`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": env.MEDIA_API_KEY,
      },
      body: JSON.stringify({ email, countryCode: countryCode.toUpperCase() }),
    });

    if (!response.ok) {
      console.error(
        "[Router] Failed to register region, status:",
        response.status,
      );
      return false;
    }

    console.log(
      "[Router] Region registered successfully, waiting for propagation...",
    );

    // Wait 1.5 seconds for the API to propagate the data
    await delay(1500);

    // Verify the registration was successful by checking the region
    const verifyResult = await checkUserRegion(email, env);

    if (verifyResult.status === "found") {
      console.log(
        "[Router] Region verified successfully:",
        verifyResult.region,
      );
      return true;
    }

    // If not found yet, wait a bit more and try once more
    console.log("[Router] Region not found yet, retrying verification...");
    await delay(1000);

    const retryResult = await checkUserRegion(email, env);
    if (retryResult.status === "found") {
      console.log("[Router] Region verified on retry:", retryResult.region);
      return true;
    }

    console.warn(
      "[Router] Region verification failed after retry, but registration was successful",
    );
    // Return true anyway since the POST was successful
    // The next page load should work
    return true;
  } catch (error) {
    console.error("[Router] Error registering region:", error);
    return false;
  }
}

async function getProductDetails(
  contentType: ContentType,
  contentId: number,
  regionId: number,
  env: Env,
) {
  try {
    const url = new URL(`${env.MEDIA_API_URL}/${contentType}/${contentId}`);
    url.searchParams.set("region_id", String(regionId));
    url.searchParams.set("api_version", "latest");
    url.searchParams.set("locale", "en-US");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json", "x-api-key": env.MEDIA_API_KEY },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { shopifyVariantId?: number };
    return data.shopifyVariantId ? { variantId: data.shopifyVariantId } : null;
  } catch {
    return null;
  }
}

async function getMembershipDetails(
  membershipId: MembershipId,
  billingPeriod: BillingPeriod,
  regionId: number,
  env: Env,
) {
  try {
    const url = new URL(`${env.MEDIA_API_URL}/memberships`);
    url.searchParams.set("region_id", String(regionId));
    url.searchParams.set("api_version", "latest");
    url.searchParams.set("locale", "en-US");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json", "x-api-key": env.MEDIA_API_KEY },
    });

    if (!response.ok) return null;

    interface Membership {
      id: string;
      shopifyVariantIdMonthly: number;
      shopifyVariantIdYearly: number;
      shopifySellingPlanIdMonthly: number;
      shopifySellingPlanIdYearly: number;
    }

    const data = (await response.json()) as { memberships?: Membership[] };
    const membership = data.memberships?.find((m) => m.id === membershipId);

    if (!membership) return null;

    const isYearly = billingPeriod === "yearly";
    return {
      variantId: isYearly
        ? membership.shopifyVariantIdYearly
        : membership.shopifyVariantIdMonthly,
      sellingPlanId: isYearly
        ? membership.shopifySellingPlanIdYearly
        : membership.shopifySellingPlanIdMonthly,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// URL BUILDERS
// =============================================================================

interface CartContext {
  get: () => Promise<{
    lines?: { nodes: Array<{ id: string }> };
    checkoutUrl?: string;
  } | null>;
  removeLines: (
    lineIds: string[],
  ) => Promise<{ cart?: { checkoutUrl?: string } }>;
  addLines: (
    lines: Array<{
      merchandiseId: string;
      quantity: number;
      sellingPlanId?: string;
    }>,
  ) => Promise<{ cart?: { checkoutUrl?: string } }>;
}

async function buildRedirectUrl(
  region: Region,
  params: RouterParams,
  env: Env,
  cart?: CartContext,
  appOrigin?: string,
  userEmail?: string,
): Promise<string> {
  const store = getStoreConfig(region);
  const baseUrl = store.url;
  // Use provided origin or fallback to production
  const origin = appOrigin || "https://bhakti.plus";

  // Login intent → back to main app
  if (params.intent === "login") {
    return `${origin}${params.returnTo || "/my"}`;
  }

  // Catalog intent → catalog page
  if (params.intent === "catalog") {
    return `${origin}/catalog`;
  }

  // For EU with cart context: create checkout directly via Hydrogen
  if (region === "EU" && cart) {
    // Product intent
    if (params.intent === "product" && params.contentType && params.contentId) {
      const product = await getProductDetails(
        params.contentType,
        params.contentId,
        store.regionId,
        env,
      );

      if (product?.variantId) {
        try {
          // Clear cart
          const currentCart = await cart.get();
          if (currentCart?.lines?.nodes?.length) {
            await cart.removeLines(currentCart.lines.nodes.map((l) => l.id));
          }

          // Add product and get checkout URL
          const result = await cart.addLines([
            {
              merchandiseId: `gid://shopify/ProductVariant/${product.variantId}`,
              quantity: 1,
            },
          ]);

          if (result?.cart?.checkoutUrl) {
            console.log(
              "[Router] EU checkout URL from cart:",
              result.cart.checkoutUrl,
            );
            return result.cart.checkoutUrl;
          }
        } catch (error) {
          console.error("[Router] Error creating EU checkout:", error);
        }
      }
    }

    // Subscribe intent
    if (params.intent === "subscribe" && params.membershipId) {
      console.log(
        "[Router] Subscribe intent - looking up membership:",
        params.membershipId,
        params.billingPeriod,
      );
      const membership = await getMembershipDetails(
        params.membershipId,
        params.billingPeriod || "monthly",
        store.regionId,
        env,
      );
      console.log("[Router] Membership details:", membership);

      if (membership?.variantId && membership?.sellingPlanId) {
        try {
          // Clear cart
          const currentCart = await cart.get();
          console.log(
            "[Router] Current cart lines:",
            currentCart?.lines?.nodes?.length || 0,
          );
          if (currentCart?.lines?.nodes?.length) {
            await cart.removeLines(currentCart.lines.nodes.map((l) => l.id));
          }

          // Add subscription and get checkout URL
          console.log("[Router] Adding subscription to cart:", {
            variantId: membership.variantId,
            sellingPlanId: membership.sellingPlanId,
          });
          const result = await cart.addLines([
            {
              merchandiseId: `gid://shopify/ProductVariant/${membership.variantId}`,
              quantity: 1,
              sellingPlanId: `gid://shopify/SellingPlan/${membership.sellingPlanId}`,
            },
          ]);

          if (result?.cart?.checkoutUrl) {
            console.log(
              "[Router] EU checkout URL from cart:",
              result.cart.checkoutUrl,
            );
            return result.cart.checkoutUrl;
          } else {
            console.error(
              "[Router] No checkout URL in cart result:",
              JSON.stringify(result),
            );
            // Check for "already a member" error
            const userErrors = (
              result as {
                userErrors?: Array<{ message?: string; code?: string }>;
              }
            )?.userErrors;
            const alreadyMemberError = userErrors?.find(
              (e) =>
                e.message?.toLowerCase().includes("already a member") ||
                e.code === "VALIDATION_CUSTOM",
            );
            if (alreadyMemberError) {
              console.error(
                "[Router] Already a member error - user email:",
                userEmail,
                "error:",
                alreadyMemberError.message,
              );
              // Return special URL to indicate already subscribed
              const errorUrl = new URL(
                `${origin}/router?intent=error&code=already_subscribed&return_to=/account/membership`,
              );
              if (userEmail) {
                errorUrl.searchParams.set("cart_email", userEmail);
              }
              return errorUrl.toString();
            }
          }
        } catch (error) {
          console.error("[Router] Error creating EU checkout:", error);
        }
      } else {
        console.error(
          "[Router] Membership lookup failed or missing variantId/sellingPlanId",
        );
      }
    }
  }

  // US Store: Use /pages/addtemp
  if (region === "US") {
    // Product intent
    if (params.intent === "product" && params.contentType && params.contentId) {
      const product = await getProductDetails(
        params.contentType,
        params.contentId,
        store.regionId,
        env,
      );
      if (product?.variantId) {
        const routerUrl = `${CONFIG.stores.US.checkoutRouter}?variant=${product.variantId}&qty=1`;
        return `${baseUrl}${CONFIG.paths.login}?return_to=${encodeURIComponent(
          routerUrl,
        )}`;
      }
    }

    // Subscribe intent
    if (params.intent === "subscribe" && params.membershipId) {
      const membership = await getMembershipDetails(
        params.membershipId,
        params.billingPeriod || "monthly",
        store.regionId,
        env,
      );
      if (membership?.variantId && membership?.sellingPlanId) {
        const routerUrl = `${CONFIG.stores.US.checkoutRouter}?variant=${membership.variantId}&qty=1&plan=${membership.sellingPlanId}`;
        return `${baseUrl}${CONFIG.paths.login}?return_to=${encodeURIComponent(
          routerUrl,
        )}`;
      }
    }
  }

  // Fallback - for purchase intents (subscribe/product), go back to app; for others, use store
  if (params.intent === "subscribe" || params.intent === "product") {
    // Purchase failed - redirect to app membership page
    console.error(
      "[Router] Fallback triggered for purchase intent:",
      params.intent,
    );
    return `${origin}/my`;
  }

  // For login-type intents, go to returnTo or home
  return `${origin}${params.returnTo || "/my"}`;
}

// =============================================================================
// LOADER
// =============================================================================

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const referer = request.headers.get("referer") || undefined;

  // Parse parameters
  const params: RouterParams = {
    intent: (url.searchParams.get("intent") || "login") as Intent,
    returnTo: url.searchParams.get("return_to") || "/my",
    contentType: url.searchParams.get("content_type") as
      | ContentType
      | undefined,
    contentId: url.searchParams.get("content_id")
      ? parseInt(url.searchParams.get("content_id")!)
      : undefined,
    membershipId: url.searchParams.get("membership_id") as
      | MembershipId
      | undefined,
    billingPeriod: (url.searchParams.get("billing_period") ||
      "monthly") as BillingPeriod,
    // Membership operation parameters (all via GET)
    op: url.searchParams.get("op") as MembershipOp | undefined,
    tier: url.searchParams.get("tier") as MembershipId | undefined,
    billing: url.searchParams.get("billing") as BillingPeriod | undefined,
  };

  console.log("[Router] Request:", params);

  // Get authenticated user from middleware context
  // This respects LOADTEST_USER_EMAIL, debugTier overrides, and real Shopify auth
  const user = context.get(userContext);
  const email = user?.email || null;
  const shopifyCustomerId = user?.shopifyCustomerId || null;

  // Validate intent
  if (!ALLOWED_INTENTS.includes(params.intent)) {
    return { error: "Invalid intent" } satisfies LoaderData;
  }

  // ==========================================================================
  // ERROR INTENT: Display checkout/cart errors (no auth required)
  // ==========================================================================
  if (params.intent === "error") {
    const errorCode = (url.searchParams.get("code") || "unknown") as ErrorCode;
    const customMessage = url.searchParams.get("message") || undefined;
    const cartEmail = url.searchParams.get("cart_email") || undefined;
    const returnTo = params.returnTo || "/my";

    console.log("[Router] Error intent:", {
      errorCode,
      customMessage,
      cartEmail,
      returnTo,
    });

    return {
      action: "checkout_error",
      errorCode: ERROR_CODES[errorCode] ? errorCode : "unknown",
      returnTo,
      customMessage,
      cartEmail,
    } satisfies LoaderData;
  }

  // ==========================================================================
  // ACCOUNT INTENT: Redirect to user's account page based on region
  // Usage: /router?intent=account&return_to=/profile
  // EU users → account.bhakti.plus | US users → account-us.bhakti.plus
  // ==========================================================================
  if (params.intent === "account") {
    // If not logged in, redirect to login first
    if (!email) {
      console.log("[Router] Account intent: user not logged in");
      return { action: "need_login", params } satisfies LoaderData;
    }

    // Check user region
    const userInfo = await checkUserRegion(email, context.env);

    if (userInfo.status === "error") {
      console.error("[Router] Account intent: failed to check user region");
      return {
        action: "api_error",
        retryUrl: request.url,
      } satisfies LoaderData;
    }

    // Determine account URL based on region
    // Default to EU if user not found (new user)
    const region: Region = userInfo.status === "found" ? userInfo.region : "EU";
    const accountPath = params.returnTo || "/profile";

    // Build account URL based on region
    // EU: account.bhakti.plus | US: account-us.bhakti.plus
    const accountBaseUrl =
      region === "EU"
        ? "https://account.bhakti.plus"
        : "https://account-us.bhakti.plus";

    const accountUrl = `${accountBaseUrl}${accountPath}`;

    console.log(
      "[Router] Account intent: redirecting to",
      accountUrl,
      "for region",
      region,
    );

    return redirect(accountUrl);
  }

  // ==========================================================================
  // LOGOUT INTENT: Log out from BOTH stores (EU and US)
  // Usage: /router?intent=logout&return_to=/
  // Flow: EU logout → US store logout (if US user) → final redirect
  // ==========================================================================
  if (params.intent === "logout") {
    // Ensure HTTPS for ngrok URLs (local dev tunnels)
    let origin = url.origin;
    if (origin.includes("ngrok") && origin.startsWith("http:")) {
      origin = origin.replace("http:", "https:");
    }
    const returnTo = params.returnTo || "/";
    const finalRedirectUrl = `${origin}${returnTo}`;

    // Check if user is logged in (via middleware context)
    if (!user) {
      // Not logged in - nothing to logout, just redirect to destination
      console.log(
        "[Router] Logout: Not logged in, redirecting to:",
        finalRedirectUrl,
      );
      return redirect(finalRedirectUrl);
    }

    // Determine user region from userProfile context
    let userRegion: Region = "EU";
    const userProfile = context.get(userProfileContext);
    if (userProfile?.stampedRegionId === 2) {
      userRegion = "US";
    }

    console.log(
      "[Router] Logout: User region is",
      userRegion,
      "for email",
      email,
    );

    // Build the post-logout redirect URL
    // For US users, we chain to US store logout after EU logout
    // Note: Shopify new Customer Accounts logout URL is: /account/logout on the store domain
    let postLogoutRedirectUri: string;

    if (userRegion === "US") {
      // Chain: EU logout → US store logout → final destination
      // US store logout URL: us.bhakti.plus/account/logout
      const usLogoutUrl = `https://us.bhakti.plus/account/logout?return=${encodeURIComponent(
        `${origin}/`,
      )}`;
      postLogoutRedirectUri = usLogoutUrl;
      console.log(
        "[Router] Logout: US user - chaining to US store logout:",
        postLogoutRedirectUri,
      );
    } else {
      // EU user: just redirect to final destination after EU logout
      postLogoutRedirectUri = finalRedirectUrl;
      console.log(
        "[Router] Logout: EU user - redirecting to:",
        postLogoutRedirectUri,
      );
    }

    // Perform the EU store logout (clears Hydrogen session)
    return context.customerAccount.logout({
      postLogoutRedirectUri,
    });
  }

  // ==========================================================================
  // ORDERS INTENT: Fetch customer orders from the correct Shopify store
  // Usage: GET /router?intent=orders
  // Returns JSON with orders from user's billing store (EU or ROW)
  // ==========================================================================
  if (params.intent === "orders") {
    console.log("[Router] Orders intent");

    // Check if user is logged in (via middleware context)
    if (!email) {
      return Response.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Get user profile from middleware context to determine their billing store
    const userProfile = context.get(userProfileContext);
    const { countryCode } = context.get(localeContext);

    if (!userProfile) {
      console.log("[Router] Orders: No user profile found");
      return Response.json(
        { success: false, error: "User profile not found" },
        { status: 404 },
      );
    }

    // Get server store context with Admin API credentials
    const serverContext = getServerStoreContext(
      userProfile,
      context.env,
      countryCode,
    );

    if (!serverContext.billingCustomerId) {
      console.log(
        "[Router] Orders: No billing customer ID (user never subscribed)",
      );
      // Return empty orders for users who have never subscribed
      return Response.json({ success: true, orders: [] });
    }

    if (!serverContext.adminApiToken || !serverContext.storeDomain) {
      console.error(
        "[Router] Orders: Missing Admin API credentials for store:",
        serverContext.storeType,
      );
      return Response.json(
        { success: false, error: "Admin API not configured" },
        { status: 500 },
      );
    }

    try {
      // Query orders from the correct store using Admin API
      const orders = await fetchCustomerOrders(
        serverContext.billingCustomerId,
        serverContext.storeDomain,
        serverContext.adminApiToken,
      );

      console.log(
        "[Router] Orders: Fetched",
        orders.length,
        "orders from",
        serverContext.storeType,
        "store",
      );

      return Response.json({
        success: true,
        orders,
        storeType: serverContext.storeType,
      });
    } catch (error) {
      console.error("[Router] Orders: Error fetching orders:", error);
      return Response.json(
        { success: false, error: "Failed to fetch orders" },
        { status: 500 },
      );
    }
  }

  // ==========================================================================
  // MEMBERSHIP INTENT: ALL operations via GET
  // ==========================================================================
  if (params.intent === "membership") {
    // If op is missing or invalid, redirect to membership page (don't fall through to store redirect)
    if (!params.op || !MEMBERSHIP_OPS.includes(params.op)) {
      console.log(
        "[Router] Membership intent without valid op, redirecting to membership page",
      );
      const returnTo = params.returnTo || "/account/membership";
      return redirect(returnTo);
    }
  }

  if (
    params.intent === "membership" &&
    params.op &&
    MEMBERSHIP_OPS.includes(params.op)
  ) {
    console.log(
      `[Router] Membership ${params.op.toUpperCase()} operation (GET)`,
    );

    if (!email) {
      if (params.op === "get") {
        // Note: This endpoint is designed to be called via fetch() from the frontend
        // The JSON data will be extracted by the calling code
        return Response.json(
          { success: false, error: "Not authenticated" },
          { status: 401 },
        );
      }
      return { action: "need_login", params } satisfies LoaderData;
    }

    const returnTo = params.returnTo || "/account/membership";

    // For mutation operations (not 'get'), show a loading page first
    // This ensures the user sees visual feedback immediately instead of browser spinner
    const isConfirmed = url.searchParams.get("confirm") === "1";
    const isMutationOp = params.op !== "get";

    if (isMutationOp && !isConfirmed) {
      console.log("[Router] Showing processing page for", params.op);
      // Return a "processing" action - the component will auto-redirect with confirm=1
      return {
        action: "membership_processing",
        email,
        op: params.op,
        originalUrl: url.pathname + url.search,
      } satisfies LoaderData;
    }

    try {
      // Get user profile from Media API (source of truth for user data)
      console.log("[Router] Fetching user profile from Media API...");
      // Create a temporary API instance for the getUserProfile call
      // (getUserProfile doesn't need user-specific regionId - it fetches the profile which contains the regionId)
      const bootstrapApi = new BhaktiMargMediaApi({
        baseUrl: context.env.MEDIA_API_URL,
        apiKey: context.env.MEDIA_API_KEY,
        apiVersion: context.env.MEDIA_API_VERSION,
        locale: "en-US", // Doesn't matter for getUserProfile
        countryCode: "US",
        regionId: 1,
      });
      const userProfile = await bootstrapApi.user.getUserProfile({ email });

      console.log("[Router] User profile:", {
        subscriptionTier: userProfile.subscriptionTier,
        subscriptionBillingPeriod: userProfile.subscriptionBillingPeriod,
        shopifyCustomerId: userProfile.shopifyCustomerId,
        stampedRegionId: userProfile.stampedRegionId,
      });

      // Get the customer ID for Appstle (prefer from profile, fallback to Shopify auth)
      const billingCustomerId = userProfile.shopifyCustomerId
        ? String(userProfile.shopifyCustomerId)
        : shopifyCustomerId;

      // Determine region for API key
      const region: Region = userProfile.stampedRegionId === 1 ? "EU" : "US";
      const apiKey = getAppstleApiKey(context.env, region);

      // ========================================
      // OPERATION: GET (returns JSON)
      // ========================================
      if (params.op === "get") {
        // If no billing customer ID, user has never subscribed
        if (!billingCustomerId) {
          return Response.json({
            success: true,
            subscriptions: [],
            profile: {
              tier: userProfile.subscriptionTier || "unsubscribed",
              billingPeriod: userProfile.subscriptionBillingPeriod || null,
            },
          });
        }

        if (!apiKey) {
          console.error(
            "[Router] Appstle API key not configured for region:",
            region,
          );
          return Response.json({
            success: true,
            subscriptions: [],
            profile: {
              tier: userProfile.subscriptionTier || "unsubscribed",
              billingPeriod: userProfile.subscriptionBillingPeriod || null,
            },
          });
        }

        // Fetch subscriptions from Appstle (source of truth)
        console.log(
          "[Router] Fetching subscriptions from Appstle for customer:",
          billingCustomerId,
        );
        const customerData = await getCustomerSubscriptions(
          billingCustomerId,
          apiKey,
        );

        const subscriptions: MembershipSubscription[] = [];
        const contracts = customerData.subscriptionContracts?.nodes || [];

        console.log("[Router] Appstle returned", contracts.length, "contracts");

        for (const contract of contracts) {
          const transformed = transformSubscription(contract);
          if (transformed) {
            subscriptions.push(transformed);
          }
        }

        return Response.json({
          success: true,
          subscriptions,
          profile: {
            tier: userProfile.subscriptionTier || "unsubscribed",
            billingPeriod: userProfile.subscriptionBillingPeriod || null,
          },
        });
      }

      // ========================================
      // MUTATIONS: update, cancel, reactivate
      // All require API key and subscription
      // ========================================
      if (!apiKey) {
        console.error(
          "[Router] Appstle API key not configured for region:",
          region,
        );
        return {
          action: "membership_result",
          result: {
            success: false,
            operation: "upgrade",
            message: "Service configuration error. Please try again later.",
            needsContact: false,
            returnTo,
            email,
          },
        } satisfies LoaderData;
      }

      if (!billingCustomerId) {
        return {
          action: "membership_result",
          result: {
            success: false,
            operation: "upgrade",
            message: "No active subscription found.",
            needsContact: false,
            returnTo,
            email,
          },
        } satisfies LoaderData;
      }

      // Fetch fresh subscription data from Appstle (source of truth)
      console.log("[Router] Fetching customer subscriptions from Appstle...");
      const customerData = await getCustomerSubscriptions(
        billingCustomerId,
        apiKey,
      );

      // Get the active subscription (from shopifySubscriptionContractId or first active)
      let subscriptionId = userProfile.shopifySubscriptionContractId
        ? String(userProfile.shopifySubscriptionContractId)
        : null;

      // Find subscription in Appstle data
      const subscription = subscriptionId
        ? findSubscriptionById(customerData, subscriptionId)
        : findActiveSubscription(customerData);

      if (!subscription) {
        console.error("[Router] No active subscription found");
        return {
          action: "membership_result",
          result: {
            success: false,
            operation: "upgrade",
            message: "No active subscription found.",
            needsContact: false,
            returnTo,
            email,
          },
        } satisfies LoaderData;
      }

      // Use the actual subscription ID from Appstle
      subscriptionId = subscription.id.split("/").pop() || subscription.id;

      const currentLine = subscription.lines?.nodes?.[0];
      if (!currentLine) {
        return {
          action: "membership_result",
          result: {
            success: false,
            operation: "upgrade",
            message: "Subscription data error. Please contact support.",
            needsContact: true,
            returnTo,
            email,
          },
        } satisfies LoaderData;
      }

      // Get current tier info
      const currentVariantId =
        currentLine.variantId.split("/").pop() || currentLine.variantId;
      const currentTierInfo = getTierFromVariantId(currentVariantId);

      console.log("[Router] Current subscription:", {
        id: subscriptionId,
        status: subscription.status,
        tier: currentTierInfo?.tier,
        billing: currentTierInfo?.billing,
      });

      // ========================================
      // OPERATION: UPDATE (upgrade/downgrade)
      // ========================================
      if (params.op === "update") {
        const targetTier = params.tier;

        if (!targetTier || !MEMBERSHIP_IDS.includes(targetTier)) {
          return {
            action: "membership_result",
            result: {
              success: false,
              operation: "upgrade",
              message:
                "Please specify a valid target tier (live, premium, or supporter).",
              needsContact: false,
              returnTo,
              email,
            },
          } satisfies LoaderData;
        }

        // Get target billing period: use specified billing or keep current
        const currentBilling = currentTierInfo?.billing || "monthly";
        const targetBilling =
          params.billing && BILLING_PERIODS.includes(params.billing)
            ? params.billing
            : currentBilling;

        // Determine if this is a billing period change only
        const isBillingChangeOnly =
          currentTierInfo?.tier === targetTier &&
          currentBilling !== targetBilling;

        // Get the variant ID for the target tier and billing
        const newVariantId = getVariantIdForTier(
          targetTier,
          region,
          targetBilling,
        );

        if (!newVariantId) {
          return {
            action: "membership_result",
            result: {
              success: false,
              operation: "upgrade",
              message: "Invalid target plan configuration.",
              needsContact: true,
              returnTo,
              email,
            },
          } satisfies LoaderData;
        }

        console.log("[Router] Plan change request:", {
          from: currentTierInfo?.tier,
          fromBilling: currentBilling,
          to: targetTier,
          toBilling: targetBilling,
          isBillingChangeOnly,
          newVariantId,
        });

        const changeType = getChangeType(
          currentTierInfo?.tier || "unsubscribed",
          targetTier as SubscriptionTier,
        );
        console.log("[Router] Change type:", changeType);

        // Check for forbidden billing period change (yearly -> monthly)
        if (isBillingChangeForbidden(currentBilling, targetBilling)) {
          console.log(
            "[Router] Billing change forbidden (yearly -> monthly) - manual support required",
          );

          void logAction(
            {
              email,
              intent: "membership",
              action_type: "membership_forbidden",
              membership_operation: "billing_change",
              from_tier: currentTierInfo?.tier,
              to_tier: targetTier,
              from_billing: currentBilling,
              to_billing: targetBilling,
              reason: "yearly_to_monthly",
            },
            context.env,
          );

          return {
            action: "membership_result",
            result: {
              success: false,
              operation: "downgrade",
              message:
                "Switching from yearly to monthly billing requires contacting our support team. Please email support@bhakti.plus and we'll help you with your request.",
              needsContact: true,
              returnTo,
              email,
              fromTier: currentTierInfo?.tier,
              toTier: targetTier as SubscriptionTier,
            },
          } satisfies LoaderData;
        }

        // Check for forbidden downgrade (only applies to tier changes, not billing period changes)
        if (
          changeType === "downgrade" &&
          currentTierInfo &&
          !isBillingChangeOnly
        ) {
          if (
            isDowngradeForbidden(
              currentTierInfo.tier,
              currentTierInfo.billing,
              targetTier as SubscriptionTier,
              targetBilling,
            )
          ) {
            console.log(
              "[Router] Downgrade forbidden - manual support required",
            );

            void logAction(
              {
                email,
                intent: "membership",
                action_type: "membership_forbidden",
                membership_operation: "downgrade",
                from_tier: currentTierInfo.tier,
                to_tier: targetTier,
                from_billing: currentTierInfo.billing,
                reason: "tier_downgrade_forbidden",
              },
              context.env,
            );

            return {
              action: "membership_result",
              result: {
                success: false,
                operation: "downgrade",
                message:
                  "This plan change requires contacting our support team. Please email support@bhakti.plus and we'll help you with your request.",
                needsContact: true,
                returnTo,
                email,
                fromTier: currentTierInfo.tier,
                toTier: targetTier as SubscriptionTier,
              },
            } satisfies LoaderData;
          }
        }

        // Check if already on exact same plan (tier + billing)
        if (
          currentTierInfo?.tier === targetTier &&
          currentBilling === targetBilling
        ) {
          console.log(
            "[Router] Already on target tier and billing, no change needed",
          );
          return {
            action: "membership_result",
            result: {
              success: true,
              operation: changeType as "upgrade" | "downgrade",
              message: `You're already on the ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)
                } ${targetBilling} plan.`,
              needsContact: false,
              alreadyOnPlan: true,
              returnTo,
              email,
              fromTier: currentTierInfo.tier,
              toTier: targetTier as SubscriptionTier,
              billing: extractBillingInfo(subscription),
            },
          } satisfies LoaderData;
        }

        // Perform the update via Appstle
        // Note: lineId can be a UUID (e.g., "31d712a5-f66d-417e-884c-fd415c4bbd89") or GID format
        const lineId = currentLine.id.includes("/")
          ? currentLine.id.split("/").pop() || currentLine.id
          : currentLine.id;

        const isDowngrade = changeType === "downgrade";
        let result: { success: boolean; message: string };
        let isScheduledDowngrade = false;

        // For downgrades: schedule for end of billing period
        // For upgrades: immediate change with proration
        if (isDowngrade && !isBillingChangeOnly) {
          console.log(
            "[Router] Scheduling downgrade for end of billing period:",
            {
              contractId: subscriptionId,
              lineId,
              oldVariantId: currentVariantId,
              newVariantId,
            },
          );

          result = await scheduleSubscriptionDowngrade(
            subscriptionId,
            lineId,
            currentVariantId,
            newVariantId,
            apiKey,
          );
          isScheduledDowngrade = result.success;
        } else {
          console.log(
            "[Router] Calling Appstle updateSubscriptionVariant with:",
            {
              contractId: subscriptionId,
              lineId,
              oldVariantId: currentVariantId,
              newVariantId,
              skipBilling: false,
            },
          );

          result = await updateSubscriptionVariant(
            subscriptionId,
            lineId,
            currentVariantId,
            newVariantId,
            apiKey,
            false, // skipBilling: false for immediate changes
          );
        }

        console.log("[Router] Appstle update result:", result);

        // Get updated billing info (re-fetch for accurate data after update)
        // Appstle API returns empty response on success, so we need to verify by fetching again
        let updatedBilling: MembershipOperationResult["billing"] | undefined;
        let verifiedSuccess = result.success;

        if (result.success && !isScheduledDowngrade) {
          // Only verify immediate changes, not scheduled downgrades
          try {
            // Small delay to allow API to propagate changes
            await new Promise((resolve) => setTimeout(resolve, 500));

            const updatedData = await getCustomerSubscriptions(
              billingCustomerId,
              apiKey,
            );
            const updatedSub = findSubscriptionById(
              updatedData,
              subscriptionId,
            );

            if (updatedSub) {
              updatedBilling = extractBillingInfo(updatedSub);

              // Verify the variant actually changed
              const updatedLine = updatedSub.lines?.nodes?.[0];
              if (updatedLine) {
                const updatedVariantId =
                  updatedLine.variantId.split("/").pop() ||
                  updatedLine.variantId;
                if (updatedVariantId === newVariantId) {
                  console.log(
                    "[Router] Verified: variant updated successfully to",
                    newVariantId,
                  );
                  console.log(
                    "[Router] New price:",
                    updatedBilling?.amount,
                    updatedBilling?.currencyCode,
                  );
                } else {
                  console.warn(
                    "[Router] Warning: variant may not have updated. Current:",
                    updatedVariantId,
                    "Expected:",
                    newVariantId,
                  );
                  // Still consider it a success if API returned OK, as propagation may be delayed
                }
              }
            }
          } catch (e) {
            console.warn("[Router] Could not fetch updated billing info:", e);
            // Fallback to original subscription data
            updatedBilling = extractBillingInfo(subscription);
          }
        } else if (result.success && isScheduledDowngrade) {
          // For scheduled downgrades, use current billing info (the downgrade hasn't happened yet)
          updatedBilling = extractBillingInfo(subscription);
        }

        // Build success message based on what changed
        let successMessage: string;
        if (isScheduledDowngrade) {
          successMessage = `Your downgrade to ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)
            } has been scheduled. It will take effect at the end of your current billing period.`;
        } else if (isBillingChangeOnly) {
          successMessage = `Your billing has been changed to ${targetBilling}!`;
        } else if (currentBilling !== targetBilling) {
          successMessage = `Your plan has been ${changeType === "upgrade" ? "upgraded" : "changed"
            } to ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)
            } ${targetBilling}!`;
        } else {
          successMessage = `Your plan has been successfully ${changeType === "upgrade" ? "upgraded" : "changed"
            } to ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)}!`;
        }

        // Log membership update
        void logAction(
          {
            email,
            intent: "membership",
            action_type: verifiedSuccess
              ? "membership_update_success"
              : "membership_update_failed",
            membership_operation: changeType,
            from_tier: currentTierInfo?.tier,
            to_tier: targetTier,
            from_billing: currentBilling,
            to_billing: targetBilling,
          },
          context.env,
        );

        return {
          action: "membership_result",
          result: {
            success: verifiedSuccess,
            operation: isBillingChangeOnly
              ? "upgrade"
              : (changeType as "upgrade" | "downgrade"),
            message: verifiedSuccess
              ? successMessage
              : `We couldn't update your plan. ${result.message}`,
            needsContact: false,
            returnTo,
            email,
            fromTier: currentTierInfo?.tier,
            toTier: targetTier as SubscriptionTier,
            billing: updatedBilling,
          },
        } satisfies LoaderData;
      }

      // ========================================
      // OPERATION: CANCEL
      // ========================================
      if (params.op === "cancel") {
        console.log("[Router] Calling Appstle cancelSubscription...");
        const result = await cancelSubscription(subscriptionId, apiKey);

        console.log("[Router] Appstle cancel result:", result);

        // Get end date from subscription data
        let accessEndDate: string | undefined;
        let cancelBilling: MembershipOperationResult["billing"] | undefined;

        if (result.success) {
          try {
            // Small delay to allow API to propagate
            await new Promise((resolve) => setTimeout(resolve, 500));

            const updatedData = await getCustomerSubscriptions(
              billingCustomerId,
              apiKey,
            );
            const updatedSub = findSubscriptionById(
              updatedData,
              subscriptionId,
            );

            if (updatedSub) {
              // nextBillingDate is the end of the current billing period
              accessEndDate = updatedSub.nextBillingDate;
              console.log("[Router] Access ends on:", accessEndDate);

              cancelBilling = extractBillingInfo(updatedSub);
            }
          } catch (err) {
            console.warn(
              "[Router] Could not fetch updated subscription after cancel:",
              err,
            );
          }
        }

        // Format the end date for display
        const formattedEndDate = accessEndDate
          ? new Date(accessEndDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
          : null;

        // Log cancellation
        void logAction(
          {
            email,
            intent: "membership",
            action_type: result.success
              ? "membership_cancel_success"
              : "membership_cancel_failed",
            membership_operation: "cancel",
            from_tier: currentTierInfo?.tier,
            access_end_date: accessEndDate,
          },
          context.env,
        );

        return {
          action: "membership_result",
          result: {
            success: result.success,
            operation: "cancel",
            message: result.success
              ? formattedEndDate
                ? `Your subscription has been cancelled. You'll continue to have access until ${formattedEndDate}.`
                : "Your subscription has been cancelled. You'll continue to have access until the end of your current billing period."
              : `We couldn't cancel your subscription. ${result.message}`,
            needsContact: false,
            returnTo,
            email,
            fromTier: currentTierInfo?.tier,
            billing: cancelBilling,
          },
        } satisfies LoaderData;
      }

      // ========================================
      // OPERATION: PAUSE
      // ========================================
      if (params.op === "pause") {
        // Check if subscription is active (can only pause active subscriptions)
        if (subscription.status !== "ACTIVE") {
          console.log(
            "[Router] Cannot pause - subscription is not active:",
            subscription.status,
          );
          return {
            action: "membership_result",
            result: {
              success: false,
              operation: "pause",
              message: `Only active subscriptions can be paused. Your subscription is currently ${subscription.status.toLowerCase()}.`,
              needsContact: false,
              returnTo,
              email,
              fromTier: currentTierInfo?.tier,
            },
          } satisfies LoaderData;
        }

        console.log(
          "[Router] Calling Appstle pauseSubscription for contract:",
          subscriptionId,
        );
        const result = await pauseSubscription(subscriptionId, apiKey);

        console.log("[Router] Appstle pause result:", result);

        // Verify and get updated billing info
        let pausedBilling: MembershipOperationResult["billing"] | undefined;
        let verifiedPause = result.success;

        if (result.success) {
          try {
            // Small delay to allow API to propagate
            await new Promise((resolve) => setTimeout(resolve, 500));

            const updatedData = await getCustomerSubscriptions(
              billingCustomerId,
              apiKey,
            );
            const updatedSub = findSubscriptionById(
              updatedData,
              subscriptionId,
            );

            if (updatedSub) {
              pausedBilling = extractBillingInfo(updatedSub);

              if (updatedSub.status === "PAUSED") {
                console.log("[Router] Verified: subscription is now PAUSED");
              } else {
                console.warn(
                  "[Router] Warning: status is",
                  updatedSub.status,
                  "expected PAUSED",
                );
              }
            }
          } catch (e) {
            console.warn("[Router] Could not verify pause status:", e);
            pausedBilling = extractBillingInfo(subscription);
          }
        }

        // Log pause
        void logAction(
          {
            email,
            intent: "membership",
            action_type: verifiedPause
              ? "membership_pause_success"
              : "membership_pause_failed",
            membership_operation: "pause",
            from_tier: currentTierInfo?.tier,
          },
          context.env,
        );

        return {
          action: "membership_result",
          result: {
            success: verifiedPause,
            operation: "pause",
            message: verifiedPause
              ? "Your subscription has been paused. You can reactivate it at any time."
              : `We couldn't pause your subscription. ${result.message}`,
            needsContact: false,
            returnTo,
            email,
            fromTier: currentTierInfo?.tier,
            billing: pausedBilling,
          },
        } satisfies LoaderData;
      }

      // ========================================
      // OPERATION: REACTIVATE
      // Can reactivate PAUSED subscriptions always, or CANCELLED subscriptions
      // only if nextBillingDate is in the future (grace period)
      // ========================================
      if (params.op === "reactivate") {
        // Check if subscription can be reactivated
        // PAUSED: always can reactivate
        // CANCELLED: only if nextBillingDate is in the future (grace period)
        const isPaused = subscription.status === "PAUSED";
        const isCancelledInGracePeriod =
          subscription.status === "CANCELLED" &&
          subscription.nextBillingDate &&
          new Date(subscription.nextBillingDate) > new Date();

        const canReactivate = isPaused || isCancelledInGracePeriod;

        if (!canReactivate) {
          console.log(
            "[Router] Cannot reactivate - subscription status:",
            subscription.status,
            "nextBillingDate:",
            subscription.nextBillingDate,
          );

          if (subscription.status === "ACTIVE") {
            return {
              action: "membership_result",
              result: {
                success: true,
                operation: "reactivate",
                message: "Your subscription is already active!",
                needsContact: false,
                returnTo,
                email,
                fromTier: currentTierInfo?.tier,
                billing: extractBillingInfo(subscription),
              },
            } satisfies LoaderData;
          }

          // CANCELLED but past grace period - must re-subscribe
          if (subscription.status === "CANCELLED") {
            return {
              action: "membership_result",
              result: {
                success: false,
                operation: "reactivate",
                message:
                  "Your subscription has expired and cannot be reactivated. Please subscribe again to continue.",
                needsContact: false,
                returnTo,
                email,
                fromTier: currentTierInfo?.tier,
              },
            } satisfies LoaderData;
          }

          return {
            action: "membership_result",
            result: {
              success: false,
              operation: "reactivate",
              message: `Cannot reactivate subscription with status "${subscription.status.toLowerCase()}". Please contact support.`,
              needsContact: true,
              returnTo,
              email,
              fromTier: currentTierInfo?.tier,
            },
          } satisfies LoaderData;
        }

        console.log(
          "[Router] Calling Appstle reactivateSubscription for contract:",
          subscriptionId,
          "from status:",
          subscription.status,
        );
        const result = await reactivateSubscription(subscriptionId, apiKey);

        console.log("[Router] Appstle reactivate result:", result);

        // Verify and get fresh billing info after reactivation
        let reactivatedBilling:
          | MembershipOperationResult["billing"]
          | undefined;
        let verifiedReactivate = result.success;

        if (result.success) {
          try {
            // Small delay to allow API to propagate
            await new Promise((resolve) => setTimeout(resolve, 500));

            const updatedData = await getCustomerSubscriptions(
              billingCustomerId,
              apiKey,
            );
            const updatedSub = findSubscriptionById(
              updatedData,
              subscriptionId,
            );

            if (updatedSub) {
              reactivatedBilling = extractBillingInfo(updatedSub);

              if (updatedSub.status === "ACTIVE") {
                console.log("[Router] Verified: subscription is now ACTIVE");
                console.log(
                  "[Router] Next billing:",
                  reactivatedBilling?.nextBillingDate,
                );
              } else {
                console.warn(
                  "[Router] Warning: status is",
                  updatedSub.status,
                  "expected ACTIVE",
                );
              }
            }
          } catch (e) {
            console.warn("[Router] Could not verify reactivation status:", e);
            reactivatedBilling = extractBillingInfo(subscription);
          }
        }

        // Log reactivation
        void logAction(
          {
            email,
            intent: "membership",
            action_type: verifiedReactivate
              ? "membership_reactivate_success"
              : "membership_reactivate_failed",
            membership_operation: "reactivate",
            from_tier: currentTierInfo?.tier,
            previous_status: subscription.status,
          },
          context.env,
        );

        return {
          action: "membership_result",
          result: {
            success: verifiedReactivate,
            operation: "reactivate",
            message: verifiedReactivate
              ? "Your subscription has been reactivated! Welcome back."
              : `We couldn't reactivate your subscription. ${result.message}`,
            needsContact: false,
            returnTo,
            email,
            fromTier: currentTierInfo?.tier,
            billing: reactivatedBilling,
          },
        } satisfies LoaderData;
      }

      // ========================================
      // OPERATION: CANCEL_DOWNGRADE
      // Cancel a scheduled pending downgrade
      // ========================================
      if (params.op === "cancel_downgrade") {
        console.log(
          "[Router] Cancelling pending downgrade for contract:",
          subscriptionId,
        );

        const result = await cancelPendingDowngrade(subscriptionId, apiKey);

        console.log("[Router] Cancel pending downgrade result:", result);

        // Log the action
        void logAction(
          {
            email,
            intent: "membership",
            action_type: result.success
              ? "membership_cancel_downgrade_success"
              : "membership_cancel_downgrade_failed",
            membership_operation: "cancel_downgrade",
            from_tier: currentTierInfo?.tier,
          },
          context.env,
        );

        return {
          action: "membership_result",
          result: {
            success: result.success,
            operation: "upgrade", // Use "upgrade" since we're keeping the higher tier
            message: result.success
              ? "Your scheduled downgrade has been cancelled. You will remain on your current plan."
              : `We couldn't cancel your scheduled downgrade. ${result.message}`,
            needsContact: !result.success,
            returnTo,
            email,
            fromTier: currentTierInfo?.tier,
            billing: extractBillingInfo(subscription),
          },
        } satisfies LoaderData;
      }

      // ========================================
      // OPERATION: UPDATE_PAYMENT
      // Redirect to account profile page to update payment method
      // ========================================
      if (params.op === "update_payment") {
        console.log(
          "[Router] Redirecting to profile page for payment update, region:",
          region,
        );

        // Build profile URL based on region
        // EU: account.bhakti.plus | US: account-us.bhakti.plus
        const profileUrl =
          region === "EU"
            ? "https://account.bhakti.plus/profile"
            : "https://account-us.bhakti.plus/profile";

        // Redirect to the profile page
        return redirect(profileUrl);
      }
    } catch (error) {
      console.error("[Router] Membership operation error:", error);

      if (params.op === "get") {
        return Response.json(
          { success: false, error: "Failed to fetch subscriptions" },
          { status: 500 },
        );
      }

      return {
        action: "membership_result",
        result: {
          success: false,
          operation: "upgrade",
          message: "An unexpected error occurred. Please try again later.",
          needsContact: false,
          returnTo: params.returnTo || "/account/membership",
          email: email || "",
        },
      } satisfies LoaderData;
    }
  }

  // No email → need login
  if (!email) {
    void logAction(
      {
        email: "anonymous",
        intent: params.intent,
        action_type: "need_login",
        return_to: params.returnTo,
        referer,
      },
      context.env,
    );
    return { action: "need_login", params } satisfies LoaderData;
  }

  // Check user region with retry for transient errors
  let userInfo = await checkUserRegion(email, context.env);

  // If error, retry once after a short delay (transient API issues)
  if (userInfo.status === "error") {
    console.log(
      "[Router] checkUserRegion returned error, retrying after 1s...",
    );
    await delay(1000);
    userInfo = await checkUserRegion(email, context.env);
  }

  if (userInfo.status === "error") {
    void logAction(
      {
        email,
        intent: params.intent,
        action_type: "api_error",
        error_message: "Failed to check user region",
        referer,
      },
      context.env,
    );
    return { action: "api_error", retryUrl: request.url } satisfies LoaderData;
  }

  if (userInfo.status === "found") {
    // Pass cart context for EU to create checkout directly
    const appOrigin = getAppOrigin(request);
    const redirectUrl = await buildRedirectUrl(
      userInfo.region,
      params,
      context.env,
      userInfo.region === "EU" ? context.cart : undefined,
      appOrigin,
      email,
    );
    void logAction(
      {
        email,
        intent: params.intent,
        action_type: "redirect",
        resolved_region: userInfo.region,
        redirect_url: redirectUrl,
        return_to: params.returnTo,
        was_new_user: false,
        membership_id: params.membershipId,
        billing_period: params.billingPeriod,
        content_type: params.contentType,
        content_id: params.contentId,
        referer,
      },
      context.env,
    );

    // Show redirect page for purchase intents
    if (params.intent === "subscribe" || params.intent === "product") {
      return {
        action: "redirecting",
        region: userInfo.region,
        redirectUrl,
        email,
      } satisfies LoaderData;
    }

    return redirect(redirectUrl);
  }

  // New user → country selection
  void logAction(
    {
      email,
      intent: params.intent,
      action_type: "need_country",
      return_to: params.returnTo,
      membership_id: params.membershipId,
      billing_period: params.billingPeriod,
      content_type: params.contentType,
      content_id: params.contentId,
      referer,
    },
    context.env,
  );
  return { action: "need_country", email, params } satisfies LoaderData;
}

// =============================================================================
// ACTION (Country Selection)
// =============================================================================

export async function action({ request, context }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const referer = request.headers.get("referer") || undefined;
  const contentType = request.headers.get("content-type") || "";

  // ==========================================================================
  // LOGOUT ACTION: Handle POST to /router?intent=logout
  // This allows forms to POST directly to the router for logout
  // ==========================================================================
  const intent = url.searchParams.get("intent");
  if (intent === "logout") {
    // Ensure HTTPS for ngrok URLs (local dev tunnels)
    let origin = url.origin;
    if (origin.includes("ngrok") && origin.startsWith("http:")) {
      origin = origin.replace("http:", "https:");
    }
    const returnTo = url.searchParams.get("return_to") || "/";
    const finalRedirectUrl = `${origin}${returnTo}`;

    // Check user region from middleware context
    const userProfile = context.get(userProfileContext);
    const isUSUser = userProfile?.stampedRegionId === 2;

    const postLogoutRedirectUri = isUSUser
      ? `https://us.bhakti.plus/account/logout?return=${encodeURIComponent(
        `${origin}/`,
      )}`
      : finalRedirectUrl;

    console.log("[Router Action] Logout:", { isUSUser, postLogoutRedirectUri });

    return context.customerAccount.logout({ postLogoutRedirectUri });
  }

  // Parse payload: support both form and JSON
  let payload: Record<string, string | undefined>;

  if (contentType.includes("application/json")) {
    try {
      payload = (await request.json()) as Record<string, string | undefined>;
    } catch {
      return Response.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 },
      );
    }
  } else {
    const formData = await request.formData();
    payload = Object.fromEntries(formData.entries()) as Record<
      string,
      string | undefined
    >;
  }

  // ==========================================================================
  // COUNTRY SELECTION FLOW (form submission)
  // Note: Membership operations are now ALL handled via GET in the loader
  // ==========================================================================
  const countryCodeField = payload.country_code as string;
  const emailField = payload.email as string;

  if (!countryCodeField || !emailField) {
    return { error: "Missing required fields" } satisfies LoaderData;
  }

  // Parse params from form
  const paramsFromForm: RouterParams = {
    intent: (payload.intent || "login") as Intent,
    returnTo: (payload.return_to as string) || "/my",
    contentType: payload.content_type as ContentType | undefined,
    contentId: payload.content_id
      ? parseInt(payload.content_id as string)
      : undefined,
    membershipId: payload.membership_id as MembershipId | undefined,
    billingPeriod: (payload.billing_period || "monthly") as BillingPeriod,
  };

  // Register user region
  await registerUserRegion(emailField, countryCodeField, context.env);

  const regionFromCountry = getRegionForCountry(countryCodeField);
  const appOrigin = getAppOrigin(request);
  // Pass cart context for EU to create checkout directly
  const redirectUrl = await buildRedirectUrl(
    regionFromCountry,
    paramsFromForm,
    context.env,
    regionFromCountry === "EU" ? context.cart : undefined,
    appOrigin,
    emailField,
  );

  void logAction(
    {
      email: emailField,
      intent: paramsFromForm.intent,
      action_type: "redirect",
      resolved_region: regionFromCountry,
      redirect_url: redirectUrl,
      return_to: paramsFromForm.returnTo,
      was_new_user: true,
      country_selected: countryCodeField,
      membership_id: paramsFromForm.membershipId,
      billing_period: paramsFromForm.billingPeriod,
      content_type: paramsFromForm.contentType,
      content_id: paramsFromForm.contentId,
      referer,
    },
    context.env,
  );

  // Show redirect page for purchase intents
  if (
    paramsFromForm.intent === "subscribe" ||
    paramsFromForm.intent === "product"
  ) {
    return {
      action: "redirecting",
      region: regionFromCountry,
      redirectUrl,
      email: emailField,
    } satisfies LoaderData;
  }

  return redirect(redirectUrl);
}

// =============================================================================
// REACT COMPONENTS
// =============================================================================

/**
 * White lotus icon (matching welcome page)
 */
function LotusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Bhakti+ Lotus</title>
      <path
        d="M16.9007 9.57781C16.9007 12.5336 15.1828 15.0599 13.8691 16.5757C15.587 16.4494 18.1891 15.9441 19.907 14.2262C21.8776 12.2557 22.2312 9.12307 22.2818 7.48096C22.2818 7.2536 22.1049 7.07675 21.9028 7.10202C20.6649 7.12728 18.5681 7.35465 16.7744 8.31465C16.8502 8.71886 16.9007 9.14833 16.9007 9.57781Z"
        fill="white"
      />
      <path
        d="M11.6973 3.13597C10.5605 4.32334 8.61523 6.79913 8.61523 9.57808C8.61523 12.357 10.5858 14.8328 11.6973 16.0454C11.8489 16.197 12.1016 16.197 12.2531 16.0454C13.39 14.8581 15.3352 12.357 15.3352 9.57808C15.3352 6.79913 13.3647 4.32334 12.2531 3.11071C12.1016 2.95913 11.8489 2.95913 11.6973 3.13597Z"
        fill="white"
      />
      <path
        d="M10.0791 16.5761C8.79068 15.0856 7.04752 12.534 7.04752 9.5782C7.04752 9.12346 7.09805 8.69399 7.17384 8.28978C5.38015 7.32978 3.28331 7.12767 2.04542 7.07715C1.81805 7.07715 1.64121 7.25399 1.66647 7.4561C1.717 9.0982 2.07068 12.2308 4.04121 14.2014C5.7591 15.9445 8.33594 16.4498 10.0791 16.5761Z"
        fill="white"
      />
      <path
        d="M21.0695 15C21.0442 15.0253 21.0189 15.0505 20.9937 15.0758C18.4674 17.6274 14.5263 17.9305 12.7832 17.9305C12.3537 17.9305 11.5958 17.9305 11.1663 17.9305C9.44842 17.9305 5.50737 17.6274 2.95579 15.0758C2.93053 15.0505 2.93053 15.0253 2.90526 15.0253C1.03579 15.6821 0 16.4653 0 17.1221C0 18.5116 4.67368 20.5326 12 20.5326C19.3263 20.5326 24 18.5116 24 17.1221C24 16.4653 22.9389 15.6568 21.0695 15Z"
        fill="white"
      />
    </svg>
  );
}

/**
 * Header component with logo and gold line
 */
function RouterHeader() {
  return (
    <header className="router-header">
      <img src={imageLogo} alt="Bhakti+" className="router-logo" />
      <div className="router-header-line" />
    </header>
  );
}

/**
 * Loading overlay for long operations (Appstle API can take 10-15s)
 */
function LoadingOverlay({ message }: { message?: string }) {
  const { strings } = useTranslations();
  const displayMessage = message || strings.router_loading_processing;
  return (
    <>
      <style>{`
        @keyframes router-overlay-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes router-overlay-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            border: "3px solid rgba(255, 255, 255, 0.1)",
            borderTopColor: "#C9A227",
            borderRadius: "50%",
            animation: "router-overlay-spin 1s linear infinite",
            marginBottom: "1.5rem",
          }}
        />
        <p
          style={{
            color: "#fff",
            fontSize: "1.125rem",
            textAlign: "center",
            maxWidth: "300px",
            fontWeight: 500,
          }}
        >
          {displayMessage}
        </p>
        <p
          style={{
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "0.875rem",
            marginTop: "0.75rem",
            animation: "router-overlay-pulse 2s ease-in-out infinite",
          }}
        >
          {strings.router_loading_wait}
        </p>
      </div>
    </>
  );
}

/**
 * Processing page for membership operations
 * Shows a loading state immediately, then triggers the actual operation
 */
function MembershipProcessingPage({
  email,
  op,
  originalUrl,
}: {
  email: string;
  op: MembershipOp;
  originalUrl: string;
}) {
  const { strings } = useTranslations();

  useEffect(() => {
    // Add confirm=1 to trigger the actual operation
    const separator = originalUrl.includes("?") ? "&" : "?";
    const confirmUrl = `${originalUrl}${separator}confirm=1`;

    // Small delay to ensure the loading UI is visible
    const timer = setTimeout(() => {
      window.location.href = confirmUrl;
    }, 100);

    return () => clearTimeout(timer);
  }, [originalUrl]);

  const getOperationMessage = () => {
    switch (op) {
      case "update":
        return strings.router_loading_updating;
      case "cancel":
        return strings.router_loading_cancelling;
      case "pause":
        return strings.router_loading_pausing;
      case "reactivate":
        return strings.router_loading_reactivating;
      case "update_payment":
        return strings.router_loading_payment_redirect;
      default:
        return strings.router_loading_processing;
    }
  };

  return (
    <>
      <style>{`
        @keyframes processing-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes processing-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes processing-dots {
          0%, 20% { content: '.'; }
          40% { content: '..'; }
          60%, 100% { content: '...'; }
        }
        .processing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: #fff;
        }
        .processing-spinner {
          width: 80px;
          height: 80px;
          border: 4px solid rgba(201, 162, 39, 0.2);
          border-top-color: #C9A227;
          border-radius: 50%;
          animation: processing-spin 1s linear infinite;
          margin-bottom: 2rem;
        }
        .processing-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          text-align: center;
        }
        .processing-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9375rem;
          animation: processing-pulse 2s ease-in-out infinite;
          text-align: center;
        }
        .processing-email {
          margin-top: 2rem;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
        }
      `}</style>
      <div className="processing-page">
        <div className="processing-spinner" />
        <h1 className="processing-title">{getOperationMessage()}</h1>
        <p className="processing-subtitle">{strings.router_loading_wait}</p>
        <div className="processing-email">{email}</div>
      </div>
    </>
  );
}

// Loading steps component
function LoadingSteps({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="router-steps">
      {steps.map((step, index) => (
        <div
          key={step}
          className={`router-step ${index < currentStep
              ? "completed"
              : index === currentStep
                ? "active"
                : "pending"
            }`}
        >
          <span className="router-step-icon">
            {index < currentStep ? "✓" : index === currentStep ? "●" : "○"}
          </span>
          <span className="router-step-text">{step}</span>
        </div>
      ))}
    </div>
  );
}

// Redirect page with progress
function RedirectingPage({
  region,
  redirectUrl,
  email,
}: {
  region: Region;
  redirectUrl: string;
  email: string;
}) {
  const { strings } = useTranslations();
  const [currentStep, setCurrentStep] = useState(0);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const steps = [
    strings.router_step_checking_account,
    strings.router_step_determining_region,
    strings.router_step_preparing_checkout,
    `Redirecting to ${region} Store`,
  ];

  useEffect(() => {
    // Animate through steps (cart is already cleared server-side for EU)
    const timers = [
      setTimeout(() => setCurrentStep(1), 500),
      setTimeout(() => setCurrentStep(2), 1000),
      setTimeout(() => setCurrentStep(3), 1500),
      setTimeout(() => setShouldRedirect(true), 2500),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = redirectUrl;
    }
  }, [shouldRedirect, redirectUrl]);

  return (
    <div className="router-page">
      <RouterHeader />

      <main className="router-main">
        <LotusIcon className="router-lotus" />

        <h1 className="router-title">{strings.router_checkout_preparing}</h1>
        <p className="router-subtitle">{strings.router_checkout_wait}</p>

        <p
          className="router-email"
          style={{
            fontSize: "0.875rem",
            color: "rgba(255,255,255,0.7)",
            marginBottom: "1.5rem",
          }}
        >
          {email}
        </p>

        <LoadingSteps steps={steps} currentStep={currentStep} />

        <p className="router-note">
          {region === "US"
            ? strings.router_redirect_us_store
            : strings.router_redirect_checkout}
        </p>

        <a href={redirectUrl} className="router-btn router-btn--tertiary">
          {strings.router_continue_checkout}
        </a>
      </main>
    </div>
  );
}

// Membership operation result page
function MembershipResultPage({
  result,
}: {
  result: MembershipOperationResult;
}) {
  const { strings } = useTranslations();
  const {
    success,
    message,
    needsContact,
    returnTo,
    email,
    operation,
    fromTier,
    toTier,
    billing,
    alreadyOnPlan,
  } = result;

  // Format next billing date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Format currency
  const formatAmount = (amount: string, currency: string) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(parseFloat(amount));
    } catch {
      return `${currency} ${amount}`;
    }
  };

  // Determine icon and colors based on result
  const isSuccess = success && !needsContact;

  return (
    <div className="router-page">
      <RouterHeader />

      <main className="router-main">
        {isSuccess ? (
          // Success checkmark
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "rgba(34, 197, 94, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="#22c55e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : needsContact ? (
          // Contact required icon
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "rgba(234, 179, 8, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="#eab308"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : (
          // Error icon
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        <h1 className="router-title" style={{ marginBottom: "0.75rem" }}>
          {isSuccess
            ? operation === "cancel"
              ? strings.router_title_cancelled
              : operation === "reactivate"
                ? strings.router_title_welcome_back
                : operation === "pause"
                  ? strings.router_title_paused
                  : alreadyOnPlan
                    ? strings.router_title_current_plan
                    : strings.router_title_plan_updated
            : needsContact
              ? strings.router_title_contact_required
              : strings.router_title_error}
        </h1>

        <p
          className="router-subtitle"
          style={{
            maxWidth: "400px",
            margin: "0 auto 1.5rem",
            lineHeight: "1.6",
          }}
        >
          {/* Render message with clickable email link if contains support@bhakti.plus */}
          {message.includes("support@bhakti.plus") ? (
            <>
              {message.split("support@bhakti.plus")[0]}
              <a
                href="mailto:support@bhakti.plus"
                style={{ color: "#C9A227", textDecoration: "underline" }}
              >
                support@bhakti.plus
              </a>
              {message.split("support@bhakti.plus")[1]}
            </>
          ) : (
            message
          )}
        </p>

        <p
          style={{
            fontSize: "0.875rem",
            color: "rgba(255,255,255,0.6)",
            marginBottom: "2rem",
          }}
        >
          {email}
        </p>

        {/* Show tier change info for upgrades/downgrades */}
        {fromTier && toTier && fromTier !== toTier && (
          <p
            style={{
              fontSize: "0.875rem",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ textTransform: "capitalize" }}>{fromTier}</span>
            <span>→</span>
            <span style={{ textTransform: "capitalize", fontWeight: "bold" }}>
              {toTier}
            </span>
          </p>
        )}

        {/* Show billing info after successful operations */}
        {success && billing && (
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: "12px",
              padding: "1rem 1.5rem",
              marginBottom: "1.5rem",
              maxWidth: "320px",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}
              >
                {operation === "pause"
                  ? strings.router_label_paused_until
                  : strings.router_label_next_billing}
              </span>
              <span
                style={{
                  color: "#fff",
                  fontWeight: "500",
                  fontSize: "0.875rem",
                }}
              >
                {formatDate(billing.nextBillingDate)}
              </span>
            </div>
            {operation !== "cancel" && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.875rem",
                  }}
                >
                  {strings.router_label_amount}
                </span>
                <span
                  style={{ color: "#fff", fontWeight: "600", fontSize: "1rem" }}
                >
                  {formatAmount(billing.amount, billing.currencyCode)}
                  <span
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "0.75rem",
                      marginLeft: "0.25rem",
                    }}
                  >
                    {strings.router_billing_period.replace(
                      "{period}",
                      billing.interval === "YEAR" ? "year" : "month",
                    )}
                  </span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Contact button for manual support required */}
        {needsContact && (
          <a
            href="mailto:support@bhakti.plus?subject=Subscription%20Plan%20Change%20Request"
            className="router-btn router-btn--primary"
            style={{ marginBottom: "1rem" }}
          >
            {strings.router_button_contact_support}
          </a>
        )}

        {/* Continue button */}
        <a
          href={returnTo}
          className={
            needsContact
              ? "router-btn router-btn--secondary"
              : "router-btn router-btn--primary"
          }
        >
          {strings.action_continue}
        </a>
      </main>
    </div>
  );
}

// Main Router component
export default function Router() {
  const { strings } = useTranslations();
  const data = useLoaderData<LoaderData>();
  const navigation = useNavigation();

  // Show loading overlay during navigation (Appstle API can be slow)
  const isLoading = navigation.state === "loading";
  const loadingUrl =
    navigation.location?.pathname + (navigation.location?.search || "");
  const isMembershipOperation =
    loadingUrl?.includes("intent=membership") &&
    (loadingUrl?.includes("op=update") ||
      loadingUrl?.includes("op=cancel") ||
      loadingUrl?.includes("op=pause") ||
      loadingUrl?.includes("op=reactivate"));

  // Show loading overlay for membership operations (Appstle API can take 10-15s)
  if (isLoading && isMembershipOperation) {
    return (
      <>
        <LoadingOverlay message={strings.router_loading_updating} />
        <div className="router-page">
          <RouterHeader />
          <main className="router-main">
            <LotusIcon className="router-lotus" />
            <h1 className="router-title">{strings.router_processing}</h1>
            <p className="router-subtitle">
              {strings.router_processing_message}
            </p>
          </main>
        </div>
      </>
    );
  }

  // Error
  if ("error" in data) {
    return (
      <div className="router-page">
        <RouterHeader />
        <main className="router-main">
          <div className="router-error-icon">⚠️</div>
          <h1 className="router-title">{strings.router_title_error}</h1>
          <p className="router-subtitle">{strings.router_error_message}</p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              marginTop: "24px",
            }}
          >
            <a
              href="https://bhakti.plus/"
              className="router-btn router-btn--primary"
            >
              {strings.router_button_go_home}
            </a>
          </div>
          <p
            style={{
              marginTop: "24px",
              color: "rgba(255,255,255,0.5)",
              fontSize: "14px",
              maxWidth: "320px",
            }}
          >
            {strings.router_support_prompt}{" "}
            <a href="mailto:support@bhakti.plus" style={{ color: "#d4af37" }}>
              support@bhakti.plus
            </a>
          </p>
        </main>
      </div>
    );
  }

  // API Error
  if (data.action === "api_error") {
    return (
      <div className="router-page">
        <RouterHeader />
        <main className="router-main">
          <div className="router-error-icon">⚠️</div>
          <h1 className="router-title">
            {strings.router_title_connection_error}
          </h1>
          <p className="router-subtitle">{strings.router_error_connection}</p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              marginTop: "24px",
            }}
          >
            <a href={data.retryUrl} className="router-btn router-btn--primary">
              {strings.router_button_try_again}
            </a>
            <a
              href="https://bhakti.plus/"
              className="router-btn router-btn--secondary"
            >
              {strings.router_button_go_home}
            </a>
          </div>
          <p
            style={{
              marginTop: "24px",
              color: "rgba(255,255,255,0.5)",
              fontSize: "14px",
              maxWidth: "320px",
            }}
          >
            {strings.router_support_prompt}{" "}
            <a href="mailto:support@bhakti.plus" style={{ color: "#d4af37" }}>
              support@bhakti.plus
            </a>
          </p>
        </main>
      </div>
    );
  }

  // Checkout/Cart Error (from Shopify store redirects)
  if (data.action === "checkout_error") {
    const errorMessage =
      data.customMessage || ERROR_CODES[data.errorCode] || ERROR_CODES.unknown;
    const isAlreadySubscribed = data.errorCode === "already_subscribed";

    return (
      <div className="router-page">
        <RouterHeader />
        <main className="router-main">
          <div className="router-error-icon">
            {isAlreadySubscribed ? "ℹ️" : "⚠️"}
          </div>
          <h1 className="router-title">
            {isAlreadySubscribed
              ? strings.router_title_already_subscribed
              : strings.router_title_error}
          </h1>
          <p className="router-subtitle">{errorMessage}</p>
          {data.cartEmail && (
            <p
              style={{
                marginTop: "12px",
                color: "rgba(255,255,255,0.7)",
                fontSize: "14px",
              }}
            >
              Cart account: {data.cartEmail}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              marginTop: "24px",
              flexWrap: "wrap",
            }}
          >
            {isAlreadySubscribed ? (
              <a
                href="https://bhakti.plus/my"
                className="router-btn router-btn--primary"
              >
                {strings.router_button_view_content}
              </a>
            ) : (
              <a
                href={data.returnTo}
                className="router-btn router-btn--primary"
              >
                {strings.router_button_try_again}
              </a>
            )}
            <a
              href="https://bhakti.plus/"
              className="router-btn router-btn--secondary"
            >
              {strings.router_button_go_home}
            </a>
          </div>
          <p
            style={{
              marginTop: "24px",
              color: "rgba(255,255,255,0.5)",
              fontSize: "14px",
              maxWidth: "320px",
            }}
          >
            {strings.router_support_prompt}{" "}
            <a href="mailto:support@bhakti.plus" style={{ color: "#d4af37" }}>
              support@bhakti.plus
            </a>
          </p>
        </main>
      </div>
    );
  }

  // Redirecting (with animated steps)
  if (data.action === "redirecting") {
    return (
      <RedirectingPage
        region={data.region}
        redirectUrl={data.redirectUrl}
        email={data.email}
      />
    );
  }

  // Membership operation result
  if (data.action === "membership_result") {
    return <MembershipResultPage result={data.result} />;
  }

  // Membership processing (shows loading, then redirects to confirm)
  if (data.action === "membership_processing") {
    return (
      <MembershipProcessingPage
        email={data.email}
        op={data.op}
        originalUrl={data.originalUrl}
      />
    );
  }

  // Need Login
  if (data.action === "need_login") {
    const searchParams = new URLSearchParams();
    searchParams.set("intent", data.params.intent);
    if (data.params.returnTo)
      searchParams.set("return_to", data.params.returnTo);
    if (data.params.contentType)
      searchParams.set("content_type", data.params.contentType);
    if (data.params.contentId)
      searchParams.set("content_id", String(data.params.contentId));
    if (data.params.membershipId)
      searchParams.set("membership_id", data.params.membershipId);
    if (data.params.billingPeriod)
      searchParams.set("billing_period", data.params.billingPeriod);
    // Membership operation parameters (for intent=membership)
    if (data.params.op) searchParams.set("op", data.params.op);
    if (data.params.tier) searchParams.set("tier", data.params.tier);
    if (data.params.billing) searchParams.set("billing", data.params.billing);

    const returnUrl = `/router?${searchParams.toString()}`;

    return (
      <div className="router-page">
        <RouterHeader />
        <main className="router-main">
          <LotusIcon className="router-lotus" />
          <h1 className="router-title">{strings.router_login_title}</h1>
          <p className="router-subtitle">{strings.router_login_subtitle}</p>
          <div className="router-actions">
            <a
              href={`/account/login?return_to=${encodeURIComponent(returnUrl)}`}
              className="router-btn router-btn--primary"
            >
              {strings.nav_login}
            </a>
          </div>
        </main>
      </div>
    );
  }

  // Need Country Selection
  if (data.action === "need_country") {
    return (
      <div className="router-page router-country-page">
        <RouterHeader />

        <main className="router-main router-main--country">
          <LotusIcon className="router-lotus router-lotus--small" />

          <h1 className="router-title">{strings.router_country_title}</h1>
          <p className="router-subtitle">
            {strings.router_country_description}
          </p>

          <Form method="post" className="router-regions">
            <input type="hidden" name="email" value={data.email} />
            <input type="hidden" name="intent" value={data.params.intent} />
            <input
              type="hidden"
              name="return_to"
              value={data.params.returnTo || ""}
            />
            <input
              type="hidden"
              name="content_type"
              value={data.params.contentType || ""}
            />
            <input
              type="hidden"
              name="content_id"
              value={data.params.contentId?.toString() || ""}
            />
            <input
              type="hidden"
              name="membership_id"
              value={data.params.membershipId || ""}
            />
            <input
              type="hidden"
              name="billing_period"
              value={data.params.billingPeriod || "monthly"}
            />

            {COUNTRY_REGIONS.map((region) => (
              <div key={region.name} className="router-region-section">
                <h2>{region.name}</h2>
                <ul className="router-country-list">
                  {region.countries.map(({ code, name }) => (
                    <li key={code}>
                      <button
                        type="submit"
                        name="country_code"
                        value={code}
                        className="router-country-link"
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Form>

          <p className="router-note">{strings.router_country_note}</p>
        </main>
      </div>
    );
  }

  return null;
}
