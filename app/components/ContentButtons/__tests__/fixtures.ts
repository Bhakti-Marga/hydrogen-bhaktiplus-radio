/**
 * Test fixtures for CTA state resolution.
 *
 * Each fixture defines a scenario with content data, user state, and the
 * expected CTA state that should be resolved. Add new fixtures here to
 * test additional edge cases - each one automatically becomes a test case.
 *
 * The content objects are minimal: only the fields that affect CTA logic
 * are populated. All other fields use sensible defaults via makeContent().
 */

import type { CtaStateInput, CtaState } from "../resolveCtaState";
import type { Content, ContentType, SubscriptionTier, User } from "~/lib/types";

// ---------------------------------------------------------------------------
// Helpers to build minimal test data
// ---------------------------------------------------------------------------

const DEFAULT_VIDEO = {
  videoId: 1001,
  title: "Test Video",
  description: "",
  durationSeconds: 3600,
  summary500: "",
  chapters: [],
};

/**
 * Creates a minimal Content object with sensible defaults.
 * Only override the fields relevant to your test scenario.
 */
export function makeContent(overrides: Partial<Content> = {}): Content {
  return {
    contentId: 100,
    contentTypeId: 5, // live
    title: "Test Content",
    subtitle: "",
    thumbnailUrl: "",
    thumbnailUrlVertical: "",
    bannerImageUrl: "",
    shopifyProductId: "",
    shopifyVariantId: "",
    subscriptionTiers: null,
    location: null as any,
    genre: null,
    description: "",
    isLiveContent: false,
    isLiveFree: false,
    isLiveNow: false,
    isPreview: false,
    liveStatus: null,
    ppvTag: null,
    tags: [],
    videoCount: 1,
    startDate: "",
    endDate: "",
    video: DEFAULT_VIDEO as any,
    isSatsangOfDay: false,
    ...overrides,
  } as Content;
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    shopifyCustomerId: "12345",
    firstName: "Test",
    lastName: "User",
    ppv: null,
    email: "test@example.com",
    stampedRegionId: 1,
    userSelectCountryCode: null,
    resolvedRegionId: 1,
    ...overrides,
  };
}

/**
 * Creates a full CtaStateInput with defaults.
 * Override any field to set up a specific scenario.
 */
export function makeInput(overrides: Partial<CtaStateInput> = {}): CtaStateInput {
  return {
    content: makeContent(),
    contentType: "live" as ContentType,
    user: makeUser(),
    subscriptionTier: "premium" as SubscriptionTier,
    isPrelaunchActive: false,
    hasVideoId: true,
    hasOnPlayClick: false,
    watchProgressSeconds: null,
    seriesFeaturedVideoMarker: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fixture type
// ---------------------------------------------------------------------------

export interface CtaFixture {
  /** Human-readable name for the test case */
  name: string;
  /** Input to resolveCtaState */
  input: CtaStateInput;
  /** Expected output */
  expected: CtaState;
}

// ---------------------------------------------------------------------------
// ACCESS PATH: User has access - Play button variants
// ---------------------------------------------------------------------------

export const accessFixtures: CtaFixture[] = [
  // ---- Live status-based states ----
  {
    name: "scheduled live → upcoming-live button",
    input: makeInput({
      content: makeContent({
        liveStatus: "scheduled",
        isLiveContent: true,
        isLiveFree: true,
        startDate: "2026-03-15T18:00:00Z",
      }),
    }),
    expected: { type: "upcoming-live" },
  },
  {
    name: "live-preview → play starting soon (clickable)",
    input: makeInput({
      content: makeContent({
        liveStatus: "live-preview",
        isLiveContent: true,
        isLiveFree: true,
      }),
    }),
    expected: { type: "play", variant: "starting-soon", isStartingSoon: true },
  },
  {
    name: "live-now → play live (red button)",
    input: makeInput({
      content: makeContent({
        liveStatus: "live-now",
        isLiveContent: true,
        isLiveFree: true,
      }),
    }),
    expected: { type: "play", variant: "live", isStartingSoon: false },
  },
  {
    name: "vod-inprogress (non-series) → replay coming soon",
    input: makeInput({
      content: makeContent({
        liveStatus: "vod-inprogress",
        isLiveContent: true,
        isLiveFree: true,
        isOngoingSeries: false,
      }),
    }),
    expected: { type: "replay-coming-soon" },
  },
  {
    name: "vod-inprogress (ongoing series) → play button (can watch past episodes)",
    input: makeInput({
      content: makeContent({
        liveStatus: "vod-inprogress",
        isLiveContent: true,
        isLiveFree: true,
        isOngoingSeries: true,
        // Note: isLiveContent=true + no isUpcoming/isPreview means resolvePlayVariant
        // detects this as "currently live" via the boolean flag fallback.
        // In practice, vod-inprogress content with isLiveContent=true would show as live.
        // This matches the original ContentButtons behavior.
      }),
    }),
    expected: { type: "play", variant: "live", isStartingSoon: false },
  },
  {
    name: "vod-ready → play replay",
    input: makeInput({
      content: makeContent({
        liveStatus: "vod-ready",
        isLiveContent: true,
        isLiveFree: true,
      }),
    }),
    expected: { type: "play", variant: "replay", isStartingSoon: false },
  },

  // ---- Boolean flag fallback (no liveStatus) ----
  {
    name: "no liveStatus + isPreview → upcoming-live (fallback)",
    input: makeInput({
      content: makeContent({
        liveStatus: null,
        isLiveContent: true,
        isPreview: true,
        isLiveFree: true,
      }),
    }),
    expected: { type: "upcoming-live" },
  },
  {
    name: "no liveStatus + isLive + isUpcoming → upcoming-live (fallback)",
    input: makeInput({
      content: makeContent({
        liveStatus: null,
        isLiveContent: true,
        isUpcoming: true,
        isLiveFree: true,
      }),
    }),
    expected: { type: "upcoming-live" },
  },
  {
    name: "no liveStatus + isLive (not upcoming, not preview) → play live",
    input: makeInput({
      content: makeContent({
        liveStatus: null,
        isLiveContent: true,
        isUpcoming: false,
        isPreview: false,
        isLiveFree: true,
      }),
    }),
    expected: { type: "play", variant: "live", isStartingSoon: false },
  },
  {
    name: "no liveStatus + not live → play watch (default)",
    input: makeInput({
      content: makeContent({
        liveStatus: null,
        isLiveContent: false,
        subscriptionTiers: ["Premium"],
      }),
      subscriptionTier: "premium",
    }),
    expected: { type: "play", variant: "watch", isStartingSoon: false },
  },

  // ---- Play button text variants ----
  {
    name: "series featured video marker 'continue' → series-continue",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: ["Premium"],
      }),
      subscriptionTier: "premium",
      seriesFeaturedVideoMarker: "continue",
    }),
    expected: { type: "play", variant: "series-continue", isStartingSoon: false },
  },
  {
    name: "series featured video marker 'watch' → series-watch",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: ["Premium"],
      }),
      subscriptionTier: "premium",
      seriesFeaturedVideoMarker: "watch",
    }),
    expected: { type: "play", variant: "series-watch", isStartingSoon: false },
  },
  {
    name: "series featured video marker 'watch-next' → series-watch",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: ["Premium"],
      }),
      subscriptionTier: "premium",
      seriesFeaturedVideoMarker: "watch-next",
    }),
    expected: { type: "play", variant: "series-watch", isStartingSoon: false },
  },
  {
    name: "series featured video marker 'watch-again' → series-watch",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: ["Premium"],
      }),
      subscriptionTier: "premium",
      seriesFeaturedVideoMarker: "watch-again",
    }),
    expected: { type: "play", variant: "series-watch", isStartingSoon: false },
  },
  {
    name: "has watch progress → continue-watching",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: ["Premium"],
      }),
      subscriptionTier: "premium",
      watchProgressSeconds: 120,
    }),
    expected: { type: "play", variant: "continue-watching", isStartingSoon: false },
  },
  {
    name: "no progress, no series marker → watch (default)",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: ["Premium"],
      }),
      subscriptionTier: "premium",
      watchProgressSeconds: null,
      seriesFeaturedVideoMarker: null,
    }),
    expected: { type: "play", variant: "watch", isStartingSoon: false },
  },

  // ---- Edge case: no videoId and no onPlayClick ----
  {
    name: "has access but no videoId and no onPlayClick → no-video",
    input: makeInput({
      content: makeContent({
        isLiveFree: true,
        video: null as any,
      }),
      hasVideoId: false,
      hasOnPlayClick: false,
    }),
    expected: { type: "no-video" },
  },
  {
    name: "has access, no videoId but has onPlayClick → play watch",
    input: makeInput({
      content: makeContent({
        isLiveFree: true,
        video: null as any,
      }),
      hasVideoId: false,
      hasOnPlayClick: true,
    }),
    expected: { type: "play", variant: "watch", isStartingSoon: false },
  },
];

// ---------------------------------------------------------------------------
// NO-ACCESS PATH: User needs to subscribe or purchase
// ---------------------------------------------------------------------------

export const noAccessFixtures: CtaFixture[] = [
  // ---- Subscription only ----
  {
    name: "unsubscribed user + content requires Live tier → choose-plan",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: ["Live"],
      }),
      subscriptionTier: "unsubscribed",
      user: makeUser(),
    }),
    expected: { type: "cta-choose-plan", hasPpv: false },
  },
  {
    name: "live subscriber + content requires Premium → upgrade-plan",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: ["Premium"],
      }),
      subscriptionTier: "live",
      user: makeUser(),
    }),
    expected: { type: "cta-upgrade-plan", hasPpv: false },
  },

  // ---- PPV only ----
  {
    name: "unsubscribed + PPV-only content → ppv-only",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: null,
        ppvTag: "pilgrimage-holi-2026",
        shopifyProductId: "gid://shopify/Product/123",
        shopifyVariantId: "gid://shopify/ProductVariant/456",
        shopifyPrice: 225,
        shopifyCurrencyCode: "EUR",
      }),
      subscriptionTier: "unsubscribed",
      user: makeUser(),
    }),
    expected: { type: "cta-ppv-only" },
  },

  // ---- Both subscription + PPV ----
  {
    name: "unsubscribed + content has both plans and PPV → choose-plan-and-ppv",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: ["Premium"],
        ppvTag: "pilgrimage-holi-2026",
        shopifyProductId: "gid://shopify/Product/123",
        shopifyVariantId: "gid://shopify/ProductVariant/456",
        shopifyPrice: 225,
      }),
      subscriptionTier: "unsubscribed",
      user: makeUser(),
    }),
    expected: { type: "cta-choose-plan-and-ppv", hasPpv: true },
  },
  {
    name: "live subscriber + content has Premium plans and PPV → upgrade-plan-and-ppv",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: ["Premium"],
        ppvTag: "pilgrimage-holi-2026",
        shopifyProductId: "gid://shopify/Product/123",
        shopifyVariantId: "gid://shopify/ProductVariant/456",
        shopifyPrice: 225,
      }),
      subscriptionTier: "live",
      user: makeUser(),
    }),
    expected: { type: "cta-upgrade-plan-and-ppv", hasPpv: true },
  },

  // ---- No subscription tiers, no PPV (free content without explicit access) ----
  {
    name: "no subscription tiers + no PPV → cta-none",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: null,
        ppvTag: null,
        isLiveFree: false,
      }),
      subscriptionTier: "unsubscribed",
      user: makeUser(),
    }),
    expected: { type: "cta-none" },
  },

  // ---- Anonymous user (not logged in) ----
  {
    name: "anonymous user + content requires Live tier → choose-plan",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: ["Live"],
      }),
      user: null,
      subscriptionTier: "unsubscribed",
    }),
    expected: { type: "cta-choose-plan", hasPpv: false },
  },
];

// ---------------------------------------------------------------------------
// ACCESS EDGE CASES: Free live, PPV access, prelaunch bypass
// ---------------------------------------------------------------------------

export const accessEdgeCaseFixtures: CtaFixture[] = [
  {
    name: "isLiveFree → has access (play button) regardless of subscription",
    input: makeInput({
      content: makeContent({
        isLiveFree: true,
        liveStatus: "live-now",
        isLiveContent: true,
      }),
      user: null,
      subscriptionTier: "unsubscribed",
    }),
    expected: { type: "play", variant: "live", isStartingSoon: false },
  },
  {
    name: "PPV access (user has ppv tag) → has access",
    input: makeInput({
      content: makeContent({
        ppvTag: "pilgrimage-holi-2026",
        shopifyProductId: "gid://shopify/Product/123",
        shopifyVariantId: "gid://shopify/ProductVariant/456",
        subscriptionTiers: ["Premium"],
      }),
      user: makeUser({ ppv: ["pilgrimage-holi-2026"] }),
      subscriptionTier: "unsubscribed",
    }),
    expected: { type: "play", variant: "watch", isStartingSoon: false },
  },
  {
    name: "prelaunch active + live content type + logged in → free access",
    input: makeInput({
      content: makeContent({
        contentTypeId: 5, // live
        subscriptionTiers: ["Live"],
        isLiveContent: true,
        liveStatus: "live-now",
      }),
      contentType: "live",
      user: makeUser(),
      subscriptionTier: "unsubscribed",
      isPrelaunchActive: true,
    }),
    expected: { type: "play", variant: "live", isStartingSoon: false },
  },
  {
    name: "prelaunch active + non-live content type → no free access",
    input: makeInput({
      content: makeContent({
        contentTypeId: 1, // satsang
        subscriptionTiers: ["Premium"],
      }),
      contentType: "satsang",
      user: makeUser(),
      subscriptionTier: "unsubscribed",
      isPrelaunchActive: true,
    }),
    expected: { type: "cta-choose-plan", hasPpv: false },
  },
  {
    name: "prelaunch active + live content + anonymous user → no free access",
    input: makeInput({
      content: makeContent({
        contentTypeId: 5,
        subscriptionTiers: ["Live"],
      }),
      contentType: "live",
      user: null,
      subscriptionTier: "unsubscribed",
      isPrelaunchActive: true,
    }),
    expected: { type: "cta-choose-plan", hasPpv: false },
  },
  {
    name: "supporter tier has access to live-tier content",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: ["Live"],
      }),
      subscriptionTier: "supporter",
    }),
    expected: { type: "play", variant: "watch", isStartingSoon: false },
  },
  {
    name: "premium tier has access to live-tier content",
    input: makeInput({
      content: makeContent({
        subscriptionTiers: ["Live"],
      }),
      subscriptionTier: "premium",
    }),
    expected: { type: "play", variant: "watch", isStartingSoon: false },
  },
];

// ---------------------------------------------------------------------------
// REAL-WORLD FIXTURE: Featured live content from /lives/featured
// (based on actual API response provided by the team)
// ---------------------------------------------------------------------------

export const realWorldFixtures: CtaFixture[] = [
  {
    name: "Holi 2026 Day 1 - scheduled, no subscription tiers, no PPV, unsubscribed user",
    input: makeInput({
      content: makeContent({
        contentId: 10012,
        contentTypeId: 5,
        title: "Holi 2026 Day 1",
        isLiveContent: false,
        isLiveNow: false,
        isPreview: false,
        isLiveFree: false,
        liveStatus: "scheduled",
        subscriptionTiers: [],
        ppvTag: null,
        shopifyProductId: "",
        shopifyVariantId: "",
        shopifyPrice: null,
        startDate: "2026-03-15T18:00:00Z",
        video: {
          videoId: 10011,
          title: "new 2026-03-01 00:47:46",
          description: "",
          durationSeconds: 0,
          summary500: "",
          chapters: [],
        } as any,
      }),
      contentType: "live",
      user: null,
      subscriptionTier: "unsubscribed",
    }),
    // No subscription tiers, no PPV, user has no access → cta-none
    expected: { type: "cta-none" },
  },
  {
    name: "Holi 2026 Day 1 - scheduled, Live tier required, unsubscribed user",
    input: makeInput({
      content: makeContent({
        contentId: 10012,
        contentTypeId: 5,
        title: "Holi 2026 Day 1",
        isLiveContent: false,
        isLiveNow: false,
        isPreview: false,
        isLiveFree: false,
        liveStatus: "scheduled",
        subscriptionTiers: ["Live"],
        ppvTag: null,
        shopifyProductId: "",
        shopifyVariantId: "",
        startDate: "2026-03-15T18:00:00Z",
        video: {
          videoId: 10011,
          title: "new 2026-03-01 00:47:46",
          description: "",
          durationSeconds: 0,
          summary500: "",
          chapters: [],
        } as any,
      }),
      contentType: "live",
      user: null,
      subscriptionTier: "unsubscribed",
    }),
    expected: { type: "cta-choose-plan", hasPpv: false },
  },
  {
    name: "Holi 2026 Day 1 - scheduled, Live tier required, premium subscriber",
    input: makeInput({
      content: makeContent({
        contentId: 10012,
        contentTypeId: 5,
        title: "Holi 2026 Day 1",
        isLiveContent: false,
        isLiveNow: false,
        isPreview: false,
        isLiveFree: false,
        liveStatus: "scheduled",
        subscriptionTiers: ["Live"],
        ppvTag: null,
        shopifyProductId: "",
        shopifyVariantId: "",
        startDate: "2026-03-15T18:00:00Z",
        video: {
          videoId: 10011,
          title: "new 2026-03-01 00:47:46",
          description: "",
          durationSeconds: 0,
          summary500: "",
          chapters: [],
        } as any,
      }),
      contentType: "live",
      user: makeUser(),
      subscriptionTier: "premium",
    }),
    expected: { type: "upcoming-live" },
  },
  {
    name: "Holi 2026 Day 1 - live-now, Live tier required, premium subscriber",
    input: makeInput({
      content: makeContent({
        contentId: 10012,
        contentTypeId: 5,
        title: "Holi 2026 Day 1",
        isLiveContent: true,
        isLiveNow: true,
        isLiveFree: false,
        liveStatus: "live-now",
        subscriptionTiers: ["Live"],
        startDate: "2026-03-15T18:00:00Z",
        video: {
          videoId: 10011,
          title: "Holi 2026 Day 1",
          description: "",
          durationSeconds: 0,
          summary500: "",
          chapters: [],
        } as any,
      }),
      contentType: "live",
      user: makeUser(),
      subscriptionTier: "premium",
    }),
    expected: { type: "play", variant: "live", isStartingSoon: false },
  },
  {
    name: "Holi 2026 Day 1 - live-now, free live, anonymous user",
    input: makeInput({
      content: makeContent({
        contentId: 10012,
        contentTypeId: 5,
        title: "Holi 2026 Day 1",
        isLiveContent: true,
        isLiveNow: true,
        isLiveFree: true,
        liveStatus: "live-now",
        subscriptionTiers: [],
        startDate: "2026-03-15T18:00:00Z",
        video: {
          videoId: 10011,
          title: "Holi 2026 Day 1",
          description: "",
          durationSeconds: 0,
          summary500: "",
          chapters: [],
        } as any,
      }),
      contentType: "live",
      user: null,
      subscriptionTier: "unsubscribed",
    }),
    expected: { type: "play", variant: "live", isStartingSoon: false },
  },
  {
    name: "Pilgrimage with PPV + Premium tier - unsubscribed user",
    input: makeInput({
      content: makeContent({
        contentId: 500,
        contentTypeId: 3, // pilgrimage
        title: "Vrindavan Pilgrimage 2026",
        isLiveContent: false,
        subscriptionTiers: ["Premium"],
        ppvTag: "pilgrimage-vrindavan-2026",
        shopifyProductId: "gid://shopify/Product/789",
        shopifyVariantId: "gid://shopify/ProductVariant/101",
        shopifyPrice: 225,
        shopifyCurrencyCode: "EUR",
      }),
      contentType: "pilgrimage",
      user: makeUser(),
      subscriptionTier: "unsubscribed",
    }),
    expected: { type: "cta-choose-plan-and-ppv", hasPpv: true },
  },
  {
    name: "Pilgrimage with PPV + Premium tier - premium subscriber",
    input: makeInput({
      content: makeContent({
        contentId: 500,
        contentTypeId: 3,
        title: "Vrindavan Pilgrimage 2026",
        isLiveContent: false,
        subscriptionTiers: ["Premium"],
        ppvTag: "pilgrimage-vrindavan-2026",
        shopifyProductId: "gid://shopify/Product/789",
        shopifyVariantId: "gid://shopify/ProductVariant/101",
        shopifyPrice: 225,
      }),
      contentType: "pilgrimage",
      user: makeUser(),
      subscriptionTier: "premium",
    }),
    expected: { type: "play", variant: "watch", isStartingSoon: false },
  },
  {
    name: "Pilgrimage with PPV + Premium tier - live subscriber (no access via subscription, has PPV)",
    input: makeInput({
      content: makeContent({
        contentId: 500,
        contentTypeId: 3,
        title: "Vrindavan Pilgrimage 2026",
        isLiveContent: false,
        subscriptionTiers: ["Premium"],
        ppvTag: "pilgrimage-vrindavan-2026",
        shopifyProductId: "gid://shopify/Product/789",
        shopifyVariantId: "gid://shopify/ProductVariant/101",
        shopifyPrice: 225,
      }),
      contentType: "pilgrimage",
      user: makeUser({ ppv: ["pilgrimage-vrindavan-2026"] }),
      subscriptionTier: "live",
    }),
    expected: { type: "play", variant: "watch", isStartingSoon: false },
  },
];

// ---------------------------------------------------------------------------
// Combine all fixtures for convenience
// ---------------------------------------------------------------------------

export const allFixtures: CtaFixture[] = [
  ...accessFixtures,
  ...noAccessFixtures,
  ...accessEdgeCaseFixtures,
  ...realWorldFixtures,
];
