import {
  CollapsibleTags,
  ContentButtons,
  ContentInfoItems,
  ExclusiveContentTooltip,
  Stack,
} from "~/components";
import { HoliPromoBanner } from "~/components/HoliPromoBanner";
import { HeroTitle, HeroDescription, HeroButtons } from "~/sections";
import { getTagsFromContent } from "~/lib/utils/content";
import { useRootLoaderData } from "~/hooks";
import { resolveSeriesCtaState } from "./resolveSeriesCtaState";
import type { useContentSeriesData } from "~/hooks";
import type { Commentary, Content, Pilgrimage } from "~/lib/types";

type SeriesContent = Commentary | Pilgrimage;
type SeriesContentType = "commentary" | "pilgrimage";

interface SeriesHeroContentProps {
  content: SeriesContent;
  contentType: SeriesContentType;
  /** Data from useContentSeriesData hook */
  seriesData: ReturnType<typeof useContentSeriesData>;
  /**
   * Optional anchor ID - when provided, CTA buttons scroll to this element
   * instead of opening the subscription modal.
   */
  scrollToId?: string;
  /**
   * Active live stream for this content (pilgrimage or commentary).
   * When set, CTA buttons use this live's data (liveStatus, access, videoId)
   * instead of the content's. The rest of the hero (title, description,
   * tabs) still shows the content's data.
   *
   * This is set by the route loader when the featured live's ppvTag matches
   * the content's ppvTag.
   */
  activeLive?: Content | null;
}

/**
 * Shared hero content used across commentary and pilgrimage heroes
 * (both full-page route heroes and inline expanded views).
 *
 * Renders: tags, title, description, content info, access tooltip, and action buttons.
 * Does NOT include the Container/wrapper — the consumer controls that.
 */
export function SeriesHeroContent({
  content,
  contentType,
  seriesData,
  scrollToId,
  activeLive,
}: SeriesHeroContentProps) {
  const {
    userHasAccess,
    playVideoId,
    hasFeaturedVideo,
    seriesFeaturedVideo,
  } = seriesData;

  const { user, subscriptionTier, userProfile } = useRootLoaderData();

  const tags = getTagsFromContent(content);

  // Single pure function resolves CTA rendering decisions.
  // See resolveSeriesCtaState for the full decision tree.
  const {
    ctaContent,
    ctaContentType,
    ctaVideoId,
    usedLiveForCta,
    resolvedSeriesMarker,
  } = resolveSeriesCtaState({
    content,
    contentType,
    activeLive: activeLive ?? null,
    user,
    subscriptionTier,
    isPrelaunchActive: false,
    seriesPlayVideoId: playVideoId,
    hasFeaturedVideo: !!hasFeaturedVideo,
    seriesFeaturedVideoMarker: hasFeaturedVideo
      ? seriesFeaturedVideo.marker
      : null,
    watchProgressSeconds: null,
  });

  // Show the Holi "thank you" banner for Premium Yearly members who have
  // access to the pilgrimage. New Premium Yearly subscribers (post-promo)
  // won't have the ppv tag, so they see the standard tooltip.
  const isPremiumYearly =
    subscriptionTier === "premium" &&
    userProfile?.subscriptionBillingPeriod === "yearly";
  const showHoliThankYou =
    content.slug === "holi-2026" && isPremiumYearly && userHasAccess;

  return (
    <Stack gap={1} className="tablet:gap-sp-3 pt-[16rem] tablet:pt-0">
      <Stack gap={2}>
        {tags.length > 0 && (
          <CollapsibleTags tags={tags} maxVisible={4} />
        )}
        <HeroTitle uppercase size="h1-lg">
          {content.title}
        </HeroTitle>
      </Stack>

      <HeroDescription size="body-b2">
        {content.summary200 || content.description}
      </HeroDescription>

      <ContentInfoItems content={content} showDuration />

      <Stack gap={2}>
        {showHoliThankYou ? (
          <HoliPromoBanner />
        ) : (
          <ExclusiveContentTooltip
            content={content}
            hasAccess={userHasAccess}
          />
        )}
        <HeroButtons>
          <ContentButtons
            content={ctaContent}
            contentType={ctaContentType}
            videoId={ctaVideoId}
            scrollToId={scrollToId}
            seriesFeaturedVideoMarker={resolvedSeriesMarker}
            seriesFeaturedVideoTitle={
              usedLiveForCta
                ? undefined
                : hasFeaturedVideo
                ? seriesFeaturedVideo.videoTitle
                : undefined
            }
            isLoadingSeriesFeaturedVideo={
              usedLiveForCta ? false : seriesFeaturedVideo.isLoading
            }
          />
        </HeroButtons>
      </Stack>
    </Stack>
  );
}
