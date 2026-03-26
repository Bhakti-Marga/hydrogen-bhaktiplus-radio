/**
 * Test fixtures for hasAccessToContent — the pure access-check functions.
 *
 * There are TWO versions of hasAccessToContent:
 *   1. Client-side (content.ts) — used by hooks/components, takes (user, tier, content, options?)
 *   2. Server-side (server.utils.ts) — used by the video route loader, takes (user, tier, video, content)
 *
 * Both share the same underlying helpers (hasHierarchicalAccess, hasAccessViaPPV,
 * filterDisabledTiers). The fixtures here test the shared logic via the client-side
 * function, plus a separate section for server-side-specific behavior.
 *
 * To add a new test case, add a fixture to the appropriate array — it will
 * automatically be picked up by the parameterized tests.
 */

import type { Content, SubscriptionTier, User, Video } from "~/lib/types";

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

export function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    videoId: 1001,
    title: "Test Video",
    description: "",
    durationSeconds: 3600,
    summary500: "",
    chapters: [],
    ...overrides,
  } as Video;
}

// ---------------------------------------------------------------------------
// Client-side fixture type (content.ts hasAccessToContent)
// ---------------------------------------------------------------------------

export interface AccessFixture {
  /** Human-readable name for the test case */
  name: string;
  /** User (null = anonymous) */
  user: User | null;
  /** User's current subscription tier */
  subscriptionTier: SubscriptionTier | undefined;
  /** The content being accessed */
  content: Content;
  /** Optional prelaunch/options */
  options?: { isPrelaunch?: boolean };
  /** Expected result */
  expected: boolean;
}

// ---------------------------------------------------------------------------
// Server-side fixture type (server.utils.ts hasAccessToContent)
// ---------------------------------------------------------------------------

export interface ServerAccessFixture {
  /** Human-readable name for the test case */
  name: string;
  /** User (null = anonymous) */
  user: User | null;
  /** User's current subscription tier */
  subscriptionTier: SubscriptionTier;
  /** The video being accessed */
  video: Video;
  /** The content record the video belongs to */
  content: Content;
  /** Expected result */
  expected: boolean;
}

// ---------------------------------------------------------------------------
// FREE CONTENT: isLiveFree bypass
// ---------------------------------------------------------------------------

export const freeContentFixtures: AccessFixture[] = [
  {
    name: "isLiveFree content → grant access (anonymous, unsubscribed)",
    user: null,
    subscriptionTier: "unsubscribed",
    content: makeContent({ isLiveFree: true }),
    expected: true,
  },
  {
    name: "isLiveFree content → grant access (logged in, unsubscribed)",
    user: makeUser(),
    subscriptionTier: "unsubscribed",
    content: makeContent({ isLiveFree: true }),
    expected: true,
  },
  {
    name: "isLiveFree content → grant access even with subscription tiers set",
    user: null,
    subscriptionTier: "unsubscribed",
    content: makeContent({ isLiveFree: true, subscriptionTiers: ["Premium"] }),
    expected: true,
  },
];

// ---------------------------------------------------------------------------
// NO USER: anonymous access denied
// ---------------------------------------------------------------------------

export const noUserFixtures: AccessFixture[] = [
  {
    name: "anonymous user + non-free content → deny",
    user: null,
    subscriptionTier: "unsubscribed",
    content: makeContent({ subscriptionTiers: ["Live"] }),
    expected: false,
  },
  {
    name: "anonymous user + PPV content → deny (PPV requires user profile)",
    user: null,
    subscriptionTier: "unsubscribed",
    content: makeContent({
      ppvTag: "pilgrimage-2026",
      subscriptionTiers: ["Premium"],
    }),
    expected: false,
  },
  {
    name: "anonymous user + content with no tiers → deny",
    user: null,
    subscriptionTier: undefined,
    content: makeContent({ subscriptionTiers: null }),
    expected: false,
  },
];

// ---------------------------------------------------------------------------
// PPV ACCESS: pay-per-view tag matching
// ---------------------------------------------------------------------------

export const ppvFixtures: AccessFixture[] = [
  {
    name: "user has matching PPV tag → grant access",
    user: makeUser({ ppv: ["pilgrimage-holi-2026"] }),
    subscriptionTier: "unsubscribed",
    content: makeContent({
      ppvTag: "pilgrimage-holi-2026",
      subscriptionTiers: ["Premium"],
    }),
    expected: true,
  },
  {
    name: "user has PPV tag but it doesn't match content → deny (falls to subscription check)",
    user: makeUser({ ppv: ["pilgrimage-other-2026"] }),
    subscriptionTier: "unsubscribed",
    content: makeContent({
      ppvTag: "pilgrimage-holi-2026",
      subscriptionTiers: ["Premium"],
    }),
    expected: false,
  },
  {
    name: "user has multiple PPV tags, one matches → grant access",
    user: makeUser({
      ppv: ["pilgrimage-other", "pilgrimage-holi-2026", "talk-special"],
    }),
    subscriptionTier: "unsubscribed",
    content: makeContent({
      ppvTag: "pilgrimage-holi-2026",
      subscriptionTiers: ["Premium"],
    }),
    expected: true,
  },
  {
    name: "user has empty PPV array + content has PPV tag → deny",
    user: makeUser({ ppv: [] }),
    subscriptionTier: "unsubscribed",
    content: makeContent({
      ppvTag: "pilgrimage-holi-2026",
      subscriptionTiers: ["Premium"],
    }),
    expected: false,
  },
  {
    name: "content has no PPV tag + user has PPV tags → falls to subscription check",
    user: makeUser({ ppv: ["some-ppv-tag"] }),
    subscriptionTier: "unsubscribed",
    content: makeContent({
      ppvTag: null,
      subscriptionTiers: ["Premium"],
    }),
    expected: false,
  },
  {
    name: "PPV access works regardless of subscription tier",
    user: makeUser({ ppv: ["pilgrimage-holi-2026"] }),
    subscriptionTier: "live",
    content: makeContent({
      ppvTag: "pilgrimage-holi-2026",
      subscriptionTiers: ["Supporter"], // higher than user's tier
    }),
    expected: true,
  },
];

// ---------------------------------------------------------------------------
// SUBSCRIPTION TIER HIERARCHY: live(1) < premium(2) < supporter(3)
// ---------------------------------------------------------------------------

export const tierHierarchyFixtures: AccessFixture[] = [
  // ---- Exact tier match ----
  {
    name: "live subscriber + content requires Live → grant",
    user: makeUser(),
    subscriptionTier: "live",
    content: makeContent({ subscriptionTiers: ["Live"] }),
    expected: true,
  },
  {
    name: "premium subscriber + content requires Premium → grant",
    user: makeUser(),
    subscriptionTier: "premium",
    content: makeContent({ subscriptionTiers: ["Premium"] }),
    expected: true,
  },
  {
    name: "supporter subscriber + content requires Supporter → grant",
    user: makeUser(),
    subscriptionTier: "supporter",
    content: makeContent({ subscriptionTiers: ["Supporter"] }),
    expected: true,
  },

  // ---- Higher tier accesses lower tier content ----
  {
    name: "premium subscriber + content requires Live → grant (higher tier)",
    user: makeUser(),
    subscriptionTier: "premium",
    content: makeContent({ subscriptionTiers: ["Live"] }),
    expected: true,
  },
  {
    name: "supporter subscriber + content requires Live → grant (highest tier)",
    user: makeUser(),
    subscriptionTier: "supporter",
    content: makeContent({ subscriptionTiers: ["Live"] }),
    expected: true,
  },
  {
    name: "supporter subscriber + content requires Premium → grant (higher tier)",
    user: makeUser(),
    subscriptionTier: "supporter",
    content: makeContent({ subscriptionTiers: ["Premium"] }),
    expected: true,
  },

  // ---- Lower tier denied for higher tier content ----
  {
    name: "live subscriber + content requires Premium → deny",
    user: makeUser(),
    subscriptionTier: "live",
    content: makeContent({ subscriptionTiers: ["Premium"] }),
    expected: false,
  },
  {
    name: "live subscriber + content requires Supporter → deny",
    user: makeUser(),
    subscriptionTier: "live",
    content: makeContent({ subscriptionTiers: ["Supporter"] }),
    expected: false,
  },
  {
    name: "premium subscriber + content requires Supporter → deny",
    user: makeUser(),
    subscriptionTier: "premium",
    content: makeContent({ subscriptionTiers: ["Supporter"] }),
    expected: false,
  },

  // ---- Unsubscribed denied for all tiers ----
  {
    name: "unsubscribed + content requires Live → deny",
    user: makeUser(),
    subscriptionTier: "unsubscribed",
    content: makeContent({ subscriptionTiers: ["Live"] }),
    expected: false,
  },
  {
    name: "unsubscribed + content requires Premium → deny",
    user: makeUser(),
    subscriptionTier: "unsubscribed",
    content: makeContent({ subscriptionTiers: ["Premium"] }),
    expected: false,
  },

  // ---- Content with multiple required tiers (user needs any one) ----
  {
    name: "live subscriber + content requires [Live, Premium] → grant (matches Live)",
    user: makeUser(),
    subscriptionTier: "live",
    content: makeContent({ subscriptionTiers: ["Live", "Premium"] }),
    expected: true,
  },
  {
    name: "unsubscribed + content requires [Live, Premium] → deny (matches neither)",
    user: makeUser(),
    subscriptionTier: "unsubscribed",
    content: makeContent({ subscriptionTiers: ["Live", "Premium"] }),
    expected: false,
  },
];

// ---------------------------------------------------------------------------
// NO SUBSCRIPTION TIERS: content without tier requirements
// ---------------------------------------------------------------------------

export const noTiersFixtures: AccessFixture[] = [
  {
    name: "content has null subscriptionTiers → deny (no subscription path)",
    user: makeUser(),
    subscriptionTier: "premium",
    content: makeContent({ subscriptionTiers: null }),
    expected: false,
  },
  {
    name: "content has empty subscriptionTiers → deny (no subscription path)",
    user: makeUser(),
    subscriptionTier: "premium",
    content: makeContent({ subscriptionTiers: [] }),
    expected: false,
  },
];

// ---------------------------------------------------------------------------
// DISABLED TIERS: supporter is hidden from UI but still grants access
// DISABLED_CONTENT_TIERS controls UI visibility (plan selection, upgrade
// prompts), NOT access checks. Supporter subscribers can access content.
// ---------------------------------------------------------------------------

export const disabledTierFixtures: AccessFixture[] = [
  {
    name: "supporter subscriber + content requires only [Supporter] → grant (disabled tiers don't block access)",
    user: makeUser(),
    subscriptionTier: "supporter",
    content: makeContent({ subscriptionTiers: ["Supporter"] }),
    expected: true,
  },
  {
    name: "content requires [Premium, Supporter] → premium user granted (matches Premium)",
    user: makeUser(),
    subscriptionTier: "premium",
    content: makeContent({ subscriptionTiers: ["Premium", "Supporter"] }),
    expected: true,
  },
  {
    name: "content requires [Premium, Supporter] → live user denied (both tiers too high)",
    user: makeUser(),
    subscriptionTier: "live",
    content: makeContent({ subscriptionTiers: ["Premium", "Supporter"] }),
    expected: false,
  },
  {
    name: "content requires only [Supporter] → premium user denied (premium < supporter)",
    user: makeUser(),
    subscriptionTier: "premium",
    content: makeContent({ subscriptionTiers: ["Supporter"] }),
    expected: false,
  },
  {
    name: "content requires only [Supporter] → unsubscribed user denied",
    user: makeUser(),
    subscriptionTier: "unsubscribed",
    content: makeContent({ subscriptionTiers: ["Supporter"] }),
    expected: false,
  },
];

// ---------------------------------------------------------------------------
// PRELAUNCH BYPASS: logged-in users get free access to Lives during prelaunch
// ---------------------------------------------------------------------------

export const prelaunchFixtures: AccessFixture[] = [
  {
    name: "prelaunch + live content type + logged in → grant (free access)",
    user: makeUser(),
    subscriptionTier: "unsubscribed",
    content: makeContent({
      contentTypeId: 5, // live
      subscriptionTiers: ["Live"],
    }),
    options: { isPrelaunch: true },
    expected: true,
  },
  {
    name: "prelaunch + non-live content type (satsang) + logged in → deny (no prelaunch bypass)",
    user: makeUser(),
    subscriptionTier: "unsubscribed",
    content: makeContent({
      contentTypeId: 1, // satsang
      subscriptionTiers: ["Premium"],
    }),
    options: { isPrelaunch: true },
    expected: false,
  },
  {
    name: "prelaunch + live content type + anonymous → deny (must be logged in)",
    user: null,
    subscriptionTier: "unsubscribed",
    content: makeContent({
      contentTypeId: 5,
      subscriptionTiers: ["Live"],
    }),
    options: { isPrelaunch: true },
    expected: false,
  },
  {
    name: "prelaunch + pilgrimage content type → deny (only lives are free)",
    user: makeUser(),
    subscriptionTier: "unsubscribed",
    content: makeContent({
      contentTypeId: 3, // pilgrimage
      subscriptionTiers: ["Premium"],
    }),
    options: { isPrelaunch: true },
    expected: false,
  },
  {
    name: "not prelaunch + live content type + unsubscribed → deny (prelaunch not active)",
    user: makeUser(),
    subscriptionTier: "unsubscribed",
    content: makeContent({
      contentTypeId: 5,
      subscriptionTiers: ["Live"],
    }),
    options: { isPrelaunch: false },
    expected: false,
  },
];

// ---------------------------------------------------------------------------
// SERVER-SIDE FIXTURES (server.utils.ts hasAccessToContent)
// The server version takes (user, tier, video, content) and does NOT handle
// isLiveFree or prelaunch — those are handled by the caller (video route).
// ---------------------------------------------------------------------------

export const serverFixtures: ServerAccessFixture[] = [
  {
    name: "anonymous user → deny",
    user: null,
    subscriptionTier: "unsubscribed",
    video: makeVideo(),
    content: makeContent({ subscriptionTiers: ["Live"] }),
    expected: false,
  },
  {
    name: "premium subscriber + content requires Live → grant",
    user: makeUser(),
    subscriptionTier: "premium",
    video: makeVideo(),
    content: makeContent({ subscriptionTiers: ["Live"] }),
    expected: true,
  },
  {
    name: "live subscriber + content requires Premium → deny",
    user: makeUser(),
    subscriptionTier: "live",
    video: makeVideo(),
    content: makeContent({ subscriptionTiers: ["Premium"] }),
    expected: false,
  },
  {
    name: "PPV match → grant access regardless of subscription",
    user: makeUser({ ppv: ["pilgrimage-holi-2026"] }),
    subscriptionTier: "unsubscribed",
    video: makeVideo(),
    content: makeContent({
      ppvTag: "pilgrimage-holi-2026",
      subscriptionTiers: ["Premium"],
    }),
    expected: true,
  },
  {
    name: "content has no subscription tiers → deny (no subscription path)",
    user: makeUser(),
    subscriptionTier: "premium",
    video: makeVideo(),
    content: makeContent({ subscriptionTiers: null }),
    expected: false,
  },
  {
    name: "content has empty subscription tiers → deny",
    user: makeUser(),
    subscriptionTier: "premium",
    video: makeVideo(),
    content: makeContent({ subscriptionTiers: [] }),
    expected: false,
  },
  {
    name: "supporter subscriber + content requires [Supporter] → grant (disabled tiers don't block access)",
    user: makeUser(),
    subscriptionTier: "supporter",
    video: makeVideo(),
    content: makeContent({ subscriptionTiers: ["Supporter"] }),
    expected: true,
  },
  {
    name: "content requires [Premium, Supporter] → premium user granted (matches Premium)",
    user: makeUser(),
    subscriptionTier: "premium",
    video: makeVideo(),
    content: makeContent({ subscriptionTiers: ["Premium", "Supporter"] }),
    expected: true,
  },
];

// ---------------------------------------------------------------------------
// Combine all client-side fixtures
// ---------------------------------------------------------------------------

export const allClientFixtures: AccessFixture[] = [
  ...freeContentFixtures,
  ...noUserFixtures,
  ...ppvFixtures,
  ...tierHierarchyFixtures,
  ...noTiersFixtures,
  ...disabledTierFixtures,
  ...prelaunchFixtures,
];
