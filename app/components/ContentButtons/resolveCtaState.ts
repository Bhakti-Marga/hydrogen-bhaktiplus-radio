/**
 * Pure decision function for CTA button resolution.
 *
 * Encapsulates the entire ContentButtons + CTAButtons branching logic
 * as a pure function with no React dependencies. This enables:
 * - Unit testing of every CTA state without rendering components
 * - Clear documentation of the decision tree
 * - Separation of "what to show" from "how to render it"
 *
 * The returned CtaState is a discriminated union that maps 1:1
 * to the button components rendered by ContentButtons and CTAButtons.
 */

import {
  hasAccessToContent,
  userHasAnyPlan,
  isPPVContent,
  getSubscriptionTiersFromContent,
} from "~/lib/utils/content";
import { isContentFreeInPrelaunch } from "~/lib/utils/prelaunch";
import type { Content, ContentType, SubscriptionTier, User } from "~/lib/types";
import type { SeriesFeaturedVideoMarker } from "~/lib/api/types";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CtaStateInput {
  content: Content;
  contentType: ContentType;
  user: User | null;
  subscriptionTier: SubscriptionTier;
  isPrelaunchActive: boolean;
  /** Whether a videoId is available (either provided or from content.video) */
  hasVideoId: boolean;
  /** Whether an onPlayClick callback was provided (modal-based playback) */
  hasOnPlayClick: boolean;
  /** Watch progress in seconds for the current video (null = no progress) */
  watchProgressSeconds: number | null;
  /** Series featured video marker from /next-video endpoint */
  seriesFeaturedVideoMarker?: SeriesFeaturedVideoMarker | null;
}

// ---------------------------------------------------------------------------
// Output types (discriminated union)
// ---------------------------------------------------------------------------

/**
 * Represents the resolved CTA state.
 * Each variant maps to a specific button component or combination.
 */
export type CtaState =
  // --- Access path: user has access ---
  | { type: "play"; variant: "live"; isStartingSoon: false }
  | { type: "play"; variant: "starting-soon"; isStartingSoon: true }
  | { type: "play"; variant: "replay"; isStartingSoon: false }
  | { type: "play"; variant: "series-continue"; isStartingSoon: false }
  | { type: "play"; variant: "series-watch"; isStartingSoon: false }
  | { type: "play"; variant: "continue-watching"; isStartingSoon: false }
  | { type: "play"; variant: "watch"; isStartingSoon: false }
  | { type: "upcoming-live" }
  | { type: "replay-coming-soon" }
  | { type: "no-video" }

  // --- No-access path: user needs to subscribe/purchase ---
  | { type: "cta-choose-plan"; hasPpv: false }
  | { type: "cta-upgrade-plan"; hasPpv: false }
  | { type: "cta-choose-plan-and-ppv"; hasPpv: true }
  | { type: "cta-upgrade-plan-and-ppv"; hasPpv: true }
  | { type: "cta-ppv-only" }
  | { type: "cta-none" };

// ---------------------------------------------------------------------------
// Pure decision function
// ---------------------------------------------------------------------------

export function resolveCtaState(input: CtaStateInput): CtaState {
  const {
    content,
    contentType,
    user,
    subscriptionTier,
    isPrelaunchActive,
    hasVideoId,
    hasOnPlayClick,
    watchProgressSeconds,
    seriesFeaturedVideoMarker,
  } = input;

  // ----- Step 1: Determine access -----
  const isLiveFree = content.isLiveFree;
  const isFreeInPrelaunch =
    isPrelaunchActive && !!user && isContentFreeInPrelaunch(contentType);
  const hasAccess = hasAccessToContent(user, subscriptionTier, content);
  const userHasAccess = isLiveFree || isFreeInPrelaunch || hasAccess;

  // ----- Step 2: No access -> CTA buttons -----
  if (!userHasAccess) {
    return resolveNoAccessState(content, subscriptionTier);
  }

  // ----- Step 3: Has access -> resolve based on liveStatus -----
  const liveStatus = content.liveStatus as
    | "scheduled"
    | "live-preview"
    | "live-now"
    | "vod-inprogress"
    | "vod-ready"
    | null
    | undefined;

  if (liveStatus) {
    switch (liveStatus) {
      case "scheduled":
        return { type: "upcoming-live" };

      case "live-preview":
        return { type: "play", variant: "starting-soon", isStartingSoon: true };

      case "vod-inprogress":
        if (content.isOngoingSeries) {
          // Ongoing series can still play past episodes
          break;
        }
        return { type: "replay-coming-soon" };

      case "live-now":
        return { type: "play", variant: "live", isStartingSoon: false };

      case "vod-ready":
        return { type: "play", variant: "replay", isStartingSoon: false };
    }
  } else {
    // Fallback to boolean flags for backwards compatibility
    const isPreview = content.isPreview;
    const isLive = content.isLiveContent;
    const isUpcoming = content.isUpcoming;

    if (isPreview || (isLive && isUpcoming)) {
      return { type: "upcoming-live" };
    }
  }

  // ----- Step 4: Play button (has access, not in a special live state) -----
  if (!hasVideoId && !hasOnPlayClick) {
    return { type: "no-video" };
  }

  // Determine play button variant
  return resolvePlayVariant(
    content,
    liveStatus,
    watchProgressSeconds,
    seriesFeaturedVideoMarker,
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolvePlayVariant(
  content: Content,
  liveStatus: string | null | undefined,
  watchProgressSeconds: number | null,
  seriesFeaturedVideoMarker?: SeriesFeaturedVideoMarker | null,
): CtaState {
  const isCurrentlyLive =
    liveStatus === "live-now" ||
    (content.isLiveContent && !content.isUpcoming && !content.isPreview);

  if (isCurrentlyLive) {
    return { type: "play", variant: "live", isStartingSoon: false };
  }

  const isReplay = liveStatus === "vod-ready";
  if (isReplay) {
    return { type: "play", variant: "replay", isStartingSoon: false };
  }

  // Series featured video marker overrides default text
  if (seriesFeaturedVideoMarker) {
    if (seriesFeaturedVideoMarker === "continue") {
      return { type: "play", variant: "series-continue", isStartingSoon: false };
    }
    // "watch", "watch-next", "watch-again" all use the same variant
    return { type: "play", variant: "series-watch", isStartingSoon: false };
  }

  // Check watch progress
  const hasProgress =
    watchProgressSeconds != null && watchProgressSeconds > 0;
  if (hasProgress) {
    return { type: "play", variant: "continue-watching", isStartingSoon: false };
  }

  return { type: "play", variant: "watch", isStartingSoon: false };
}

function resolveNoAccessState(
  content: Content,
  subscriptionTier: SubscriptionTier,
): CtaState {
  const contentPlans = getSubscriptionTiersFromContent(content, true);
  const hasContentPlans = contentPlans.length > 0;
  const isContentPPV = isPPVContent(content);
  const hasAnyPlan = userHasAnyPlan(subscriptionTier);

  if (hasContentPlans && isContentPPV) {
    return hasAnyPlan
      ? { type: "cta-upgrade-plan-and-ppv", hasPpv: true }
      : { type: "cta-choose-plan-and-ppv", hasPpv: true };
  }

  if (hasContentPlans) {
    return hasAnyPlan
      ? { type: "cta-upgrade-plan", hasPpv: false }
      : { type: "cta-choose-plan", hasPpv: false };
  }

  if (isContentPPV) {
    return { type: "cta-ppv-only" };
  }

  return { type: "cta-none" };
}
