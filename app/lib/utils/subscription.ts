import {
  PLAN_VARIANT_IDS,
  STORE_SUBSCRIPTION_CONFIG,
  type BillingInterval,
} from "~/lib/constants";
import type { SubscriptionTier } from "~/lib/types";
import type { StoreType } from "~/lib/store-routing";
import type { TranslationDictionary } from "~/lib/translations/keys";

/**
 * Billing period type
 */
export type Billing = "monthly" | "yearly";

/**
 * Variant IDs mapping: tier -> billing -> variantId
 */
export type VariantIds = Record<
  Exclude<SubscriptionTier, "unsubscribed">,
  Record<Billing, string>
>;

/**
 * Action type for membership operations
 * All operations now go through the router via GET requests
 */
export type MembershipAction = {
  text:
    | "subscribe"
    | "upgrade"
    | "downgrade"
    | "pause"
    | "cancel"
    | "contact"
    | "change frequency";
  link: string;
  method: "GET" | "MAILTO";
};

/**
 * Feature with optional tooltip
 */
export interface TierFeature {
  text: string;
  tooltip?: string;
}

/**
 * Get translated features for a subscription tier.
 * Uses direct property access for translation keys (required by translation system).
 */
export function getTierFeatures(
  tier: string,
  strings: TranslationDictionary,
): string[] {
  switch (tier) {
    case "live":
      return [
        strings.tier_feature_live_streams,
        strings.tier_feature_live_recordings_30_days,
        strings.tier_feature_featured_satsang_daily,
        strings.tier_feature_weekly_7_satsangs,
      ];
    case "premium":
      return [
        strings.tier_feature_everything_from_live,
        strings.tier_feature_unlimited_livestreams,
        strings.tier_feature_exclusive_satsangs,
        strings.tier_feature_scripture_commentaries,
        strings.tier_feature_virtual_pilgrimages,
        strings.tier_feature_smart_search_beta,
      ];
    case "supporter":
      return [
        "For those who wish to go beyond content.",
        "The Supporter plan is an invitation into a deeper, more personal dimension of Paramahamsa Vishwananda’s work.",
        "Designed for committed seekers who value access, continuity, and contribution.",
        "Details will be revealed at launch.",
        "",
        //strings.tier_feature_everything_from_premium,
        //strings.tier_feature_all_commentaries_pilgrimages,
        //strings.tier_feature_all_exclusive_talks,
        //strings.tier_feature_future_programs,
        //strings.tier_feature_12_month_commitment,
      ];
    default:
      return [];
  }
}

/**
 * Get translated features with tooltips for a subscription tier.
 * Returns features with optional tooltip text for premium tier features.
 */
export function getTierFeaturesWithTooltips(
  tier: string,
  strings: TranslationDictionary,
): TierFeature[] {
  switch (tier) {
    case "live":
      return [
        { text: strings.tier_feature_live_streams },
        { text: strings.tier_feature_live_recordings_30_days },
        { text: strings.tier_feature_featured_satsang_daily },
        { text: strings.tier_feature_weekly_7_satsangs },
      ];
    case "premium":
      return [
        { text: strings.tier_feature_everything_from_live },
        { text: strings.tier_feature_unlimited_livestreams },
        {
          text: strings.tier_feature_exclusive_satsangs,
          tooltip: strings.tier_tooltip_exclusive_satsangs,
        },
        {
          text: strings.tier_feature_scripture_commentaries,
          tooltip: strings.tier_tooltip_scripture_commentaries,
        },
        {
          text: strings.tier_feature_virtual_pilgrimages,
          tooltip: strings.tier_tooltip_virtual_pilgrimages,
        },
        { text: strings.tier_feature_smart_search_beta },
      ];
    case "supporter":
      return [
        { text: "For those who wish to go beyond content." },
        {
          text: "The Supporter plan is an invitation into a deeper, more personal dimension of Paramahamsa Vishwananda’s work.",
        },
        {
          text: "Designed for committed seekers who value access, continuity, and contribution.",
        },
        { text: "Details will be revealed at launch." },
        { text: "" },
        //{ text: strings.tier_feature_everything_from_premium },
        //{ text: strings.tier_feature_all_commentaries_pilgrimages },
        //{ text: strings.tier_feature_all_exclusive_talks },
        //{ text: strings.tier_feature_future_programs },
        //{ text: strings.tier_feature_12_month_commitment },
      ];
    default:
      return [];
  }
}

/**
 * Get plan name from variant ID
 */
export function getPlanNameFromVariantId(variantId: string): SubscriptionTier {
  const entries = Object.entries(PLAN_VARIANT_IDS) as Array<
    [SubscriptionTier, string]
  >;
  const found = entries.find(([_, id]) => id === variantId);
  return found ? found[0] : "unsubscribed";
}

/**
 * Format renewal date
 */
export function formatRenewalDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get variant ID from plan name
 */
export function getVariantIdFromPlanName(planName: SubscriptionTier): string {
  return PLAN_VARIANT_IDS[planName as keyof typeof PLAN_VARIANT_IDS] || "";
}

/**
 * Subscription tier schema for UI components
 * Note: features are translated strings, populated via getTierFeatures()
 */
export interface SubscriptionTierSchema {
  id: SubscriptionTier;
  title: string;
  price: {
    monthly: string;
    yearly?: string;
  };
  features: string[];
  checkoutUrl: string;
}

/**
 * Static plan data - fallback when API is unavailable
 * Note: features are empty here - populate via getTierFeatures() at render time
 */
export const STATIC_PLANS: SubscriptionTierSchema[] = [
  {
    id: "live" as SubscriptionTier,
    title: "Live",
    price: { monthly: "9.99", yearly: "99.00" },
    features: [],
    checkoutUrl: "",
  },
  {
    id: "premium" as SubscriptionTier,
    title: "Premium",
    price: { monthly: "49.99", yearly: "499.00" },
    features: [],
    checkoutUrl: "",
  },
  {
    id: "supporter" as SubscriptionTier,
    title: "Supporter",
    price: { monthly: "200.00", yearly: "2000.00" },
    features: [],
    checkoutUrl: "",
  },
];

/**
 * Build the plan key from tier and interval
 * e.g., ('premium', 'monthly') => 'premiumMonthly'
 */
function buildPlanKey(
  planName: SubscriptionTier,
  billingInterval: BillingInterval,
): string {
  const capitalizedInterval =
    billingInterval.charAt(0).toUpperCase() + billingInterval.slice(1);
  return `${planName}${capitalizedInterval}`;
}

/**
 * Get variant ID for a plan from a specific store
 */
export function getVariantIdForStore(
  planName: SubscriptionTier,
  storeType: StoreType,
  billingInterval: BillingInterval = "monthly",
): string {
  const storeConfig = STORE_SUBSCRIPTION_CONFIG[storeType];
  const planKey = buildPlanKey(planName, billingInterval);
  return (
    storeConfig.variantIds[planKey as keyof typeof storeConfig.variantIds] || ""
  );
}

/**
 * Get selling plan ID for a plan from a specific store
 */
export function getSellingPlanIdForStore(
  planName: SubscriptionTier,
  storeType: StoreType,
  billingInterval: BillingInterval = "monthly",
): string {
  const storeConfig = STORE_SUBSCRIPTION_CONFIG[storeType];
  const planKey = buildPlanKey(planName, billingInterval);
  return (
    storeConfig.sellingPlanIds[
      planKey as keyof typeof storeConfig.sellingPlanIds
    ] || ""
  );
}

/**
 * Build Shopify quick checkout URL for subscription - multi-store version
 *
 * @param checkoutDomain - The Shopify checkout domain (e.g., "checkout.example.com")
 * @param planName - The subscription tier (live, premium, supporter)
 * @param storeType - Which store configuration to use (eu or row)
 * @param billingInterval - Monthly or yearly billing (defaults to monthly)
 * @returns Full checkout URL for the specified store
 */
export function buildMultiStoreCheckoutUrl(
  checkoutDomain: string,
  planName: SubscriptionTier,
  storeType: StoreType,
  billingInterval: BillingInterval = "monthly",
): string {
  console.log("🟡 [buildMultiStoreCheckoutUrl] ====== START ======");
  console.log("🟡 [buildMultiStoreCheckoutUrl] Inputs:", {
    checkoutDomain,
    planName,
    storeType,
    billingInterval,
  });

  const variantId = getVariantIdForStore(planName, storeType, billingInterval);
  const sellingPlanId = getSellingPlanIdForStore(
    planName,
    storeType,
    billingInterval,
  );

  console.log("🟡 [buildMultiStoreCheckoutUrl] Product IDs:", {
    variantId,
    sellingPlanId,
  });

  if (!variantId || !sellingPlanId) {
    console.error(
      "🔴 [buildMultiStoreCheckoutUrl] Missing variantId or sellingPlanId!",
    );
    throw new Error(
      `Invalid plan name or store type: ${planName} / ${storeType} / ${billingInterval}`,
    );
  }

  // Build the cart add URL parameters
  // Flow: /cart/clear -> /cart/add (with item) -> /checkout
  const cartAddUrl = `/cart/add?items[0][id]=${variantId}&items[0][quantity]=1&items[0][selling_plan]=${sellingPlanId}&return_to=/checkout?`;
  console.log(
    "🟡 [buildMultiStoreCheckoutUrl] Cart add URL (unencoded):",
    cartAddUrl,
  );

  // Encode the entire cart add URL for the return_to parameter
  const encodedReturnTo = encodeURIComponent(cartAddUrl);
  console.log(
    "🟡 [buildMultiStoreCheckoutUrl] Cart add URL (encoded):",
    encodedReturnTo,
  );

  // Build the final checkout URL
  const checkoutUrl = `https://${checkoutDomain}/cart/clear?return_to=${encodedReturnTo}`;

  console.log("🟡 [buildMultiStoreCheckoutUrl] FINAL URL:", checkoutUrl);
  console.log("🟡 [buildMultiStoreCheckoutUrl] ====== END ======");

  return checkoutUrl;
}

/**
 * Get membership link/action based on current subscription and target tier.
 * Determines if action is subscribe, upgrade, downgrade, cancel, pause, reactivate, or contact.
 *
 * Downgrade rules:
 * - Downgrades are only allowed within the same billing frequency (monthly->monthly, yearly->yearly)
 * - Cross-frequency downgrades (e.g., premium monthly -> live yearly) are forbidden
 * - Supporter tier downgrades are forbidden entirely
 *
 * @param params - Configuration for determining the action
 * @returns Action object or null if no action available
 */
export function getMembershipLink(params: {
  subscriptionTier: SubscriptionTier; // current tier
  currentBilling?: Billing | null; // billing of current sub (if subscribed)
  status?: "ACTIVE" | "PAUSED" | "CANCELLED";
  subscriptionId?: string | null; // Appstle contract ID

  targetTier: Exclude<SubscriptionTier, "unsubscribed">;
  targetBilling?: Billing; // what user wants (or default monthly)

  variantIds: VariantIds;
  returnTo?: string;

  contactEmail?: string; // default support@bhakti.plus
}): MembershipAction | null {
  const {
    subscriptionTier,
    currentBilling = null,
    status = "ACTIVE",
    subscriptionId = null,
    targetTier,
    targetBilling = "monthly",
    variantIds,
    returnTo = "/my",
    contactEmail = "support@bhakti.plus",
  } = params;

  // Plan levels (hierarchy)
  const LEVEL: Record<
    Exclude<SubscriptionTier, "unsubscribed">,
    number
  > = {
    live: 10,
    premium: 20,
    supporter: 30,
  };

  // If unsubscribed -> subscribe flow (checkout via router)
  // Router links should be absolute (no locale prefix)
  if (subscriptionTier === "unsubscribed") {
    return {
      text: "subscribe",
      method: "GET",
      link: `/router?intent=subscribe&membership_id=${targetTier}&billing_period=${targetBilling}&return_to=${encodeURIComponent(
        returnTo,
      )}`,
    };
  }

  // If no subscriptionId we can't do update/cancel/reactivate
  if (!subscriptionId) return null;

  // Reactivate if paused
  if (status === "PAUSED") {
    return {
      text: "pause",
      method: "GET",
      link: `/router?intent=membership&op=reactivate&return_to=${encodeURIComponent(
        returnTo,
      )}`,
    };
  }

  // Check if same tier but different billing period - this is "Change frequency"
  const currentTierNormalized = subscriptionTier;
  if (
    targetTier === currentTierNormalized &&
    currentBilling &&
    currentBilling !== targetBilling
  ) {
    return {
      text: "change frequency",
      method: "GET",
      link: `/router?intent=membership&op=update&tier=${targetTier}&billing=${targetBilling}&return_to=${encodeURIComponent(
        returnTo,
      )}`,
    };
  }

  // Optional: clicking current tier (same tier AND same billing) could be "cancel"
  if (targetTier === currentTierNormalized) {
    return {
      text: "cancel",
      method: "GET",
      link: `/router?intent=membership&op=cancel&return_to=${encodeURIComponent(
        returnTo,
      )}`,
    };
  }

  const from = currentTierNormalized as Exclude<
    SubscriptionTier,
    "unsubscribed"
  >;
  const to = targetTier;

  const isUpgrade = LEVEL[to] > LEVEL[from];
  const isDowngrade = LEVEL[to] < LEVEL[from];

  // Forbidden downgrades:
  // 1) Supporter tier -> anything lower is forbidden (supporter is a commitment)
  // 2) Cross-billing-frequency downgrades are forbidden (e.g., premium monthly -> live yearly)
  //    - Downgrades must be within the same billing frequency
  const isFromSupporter = from === "supporter";
  const isCrossBillingDowngrade =
    isDowngrade && currentBilling !== targetBilling;
  const forbiddenDowngrade =
    isDowngrade && (isFromSupporter || isCrossBillingDowngrade);

  if (isDowngrade && forbiddenDowngrade) {
    return {
      text: "contact",
      method: "MAILTO",
      link: `mailto:${contactEmail}`,
    };
  }

  // Allowed upgrade/downgrade -> use router membership update
  return {
    text: isUpgrade ? "upgrade" : "downgrade",
    method: "GET",
    link: `/router?intent=membership&op=update&tier=${to}&billing=${targetBilling}&return_to=${encodeURIComponent(
      returnTo,
    )}`,
  };
}
