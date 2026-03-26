import {
  Carousel,
  Container,
  ContentCard,
  SectionHeader,
  ExpandableSection,
} from "~/components";
import { Talk, Content } from "~/lib/types";
import { useCallback, useState, useRef } from "react";
import { ExpandedTalkView } from "./ExpandedTalkView";
import { useRootLoaderData } from "~/hooks";
import { hasAccessToContent } from "~/lib/utils/content";

interface TalksProps {
  title: string;
  talks: Talk[];
  /** When false, cards are not clickable and don't show hover effects (default: true) */
  interactive?: boolean;
  /** Hide the "Explore All" link in the section header (default: false) */
  hideExploreLink?: boolean;
  /**
   * Optional anchor ID - when provided, CTA buttons scroll to this element
   * instead of opening the subscription modal.
   */
  ctaScrollToId?: string;
  showLock?: boolean;
}

export function Talks({
  title,
  talks,
  interactive = true,
  hideExploreLink = false,
  ctaScrollToId,
  showLock = true,
}: TalksProps) {
  const { user, subscriptionTier } = useRootLoaderData();
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);
  const sectionHeaderRef = useRef<HTMLDivElement>(null);

  const handleExpandClick = useCallback((talk: Talk) => {
    if (!interactive) return;
    setSelectedTalk(talk);
  }, [interactive]);

  const hasActiveContent = selectedTalk !== null;

  return (
    <ExpandableSection isExpanded={hasActiveContent} onClose={() => setSelectedTalk(null)}>
      <div className="animated-link-chevron-trigger max-w-screen relative z-[5]">
        <Container>
          <div ref={sectionHeaderRef}>
            <SectionHeader title={title} exploreAllLink={interactive && !hideExploreLink ? "/talks" : undefined} />
          </div>
        </Container>
        <Container bleedRight>
          <Carousel>
            {talks.map((talk) => {
              const userHasAccess = hasAccessToContent(user, subscriptionTier, talk);
              return (
                <Carousel.Slide key={talk.contentId} disableHover={!interactive}>
                  <ContentCard
                    size="md"
                    aspectRatio={hasActiveContent ? "landscape" : "portrait"}
                    onClick={interactive ? () => handleExpandClick(talk) : undefined}
                    eyebrow={talk.subtitle}
                    title={talk.title ?? ""}
                    image={hasActiveContent || !talk.thumbnailUrlVertical ? talk.thumbnailUrl : talk.thumbnailUrlVertical}
                    imageVariants={hasActiveContent || !talk.thumbnailUrlVerticalVariants ? talk.thumbnailUrlVariants : talk.thumbnailUrlVerticalVariants}
                    active={selectedTalk?.contentId === talk.contentId}
                    hasAccess={userHasAccess}
                    showLock={showLock}
                  />
                </Carousel.Slide>
              );
            })}
          </Carousel>
        </Container>
      </div>

      {/* Expanded content section below carousel */}
      <ExpandableSection.Content key={selectedTalk?.contentId} scrollToRef={sectionHeaderRef}>
        <ExpandableSection.CloseButton onClick={() => setSelectedTalk(null)} />
        {selectedTalk && <ExpandedTalkView talk={selectedTalk} scrollToId={ctaScrollToId} />}
      </ExpandableSection.Content>
    </ExpandableSection>
  );
}
