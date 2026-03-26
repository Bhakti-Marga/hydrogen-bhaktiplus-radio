/**
 * Pure decision function for the series hero render state.
 *
 * This is the single source of truth for CTA conditional rendering in
 * SeriesHeroContent. Given content data, user state, and an optional
 * activeLive, it returns a render state object that determines:
 *
 * 1. Which content/type/videoId to pass to ContentButtons
 * 2. The resolved CTA state (play, upcoming-live, cta-choose-plan, etc.)
 *
 * Decision tree:
 *
 *   activeLive present + user HAS access to live
 *     → ctaContent: activeLive
 *
 *   activeLive present + user LACKS access to live
 *     → falls back to series content
 *     → ctaContent: series content
 *
 *   activeLive null
 *     → ctaContent: series content
 */

import { hasAccessToContent } from "~/lib/utils/content";
import { resolveCtaState } from "~/components/ContentButtons/resolveCtaState";
import type { CtaState, CtaStateInput } from "~/components/ContentButtons/resolveCtaState";
import type { Content, ContentType, SubscriptionTier, User } from "~/lib/types";
import type { SeriesFeaturedVideoMarker } from "~/lib/api/types";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface SeriesCtaInput {
  /** The series content (commentary or pilgrimage) */
  content: Content;
  /** The content type of the series */
  contentType: "commentary" | "pilgrimage";
  /** Active live matched to this series (null when no live is active) */
  activeLive: Content | null;
  /** Current user (null when anonymous) */
  user: User | null;
  /** User's subscription tier */
  subscriptionTier: SubscriptionTier;
  /** Whether the prelaunch period is active */
  isPrelaunchActive: boolean;
  /** Video ID from the series featured video / preview video */
  seriesPlayVideoId?: number;
  /** Whether the series has a featured video loaded */
  hasFeaturedVideo: boolean;
  /** Series featured video marker from /next-video endpoint */
  seriesFeaturedVideoMarker?: SeriesFeaturedVideoMarker | null;
  /** Watch progress in seconds for the series video (null = no progress) */
  watchProgressSeconds: number | null;
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface SeriesCtaResult {
  /** The CtaState that ContentButtons will render */
  ctaState: CtaState;
  /** Which content was used for the CTA (live or series) */
  ctaContent: Content;
  /** Which content type was used */
  ctaContentType: ContentType;
  /** Which video ID was used */
  ctaVideoId: number | undefined;
  /** Whether the active live was used for the CTA */
  usedLiveForCta: boolean;
  /** Series featured video marker passed to ContentButtons (undefined when live is used) */
  resolvedSeriesMarker: SeriesFeaturedVideoMarker | undefined;
}

// ---------------------------------------------------------------------------
// Pure decision function
// ---------------------------------------------------------------------------

export function resolveSeriesCtaState(input: SeriesCtaInput): SeriesCtaResult {
  const {
    content,
    contentType,
    activeLive,
    user,
    subscriptionTier,
    isPrelaunchActive,
    seriesPlayVideoId,
    hasFeaturedVideo,
    seriesFeaturedVideoMarker,
    watchProgressSeconds,
  } = input;

  // --- Step 1: Decide whether to use live or series content for CTA ---
  const userHasAccessToLive =
    !!activeLive && hasAccessToContent(user, subscriptionTier, activeLive);
  const useLiveForCta = !!activeLive && userHasAccessToLive;

  const ctaContent = useLiveForCta ? activeLive : content;
  const ctaContentType: ContentType = useLiveForCta ? "live" : contentType;
  const ctaVideoId = useLiveForCta
    ? activeLive.video?.videoId
    : seriesPlayVideoId;

  // When using live content, suppress series markers — the live has its own
  // liveStatus-based button text
  const resolvedSeriesMarker = useLiveForCta
    ? undefined
    : hasFeaturedVideo
      ? seriesFeaturedVideoMarker ?? undefined
      : undefined;

  // --- Step 2: Resolve via the standard CTA state function ---
  const ctaStateInput: CtaStateInput = {
    content: ctaContent,
    contentType: ctaContentType,
    user,
    subscriptionTier,
    isPrelaunchActive,
    hasVideoId: !!ctaVideoId,
    hasOnPlayClick: false,
    watchProgressSeconds: useLiveForCta ? null : watchProgressSeconds,
    seriesFeaturedVideoMarker: resolvedSeriesMarker,
  };

  const ctaState = resolveCtaState(ctaStateInput);

  return {
    ctaState,
    ctaContent,
    ctaContentType,
    ctaVideoId,
    usedLiveForCta: useLiveForCta,
    resolvedSeriesMarker,
  };
}
