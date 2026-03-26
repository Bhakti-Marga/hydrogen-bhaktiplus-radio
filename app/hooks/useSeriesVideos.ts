import { useFetcher } from "react-router";
import { useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useLocale } from "~/hooks/useLocale";
import { transformSeriesVideos } from "~/lib/utils/series-videos";
import type { SerieVideosResponseDto } from "~/lib/api/types";
import type { Commentary, Pilgrimage, ContentType } from "~/lib/types";

type SeriesContent = Commentary | Pilgrimage;

type SeriesVideosApiResponse = SerieVideosResponseDto & {
  error: string | null;
};

interface UseSeriesVideosOptions {
  /**
   * Whether to prepend group names to video titles
   * @default false
   */
  prependGroupName?: boolean;
}

/**
 * Hook for fetching and managing series videos (commentaries, pilgrimages)
 * Consolidates common logic for video fetching, info building, and data transformation
 */
export function useSeriesVideos(
  content: SeriesContent,
  contentType: "commentary" | "pilgrimage",
  options: UseSeriesVideosOptions = {}
) {
  const { prependGroupName = false } = options;
  const locale = useLocale();
  const videosFetcher = useFetcher<SeriesVideosApiResponse>();

  // Build info array (date, location, time)
  const info = useMemo(() => {
    const info = [];

    if (content?.startDate) {
      info.push({
        label: "Date",
        value: [format(content.startDate, "dd MMMM yyyy")],
      });
    }

    if (content?.location?.location) {
      info.push({
        label: "Location",
        value: [
          [content?.location?.city, content?.location?.country].join(", "),
        ],
      });
    }

    // if (content?.startDate) {
    //   info.push({
    //     label: "Time",
    //     value: [format(content.startDate, "HH:mm")],
    //   });
    // }

    return info;
  }, [content]);

  // Extract first video ID and duration for background video
  const firstVideoData = useMemo(() => {
    const firstVideo = videosFetcher.data?.videoGroups?.[0]?.parts?.[0]?.video;
    return {
      videoId: firstVideo?.videoId,
      startTime: firstVideo?.previewStartOffset ??
        (firstVideo?.durationSeconds ? Math.floor(firstVideo.durationSeconds / 2) : undefined),
    };
  }, [videosFetcher.data]);

  // Transform video data for AllVideos component
  const allVideos = useMemo(() => {
    return transformSeriesVideos({
      videoGroups: videosFetcher.data?.videoGroups,
      contentId: content.contentId,
      contentType,
      fallbackThumbnail: content.thumbnailUrl,
      prependGroupName,
    });
  }, [
    videosFetcher.data?.videoGroups,
    content.contentId,
    content.thumbnailUrl,
    contentType,
    prependGroupName,
  ]);

  // Load videos when component mounts or content changes
  // Note: Use locale.pathPrefix (primitive) instead of locale (object) to avoid
  // infinite re-renders caused by useLocale() returning a new object on each render
  useEffect(() => {
    if (content?.contentId) {
      const apiPath = contentType === "commentary" ? "commentaries" : "pilgrimages";
      const url = `${locale.pathPrefix}/api/${apiPath}/${content.contentId}/videos`;
      videosFetcher.load(url);
    }
  }, [content?.contentId, contentType, locale.pathPrefix]);

  return {
    info,
    firstVideoData,
    allVideos,
    isLoading: videosFetcher.state === "loading",
    error: videosFetcher.data?.error || null,
    videoCount: content.videoCount || allVideos.length,
  };
}
