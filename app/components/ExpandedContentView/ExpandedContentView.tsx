import {
  BackgroundVideoWithOverlays,
  ContentDetailsTabs,
  SeriesHeroContent,
  Container,
} from "~/components";
import type { Commentary, Pilgrimage } from "~/lib/types";
import { useState } from "react";
import { HeroContent } from "~/sections";
import { useContentSeriesData } from "~/hooks";

type SeriesContent = Commentary | Pilgrimage;
type SeriesContentType = "commentary" | "pilgrimage";

interface ExpandedContentViewProps {
  content: SeriesContent;
  contentType: SeriesContentType;
  /**
   * Label for the videos/days tab subtitle, e.g. "Videos (10)" or "Days (5)".
   * When omitted, defaults to "Videos ({count})".
   */
  videosSubtitle?: string;
  /**
   * Optional anchor ID - when provided, CTA buttons scroll to this element
   * instead of opening the subscription modal.
   */
  scrollToId?: string;
  /**
   * When true, video cards are non-clickable
   */
  disableLinks?: boolean;
}

/**
 * Generic expanded content view used inside ContentSeriesCarousel.
 * Replaces the formerly separate ExpandedCommentaryView and ExpandedPilgrimageView.
 */
export function ExpandedContentView({
  content,
  contentType,
  videosSubtitle,
  scrollToId,
  disableLinks = false,
}: ExpandedContentViewProps) {
  const [activeTab, setActiveTab] = useState("about");
  const seriesData = useContentSeriesData(content, contentType);
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
      <HeroContent padding="py-32">
        <SeriesHeroContent
          content={content}
          contentType={contentType}
          seriesData={seriesData}
          scrollToId={scrollToId}
        />
      </HeroContent>
    </Container>
  );

  return (
    <div className="relative w-full overflow-hidden aspect-[9/16] tablet:aspect-video">
      <BackgroundVideoWithOverlays
        imageUrl={content.thumbnailUrl}
        mobileImageUrl={content.thumbnailUrlVertical || undefined}
        videoId={previewVideoData.videoId?.toString()}
        startTimeSeconds={previewVideoData.startTimeSeconds}
        previewDurationSeconds={previewVideoData.previewDurationSeconds}
        enableVideo={activeTab === "about"}
      />

      <div className="absolute inset-0 z-10">
        <ContentDetailsTabs
          title={content.title}
          descriptionHtml={content.descriptionHtml}
          videoCount={videoCount}
          videos={allVideos}
          isLoadingVideos={isLoading}
          videosError={error}
          videosSubtitle={videosSubtitle}
          info={info}
          heroContent={heroContent}
          height="100%"
          activeTab={activeTab}
          onTabChange={setActiveTab}
          content={content}
          contentType={contentType}
          userHasAccess={userHasAccess}
          disableLinks={disableLinks}


          isPublished={content.isPublished}
        />
      </div>
    </div>
  );
}
