import {
  BackgroundVideoWithOverlays,
  ContentButtons,
  ContentInfoItems,
  ExclusiveContentTooltip,
  CollapsibleTags,
  Stack,
  Container,
  DraftBadge,
} from "~/components";
import { Talk } from "~/lib/types";
import {
  HeroContent,
  HeroTitle,
  HeroDescription,
  HeroButtons,
} from "~/sections";
import { getTagsFromContent, hasAccessToContent } from "~/lib/utils/content";
import { useRootLoaderData } from "~/hooks";

interface ExpandedTalkViewProps {
  talk: Talk;
  /**
   * Optional anchor ID - when provided, CTA buttons scroll to this element
   * instead of opening the subscription modal.
   */
  scrollToId?: string;
}

/**
 * Simplified expanded view for talks (single videos).
 * Shows a hero section with background video, title, description, and play button.
 * No tabs - simpler than commentary/pilgrimage expanded views.
 */
export function ExpandedTalkView({ talk, scrollToId }: ExpandedTalkViewProps) {
  const { user, subscriptionTier } = useRootLoaderData();

  // Check if user has access to this content
  const userHasAccess = hasAccessToContent(user, subscriptionTier, talk);

  const tags = getTagsFromContent(talk);

  // Video data for background preview
  const videoId = talk?.video?.videoId;
  const startTime = talk?.video?.previewStartOffset ??
    (talk?.video?.durationSeconds ? Math.floor(talk.video.durationSeconds / 2) : undefined);

  return (
    <div className="relative w-full overflow-hidden aspect-video">
      <BackgroundVideoWithOverlays
        imageUrl={talk.thumbnailUrl}
        mobileImageUrl={talk.thumbnailUrlVertical || undefined}
        videoId={videoId?.toString()}
        startTimeSeconds={startTime}
        enableVideo={true}
      />

      {/* DRAFT badge for unpublished content - top-left corner */}
      {talk?.isPublished === false && (
        <div className="absolute top-24 left-24 z-20">
          <DraftBadge size="md" />
        </div>
      )}

      <div className="absolute inset-0 z-10 flex flex-col h-full">
        <div className="flex-1 flex items-center w-full [container-type:size]">
          <Container className="h-full flex items-center">
            <HeroContent padding="py-32">
              <Stack gap={3}>
                <Stack gap={2}>
                  {tags && tags.length > 0 && (
                    <CollapsibleTags
                      tags={tags}
                      maxVisible={4}
                    />
                  )}
                  <HeroTitle uppercase size="h1-lg">
                    {talk.title}
                  </HeroTitle>
                </Stack>

                {(talk.summary200 || talk.description) && (
                  <HeroDescription size="body-b2" className="max-h-[40cqh] overflow-y-auto">
                    {talk.summary200 || talk.description}
                  </HeroDescription>
                )}

                <ContentInfoItems content={talk} showDuration />

                <Stack gap={2}>
                  <ExclusiveContentTooltip content={talk} hasAccess={userHasAccess} />
                  <HeroButtons>
                    <ContentButtons
                      content={talk}
                      contentType="talk"
                      videoId={videoId}
                      scrollToId={scrollToId}
                    />
                  </HeroButtons>
                </Stack>
              </Stack>
            </HeroContent>
          </Container>
        </div>
      </div>
    </div>
  );
}

