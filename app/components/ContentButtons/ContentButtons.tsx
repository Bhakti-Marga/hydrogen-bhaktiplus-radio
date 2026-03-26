import { useRootLoaderData } from "~/hooks";
import { usePrelaunch } from "~/contexts/PrelaunchProvider";
import { useVideoProgress } from "~/contexts/WatchProgressProvider";
import type { Content, ContentType } from "~/lib/types";
import type { SeriesFeaturedVideoMarker } from "~/lib/api/types";
import { PlayButton } from "./PlayButton";
import { UpcomingLiveButton } from "./UpcomingLiveButton";
import { ReplayComingSoonButton } from "./ReplayComingSoonButton";
import { CTAButtons } from "./CTAButtons";
import { resolveCtaState } from "./resolveCtaState";
import type { CtaState } from "./resolveCtaState";

interface ContentButtonsProps {
  content: Content;
  contentType: ContentType;
  /**
   * Optional video ID to use for multi-video content (pilgrimages, commentaries).
   * If provided, this will be used instead of trying to extract from content.videos
   */
  videoId?: number;
  /**
   * Optional callback - when provided, play button calls this instead of navigating.
   * Used for modal-based playback (e.g., free live on unsubscribed homepage).
   */
  onPlayClick?: () => void;
  /**
   * Optional anchor ID - when provided, CTA buttons scroll to this element
   * instead of opening the subscription modal.
   */
  scrollToId?: string;
  /**
   * Series featured video marker from the /next-video endpoint.
   * When provided, overrides the default play button text with series-aware text.
   * - "watch" / "watch-next" / "watch-again": "Watch {videoTitle}"
   * - "continue": "Continue Watching {videoTitle}"
   */
  seriesFeaturedVideoMarker?: SeriesFeaturedVideoMarker | null;
  /**
   * Title of the series featured video, appended to the button text.
   */
  seriesFeaturedVideoTitle?: string | null;
  /**
   * When true, the play button shows a loading state.
   * Used while the series featured video data is being fetched.
   */
  isLoadingSeriesFeaturedVideo?: boolean;
}

/**
 * Main component for displaying content action buttons.
 *
 * Decision flow:
 * 1. Access check FIRST - users without access see CTAButtons (subscribe/upgrade/purchase)
 * 2. For users WITH access, check liveStatus to determine button state
 *
 * liveStatus values (for users with access):
 * - 'scheduled': Show "Join Live at {time}" (disabled)
 * - 'live-preview': Show "Join Live at {time}" (disabled) - ready to go live
 * - 'live-now': Show "Watch LIVE" (red, enabled)
 * - 'vod-inprogress': Show "Replay coming soon" (disabled)
 * - 'vod-ready': Show "Watch Replay" (enabled)
 * - null/undefined: Fallback to boolean flags (isLive, isUpcoming, isPreview)
 */
export function ContentButtons({
  content,
  contentType,
  videoId: providedVideoId,
  onPlayClick,
  scrollToId,
  seriesFeaturedVideoMarker,
  seriesFeaturedVideoTitle,
  isLoadingSeriesFeaturedVideo = false,
}: ContentButtonsProps) {
  const { user, subscriptionTier } = useRootLoaderData();
  const { isPrelaunchActive } = usePrelaunch();

  // For multi-video content, the videoId should be passed explicitly
  // For single-video content, we can get it from content.video
  const videoId = providedVideoId ?? content.video?.videoId;

  // Check watch progress for the current video
  const progressSeconds = useVideoProgress(videoId);

  // Resolve the CTA state using the pure decision function
  const ctaState = resolveCtaState({
    content,
    contentType,
    user,
    subscriptionTier,
    isPrelaunchActive,
    hasVideoId: !!videoId,
    hasOnPlayClick: !!onPlayClick,
    watchProgressSeconds: progressSeconds ?? null,
    seriesFeaturedVideoMarker,
  });

  const logPrefix = `[ContentButtons][${content.contentId}]`;

  console.warn(
    `${logPrefix} Resolved CTA state: ${ctaState.type}${
      "variant" in ctaState ? `/${ctaState.variant}` : ""
    }`,
    `| user=${user ? "logged-in" : "anonymous"},`,
    `subscriptionTier=${subscriptionTier ?? "none"},`,
    `liveStatus=${content.liveStatus ?? "null"}`,
  );

  return renderCtaState(ctaState, {
    content,
    contentType,
    subscriptionTier,
    videoId,
    onPlayClick,
    scrollToId,
    seriesFeaturedVideoMarker,
    seriesFeaturedVideoTitle,
    isLoadingSeriesFeaturedVideo,
  });
}

// ---------------------------------------------------------------------------
// Render helper - maps CtaState to React elements
// ---------------------------------------------------------------------------

interface RenderContext {
  content: Content;
  contentType: ContentType;
  subscriptionTier: any;
  videoId?: number;
  onPlayClick?: () => void;
  scrollToId?: string;
  seriesFeaturedVideoMarker?: SeriesFeaturedVideoMarker | null;
  seriesFeaturedVideoTitle?: string | null;
  isLoadingSeriesFeaturedVideo: boolean;
}

function renderCtaState(
  state: CtaState,
  ctx: RenderContext,
): React.ReactElement | null {
  switch (state.type) {
    // --- No-access path ---
    case "cta-choose-plan":
    case "cta-upgrade-plan":
    case "cta-choose-plan-and-ppv":
    case "cta-upgrade-plan-and-ppv":
    case "cta-ppv-only":
    case "cta-none":
      return (
        <CTAButtons
          content={ctx.content}
          contentType={ctx.contentType}
          userHasAnyPlan={
            state.type === "cta-upgrade-plan" ||
            state.type === "cta-upgrade-plan-and-ppv"
          }
          scrollToId={ctx.scrollToId}
        />
      );

    // --- Access path: special states ---
    case "upcoming-live":
      return <UpcomingLiveButton startDate={ctx.content.startDate} />;

    case "replay-coming-soon":
      return <ReplayComingSoonButton />;

    case "no-video":
      return null;

    // --- Access path: play button ---
    case "play": {
      const isCurrentlyLive = state.variant === "live";
      const isReplay = state.variant === "replay";

      return (
        <PlayButton
          videoId={ctx.videoId}
          isLive={isCurrentlyLive}
          isFreeLive={ctx.content.isLiveFree}
          isReplay={isReplay}
          isStartingSoon={state.isStartingSoon}
          onClick={ctx.onPlayClick}
          seriesFeaturedVideoMarker={ctx.seriesFeaturedVideoMarker}
          seriesFeaturedVideoTitle={ctx.seriesFeaturedVideoTitle}
          loading={ctx.isLoadingSeriesFeaturedVideo}
        />
      );
    }
  }
}
