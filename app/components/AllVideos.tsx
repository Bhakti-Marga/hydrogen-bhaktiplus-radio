import React, { useState } from "react";
import { Carousel, Container, Link } from "~/components";
import { formatVideoDuration, getSrcSetFromVariants, getThumbnailSizes, stripHtml } from "~/lib/utils";
import { IconVideos } from "./Icons";
import { useTranslations } from "~/contexts/TranslationsProvider";
import type { Content, ContentType } from "~/lib/types";
import { useRootLoaderData } from "~/hooks";
import { hasAccessToContent } from "~/lib/utils/content";
import SubscriptionModal from "~/components/SubscriptionModal";

export type Video = {
  title: string;
  image: string;
  /** Pre-computed thumbnail variants from API (JSON string) */
  imageVariants?: string | null;
  description: string;
  parts: number;
  id: number;
  url: string;
  // Allow extra properties from TransformedVideo
  summary200?: string;
  summary500?: string;
};

export interface AllVideosProps {
  title?: string;
  subtitle?: string;
  videos: Video[];
  activeVideo?: Video;
  onVideoClick?: (video: Video) => void;
  initialActiveIndex?: number;
  /**
   * The content object (pilgrimage, commentary, etc.) for access control
   */
  content?: Content;
  /**
   * The type of content (pilgrimage, commentary, etc.)
   */
  contentType?: ContentType;
  /**
   * Whether the user has access to this content (computed by parent)
   */
  userHasAccess?: boolean;
  /**
   * When true, video cards are non-clickable (no navigation, no modal)
   */
  disableLinks?: boolean;
}

export const AllVideos: React.FC<AllVideosProps> = ({
  title,
  subtitle,
  videos,
  onVideoClick,
  content,
  contentType,
  userHasAccess = true,
  disableLinks = false,
}) => {
  const { strings } = useTranslations();
  const { subscriptionTier, memberships } = useRootLoaderData();
  const [showModal, setShowModal] = useState(false);

  const handleVideoSelect = (video: Video, event: React.MouseEvent) => {
    // Navigate to subscription tiers section when card is clicked
    event.preventDefault();
    
    // Scroll to subscription tiers section
    const subscriptionTiersElement = document.getElementById('subscription-tiers');
    if (subscriptionTiersElement) {
      subscriptionTiersElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // If element not found, navigate to homepage with hash
      window.location.href = '/#subscription-tiers';
    }

    onVideoClick?.(video);
  };

  return (
    <>
      <div className="relative w-full">
        <div className="relative">
          <Container className="text-white mb-16">
            <div className="font-avenir-next text-32 font-900 uppercase opacity-20 leading-[60px]">
              {title}
            </div>
            {/* TODO-TYPOGRAPHY: Could use h3-lg class (but has custom leading-8) */}
            <div className="text-18 font-600 leading-8 text-white">
              {subtitle || `${videos?.length ?? 0} videos`}
            </div>
          </Container>
          <Container>
            <Carousel spaceBetween={16}>
              {videos?.map((video, index) => (
                <Carousel.Slide key={index}>
                  <VideoSlide
                    video={video}
                    index={index}
                    hasAccess={userHasAccess}
                    onVideoClick={handleVideoSelect}
                    disableNavigation={disableLinks}
                  />
                </Carousel.Slide>
              ))}
            </Carousel>
          </Container>
        </div>
      </div>

      {/* Show subscription modal if user doesn't have access */}
      {showModal && content && contentType && (
        <SubscriptionModal
          content={content}
          contentTitle={content.title}
          contentType={contentType}
          userCurrentPlan={subscriptionTier}
          memberships={memberships}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

interface VideoSlideProps {
  video: Video;
  index: number;
  hasAccess: boolean;
  onVideoClick: (video: Video, event: React.MouseEvent) => void;
  /** When true, clicking is disabled but hover styling still works */
  disableNavigation?: boolean;
}

function VideoSlide({ video, hasAccess, onVideoClick, disableNavigation = false }: VideoSlideProps) {
  const { strings } = useTranslations();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (disableNavigation) {
      event.preventDefault();
      return;
    }
    // Only intercept click when user doesn't have access - redirect to subscription
    // When user has access, let the Link navigate normally to video.url
    if (!hasAccess) {
      onVideoClick(video, event);
    }
  };

  // Generate srcset from variants if available (only if originalUrl matches image)
  const srcSet = video.imageVariants ? getSrcSetFromVariants(video.imageVariants, video.image) : "";
  const sizes = srcSet ? getThumbnailSizes("xs") : undefined;

  return (
    <Link
      to={video.url}
      onClick={handleClick}
      className={`all-videos__video-slide hover:bg-brand-light transition-colors duration-200 block rounded-lg ${disableNavigation ? 'cursor-default' : ''}`}
      style={{ width: 'var(--video-width-xs)' }}
    >
      <div className="all-videos__video-image bg-white relative rounded-lg aspect-[227/121] overflow-hidden">
        {srcSet ? (
          <picture>
            <source srcSet={srcSet} sizes={sizes} />
            <img
              src={video.image}
              alt={video.title}
              loading="lazy"
              className="w-full h-full object-cover object-center"
            />
          </picture>
        ) : (
          <img
            src={video.image}
            alt={video.title}
            loading="lazy"
            className="w-full h-full object-cover object-center"
          />
        )}
      </div>
      <div className="all-videos__video-info p-8">
        <div className="all-videos__video-title flex items-center gap-8">
          <span className="text-red">&bull;</span>
          <span className="body-b3">{video.title}</span>
        </div>
        {video.description && (
          <>
            {/* TODO-TYPOGRAPHY: Could use body-b4 or body-b5 class */}
            <div
              className="all-videos__video-description body-b5 font-500 text-white/80 line-clamp-6"
              title={stripHtml(video.description)}
            >
              {stripHtml(video.description)}
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

export default AllVideos;
