/**
 * Tests for resolveSeriesCtaState — the series-level CTA decision function.
 *
 * This tests "one level up" from resolveCtaState: given a series content,
 * an optional activeLive, and user state, it verifies the render state
 * including:
 *
 * 1. Which content/type/videoId to feed to ContentButtons
 * 2. The resolved CTA state (play, upcoming-live, cta-choose-plan, etc.)
 *
 * The fixtures cover the matrix of:
 *   activeLive (null | present) × user access (has | lacks) × live status
 */

import { describe, it, expect } from "vitest";
import { resolveSeriesCtaState } from "../resolveSeriesCtaState";
import type { SeriesCtaInput } from "../resolveSeriesCtaState";
import type { Content, SubscriptionTier, User } from "~/lib/types";

// ---------------------------------------------------------------------------
// Test helpers — mirrors the existing fixtures.ts pattern
// ---------------------------------------------------------------------------

const DEFAULT_VIDEO = {
  videoId: 1001,
  title: "Test Video",
  description: "",
  durationSeconds: 3600,
  summary500: "",
  chapters: [],
};

const LIVE_VIDEO = {
  videoId: 9001,
  title: "Live Stream",
  description: "",
  durationSeconds: 0,
  summary500: "",
  chapters: [],
};

function makeContent(overrides: Partial<Content> = {}): Content {
  return {
    contentId: 100,
    contentTypeId: 3, // pilgrimage
    title: "Test Pilgrimage",
    subtitle: "",
    thumbnailUrl: "",
    thumbnailUrlVertical: "",
    bannerImageUrl: "",
    shopifyProductId: "",
    shopifyVariantId: "",
    subscriptionTiers: ["Premium"],
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
    videoCount: 5,
    startDate: "",
    endDate: "",
    video: DEFAULT_VIDEO as any,
    isSatsangOfDay: false,
    ...overrides,
  } as Content;
}

function makeLive(overrides: Partial<Content> = {}): Content {
  return makeContent({
    contentId: 200,
    contentTypeId: 5, // live
    title: "Live Event",
    isLiveContent: true,
    isLiveFree: false,
    liveStatus: "live-now",
    subscriptionTiers: ["Live"],
    video: LIVE_VIDEO as any,
    ...overrides,
  });
}

function makeUser(overrides: Partial<User> = {}): User {
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

function makeSeriesInput(
  overrides: Partial<SeriesCtaInput> = {},
): SeriesCtaInput {
  return {
    content: makeContent(),
    contentType: "pilgrimage",
    activeLive: null,
    user: makeUser(),
    subscriptionTier: "premium" as SubscriptionTier,
    isPrelaunchActive: false,
    seriesPlayVideoId: 1001,
    hasFeaturedVideo: false,
    seriesFeaturedVideoMarker: null,
    watchProgressSeconds: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("resolveSeriesCtaState", () => {
  // =========================================================================
  // No activeLive — series content used directly
  // =========================================================================
  describe("No activeLive (null)", () => {
    it("user has access → play watch (default series button)", () => {
      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "premium",
          activeLive: null,
        }),
      );

      expect(result.usedLiveForCta).toBe(false);
      expect(result.ctaContentType).toBe("pilgrimage");
      expect(result.ctaVideoId).toBe(1001);
      expect(result.ctaState).toEqual({
        type: "play",
        variant: "watch",
        isStartingSoon: false,
      });
    });

    it("user lacks access → cta-choose-plan from series content tiers", () => {
      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "unsubscribed",
          activeLive: null,
        }),
      );

      expect(result.usedLiveForCta).toBe(false);
      expect(result.ctaContentType).toBe("pilgrimage");
      expect(result.ctaState).toEqual({
        type: "cta-choose-plan",
        hasPpv: false,
      });
    });

    it("user lacks access + series has PPV → cta-choose-plan-and-ppv", () => {
      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({
            subscriptionTiers: ["Premium"],
            ppvTag: "pilgrimage-holi-2026",
            shopifyProductId: "gid://shopify/Product/123",
            shopifyVariantId: "gid://shopify/ProductVariant/456",
            shopifyPrice: 225,
          }),
          subscriptionTier: "unsubscribed",
          activeLive: null,
        }),
      );

      expect(result.usedLiveForCta).toBe(false);
      expect(result.ctaState).toEqual({
        type: "cta-choose-plan-and-ppv",
        hasPpv: true,
      });
    });

    it("series featured video marker 'continue' → series-continue", () => {
      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "premium",
          activeLive: null,
          hasFeaturedVideo: true,
          seriesFeaturedVideoMarker: "continue",
        }),
      );

      expect(result.usedLiveForCta).toBe(false);
      expect(result.resolvedSeriesMarker).toBe("continue");
      expect(result.ctaState).toEqual({
        type: "play",
        variant: "series-continue",
        isStartingSoon: false,
      });
    });

    it("series featured video marker 'watch-next' → series-watch", () => {
      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "premium",
          activeLive: null,
          hasFeaturedVideo: true,
          seriesFeaturedVideoMarker: "watch-next",
        }),
      );

      expect(result.usedLiveForCta).toBe(false);
      expect(result.resolvedSeriesMarker).toBe("watch-next");
      expect(result.ctaState).toEqual({
        type: "play",
        variant: "series-watch",
        isStartingSoon: false,
      });
    });

    it("anonymous user + series requires Premium → cta-choose-plan", () => {
      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          user: null,
          subscriptionTier: "unsubscribed",
          activeLive: null,
        }),
      );

      expect(result.usedLiveForCta).toBe(false);
      expect(result.ctaState).toEqual({
        type: "cta-choose-plan",
        hasPpv: false,
      });
    });
  });

  // =========================================================================
  // activeLive present + user HAS access to live → live CTA
  // =========================================================================
  describe("activeLive present + user has access to live", () => {
    it("live-now + free live → play live (uses live content)", () => {
      const live = makeLive({
        liveStatus: "live-now",
        isLiveFree: true,
        subscriptionTiers: [],
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "unsubscribed",
          user: null,
          activeLive: live,
        }),
      );

      expect(result.usedLiveForCta).toBe(true);
      expect(result.ctaContent).toBe(live);
      expect(result.ctaContentType).toBe("live");
      expect(result.ctaVideoId).toBe(LIVE_VIDEO.videoId);
      expect(result.ctaState).toEqual({
        type: "play",
        variant: "live",
        isStartingSoon: false,
      });
    });

    it("live-now + subscription access → play live", () => {
      const live = makeLive({
        liveStatus: "live-now",
        subscriptionTiers: ["Live"],
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "premium",
          activeLive: live,
        }),
      );

      expect(result.usedLiveForCta).toBe(true);
      expect(result.ctaContentType).toBe("live");
      expect(result.ctaState).toEqual({
        type: "play",
        variant: "live",
        isStartingSoon: false,
      });
    });

    it("scheduled live + user has access → upcoming-live", () => {
      const live = makeLive({
        liveStatus: "scheduled",
        subscriptionTiers: ["Live"],
        startDate: "2026-03-15T18:00:00Z",
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "premium",
          activeLive: live,
        }),
      );

      expect(result.usedLiveForCta).toBe(true);
      expect(result.ctaState).toEqual({ type: "upcoming-live" });
    });

    it("live-preview + user has access → play starting-soon", () => {
      const live = makeLive({
        liveStatus: "live-preview",
        subscriptionTiers: ["Live"],
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "supporter",
          activeLive: live,
        }),
      );

      expect(result.usedLiveForCta).toBe(true);
      expect(result.ctaState).toEqual({
        type: "play",
        variant: "starting-soon",
        isStartingSoon: true,
      });
    });

    it("vod-ready + user has access → play replay", () => {
      const live = makeLive({
        liveStatus: "vod-ready",
        subscriptionTiers: ["Live"],
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "premium",
          activeLive: live,
        }),
      );

      expect(result.usedLiveForCta).toBe(true);
      expect(result.ctaState).toEqual({
        type: "play",
        variant: "replay",
        isStartingSoon: false,
      });
    });

    it("vod-inprogress (non-series) + user has access → replay-coming-soon", () => {
      const live = makeLive({
        liveStatus: "vod-inprogress",
        isOngoingSeries: false,
        subscriptionTiers: ["Live"],
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "premium",
          activeLive: live,
        }),
      );

      expect(result.usedLiveForCta).toBe(true);
      expect(result.ctaState).toEqual({ type: "replay-coming-soon" });
    });

    it("PPV access to live → uses live content for CTA", () => {
      const live = makeLive({
        liveStatus: "live-now",
        subscriptionTiers: ["Premium"],
        ppvTag: "live-event-2026",
        shopifyProductId: "gid://shopify/Product/789",
        shopifyVariantId: "gid://shopify/ProductVariant/101",
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "unsubscribed",
          user: makeUser({ ppv: ["live-event-2026"] }),
          activeLive: live,
        }),
      );

      expect(result.usedLiveForCta).toBe(true);
      expect(result.ctaState).toEqual({
        type: "play",
        variant: "live",
        isStartingSoon: false,
      });
    });

    it("suppresses series markers when using live", () => {
      const live = makeLive({
        liveStatus: "live-now",
        isLiveFree: true,
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          activeLive: live,
          hasFeaturedVideo: true,
          seriesFeaturedVideoMarker: "continue",
        }),
      );

      expect(result.usedLiveForCta).toBe(true);
      expect(result.resolvedSeriesMarker).toBeUndefined();
    });

    it("suppresses series watch progress when using live", () => {
      const live = makeLive({
        liveStatus: "live-now",
        isLiveFree: true,
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          activeLive: live,
          watchProgressSeconds: 500,
        }),
      );

      expect(result.usedLiveForCta).toBe(true);
      // Should get live variant, not continue-watching
      expect(result.ctaState).toEqual({
        type: "play",
        variant: "live",
        isStartingSoon: false,
      });
    });
  });

  // =========================================================================
  // activeLive present + user LACKS access to live → falls back to series CTA
  // =========================================================================
  describe("activeLive present + user lacks access to live → series content CTA", () => {
    it("unsubscribed user + live requires Live tier → falls back to series choose-plan", () => {
      const live = makeLive({
        liveStatus: "live-now",
        subscriptionTiers: ["Live"],
        isLiveFree: false,
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "unsubscribed",
          activeLive: live,
        }),
      );

      expect(result.usedLiveForCta).toBe(false);
      expect(result.ctaContent).not.toBe(live);
      expect(result.ctaContentType).toBe("pilgrimage");
      // CTA is based on the SERIES content's tiers (Premium), not the live's (Live)
      expect(result.ctaState).toEqual({
        type: "cta-choose-plan",
        hasPpv: false,
      });
    });

    it("anonymous user + live requires subscription → falls back to series CTA", () => {
      const live = makeLive({
        liveStatus: "live-now",
        subscriptionTiers: ["Live"],
        isLiveFree: false,
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({
            subscriptionTiers: ["Premium"],
            ppvTag: "pilgrimage-2026",
            shopifyProductId: "gid://shopify/Product/123",
            shopifyVariantId: "gid://shopify/ProductVariant/456",
            shopifyPrice: 225,
          }),
          user: null,
          subscriptionTier: "unsubscribed",
          activeLive: live,
        }),
      );

      expect(result.usedLiveForCta).toBe(false);
      expect(result.ctaContentType).toBe("pilgrimage");
      // Series content has both Premium tiers and PPV
      expect(result.ctaState).toEqual({
        type: "cta-choose-plan-and-ppv",
        hasPpv: true,
      });
    });

    it("live subscriber + live requires Premium → falls back to series upgrade-plan", () => {
      const live = makeLive({
        liveStatus: "live-now",
        subscriptionTiers: ["Premium"],
        isLiveFree: false,
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          // Series also requires Premium
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "live",
          activeLive: live,
        }),
      );

      expect(result.usedLiveForCta).toBe(false);
      expect(result.ctaContentType).toBe("pilgrimage");
      expect(result.ctaState).toEqual({
        type: "cta-upgrade-plan",
        hasPpv: false,
      });
    });

    it("preserves series markers when falling back to series content", () => {
      const live = makeLive({
        liveStatus: "live-now",
        subscriptionTiers: ["Live"],
        isLiveFree: false,
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "unsubscribed",
          activeLive: live,
          hasFeaturedVideo: true,
          seriesFeaturedVideoMarker: "continue",
        }),
      );

      expect(result.usedLiveForCta).toBe(false);
      // Marker preserved (though no-access path won't use it, it's still resolved)
      expect(result.resolvedSeriesMarker).toBe("continue");
    });

    it("uses series video ID (not live video ID) when falling back", () => {
      const live = makeLive({
        liveStatus: "live-now",
        subscriptionTiers: ["Live"],
        isLiveFree: false,
        video: { ...LIVE_VIDEO, videoId: 9999 } as any,
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "unsubscribed",
          seriesPlayVideoId: 1001,
          activeLive: live,
        }),
      );

      expect(result.usedLiveForCta).toBe(false);
      expect(result.ctaVideoId).toBe(1001);
    });

    it("series PPV-only content + no access to live → cta-ppv-only from series", () => {
      const live = makeLive({
        liveStatus: "live-now",
        subscriptionTiers: ["Live"],
        isLiveFree: false,
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({
            subscriptionTiers: null,
            ppvTag: "pilgrimage-2026",
            shopifyProductId: "gid://shopify/Product/123",
            shopifyVariantId: "gid://shopify/ProductVariant/456",
            shopifyPrice: 225,
          }),
          subscriptionTier: "unsubscribed",
          activeLive: live,
        }),
      );

      expect(result.usedLiveForCta).toBe(false);
      expect(result.ctaState).toEqual({ type: "cta-ppv-only" });
    });
  });

  // =========================================================================
  // Commentary content type
  // =========================================================================
  describe("commentary content type", () => {
    it("no activeLive + user has access → play with commentary type", () => {
      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({
            contentTypeId: 2,
            subscriptionTiers: ["Premium"],
          }),
          contentType: "commentary",
          subscriptionTier: "premium",
          activeLive: null,
        }),
      );

      expect(result.ctaContentType).toBe("commentary");
      expect(result.ctaState).toEqual({
        type: "play",
        variant: "watch",
        isStartingSoon: false,
      });
    });

    it("activeLive + has access → switches to live content type", () => {
      const live = makeLive({
        liveStatus: "live-now",
        isLiveFree: true,
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({
            contentTypeId: 2,
            subscriptionTiers: ["Premium"],
          }),
          contentType: "commentary",
          subscriptionTier: "premium",
          activeLive: live,
        }),
      );

      expect(result.ctaContentType).toBe("live");
    });

    it("activeLive + lacks access → stays commentary content type", () => {
      const live = makeLive({
        liveStatus: "live-now",
        subscriptionTiers: ["Live"],
        isLiveFree: false,
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({
            contentTypeId: 2,
            subscriptionTiers: ["Premium"],
          }),
          contentType: "commentary",
          subscriptionTier: "unsubscribed",
          activeLive: live,
        }),
      );

      expect(result.ctaContentType).toBe("commentary");
    });
  });

  // =========================================================================
  // Edge cases & regressions
  // =========================================================================
  describe("Edge cases", () => {
    it("activeLive with no video → usedLiveForCta true but no videoId", () => {
      const live = makeLive({
        liveStatus: "scheduled",
        isLiveFree: true,
        video: null as any,
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "premium",
          activeLive: live,
        }),
      );

      expect(result.usedLiveForCta).toBe(true);
      expect(result.ctaVideoId).toBeUndefined();
      // Scheduled → upcoming-live (doesn't need videoId)
      expect(result.ctaState).toEqual({ type: "upcoming-live" });
    });

    it("user has access to series but not live → falls back to series play", () => {
      const live = makeLive({
        liveStatus: "live-now",
        subscriptionTiers: ["Premium"],
        isLiveFree: false,
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          // Series requires Live tier, user has live subscription
          content: makeContent({ subscriptionTiers: ["Live"] }),
          subscriptionTier: "live",
          activeLive: live,
        }),
      );

      // User has access to the series (live tier >= Live requirement)
      // but NOT to the live (live tier < Premium requirement)
      expect(result.usedLiveForCta).toBe(false);
      expect(result.ctaContentType).toBe("pilgrimage");
      // User HAS access to the series content → play button, not CTA
      expect(result.ctaState).toEqual({
        type: "play",
        variant: "watch",
        isStartingSoon: false,
      });
    });

    it("user has access to live (via PPV) but not to series → uses live CTA", () => {
      const live = makeLive({
        liveStatus: "live-now",
        subscriptionTiers: ["Premium"],
        ppvTag: "live-event-2026",
        shopifyProductId: "gid://shopify/Product/789",
        shopifyVariantId: "gid://shopify/ProductVariant/101",
      });

      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Supporter"] }),
          subscriptionTier: "unsubscribed",
          user: makeUser({ ppv: ["live-event-2026"] }),
          activeLive: live,
        }),
      );

      // User has PPV access to the live → uses live for CTA
      expect(result.usedLiveForCta).toBe(true);
      expect(result.ctaState).toEqual({
        type: "play",
        variant: "live",
        isStartingSoon: false,
      });
    });

    it("series has no video and no featured video → no-video when activeLive absent", () => {
      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({
            subscriptionTiers: ["Premium"],
            video: null as any,
          }),
          subscriptionTier: "premium",
          seriesPlayVideoId: undefined,
          activeLive: null,
        }),
      );

      expect(result.ctaState).toEqual({ type: "no-video" });
    });

    it("hasFeaturedVideo false → series marker not passed even if provided", () => {
      const result = resolveSeriesCtaState(
        makeSeriesInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "premium",
          activeLive: null,
          hasFeaturedVideo: false,
          seriesFeaturedVideoMarker: "continue",
        }),
      );

      expect(result.resolvedSeriesMarker).toBeUndefined();
      expect(result.ctaState).toEqual({
        type: "play",
        variant: "watch",
        isStartingSoon: false,
      });
    });
  });
});
