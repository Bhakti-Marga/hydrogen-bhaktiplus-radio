/**
 * Test fixtures for modal state resolution.
 *
 * Each fixture defines a scenario with content data, user subscription tier,
 * and the expected modal state. Tests run as parameterized test cases.
 *
 * Uses the same makeContent/makeUser helpers from the CTA fixtures.
 */

import type { ModalStateInput, ModalState } from "../resolveModalState";
import { makeContent } from "~/components/ContentButtons/__tests__/fixtures";
import type { SubscriptionTier } from "~/lib/types";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

export function makeModalInput(
  overrides: Partial<ModalStateInput> = {},
): ModalStateInput {
  return {
    content: makeContent(),
    userCurrentPlan: "unsubscribed" as SubscriptionTier,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fixture type
// ---------------------------------------------------------------------------

export interface ModalFixture {
  /** Human-readable name for the test case */
  name: string;
  /** Input to resolveModalState */
  input: ModalStateInput;
  /** Expected output */
  expected: ModalState;
}

// ---------------------------------------------------------------------------
// PLANS-ONLY: Content has subscription tiers, no PPV
// ---------------------------------------------------------------------------

export const plansOnlyFixtures: ModalFixture[] = [
  {
    name: "Live tier content, unsubscribed user → plans-only, live+premium+supporter grant access",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: ["Live"],
      }),
      userCurrentPlan: "unsubscribed",
    }),
    expected: {
      type: "plans-only",
      planAccess: [
        { planId: "live", grantsAccess: true, isCurrentPlan: false },
        { planId: "premium", grantsAccess: true, isCurrentPlan: false },
        { planId: "supporter", grantsAccess: true, isCurrentPlan: false },
      ],
      requiredPlans: ["live"],
      userCurrentPlan: "unsubscribed",
      userHasPlan: false,
    },
  },
  {
    name: "Premium tier content, unsubscribed user → plans-only, only premium+supporter grant access",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: ["Premium"],
      }),
      userCurrentPlan: "unsubscribed",
    }),
    expected: {
      type: "plans-only",
      planAccess: [
        { planId: "live", grantsAccess: false, isCurrentPlan: false },
        { planId: "premium", grantsAccess: true, isCurrentPlan: false },
        { planId: "supporter", grantsAccess: true, isCurrentPlan: false },
      ],
      requiredPlans: ["premium"],
      userCurrentPlan: "unsubscribed",
      userHasPlan: false,
    },
  },
  {
    name: "Premium tier content, live subscriber → plans-only, user has live plan (needs upgrade)",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: ["Premium"],
      }),
      userCurrentPlan: "live",
    }),
    expected: {
      type: "plans-only",
      planAccess: [
        { planId: "live", grantsAccess: false, isCurrentPlan: true },
        { planId: "premium", grantsAccess: true, isCurrentPlan: false },
        { planId: "supporter", grantsAccess: true, isCurrentPlan: false },
      ],
      requiredPlans: ["premium"],
      userCurrentPlan: "live",
      userHasPlan: true,
    },
  },
  {
    name: "Supporter tier content (disabled tier filtered out) → plans-only with empty requiredPlans → no-options",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: ["Supporter"],
      }),
      userCurrentPlan: "unsubscribed",
    }),
    // Supporter is in DISABLED_CONTENT_TIERS, so getSubscriptionTiersFromContent
    // filters it out → empty plans → no-options
    expected: {
      type: "no-options",
      userCurrentPlan: "unsubscribed",
      userHasPlan: false,
    },
  },
  {
    name: "Multiple tiers [Live, Premium], unsubscribed → plans-only, all three grant access",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: ["Live", "Premium"],
      }),
      userCurrentPlan: "unsubscribed",
    }),
    expected: {
      type: "plans-only",
      planAccess: [
        { planId: "live", grantsAccess: true, isCurrentPlan: false },
        { planId: "premium", grantsAccess: true, isCurrentPlan: false },
        { planId: "supporter", grantsAccess: true, isCurrentPlan: false },
      ],
      requiredPlans: ["live", "premium"],
      userCurrentPlan: "unsubscribed",
      userHasPlan: false,
    },
  },
];

// ---------------------------------------------------------------------------
// PPV-ONLY: Content has PPV data, no subscription tiers
// (The bug scenario: currently shows plan cards incorrectly)
// ---------------------------------------------------------------------------

export const ppvOnlyFixtures: ModalFixture[] = [
  {
    name: "PPV-only content (subscriptionTiers: []), unsubscribed → ppv-only with purchase info",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: [],
        ppvTag: "holi-2026",
        shopifyProductId: "gid://shopify/Product/123",
        shopifyVariantId: "gid://shopify/ProductVariant/456",
        shopifyPrice: 225,
        shopifyCurrencyCode: "EUR",
        contentTypeId: 3, // pilgrimage
        contentId: 500,
      }),
      userCurrentPlan: "unsubscribed",
    }),
    expected: {
      type: "ppv-only",
      ppv: {
        link: "/router?intent=product&content_type=pilgrimages&content_id=500",
        price: "EUR 225.00",
      },
      userCurrentPlan: "unsubscribed",
      userHasPlan: false,
    },
  },
  {
    name: "PPV-only content (subscriptionTiers: null), premium subscriber → ppv-only (subscription doesn't help)",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: null,
        ppvTag: "holi-2026",
        shopifyProductId: "gid://shopify/Product/123",
        shopifyVariantId: "gid://shopify/ProductVariant/456",
        shopifyPrice: 99,
        shopifyCurrencyCode: "USD",
        contentTypeId: 3,
        contentId: 501,
      }),
      userCurrentPlan: "premium",
    }),
    expected: {
      type: "ppv-only",
      ppv: {
        link: "/router?intent=product&content_type=pilgrimages&content_id=501",
        price: "USD 99.00",
      },
      userCurrentPlan: "premium",
      userHasPlan: true,
    },
  },
  {
    name: "PPV-only content with no price set → ppv-only with null price",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: [],
        ppvTag: "holi-2026",
        shopifyProductId: "gid://shopify/Product/123",
        shopifyVariantId: "gid://shopify/ProductVariant/456",
        shopifyPrice: null,
        contentTypeId: 3,
        contentId: 502,
      }),
      userCurrentPlan: "unsubscribed",
    }),
    expected: {
      type: "ppv-only",
      ppv: {
        link: "/router?intent=product&content_type=pilgrimages&content_id=502",
        price: null,
      },
      userCurrentPlan: "unsubscribed",
      userHasPlan: false,
    },
  },
];

// ---------------------------------------------------------------------------
// PLANS + PPV: Content has both subscription tiers and PPV
// ---------------------------------------------------------------------------

export const plansAndPpvFixtures: ModalFixture[] = [
  {
    name: "Premium tier + PPV, unsubscribed → plans-and-ppv, PPV button below plan cards",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: ["Premium"],
        ppvTag: "pilgrimage-vrindavan-2026",
        shopifyProductId: "gid://shopify/Product/789",
        shopifyVariantId: "gid://shopify/ProductVariant/101",
        shopifyPrice: 225,
        shopifyCurrencyCode: "EUR",
        contentTypeId: 3,
        contentId: 600,
      }),
      userCurrentPlan: "unsubscribed",
    }),
    expected: {
      type: "plans-and-ppv",
      planAccess: [
        { planId: "live", grantsAccess: false, isCurrentPlan: false },
        { planId: "premium", grantsAccess: true, isCurrentPlan: false },
        { planId: "supporter", grantsAccess: true, isCurrentPlan: false },
      ],
      requiredPlans: ["premium"],
      ppv: {
        link: "/router?intent=product&content_type=pilgrimages&content_id=600",
        price: "EUR 225.00",
      },
      userCurrentPlan: "unsubscribed",
      userHasPlan: false,
    },
  },
  {
    name: "Live tier + PPV, live subscriber → plans-and-ppv, live card is current plan",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: ["Live"],
        ppvTag: "pilgrimage-vrindavan-2026",
        shopifyProductId: "gid://shopify/Product/789",
        shopifyVariantId: "gid://shopify/ProductVariant/101",
        shopifyPrice: 150,
        shopifyCurrencyCode: "GBP",
        contentTypeId: 3,
        contentId: 601,
      }),
      userCurrentPlan: "live",
    }),
    expected: {
      type: "plans-and-ppv",
      planAccess: [
        { planId: "live", grantsAccess: true, isCurrentPlan: true },
        { planId: "premium", grantsAccess: true, isCurrentPlan: false },
        { planId: "supporter", grantsAccess: true, isCurrentPlan: false },
      ],
      requiredPlans: ["live"],
      ppv: {
        link: "/router?intent=product&content_type=pilgrimages&content_id=601",
        price: "GBP 150.00",
      },
      userCurrentPlan: "live",
      userHasPlan: true,
    },
  },
];

// ---------------------------------------------------------------------------
// NO-OPTIONS: No subscription tiers and no PPV (broken content config)
// ---------------------------------------------------------------------------

export const noOptionsFixtures: ModalFixture[] = [
  {
    name: "No tiers + no PPV → no-options (broken content)",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: null,
        ppvTag: null,
        shopifyProductId: "",
        shopifyVariantId: "",
      }),
      userCurrentPlan: "unsubscribed",
    }),
    expected: {
      type: "no-options",
      userCurrentPlan: "unsubscribed",
      userHasPlan: false,
    },
  },
  {
    name: "Empty tiers + no PPV → no-options",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: [],
        ppvTag: null,
      }),
      userCurrentPlan: "premium",
    }),
    expected: {
      type: "no-options",
      userCurrentPlan: "premium",
      userHasPlan: true,
    },
  },
];

// ---------------------------------------------------------------------------
// EDGE CASES
// ---------------------------------------------------------------------------

export const edgeCaseFixtures: ModalFixture[] = [
  {
    name: "PPV with ppvTag but missing shopifyProductId → not PPV (needs all three fields)",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: [],
        ppvTag: "holi-2026",
        shopifyProductId: "", // empty = falsy
        shopifyVariantId: "gid://shopify/ProductVariant/456",
      }),
      userCurrentPlan: "unsubscribed",
    }),
    // isPPVContent requires ppvTag + shopifyProductId + shopifyVariantId to all be truthy
    expected: {
      type: "no-options",
      userCurrentPlan: "unsubscribed",
      userHasPlan: false,
    },
  },
  {
    name: "Supporter-only content with PPV → ppv-only (supporter tier is disabled/filtered out)",
    input: makeModalInput({
      content: makeContent({
        subscriptionTiers: ["Supporter"],
        ppvTag: "special-event",
        shopifyProductId: "gid://shopify/Product/999",
        shopifyVariantId: "gid://shopify/ProductVariant/888",
        shopifyPrice: 50,
        shopifyCurrencyCode: "EUR",
        contentTypeId: 3,
        contentId: 700,
      }),
      userCurrentPlan: "premium",
    }),
    // Supporter tier is filtered out by DISABLED_CONTENT_TIERS
    // → no valid plans left, but PPV exists → ppv-only
    expected: {
      type: "ppv-only",
      ppv: {
        link: "/router?intent=product&content_type=pilgrimages&content_id=700",
        price: "EUR 50.00",
      },
      userCurrentPlan: "premium",
      userHasPlan: true,
    },
  },
];

// ---------------------------------------------------------------------------
// REAL-WORLD: The exact bug scenario from the issue
// ---------------------------------------------------------------------------

export const realWorldModalFixtures: ModalFixture[] = [
  {
    name: "BUG REPRO: Holi 2026 live, subscriptionTiers: [], ppvTag: 'holi-2026', premium subscriber - should show PPV-only, NOT plan cards",
    input: makeModalInput({
      content: makeContent({
        contentId: 10012,
        contentTypeId: 5, // live
        title: "Holi 2026 Day 1",
        subscriptionTiers: [],
        ppvTag: "holi-2026",
        shopifyProductId: "gid://shopify/Product/123",
        shopifyVariantId: "gid://shopify/ProductVariant/456",
        shopifyPrice: 225,
        shopifyCurrencyCode: "EUR",
      }),
      userCurrentPlan: "premium",
    }),
    // This is the bug case: currently the modal shows all plan cards with
    // "Unlocks content" badge. It should show ppv-only.
    // Note: live contentTypeId (5) maps to no router content type,
    // so buildPPVRouterUrl returns null → link is ""
    expected: {
      type: "ppv-only",
      ppv: {
        link: "",
        price: "EUR 225.00",
      },
      userCurrentPlan: "premium",
      userHasPlan: true,
    },
  },
  {
    name: "Holi 2026 live, subscriptionTiers: [], ppvTag: 'holi-2026', unsubscribed user - should show PPV-only",
    input: makeModalInput({
      content: makeContent({
        contentId: 10012,
        contentTypeId: 5,
        title: "Holi 2026 Day 1",
        subscriptionTiers: [],
        ppvTag: "holi-2026",
        shopifyProductId: "gid://shopify/Product/123",
        shopifyVariantId: "gid://shopify/ProductVariant/456",
        shopifyPrice: 225,
        shopifyCurrencyCode: "EUR",
      }),
      userCurrentPlan: "unsubscribed",
    }),
    expected: {
      type: "ppv-only",
      ppv: {
        link: "",
        price: "EUR 225.00",
      },
      userCurrentPlan: "unsubscribed",
      userHasPlan: false,
    },
  },
];

// ---------------------------------------------------------------------------
// Combine all fixtures
// ---------------------------------------------------------------------------

export const allModalFixtures: ModalFixture[] = [
  ...plansOnlyFixtures,
  ...ppvOnlyFixtures,
  ...plansAndPpvFixtures,
  ...noOptionsFixtures,
  ...edgeCaseFixtures,
  ...realWorldModalFixtures,
];
