import type { SerieVideosResponseDto } from "~/lib/api/types";
import { encodeVideoId } from "./video-id-encoder";

export interface TransformedVideo {
  title: string;
  image: string;
  /** Pre-computed thumbnail variants from API (JSON string) */
  imageVariants?: string | null;
  description: string;
  summary200: string;
  summary500: string;
  parts: number;
  id: number;
  url: string;
  durationSeconds?: number;
}

export interface TransformSeriesVideosOptions {
  videoGroups: SerieVideosResponseDto["videoGroups"] | undefined;
  contentId: number;
  contentType: "commentary" | "pilgrimage" | "satsang" | "talk";
  fallbackThumbnail: string;
  prependGroupName?: boolean;
}

/**
 * Transforms API video groups into a flat array of videos for display in carousels.
 * Each part within a video group becomes its own video card.
 *
 * @param options - Configuration for transforming the videos
 * @returns Array of transformed videos ready for display
 */
export function transformSeriesVideos({
  videoGroups,
  contentId,
  contentType,
  fallbackThumbnail,
  prependGroupName = false
}: TransformSeriesVideosOptions): TransformedVideo[] {
  if (!videoGroups) return [];

  const videos: TransformedVideo[] = [];

  videoGroups.forEach((group) => {
    // Flatten all parts into individual video cards
    group.parts?.forEach((part) => {
      let videoTitle = part.video?.title || group.name || "";
      if (prependGroupName) {
        const prefix = group.name ? `${group.name} - ` : '';
        videoTitle = `${prefix}${videoTitle}`;
      }
      const description = part.video?.description || group.description || "";
      const summary500 = part.video?.summary500 || description;
      const summary200 = part.video?.summary200 || summary500;
      const videoId = part.video?.videoId || 0;
      videos.push({
        title: videoTitle,
        image: part.video?.thumbnailUrl || fallbackThumbnail,
        imageVariants: part.video?.thumbnailUrlVariants,
        description,
        summary500,
        summary200,
        id: videoId,
        parts: 1,
        url: `/video?videoId=${encodeVideoId(videoId)}`,
        durationSeconds: part.video?.durationSeconds,
      });
    });
  });

  return videos;
}
