import { Button } from "~/components/Button/Button";
import { IconPlay } from "~/components/Icons";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { encodeVideoId } from "~/lib/utils/video-id-encoder";
import { useVideoProgress } from "~/contexts/WatchProgressProvider";
import type { SeriesFeaturedVideoMarker } from "~/lib/api/types";

interface PlayButtonProps {
  videoId?: number | string;
  isLive?: boolean;
  isFreeLive?: boolean;
  isReplay?: boolean;
  isStartingSoon?: boolean;
  className?: string;
  /** Optional callback - renders as button instead of link */
  onClick?: () => void;
  /**
   * Series featured video marker from the /next-video endpoint.
   * When provided, overrides the default button text with series-aware text.
   */
  seriesFeaturedVideoMarker?: SeriesFeaturedVideoMarker | null;
  /**
   * Title of the series featured video, appended to the button text.
   */
  seriesFeaturedVideoTitle?: string | null;
  /**
   * When true, shows a loading spinner on the button.
   * Used while series featured video data is being fetched.
   */
  loading?: boolean;
}

/**
 * Play button for content that user has access to.
 * Shows different text based on content type:
 * - "Watch LIVE" for live content (including free live)
 * - "Watch Replay" for VOD-ready live content
 * - "Starting soon" for live-preview content (clickable, navigates to player)
 * - "Continue Watching {title}" if series featured video marker is "continue"
 * - "Watch {title}" if series featured video marker is "watch" / "watch-next" / "watch-again"
 * - "Continue Watching" if user has started watching (fallback without series data)
 * - "Watch" if user hasn't started watching yet (fallback without series data)
 */
export function PlayButton({
  videoId,
  isLive = false,
  isFreeLive = false,
  isReplay = false,
  isStartingSoon = false,
  className = "",
  onClick,
  seriesFeaturedVideoMarker,
  seriesFeaturedVideoTitle,
  loading = false,
}: PlayButtonProps) {
  const { strings } = useTranslations();

  // Check if user has started watching this video
  const progressSeconds = useVideoProgress(videoId);
  const hasProgress = progressSeconds != null && progressSeconds > 0;

  // Determine button text based on content type, series marker, and watch progress
  const buttonText = isStartingSoon
    ? strings.live_starting_soon
    : isLive
    ? strings.livestream_watch_live
    : isReplay
    ? strings.live_watch_replay
    : seriesFeaturedVideoMarker
    ? getSeriesFeaturedButtonText(seriesFeaturedVideoMarker, seriesFeaturedVideoTitle, strings)
    : hasProgress
    ? strings.content_continue_watching
    : strings.content_watch;

  // Button variant based on live status only (not isFreeLive)
  // Starting soon uses red variant like live content
  const variant = isLive || isStartingSoon ? "red" : "primary";

  // Determine data-testid based on button state
  const testId = isStartingSoon
    ? "cta-play-starting-soon"
    : isLive
    ? "cta-play-live"
    : isReplay
    ? "cta-play-replay"
    : seriesFeaturedVideoMarker === "continue"
    ? "cta-play-series-continue"
    : seriesFeaturedVideoMarker
    ? "cta-play-series-watch"
    : hasProgress
    ? "cta-play-continue-watching"
    : "cta-play-watch";

  // If onClick is provided, render as button
  if (onClick) {
    return (
      <Button
        as="button"
        variant={variant}
        className={className}
        icon={<IconPlay className="w-12 mr-8 relative top-[-1px]" />}
        onClick={onClick}
        loading={loading}
        data-testid={testId}
      >
        {buttonText}
      </Button>
    );
  }

  // While loading, render as a disabled button (no href yet)
  if (loading) {
    return (
      <Button
        as="button"
        variant={variant}
        className={className}
        icon={<IconPlay className="w-12 mr-8 relative top-[-1px]" />}
        loading
        data-testid={testId}
      >
        {buttonText}
      </Button>
    );
  }

  // Original link behavior - requires videoId
  if (!videoId) {
    console.warn("[PlayButton] No videoId provided for link mode");
    return null;
  }

  // Encode videoId if it's a number
  const encodedVideoId =
    typeof videoId === "number" ? encodeVideoId(videoId) : videoId;

   return (
    <Button
      as="link"
      href={`/video?videoId=${encodedVideoId}`}
      variant={variant}
      className={className}
      icon={<IconPlay className="w-12 mr-8 relative top-[-1px]" />}
      data-testid={testId}
    >
      {buttonText}
    </Button>
  );
}

/**
 * Get button text for series featured video based on the marker.
 * - "watch" / "watch-next" / "watch-again": "Watch {title}"
 * - "continue": "Continue Watching {title}"
 */
function getSeriesFeaturedButtonText(
  marker: SeriesFeaturedVideoMarker,
  videoTitle: string | null | undefined,
  strings: Record<string, string>,
): string {
  const title = videoTitle || "";
  const baseText =
    marker === "continue"
      ? strings.content_continue_watching
      : strings.content_watch;

  return title ? `${baseText} ${title}` : baseText;
}

