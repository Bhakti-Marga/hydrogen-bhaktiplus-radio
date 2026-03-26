import { useMemo } from "react";
import { useWatchProgressContext } from "~/contexts/WatchProgressProvider";
import { Card } from "./Card";
import { GenreEyebrow, type Genre } from "./GenreEyebrow";
import { IconLock } from "./Icons";
import { formatVideoDuration, getSrcSetFromVariants, getThumbnailSizes } from "~/lib/utils";
import { hasHierarchicalAccess } from "~/lib/utils/content";
import type { SubscriptionTier } from "~/lib/types";

export interface RelatedVideo {
  videoId: number;
  title: string | null;
  thumbnailUrl?: string | null;
  thumbnailUrlVariants?: string | null;
  thumbnailUrlVertical?: string | null;
  thumbnailUrlVerticalVariants?: string | null;
  durationSeconds?: number | null;
  eyebrow?: string | null;
  subscriptionTiers?: string[] | null;
  /** Genre of the content (e.g., 'Exclusive', 'Darshan', 'Event', 'Q&A') */
  genre?: string | null;
}

interface RelatedVideosGridProps {
  title: string;
  videos: RelatedVideo[];
  onVideoSelect: (videoId: number) => void;
  currentVideoId?: number;
  /** User's subscription tier for access checking */
  subscriptionTier?: string | null;
  /** Content type label for GenreEyebrow (e.g., 'Satsang', 'Talk', 'Live') */
  contentType?: string;
}

export function RelatedVideosGrid({
  title,
  videos,
  onVideoSelect,
  currentVideoId,
  subscriptionTier,
  contentType = 'Satsang',
}: RelatedVideosGridProps) {
  const { watchProgress } = useWatchProgressContext();

  // Create a lookup map for quick progress access
  const progressMap = useMemo(() => {
    const map = new Map<number, number>();
    watchProgress.forEach((entry) => {
      if (entry.videoId && entry.progressSeconds) {
        map.set(entry.videoId, entry.progressSeconds);
      }
    });
    return map;
  }, [watchProgress]);

  // Check if user has access to video based on subscription tier
  const checkAccess = (video: RelatedVideo): boolean => {
    // If no subscription tiers required, content is free
    if (!video.subscriptionTiers || video.subscriptionTiers.length === 0) {
      return true;
    }
    // If user has no subscription, they don't have access
    if (!subscriptionTier || subscriptionTier === 'unsubscribed') {
      return false;
    }
    // Check if user's tier has hierarchical access to any of the required tiers
    return video.subscriptionTiers.some((requiredTier) =>
      hasHierarchicalAccess(subscriptionTier as SubscriptionTier, requiredTier)
    );
  };

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-32">
      <span className="text-24 font-700 text-white leading-tight">{title}</span>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-x-12 gap-y-32">
        {videos.map((video, idx) => {
          const isActive = video.videoId === currentVideoId;
          const hasAccess = checkAccess(video);
          const thumbnailUrl = video.thumbnailUrl || video.thumbnailUrlVertical;
          const thumbnailUrlVariants = video.thumbnailUrlVariants || video.thumbnailUrlVerticalVariants;
          const videoTitle = video.title || `Video ${idx + 1}`;
          const duration = video.durationSeconds;

          // Generate srcset from variants if available (only if originalUrl matches thumbnailUrl)
          const srcSet = thumbnailUrlVariants ? getSrcSetFromVariants(thumbnailUrlVariants, thumbnailUrl) : "";
          const sizes = srcSet ? getThumbnailSizes("md") : undefined;

          // Get progress for this video
          const progressSeconds = progressMap.get(video.videoId);
          const progressPercent =
            progressSeconds && duration
              ? Math.min(100, Math.round((progressSeconds / duration) * 100))
              : undefined;

          return (
            <button
              key={`${video.videoId}-${idx}`}
              onClick={() => onVideoSelect(video.videoId)}
              className={`block text-left rounded-md transition-transform duration-300 ease-out hover:-translate-y-8 hover:shadow-[0px_4px_14px_0px_#0C162F4D] relative ${
                isActive
                  ? "ring-2 ring-gold-light ring-offset-2 ring-offset-brand"
                  : ""
              }`}
            >
              <Card size="auto" aspectRatio="landscape">
                {/* Thumbnail or gradient fallback */}
                {thumbnailUrl ? (
                  srcSet ? (
                    <picture>
                      <source srcSet={srcSet} sizes={sizes} />
                      <img
                        src={thumbnailUrl}
                        alt={videoTitle}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </picture>
                  ) : (
                    <img
                      src={thumbnailUrl}
                      alt={videoTitle}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-light to-brand-dark" />
                )}

                {/* Lock icon for locked content */}
                {!hasAccess && (
                  <div
                    className="absolute top-8 right-8 w-28 h-28 rounded-full bg-black/50 flex items-center justify-center z-10"
                    aria-label="Locked content"
                  >
                    <IconLock className="w-14 h-14 text-white" />
                  </div>
                )}

                {/* Duration badge */}
                {duration && (
                  <div className="absolute bottom-8 right-8 bg-brand/50 backdrop-blur-md rounded-full px-10 py-2">
                    <p className="body-b3 text-white text-nowrap">
                      {formatVideoDuration(duration)}
                    </p>
                  </div>
                )}

                {/* Title overlay with GenreEyebrow */}
                <Card.Overlay>
                  <GenreEyebrow 
                    genre={video.genre as Genre | undefined} 
                    contentType={contentType} 
                  />
                  <Card.Title>{videoTitle}</Card.Title>
                </Card.Overlay>

                {/* Progress bar */}
                {progressPercent !== undefined && progressPercent > 0 && (
                  <div className="absolute bottom-0 w-full h-4 bg-grey-light/30">
                    <div
                      className="h-full bg-grey-light"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}

