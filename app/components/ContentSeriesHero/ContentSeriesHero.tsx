import { useState } from "react";
import {
  BackgroundVideoWithOverlays,
  Cover,
  ContentDetailsTabs,
  Container,
  SeriesHeroContent,
} from "~/components";
import { HeroBackground } from "~/sections";
import { useContentSeriesData } from "~/hooks";
import type { Commentary, Content, Pilgrimage, SubscriptionTier, User } from "~/lib/types";

type SeriesContent = Commentary | Pilgrimage;
type SeriesContentType = "commentary" | "pilgrimage";

interface ContentSeriesHeroProps {
  content: SeriesContent;
  contentType: SeriesContentType;
  subscriptionTier?: SubscriptionTier;
  customerId?: string;
  /**
   * User object for access checks. Passed explicitly from loader data
   * so the hook doesn't rely solely on root loader.
   */
  user?: User | null;
  /** Whether to prepend group names to video titles (default: false) */
  prependGroupName?: boolean;
  /**
   * Subtitle for the videos/days tab.
   * Receives the video count, e.g. (count) => strings.days_count.replace("{count}", String(count))
   * When omitted, ContentDetailsTabs uses its own default.
   */
  videosSubtitle?: (videoCount: number) => string;
  /**
   * Active live stream associated with this content (pilgrimage or commentary).
   * When provided, the hero CTA buttons use this live's data (access checks,
   * liveStatus, videoId) instead of the content's own data.
   * The content layout (tabs, description, background) remains unchanged.
   *
   * Set this when the featured live's ppvTag matches the content's ppvTag,
   * indicating the live is the active stream for this content.
   */
  activeLive?: Content | null;
}

/**
 * Full-page hero for series content (commentaries, pilgrimages).
 * Used at the top of index and detail route pages.
 *
 * For the inline/compact variant used inside carousels, see ExpandedContentView.
 */
export function ContentSeriesHero({
  content,
  contentType,
  subscriptionTier,
  customerId,
  user,
  prependGroupName,
  videosSubtitle,
  activeLive,
}: ContentSeriesHeroProps) {
  const [activeTab, setActiveTab] = useState("about");
  const seriesData = useContentSeriesData(content, contentType, {
    prependGroupName,
    user,
    subscriptionTier,
  });
  const {
    previewVideoData,
    info,
    allVideos,
    isLoading,
    error,
    videoCount,
    userHasAccess,
  } = seriesData;

  const heroContent = (
    <Container className="h-full flex items-center">
      <div className="max-w-2xl text-left">
        <SeriesHeroContent
          content={content}
          contentType={contentType}
          seriesData={seriesData}
          activeLive={activeLive}
        />
      </div>
    </Container>
  );

  return (
    <HeroBackground className="-mt-[var(--header-height)] overflow-hidden">
      <BackgroundVideoWithOverlays
        imageUrl={content.thumbnailUrl}
        mobileImageUrl={content.thumbnailUrlVertical || undefined}
        videoId={previewVideoData.videoId?.toString()}
        startTimeSeconds={previewVideoData.startTimeSeconds}
        previewDurationSeconds={previewVideoData.previewDurationSeconds}
        altText={content.title}
        subscriptionTier={subscriptionTier}
        customerId={customerId}
        enableVideo={activeTab === "about"}
      />
      <Cover minHeight="70vh" mobileMinHeight="85vh" padding="0">
        <ContentDetailsTabs
          title={content.title}
          descriptionHtml={content.descriptionHtml}
          videoCount={videoCount}
          videos={allVideos}
          isLoadingVideos={isLoading}
          videosError={error}
          videosSubtitle={videosSubtitle ? videosSubtitle(videoCount) : undefined}
          info={info}
          heroContent={heroContent}
          contentClassName="mt-60"
          activeTab={activeTab}
          onTabChange={setActiveTab}
          content={content}
          contentType={contentType}
          userHasAccess={userHasAccess}


          isPublished={content.isPublished}
        />
      </Cover>
    </HeroBackground>
  );
}
