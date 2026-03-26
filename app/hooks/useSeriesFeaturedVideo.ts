import { useFetcher } from "react-router";
import { useEffect } from "react";
import { useLocale } from "~/hooks/useLocale";
import type {
  SeriesFeaturedVideoResponseDto,
  SeriesFeaturedVideoMarker,
} from "~/lib/api/types";
import type { Commentary, Pilgrimage } from "~/lib/types";

type SeriesContent = Commentary | Pilgrimage;

type SeriesFeaturedVideoApiResponse = SeriesFeaturedVideoResponseDto & {
  error: string | null;
};

/**
 * Hook for fetching the series featured video (next video to watch) for a series.
 * Uses the /next-video API endpoint to determine which video to show in the hero
 * based on user's watch progress.
 *
 * Returns the video ID and marker to pass to ContentButtons, which will determine
 * the appropriate button text (Watch / Continue Watching / Watch Next / Watch Again).
 */
export function useSeriesFeaturedVideo(
  content: SeriesContent,
  contentType: "commentary" | "pilgrimage",
) {
  const locale = useLocale();
  const fetcher = useFetcher<SeriesFeaturedVideoApiResponse>();

  // Load series featured video when component mounts or content changes
  // Note: Use locale.pathPrefix (primitive) instead of locale (object) to avoid
  // infinite re-renders caused by useLocale() returning a new object on each render
  useEffect(() => {
    if (content?.contentId) {
      const apiPath =
        contentType === "commentary" ? "commentaries" : "pilgrimages";
      const url = `${locale.pathPrefix}/api/${apiPath}/${content.contentId}/series-featured-video`;
      fetcher.load(url);
    }
  }, [content?.contentId, contentType, locale.pathPrefix]);

  const data = fetcher.data;
  // Loading = actively fetching OR hasn't fetched yet (idle with no data)
  const isLoading =
    fetcher.state === "loading" || (fetcher.state === "idle" && !data);

  return {
    /** The video ID to use for the play button (null if not yet loaded or error) */
    videoId: data?.video?.videoId ?? null,
    /** The title of the featured video (for button text) */
    videoTitle: data?.video?.title ?? null,
    /** Why this video was selected (watch, continue, watch-next, watch-again) */
    marker: (data?.marker as SeriesFeaturedVideoMarker) ?? null,
    /** Playback progress in seconds (only when marker is "continue") */
    progressSeconds: data?.progressSeconds ?? null,
    /** Zero-based index of the video in the series */
    videoIndex: data?.videoIndex ?? 0,
    /** Total number of videos in the series */
    totalVideos: data?.totalVideos ?? 0,
    /** Whether the data is currently loading or hasn't been fetched yet */
    isLoading,
    /** Whether the fetch completed (with or without error) */
    isLoaded: fetcher.state === "idle" && data != null,
    /** Error message if the fetch failed */
    error: data?.error ?? null,
  };
}
