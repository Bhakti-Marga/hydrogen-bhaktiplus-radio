import { useSeriesVideos, useSeriesFeaturedVideo, useRootLoaderData } from "~/hooks";
import { hasAccessToContent, getPreviewVideoData } from "~/lib/utils/content";
import type { Commentary, Pilgrimage, SubscriptionTier, User } from "~/lib/types";

type SeriesContent = Commentary | Pilgrimage;
type SeriesContentType = "commentary" | "pilgrimage";

interface UseContentSeriesDataOptions {
  /** Whether to prepend group names to video titles (default: false) */
  prependGroupName?: boolean;
  /**
   * Provide user/subscriptionTier explicitly (e.g. from loader data).
   * When omitted, falls back to useRootLoaderData().
   */
  user?: User | null;
  subscriptionTier?: SubscriptionTier;
}

/**
 * Consolidates the shared hook logic used by every series hero and expanded view:
 * - Preview video data for background
 * - Series videos list for the Videos tab
 * - Series featured video for play button
 * - Access check
 * - Play video ID derivation
 */
export function useContentSeriesData(
  content: SeriesContent,
  contentType: SeriesContentType,
  options: UseContentSeriesDataOptions = {},
) {
  const rootData = useRootLoaderData();
  const user = options.user !== undefined ? options.user : rootData.user;
  const subscriptionTier =
    options.subscriptionTier !== undefined
      ? options.subscriptionTier
      : rootData.subscriptionTier;

  // Preview video data for BackgroundVideoWithOverlays
  const previewVideoData = getPreviewVideoData(content);

  // Series videos for Videos tab
  const { info, allVideos, isLoading, error, videoCount } = useSeriesVideos(
    content,
    contentType,
    { prependGroupName: options.prependGroupName },
  );

  // Series featured video for play button
  const seriesFeaturedVideo = useSeriesFeaturedVideo(content, contentType);

  // Access check
  const userHasAccess = hasAccessToContent(user, subscriptionTier, content);

  // Play video ID derivation
  const hasFeaturedVideo =
    seriesFeaturedVideo.isLoaded &&
    !seriesFeaturedVideo.error &&
    seriesFeaturedVideo.videoId;
  const playVideoId = hasFeaturedVideo
    ? seriesFeaturedVideo.videoId!
    : previewVideoData.videoId;

  return {
    previewVideoData,
    info,
    allVideos,
    isLoading,
    error,
    videoCount,
    seriesFeaturedVideo,
    userHasAccess,
    hasFeaturedVideo,
    playVideoId,
  };
}
