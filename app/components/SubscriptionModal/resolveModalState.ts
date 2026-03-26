/**
 * Pure decision function for SubscriptionModal content resolution.
 *
 * Determines what the modal should display based on:
 * - Content's subscription tiers (after filtering disabled tiers)
 * - Whether content is PPV (has ppvTag + shopifyProductId + shopifyVariantId)
 * - User's current subscription tier
 *
 * This mirrors the resolveCtaState pattern: extract decisions from rendering
 * so they can be unit tested without React dependencies.
 */

import {
  isPPVContent,
  getSubscriptionTiersFromContent,
  hasHierarchicalAccess,
  userHasAnyPlan,
  buildPPVRouterUrl,
} from "~/lib/utils/content";
import type { Content, SubscriptionTier } from "~/lib/types";

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------

export interface ModalStateInput {
  /** The content the user is trying to access */
  content: Content;
  /** User's current subscription tier */
  userCurrentPlan: SubscriptionTier;
}

// ---------------------------------------------------------------------------
// Output types (discriminated union)
// ---------------------------------------------------------------------------

/** Per-plan access info for rendering plan cards */
export interface PlanAccessInfo {
  /** The plan tier id */
  planId: SubscriptionTier;
  /** Whether this plan grants access to the content */
  grantsAccess: boolean;
  /** Whether this is the user's current plan */
  isCurrentPlan: boolean;
}

/** PPV purchase data for rendering the purchase button */
export interface PpvInfo {
  /** Router URL for PPV purchase */
  link: string;
  /** Formatted price string like "EUR 225.00", or null if unavailable */
  price: string | null;
}

export type ModalState =
  | {
      type: "plans-only";
      /** Which plans grant access, ordered [live, premium, supporter] */
      planAccess: PlanAccessInfo[];
      /** Content subscription tiers that grant access (lowercase, filtered) */
      requiredPlans: string[];
      /** User's current plan */
      userCurrentPlan: SubscriptionTier;
      /** Whether user has any active subscription */
      userHasPlan: boolean;
    }
  | {
      type: "plans-and-ppv";
      planAccess: PlanAccessInfo[];
      requiredPlans: string[];
      ppv: PpvInfo;
      userCurrentPlan: SubscriptionTier;
      userHasPlan: boolean;
    }
  | {
      type: "ppv-only";
      ppv: PpvInfo;
      userCurrentPlan: SubscriptionTier;
      userHasPlan: boolean;
    }
  | {
      type: "no-options";
      userCurrentPlan: SubscriptionTier;
      userHasPlan: boolean;
    };

// ---------------------------------------------------------------------------
// The plan tiers we always render cards for (in order)
// ---------------------------------------------------------------------------

const PLAN_TIERS: SubscriptionTier[] = ["live", "premium", "supporter"];

// ---------------------------------------------------------------------------
// Pure decision function
// ---------------------------------------------------------------------------

export function resolveModalState(input: ModalStateInput): ModalState {
  const { content, userCurrentPlan } = input;

  // Determine content characteristics
  const contentPlans = getSubscriptionTiersFromContent(content, true); // lowercase + filtered
  const hasContentPlans = contentPlans.length > 0;
  const isContentPPV = isPPVContent(content);
  const userHasPlan = userHasAnyPlan(userCurrentPlan);

  // Build PPV info if applicable
  const ppv: PpvInfo | null = isContentPPV ? buildPpvInfo(content) : null;

  // Build plan access info for each tier
  const planAccess: PlanAccessInfo[] = PLAN_TIERS.map((planId) => ({
    planId,
    grantsAccess: contentPlans.some((requiredTier) =>
      hasHierarchicalAccess(planId, requiredTier),
    ),
    isCurrentPlan: userCurrentPlan === planId,
  }));

  // Determine modal state
  if (hasContentPlans && isContentPPV && ppv) {
    return {
      type: "plans-and-ppv",
      planAccess,
      requiredPlans: contentPlans,
      ppv,
      userCurrentPlan,
      userHasPlan,
    };
  }

  if (hasContentPlans) {
    return {
      type: "plans-only",
      planAccess,
      requiredPlans: contentPlans,
      userCurrentPlan,
      userHasPlan,
    };
  }

  if (isContentPPV && ppv) {
    return {
      type: "ppv-only",
      ppv,
      userCurrentPlan,
      userHasPlan,
    };
  }

  return {
    type: "no-options",
    userCurrentPlan,
    userHasPlan,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPpvInfo(content: Content): PpvInfo {
  const link = buildPPVRouterUrl(content) || "";
  let price: string | null = null;

  if (content.shopifyPrice != null) {
    const currencyCode = content.shopifyCurrencyCode || "EUR";
    price = `${currencyCode} ${content.shopifyPrice.toFixed(2)}`;
  }

  return { link, price };
}
