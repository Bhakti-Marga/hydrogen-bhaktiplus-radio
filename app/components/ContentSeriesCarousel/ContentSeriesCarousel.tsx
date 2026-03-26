import {
  Carousel,
  Container,
  ContentCard,
  SectionHeader,
  ExpandableSection,
  ExpandedContentView,
} from "~/components";
import type { Commentary, Pilgrimage } from "~/lib/types";
import { useCallback, useState, useRef } from "react";
import { useRootLoaderData } from "~/hooks";
import { hasAccessToContent, isNewContent } from "~/lib/utils/content";

type SeriesContent = Commentary | Pilgrimage;
type SeriesContentType = "commentary" | "pilgrimage";

interface ContentSeriesCarouselProps {
  title: string;
  items: SeriesContent[];
  contentType: SeriesContentType;
  /** Link for the "Explore all" header link, e.g. "/commentaries" */
  exploreAllLink: string;
  /** When false, cards are not clickable and don't show hover effects (default: true) */
  interactive?: boolean;
  /**
   * Optional anchor ID - when provided, CTA buttons scroll to this element
   * instead of opening the subscription modal.
   */
  ctaScrollToId?: string;
  /**
   * When true, video cards in expanded view are non-clickable
   */
  disableLinks?: boolean;
  showLock?: boolean;
  /**
   * Label for the videos/days tab subtitle in the expanded view.
   * Receives the video count. E.g. (count) => `Days (${count})`
   * Defaults to (count) => `Videos (${count})`
   */
  videosSubtitle?: (videoCount: number) => string;
}

/**
 * Generic carousel with expandable detail view for series content
 * (commentaries, pilgrimages). Replaces the formerly separate
 * Commentaries and Pilgrimages carousel components.
 */
export function ContentSeriesCarousel({
  title,
  items,
  contentType,
  exploreAllLink,
  interactive = true,
  ctaScrollToId,
  disableLinks = false,
  showLock = true,
  videosSubtitle,
}: ContentSeriesCarouselProps) {
  const { user, subscriptionTier } = useRootLoaderData();
  const [selectedItem, setSelectedItem] = useState<SeriesContent | null>(null);
  const sectionHeaderRef = useRef<HTMLDivElement>(null);

  const handleExpandClick = useCallback(
    (item: SeriesContent) => {
      if (!interactive) return;
      setSelectedItem(item);
    },
    [interactive],
  );

  const hasActiveContent = selectedItem !== null;

  return (
    <ExpandableSection
      isExpanded={hasActiveContent}
      onClose={() => setSelectedItem(null)}
    >
      <div className="animated-link-chevron-trigger max-w-screen relative z-[5]">
        <Container>
          <div ref={sectionHeaderRef}>
            <SectionHeader
              title={title}
              exploreAllLink={
                interactive && !disableLinks ? exploreAllLink : undefined
              }
            />
          </div>
        </Container>
        <Container bleedRight>
          <Carousel>
            {items.map((item) => {
              const userHasAccess = hasAccessToContent(
                user,
                subscriptionTier,
                item,
              );
              return (
                <Carousel.Slide
                  key={item.contentId}
                  disableHover={!interactive}
                >
                  <ContentCard
                    size="md"
                    aspectRatio={hasActiveContent ? "landscape" : "portrait"}
                    onClick={
                      interactive
                        ? () => handleExpandClick(item)
                        : undefined
                    }
                    eyebrow={item.subtitle}
                    title={item.title ?? ""}
                    videoCount={item.videoCount}
                    image={
                      hasActiveContent || !item.thumbnailUrlVertical
                        ? item.thumbnailUrl
                        : item.thumbnailUrlVertical
                    }
                    imageVariants={
                      hasActiveContent || !item.thumbnailUrlVerticalVariants
                        ? item.thumbnailUrlVariants
                        : item.thumbnailUrlVerticalVariants
                    }
                    active={selectedItem?.contentId === item.contentId}
                    hasAccess={userHasAccess}
                    showLock={showLock}
                    isNew={isNewContent(item)}
                    isUpcoming={item.isUpcoming}
                    isPublished={item.isPublished}
                  />
                </Carousel.Slide>
              );
            })}
          </Carousel>
        </Container>
      </div>

      {/* Expanded content section below carousel */}
      <ExpandableSection.Content
        key={selectedItem?.contentId}
        scrollToRef={sectionHeaderRef}
      >
        <ExpandableSection.CloseButton
          onClick={() => setSelectedItem(null)}
        />
        {selectedItem && (
          <ExpandedContentView
            content={selectedItem}
            contentType={contentType}
            videosSubtitle={
              videosSubtitle ? videosSubtitle(selectedItem.videoCount ?? 0) : undefined
            }
            scrollToId={ctaScrollToId}
            disableLinks={disableLinks}
          />
        )}
      </ExpandableSection.Content>
    </ExpandableSection>
  );
}
