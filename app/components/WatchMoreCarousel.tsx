import { useNavigate } from "react-router";
import { Container, Carousel } from "~/components";
import { ContentCard } from "~/components/Card";
import { VideoCard } from "~/components/Card";
import { IconLock } from "~/components/Icons";
import { encodeVideoId } from "~/lib/utils/video-id-encoder";
import { hasHierarchicalAccess } from "~/lib/utils/content";
import type { SubscriptionTier } from "~/lib/types";

export interface WatchMoreVideo {
  videoId?: number | null;
  contentId?: number | null;
  slug?: string | null;
  title: string | null;
  subtitle?: string | null;
  thumbnailUrl?: string | null;
  thumbnailUrlVariants?: string | null;
  thumbnailUrlVertical?: string | null;
  thumbnailUrlVerticalVariants?: string | null;
  durationSeconds?: number | null;
  subscriptionTiers?: string[] | null;
}

interface WatchMoreCarouselProps {
  title: string;
  categoryName: string;
  videos: WatchMoreVideo[];
  currentVideoId?: number;
  exploreAllLink?: string;
  /** Content type determines navigation: bundled content goes to detail page, single videos go to player */
  contentType: 'pilgrimage' | 'talk' | 'commentary' | 'live';
  /** Card aspect ratio - portrait for bundled content, landscape for single videos like lives */
  aspectRatio?: 'portrait' | 'landscape';
  /** User's subscription tier for access checking */
  subscriptionTier?: string | null;
}

export function WatchMoreCarousel({
  title,
  categoryName,
  videos,
  currentVideoId,
  exploreAllLink,
  contentType,
  aspectRatio = 'portrait',
  subscriptionTier,
}: WatchMoreCarouselProps) {
  const navigate = useNavigate();

  if (!videos || videos.length === 0) {
    return null;
  }

  const handleVideoClick = (video: WatchMoreVideo) => {
    // For single videos with a valid videoId, navigate to the video player
    if (video.videoId) {
      navigate(`/video?videoId=${encodeVideoId(video.videoId)}`);
      return;
    }

    // For bundled content without a direct videoId, navigate to the content detail page
    if (video.slug) {
      const basePath = contentType === 'pilgrimage' ? '/pilgrimages' 
        : contentType === 'commentary' ? '/commentaries'
        : contentType === 'live' ? '/lives'
        : '/talks';
      navigate(`${basePath}/${video.slug}`);
    }
  };

  // Check if user has access to content based on subscription tier
  const checkAccess = (video: WatchMoreVideo): boolean => {
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

  return (
    <div className="watch-more-carousel">
      <Container>
        <h2 className="text-white text-24 mb-8">
          <span className="font-200">{title}</span> <span className="font-700">{categoryName}</span>
        </h2>
      </Container>
      <Container bleedRight>
        <Carousel>
          {videos.map((video, idx) => {
            const isActive = video.videoId === currentVideoId;
            const hasAccess = checkAccess(video);
            // Use vertical thumbnail for portrait, horizontal for landscape
            const thumbnailUrl = aspectRatio === 'portrait'
              ? (video.thumbnailUrlVertical || video.thumbnailUrl || "")
              : (video.thumbnailUrl || video.thumbnailUrlVertical || "");
            const thumbnailUrlVariants = aspectRatio === 'portrait'
              ? (video.thumbnailUrlVerticalVariants || video.thumbnailUrlVariants)
              : (video.thumbnailUrlVariants || video.thumbnailUrlVerticalVariants);

            return (
              <Carousel.Slide key={`${video.videoId}-${video.contentId}-${idx}`}>
                <button
                  onClick={() => handleVideoClick(video)}
                  className="block text-left relative"
                >
                  {aspectRatio === 'landscape' ? (
                    <>
                      <VideoCard
                        title={video.title || ""}
                        eyebrow={video.subtitle || undefined}
                        image={thumbnailUrl}
                        imageVariants={thumbnailUrlVariants}
                        duration={video.durationSeconds || undefined}
                        size="md"
                        aspectRatio="landscape"
                      />
                      {/* Lock icon for locked content - VideoCard doesn't have hasAccess prop */}
                      {!hasAccess && (
                        <div
                          className="absolute top-8 right-8 rounded-full bg-black/50 flex items-center justify-center w-28 h-28"
                          aria-label="Locked content"
                        >
                          <IconLock className="text-white w-14 h-14" />
                        </div>
                      )}
                    </>
                  ) : (
                    <ContentCard
                      title={video.title || ""}
                      eyebrow={video.subtitle || undefined}
                      image={thumbnailUrl}
                      imageVariants={thumbnailUrlVariants}
                      size="md"
                      aspectRatio="portrait"
                      active={isActive}
                      hasAccess={hasAccess}
                    />
                  )}
                </button>
              </Carousel.Slide>
            );
          })}
        </Carousel>
      </Container>
    </div>
  );
}
