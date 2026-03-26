import { memo, useState, useMemo } from "react";
import {
  Button,
  Container,
  ContentButtons,
  ContentDetails,
  Carousel,
  VideoCard,
  ContentCard,
  SectionHeader,
  Link,
  HoverVideoCard,
  ProgressAwareHoverVideoCard,
  HeroOverlay,
  Stack,
  BackgroundVideoWithOverlays,
  ProgressAwareVideoCardLink,
  GenreEyebrow,
  VideoChapters,
  VideoGrid,
  ContentInfoItems,
  CollapsibleTags,
  MoreBhaktiEyebrow,
  DraftBadge,
  type Genre,
} from "~/components";
import {
  IconInfo,
  IconChapters,
  IconChevron,
  IconPlay,
} from "~/components/Icons";
import satsangWeekPlayIcon from "~/assets/images/satsang-week-play-icon.svg";
import {
  HeroBackground,
  HeroContent,
  HeroTags,
  HeroTitle,
  HeroDescription,
  HeroButtons,
} from "~/sections";
import {
  getTagsFromContent,
  decodeHtmlEntities,
  isNewContent,
} from "~/lib/utils";
import { Cover } from "~/components";
import { Content, SubscriptionTier } from "~/lib/types";
import { WatchHistoryEntryDto, SatsangDto, PurchaseDto } from "~/lib/api/types";
import { encodeVideoId } from "~/lib/utils/video-id-encoder";
import { CONTENT_TYPE_ID_TO_TYPE } from "~/lib/constants";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { useVideoPlayer } from "~/contexts/VideoPlayerProvider";
import { useWhyDidYouUpdate, useRootLoaderData } from "~/hooks";

export function FeaturedLiveHero({
  featuredLive,
  isDetailsVisible,
  setIsDetailsVisible,
  subscriptionTier,
  customerId,
  onPlayClick,
  showLearnMoreLink = false,
  learnMoreTargetId,
}: {
  featuredLive: Content;
  isDetailsVisible: boolean;
  setIsDetailsVisible: (isDetailsVisible: boolean) => void;
  subscriptionTier?: string;
  customerId?: string | null;
  /** Optional callback - when provided, play button calls this instead of navigating to video page */
  onPlayClick?: () => void;
  /** Show "Learn more" scroll link at the bottom of the hero */
  showLearnMoreLink?: boolean;
  /** Target element ID for the learn more link to scroll to */
  learnMoreTargetId?: string;
}) {
  const { strings } = useTranslations();
  const { stopAllVideos } = useVideoPlayer();

  // REMOVE REMOVE REMOVE REMOVE
  // featuredLive.liveStatus = 'live-now';

  // Derive hero values from featuredLive content directly
  const featuredTags = getTagsFromContent(featuredLive);
  const backgroundImageUrl =
    featuredLive?.bannerImageUrl || featuredLive?.thumbnailUrl || "";

  // Only enable background video preview when content is live, in preview, or has replay available
  // Use liveStatus if available, otherwise fall back to boolean flags
  const liveStatus = featuredLive?.liveStatus;
  const enableBackgroundVideo = liveStatus
    ? liveStatus === "live-now" ||
      liveStatus === "live-preview" ||
      liveStatus === "vod-ready"
    : (featuredLive?.isLiveContent || featuredLive?.isLiveNow) &&
      !featuredLive?.isUpcoming;

  // Handle play button click - stop background video and call the callback
  const handlePlayClick = onPlayClick
    ? () => {
        stopAllVideos();
        onPlayClick();
      }
    : undefined;

  return (
    <>
      <HeroBackground>
        <BackgroundVideoWithOverlays
          imageUrl={backgroundImageUrl}
          mobileImageUrl={featuredLive?.thumbnailUrlVertical || undefined}
          altText={featuredLive?.title}
          videoId={featuredLive?.video?.videoId?.toString()}
          subscriptionTier={subscriptionTier}
          customerId={customerId}
          enableVideo={enableBackgroundVideo}
          startTimeSeconds={featuredLive?.video?.previewStartOffset}
        />
        <Cover minHeight="70vh">
          <Cover.Center>
            <Container>
              <HeroContent padding="py-128">
                <Stack gap={3}>
                  <Stack gap={2}>
                    {featuredTags && featuredTags.length > 0 && (
                      <HeroTags tags={featuredTags} />
                    )}
                    <HeroTitle uppercase>{featuredLive?.title}</HeroTitle>
                  </Stack>
                  {(featuredLive?.summary200 || featuredLive?.description) && (
                    <HeroDescription>
                      {featuredLive.summary200 || featuredLive.description}
                    </HeroDescription>
                  )}

                  <ContentInfoItems content={featuredLive} showDuration />

                  <HeroButtons>
                    <ContentButtons
                      content={featuredLive}
                      contentType="live"
                      onPlayClick={handlePlayClick}
                    />
                    <Button
                      icon={
                        <IconInfo className="w-20 tooltip-trigger mr-8 relative top-[-1px] m-y-auto" />
                      }
                      variant="secondary"
                      onClick={() => setIsDetailsVisible(true)}
                    >
                      {strings.homepage_button_details}
                    </Button>
                  </HeroButtons>
                </Stack>
              </HeroContent>
            </Container>
          </Cover.Center>
        </Cover>

        {/* Learn more scroll link - positioned absolutely at bottom of hero, on top of video overlay */}
        {showLearnMoreLink && learnMoreTargetId && (
          <div className="hidden tablet:block absolute bottom-48 left-0 right-0 z-10">
            <Container>
              <div className="flex justify-center">
                <a
                  href={`#${learnMoreTargetId}`}
                  className="flex flex-col items-center gap-8 text-grey-dark hover:text-white transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById(learnMoreTargetId)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  <span className="body-b2">
                    {strings.homepage_unsubscribed_learn_more}
                  </span>
                  <IconChevron className="w-24 h-24 animate-pulse-down" />
                </a>
              </div>
            </Container>
          </div>
        )}

        {/* DRAFT badge for unpublished content - top-left corner */}
        {featuredLive?.isPublished === false && (
          <div className="absolute top-24 left-24 z-10">
            <DraftBadge size="md" />
          </div>
        )}

        <HeroOverlay
          isVisible={isDetailsVisible}
          onClose={() => setIsDetailsVisible(false)}
          ariaLabel={strings.aria_content_details}
        >
          <ContentDetails content={featuredLive} />
        </HeroOverlay>
      </HeroBackground>
    </>
  );
}

export function DailySatsangHero({
  dailySatsang,
  subscriptionTier,
  customerId,
}: {
  dailySatsang: SatsangDto;
  subscriptionTier?: string;
  customerId?: string | null;
}) {
  const { strings } = useTranslations();
  const [isVideoChaptersVisible, setIsVideoChaptersVisible] = useState(false);

  // Derive hero values from dailySatsang content
  const contentTags = getTagsFromContent(dailySatsang as unknown as Content);
  const backgroundImageUrl =
    dailySatsang?.bannerImageUrl || dailySatsang?.thumbnailUrl || "";
  const hasChapters =
    dailySatsang?.video?.chapters && dailySatsang.video.chapters.length > 0;

  // Combine "Satsang of the Day" tag, "Day X" tag with content tags
  const allTags = useMemo(() => {
    const tags: { label: string; bgColor: string; textColor: string }[] = [];

    // Add "Satsang of the Day" tag first
    tags.push({
      label: strings.hero_satsang_of_the_day,
      bgColor: "bg-purple-dark",
      textColor: "text-white",
    });

    // Add "Day X" tag after if dayOfSatsangOfDay is available
    if (dailySatsang?.dayOfSatsangOfDay) {
      tags.push({
        label: `${strings.hero_satsang_day} ${dailySatsang.dayOfSatsangOfDay}`,
        bgColor: "bg-purple-dark",
        textColor: "text-white",
      });
    }

    return [...tags, ...(contentTags || [])];
  }, [
    strings.hero_satsang_of_the_day,
    strings.hero_satsang_day,
    contentTags,
    dailySatsang?.dayOfSatsangOfDay,
  ]);

  return (
    <HeroBackground>
      <BackgroundVideoWithOverlays
        imageUrl={backgroundImageUrl}
        mobileImageUrl={dailySatsang?.thumbnailUrlVertical || undefined}
        altText={dailySatsang?.title}
        videoId={dailySatsang?.video?.videoId?.toString()}
        subscriptionTier={subscriptionTier}
        customerId={customerId}
        enableVideo={true}
        startTimeSeconds={dailySatsang?.video?.previewStartOffset}
      />
      <Cover minHeight="70vh">
        <Cover.Center>
          <Container>
            <HeroContent padding="py-128">
              <Stack gap={3}>
                <Stack gap={2}>
                  <CollapsibleTags
                    tags={allTags}
                    maxWidth="432px"
                    className="hero__tags"
                  />
                  <HeroTitle uppercase>{dailySatsang?.title}</HeroTitle>
                </Stack>
                {(dailySatsang?.summary200 || dailySatsang?.description) && (
                  <HeroDescription>{dailySatsang.summary200 || dailySatsang.description}</HeroDescription>
                )}

                <ContentInfoItems content={dailySatsang} showDuration />

                <HeroButtons>
                  <ContentButtons
                    content={dailySatsang as unknown as Content}
                    contentType="satsang"
                  />
                  {hasChapters && (
                    <Button
                      variant="secondary"
                      icon={<IconChapters className="w-20 mr-8" />}
                      onClick={() => setIsVideoChaptersVisible(true)}
                    >
                      {strings.video_see_chapters}
                    </Button>
                  )}
                </HeroButtons>
              </Stack>
            </HeroContent>
          </Container>
        </Cover.Center>
      </Cover>

      {hasChapters && (
        <HeroOverlay
          isVisible={isVideoChaptersVisible}
          onClose={() => setIsVideoChaptersVisible(false)}
          ariaLabel="Video chapters"
        >
          <VideoChapters
            title={dailySatsang.title}
            video={dailySatsang.video}
            chapters={dailySatsang.video.chapters}
          />
        </HeroOverlay>
      )}

      {/* DRAFT badge for unpublished content - top-left corner */}
      {dailySatsang?.isPublished === false && (
        <div className="absolute top-24 left-24 z-10">
          <DraftBadge size="md" />
        </div>
      )}
    </HeroBackground>
  );
}

export function Lives({
  lives,
  title,
  aspectRatio,
  subscriptionTier,
  customerId,
  id,
  hideMoreBhaktiEyebrow = false,
}: {
  lives: Content[];
  title: string;
  aspectRatio: "square" | "portrait" | "landscape";
  subscriptionTier?: string;
  customerId?: string | null;
  id: string;
  /** Hide the "More on Bhakti+" eyebrow when rendered separately (e.g., after MyPurchasesRow) */
  hideMoreBhaktiEyebrow?: boolean;
}) {
  const { expandedPortalContainerId } = useVideoPlayer();
  const portalContainerId = `${id}-portal-container`;
  const hasExpandedCard = expandedPortalContainerId === portalContainerId;
  const { user, memberships } = useRootLoaderData();
  const { strings } = useTranslations();

  return (
    <div
      className="relative"
      style={{ zIndex: hasExpandedCard ? 50 : 10 }}
      id={portalContainerId}
    >
      <div className="animated-link-chevron-trigger max-w-screen overflow-hidden">
        <Container>
          <SectionHeader title={title} exploreAllLink="/livestreams" />
        </Container>
        <Container bleedRight>
          <Carousel>
            {lives.map((live) => (
              <Carousel.Slide key={live.contentId}>
                <ProgressAwareVideoCardLink
                  content={live}
                  user={user}
                  subscriptionTier={
                    subscriptionTier as SubscriptionTier | undefined
                  }
                  memberships={memberships ?? undefined}
                  contentType="livestream"
                >
                  {({ hasAccess }) => (
                    <ProgressAwareHoverVideoCard
                      aspectRatio={aspectRatio}
                      eyebrow={<GenreEyebrow contentType="Live" />}
                      title={live.title ?? ""}
                      duration={live.video?.durationSeconds}
                      thumbnailUrl={
                        aspectRatio === "portrait"
                          ? live.thumbnailUrlVertical || live.thumbnailUrl
                          : live.thumbnailUrl
                      }
                      thumbnailUrlVariants={
                        aspectRatio === "portrait"
                          ? live.thumbnailUrlVerticalVariants ||
                            live.thumbnailUrlVariants
                          : live.thumbnailUrlVariants
                      }
                      videoId={live.video?.videoId}
                      subscriptionTier={subscriptionTier}
                      customerId={customerId}
                      tags={live.tags}
                      chapters={live.video?.chapters}
                      locked={!hasAccess}
                      isNew={isNewContent(live)}
                      isPublished={live.isPublished}
                    />
                  )}
                </ProgressAwareVideoCardLink>
              </Carousel.Slide>
            ))}
          </Carousel>
        </Container>
        {!hideMoreBhaktiEyebrow && (
          <Container>
            <MoreBhaktiEyebrow
              text={strings.account_more_on_bhakti_plus}
              className="mt-64 mb-16 desktop:mt-64 desktop:mb-4"
            />
          </Container>
        )}
      </div>
    </div>
  );
}

export const SatsangContentRow = memo(function SatsangContentRow({
  content,
  title,
  exploreAllLink,
  aspectRatio,
  subscriptionTier,
  customerId,
  id,
}: {
  content: Content[];
  title: string;
  exploreAllLink: string;
  aspectRatio: "square" | "portrait" | "landscape";
  subscriptionTier?: string;
  customerId?: string | null;
  id: string;
}) {
  const { expandedPortalContainerId } = useVideoPlayer();
  const portalContainerId = `${id}-portal-container`;
  const hasExpandedCard = expandedPortalContainerId === portalContainerId;
  const { user, memberships } = useRootLoaderData();
  useWhyDidYouUpdate("SatsangContentRow", {
    content,
    title,
    exploreAllLink,
    aspectRatio,
    subscriptionTier,
    customerId,
    id,
  });

  return (
    <div
      className="relative"
      style={{ zIndex: hasExpandedCard ? 50 : 10 }}
      id={portalContainerId}
    >
      <div className="animated-link-chevron-trigger max-w-screen overflow-hidden">
        <Container>
          <SectionHeader title={title} exploreAllLink={exploreAllLink} />
        </Container>
        <Container bleedRight>
          <Carousel>
            {content.map((item) => (
              <Carousel.Slide key={item.contentId}>
                <ProgressAwareVideoCardLink
                  content={item}
                  user={user}
                  subscriptionTier={
                    subscriptionTier as SubscriptionTier | undefined
                  }
                  memberships={memberships ?? undefined}
                  contentType="satsang"
                >
                  {({ hasAccess }) => (
                    <ProgressAwareHoverVideoCard
                      aspectRatio={aspectRatio}
                      eyebrow={
                        item.genre ? (
                          <GenreEyebrow
                            genre={item.genre as Genre}
                            contentType="Satsang"
                          />
                        ) : undefined
                      }
                      title={item.title ?? ""}
                      duration={item.video?.durationSeconds}
                      thumbnailUrl={
                        aspectRatio === "portrait"
                          ? item.thumbnailUrlVertical || item.thumbnailUrl
                          : item.thumbnailUrl
                      }
                      thumbnailUrlVariants={
                        aspectRatio === "portrait"
                          ? item.thumbnailUrlVerticalVariants ||
                            item.thumbnailUrlVariants
                          : item.thumbnailUrlVariants
                      }
                      videoId={item.video?.videoId}
                      subscriptionTier={subscriptionTier}
                      customerId={customerId}
                      tags={item.tags}
                      chapters={item.video?.chapters}
                      locked={!hasAccess}
                      isNew={isNewContent(item)}
                      isPublished={item.isPublished}
                    />
                  )}
                </ProgressAwareVideoCardLink>
              </Carousel.Slide>
            ))}
          </Carousel>
        </Container>
      </div>
    </div>
  );
});

/**
 * Grid layout for satsang content - displays all videos in a multi-row grid.
 * Used when showing all content for a category/subcategory instead of a carousel.
 *
 * @param title - Optional section title. When empty, no header is displayed.
 */
export const SatsangContentGrid = memo(function SatsangContentGrid({
  content,
  title,
  aspectRatio,
  subscriptionTier,
  customerId,
  id,
}: {
  content: Content[];
  title?: string;
  aspectRatio: "square" | "portrait" | "landscape";
  subscriptionTier?: string;
  customerId?: string | null;
  id: string;
}) {
  const { expandedPortalContainerId } = useVideoPlayer();
  const portalContainerId = `${id}-portal-container`;
  const hasExpandedCard = expandedPortalContainerId === portalContainerId;
  const { user, memberships } = useRootLoaderData();

  return (
    <div
      className="relative"
      style={{ zIndex: hasExpandedCard ? 50 : 10 }}
      id={portalContainerId}
    >
      <Container>
        {title && <SectionHeader title={title} />}
        <VideoGrid>
          {content.map((item) => (
            <VideoGrid.Item key={item.contentId}>
              <ProgressAwareVideoCardLink
                content={item}
                user={user}
                subscriptionTier={
                  subscriptionTier as SubscriptionTier | undefined
                }
                memberships={memberships ?? undefined}
                contentType="satsang"
              >
                {({ hasAccess }) => (
                  <ProgressAwareHoverVideoCard
                    aspectRatio={aspectRatio}
                    eyebrow={
                      item.genre ? (
                        <GenreEyebrow
                          genre={item.genre as Genre}
                          contentType="Satsang"
                        />
                      ) : undefined
                    }
                    title={item.title ?? ""}
                    duration={item.video?.durationSeconds}
                    thumbnailUrl={
                      aspectRatio === "portrait"
                        ? item.thumbnailUrlVertical || item.thumbnailUrl
                        : item.thumbnailUrl
                    }
                    thumbnailUrlVariants={
                      aspectRatio === "portrait"
                        ? item.thumbnailUrlVerticalVariants ||
                          item.thumbnailUrlVariants
                        : item.thumbnailUrlVariants
                    }
                    videoId={item.video?.videoId}
                    subscriptionTier={subscriptionTier}
                    customerId={customerId}
                    tags={item.tags}
                    chapters={item.video?.chapters}
                    locked={!hasAccess}
                    isNew={isNewContent(item)}
                    isPublished={item.isPublished}
                  />
                )}
              </ProgressAwareVideoCardLink>
            </VideoGrid.Item>
          ))}
        </VideoGrid>
      </Container>
    </div>
  );
});

export const SatsangsOfTheWeekRow = memo(function SatsangsOfTheWeekRow({
  content,
  title,
  description,
  aspectRatio,
  subscriptionTier,
  customerId,
  id,
  todayIndex,
}: {
  content: Content[];
  title: string;
  description: string;
  aspectRatio: "square" | "portrait" | "landscape";
  subscriptionTier?: string;
  customerId?: string | null;
  id: string;
  /** Index of today's satsang within the weekly list (0-based). -1 if not found. */
  todayIndex?: number;
}) {
  const { expandedPortalContainerId } = useVideoPlayer();
  const portalContainerId = `${id}-portal-container`;
  const hasExpandedCard = expandedPortalContainerId === portalContainerId;
  const { user, memberships } = useRootLoaderData();

  return (
    <div
      className="relative"
      style={{ zIndex: hasExpandedCard ? 50 : 10 }}
      id={portalContainerId}
    >
      <Container bleedRight>
        {/* Lighter underlay background */}
        <div className="bg-brand rounded-lg py-16 tablet:py-24 w-full">
          {/* Side-by-side layout */}
          <div className="tablet:flex items-start">
            {/* Left info panel - card size + 20% */}
            <div className="flex-shrink-0 w-[300px] desktop:w-[340px] pl-24 desktop:pl-32 pr-24 flex flex-col gap-12">
              {/* Play icon box */}
              <img
                src={satsangWeekPlayIcon}
                alt="Satsangs of the week"
                width={37}
                height={37}
              />
              <div className="flex flex-col gap-8">
                <h2 className="body-b0 font-semibold text-white">{title}</h2>
                <div
                  className="body-b3 text-grey-dark whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: description }}
                ></div>
              </div>
            </div>

            {/* Right carousel */}
            <Carousel arrowBgClass="bg-brand hover:bg-brand">
              {content.map((item, index) => (
                <Carousel.Slide key={item.contentId}>
                  <ProgressAwareVideoCardLink
                    content={item}
                    user={user}
                    subscriptionTier={
                      subscriptionTier as SubscriptionTier | undefined
                    }
                    memberships={memberships ?? undefined}
                    contentType="satsang"
                  >
                    {({ hasAccess }) => (
                      <ProgressAwareHoverVideoCard
                        aspectRatio={aspectRatio}
                        eyebrow={
                          item.genre ? (
                            <GenreEyebrow
                              genre={item.genre as Genre}
                              contentType="Satsang"
                            />
                          ) : undefined
                        }
                        title={item.title ?? ""}
                        duration={item.video?.durationSeconds}
                        thumbnailUrl={
                          aspectRatio === "portrait"
                            ? item.thumbnailUrlVertical || item.thumbnailUrl
                            : item.thumbnailUrl
                        }
                        thumbnailUrlVariants={
                          aspectRatio === "portrait"
                            ? item.thumbnailUrlVerticalVariants ||
                              item.thumbnailUrlVariants
                            : item.thumbnailUrlVariants
                        }
                        videoId={item.video?.videoId}
                        subscriptionTier={subscriptionTier}
                        customerId={customerId}
                        tags={item.tags}
                        chapters={item.video?.chapters}
                        locked={!hasAccess}
                        isSatsangOfDay={item.isSatsangOfDay}
                        dayOfSatsangOfDay={item.dayOfSatsangOfDay}
                        isTodaySatsang={todayIndex != null && todayIndex === index}
                        isNew={isNewContent(item)}
                        isPublished={item.isPublished}
                      />
                    )}
                  </ProgressAwareVideoCardLink>
                </Carousel.Slide>
              ))}
            </Carousel>
          </div>
        </div>
      </Container>
    </div>
  );
});

export function HistoryContentRow({
  content,
  title,
  exploreAllLink,
  aspectRatio,
  subscriptionTier,
  customerId,
  id,
}: {
  content: WatchHistoryEntryDto[];
  title: string;
  exploreAllLink?: string;
  aspectRatio: "square" | "portrait" | "landscape";
  subscriptionTier?: string;
  customerId?: string | null;
  id: string;
}) {
  const { expandedPortalContainerId } = useVideoPlayer();
  const portalContainerId = `${id}-portal-container`;
  const hasExpandedCard = expandedPortalContainerId === portalContainerId;
  const { user, memberships } = useRootLoaderData();

  return (
    <div
      className="relative"
      style={{ zIndex: hasExpandedCard ? 50 : 10 }}
      id={portalContainerId}
    >
      <div className="animated-link-chevron-trigger max-w-screen overflow-hidden">
        <Container>
          <SectionHeader title={title} exploreAllLink={exploreAllLink} />
        </Container>
        <Container bleedRight>
          <Carousel>
            {content.map((historyItem) => {
              // Create minimal Content object for access check
              // WatchHistoryEntryDto has subscriptionTiers and contentTypeId at root level
              const contentForCheck = {
                contentTypeId: historyItem.contentTypeId,
                subscriptionTiers:
                  historyItem.subscriptionTiers ??
                  historyItem.content?.subscriptionTiers ??
                  null,
                title: historyItem.title ?? historyItem.content?.title ?? "",
                ppvTag: historyItem.content?.ppvTag ?? null,
              } as unknown as Content;

              // Map API content type to modal content type ('live' -> 'livestream')
              const apiContentType = historyItem.contentTypeId
                ? CONTENT_TYPE_ID_TO_TYPE[historyItem.contentTypeId]
                : undefined;
              const contentType =
                apiContentType === "live"
                  ? "livestream"
                  : apiContentType === "talk"
                  ? "video"
                  : apiContentType;

              // Map content type to display label for GenreEyebrow
              const contentTypeLabel =
                apiContentType === "satsang"
                  ? "Satsang"
                  : apiContentType === "live"
                  ? "Live"
                  : apiContentType === "talk"
                  ? "Talk"
                  : apiContentType === "commentary"
                  ? "Commentary"
                  : apiContentType === "pilgrimage"
                  ? "Pilgrimage"
                  : "Video";

              // Get genre from content (will be available after backend update)
              const genre = historyItem.content?.genre as Genre | undefined;

              return (
                <Carousel.Slide
                  key={historyItem.content?.id || historyItem.videoId}
                >
                  <ProgressAwareVideoCardLink
                    content={contentForCheck}
                    videoId={historyItem.videoId}
                    user={user}
                    subscriptionTier={
                      subscriptionTier as SubscriptionTier | undefined
                    }
                    memberships={memberships ?? undefined}
                    contentType={contentType || "video"}
                    explicitProgress={historyItem.progressSeconds}
                  >
                    {({ hasAccess }) => (
                      <HoverVideoCard
                        aspectRatio={aspectRatio}
                        eyebrow={
                          <GenreEyebrow
                            genre={genre}
                            contentType={contentTypeLabel}
                            contentTitle={historyItem.content?.title}
                          />
                        }
                        title={historyItem.title ?? ""}
                        duration={historyItem.totalSeconds}
                        thumbnailUrl={historyItem.thumbnailUrl ?? ""}
                        thumbnailUrlVariants={historyItem.thumbnailUrlVariants}
                        videoId={historyItem.videoId}
                        subscriptionTier={subscriptionTier}
                        customerId={customerId}
                        progressSeconds={historyItem.progressSeconds}
                        chapters={historyItem.video?.chapters ?? undefined}
                        locked={!hasAccess}
                        isNew={isNewContent(historyItem.content)}
                        isPublished={historyItem.content?.isPublished}
                      />
                    )}
                  </ProgressAwareVideoCardLink>
                </Carousel.Slide>
              );
            })}
          </Carousel>
        </Container>
      </div>
    </div>
  );
}

/**
 * My Purchases row for homepage - shows user's purchased content in a carousel.
 * Only renders if user has purchases.
 */
export function MyPurchasesRow({
  purchases,
  title,
}: {
  purchases: PurchaseDto[];
  title: string;
}) {
  // Don't render if no purchases
  if (!purchases || purchases.length === 0) {
    return null;
  }

  const getContentUrl = (purchase: PurchaseDto) => {
    if (purchase.videoId) {
      const encodedVideoId = encodeVideoId(purchase.videoId);
      return `/video?videoId=${encodedVideoId}`;
    }
    return "#";
  };

  return (
    <div className="animated-link-chevron-trigger max-w-screen overflow-hidden">
      <Container>
        <SectionHeader title={title} exploreAllLink="/account/purchases" />
      </Container>
      <Container bleedRight>
        <Carousel>
          {purchases.map((purchase) => (
            <Carousel.Slide
              key={purchase.id}
              className="flex-shrink-0 flex flex-col"
            >
              <Link to={getContentUrl(purchase)}>
                <ContentCard
                  size="md"
                  aspectRatio="portrait"
                  title={purchase.title}
                  image={
                    purchase.thumbnailUrlVertical || purchase.thumbnailUrl || ""
                  }
                  className={purchase.isExpired ? "opacity-60" : ""}
                />
              </Link>
            </Carousel.Slide>
          ))}
        </Carousel>
      </Container>
    </div>
  );
}
