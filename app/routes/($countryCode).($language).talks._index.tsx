import { useState, useCallback, Suspense, useRef, useEffect, useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData, type MetaFunction, Await, useRouteLoaderData } from "react-router";
import {
  HeroBackground,
  HeroContent,
  HeroTags,
  HeroTitle,
  HeroDescription,
  HeroButtons,
} from "~/sections";
import { getTagsFromContent, hasAccessToContent } from "~/lib/utils";
import { IconChapters, IconClose } from "~/components/Icons";
import {
  Container,
  ContainerWide,
  ContentInfoItems,
  VideoChapters,
  VideoChaptersProps,
  Button,
  ContentButtons,
  Stack,
  BackgroundVideoWithOverlays,
  Cover,
  ContentCard,
  SectionHeader,
  ExpandableSection,
  Talks as TalksComponent,
  MobileWall,
  DraftBadge,
} from "~/components";
import { ExpandedTalkView } from "~/components/Talks/ExpandedTalkView";
import { Content, SubscriptionTier, Talk, User } from "~/lib/types";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { useLocale } from "~/hooks";
import type { RootLoader } from "~/root";
import { userScopedMediaApiContext } from "~/lib/middleware";
import type { CardSize } from "~/components/Card/Card";

const PAGE_SIZE = 24;

/** Maps CardSize to pixel values for grid calculations */
const cardSizeToPixels: Record<CardSize, number> = {
  auto: 300, // fallback to md size
  xxs: 158,
  xs: 226,
  sm: 256,
  md: 300,
  lg: 318,
};

export const meta: MetaFunction = () => {
  return [
    { title: "Talks - Bhakti+" },
    { name: "description", content: "Paramahamsa Vishwananda's wisdom in one place. Watch everywhere, anytime, without distractions. Available in 28+ languages." },
  ];
};

interface TalksGridProps {
  talks: Talk[];
  selectedTalk: Talk | null;
  onSelectTalk: (talk: Talk) => void;
  onCloseTalk: () => void;
  /** Card size - defaults to "md" (300px). Use smaller sizes like "xs" (226px) to fit more cards */
  cardSize?: CardSize;
  /** Gap between rows in pixels - defaults to 48 */
  rowGap?: number;
  /** Gap between columns in pixels - defaults to 24 */
  columnGap?: number;
  /** User data for access checking */
  user?: User | null;
  /** User's subscription tier for access checking */
  subscriptionTier?: SubscriptionTier | null;
}

/**
 * TalksGrid component that renders cards in rows with expandable section
 * appearing below the row containing the selected card.
 */
function TalksGrid({
  talks,
  selectedTalk,
  onSelectTalk,
  onCloseTalk,
  cardSize = "md",
  rowGap = 48,
  columnGap = 8,
  user,
  subscriptionTier,
}: TalksGridProps) {
  // Ref to measure the content width inside Container (after padding)
  const gridMeasureRef = useRef<HTMLDivElement>(null);
  const [cardsPerRow, setCardsPerRow] = useState(4);

  // Refs for each row to enable scroll-to functionality
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Get pixel width for the selected card size
  const cardWidth = cardSizeToPixels[cardSize];

  // Calculate cards per row based on grid width inside Container (accounting for gaps)
  useEffect(() => {
    const updateCardsPerRow = () => {
      if (gridMeasureRef.current) {
        const contentWidth = gridMeasureRef.current.offsetWidth;
        // Calculate how many cards fit: (contentWidth + gap) / (cardWidth + gap)
        // This accounts for gaps between cards
        const calculated = Math.floor((contentWidth + columnGap) / (cardWidth + columnGap));
        setCardsPerRow(Math.max(1, calculated));
      }
    };

    updateCardsPerRow();
    window.addEventListener("resize", updateCardsPerRow);
    return () => window.removeEventListener("resize", updateCardsPerRow);
  }, [cardWidth, columnGap]);

  // Group talks into rows
  const rows = useMemo(() => {
    const result: Talk[][] = [];
    for (let i = 0; i < talks.length; i += cardsPerRow) {
      result.push(talks.slice(i, i + cardsPerRow));
    }
    return result;
  }, [talks, cardsPerRow]);

  // Find which row contains the selected talk
  const selectedRowIndex = useMemo(() => {
    if (!selectedTalk) return -1;
    const talkIndex = talks.findIndex((t) => t.contentId === selectedTalk.contentId);
    if (talkIndex === -1) return -1;
    return Math.floor(talkIndex / cardsPerRow);
  }, [selectedTalk, talks, cardsPerRow]);

  // Get the ref for the selected row (for scrolling)
  const selectedRowRef = selectedRowIndex >= 0 ? rowRefs.current.get(selectedRowIndex) : null;

  return (
    <div>
      {rows.map((row, rowIndex) => {
        // Only cards in the selected row should switch to horizontal layout
        const isSelectedRow = selectedRowIndex === rowIndex;
        // Use first row's grid to measure content width inside Container
        const isFirstRow = rowIndex === 0;

        return (
          <div key={rowIndex}>
            {/* Hidden anchor for scroll-to functionality */}
            <div
              ref={(el) => {
                if (el) {
                  rowRefs.current.set(rowIndex, el);
                } else {
                  rowRefs.current.delete(rowIndex);
                }
              }}
              className="sr-only"
              aria-hidden="true"
            />
            {/* Row of cards - wrapped in Container for consistent horizontal padding */}
            <Container>
              <div
                ref={isFirstRow ? gridMeasureRef : undefined}
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(auto-fill, ${cardWidth}px)`,
                  rowGap: `${rowGap}px`,
                  columnGap: `${columnGap}px`,
                }}
              >
                {row.map((talk) => {
                  const userHasAccess = hasAccessToContent(user ?? null, subscriptionTier ?? undefined, talk);
                  return (
                    <ContentCard
                      key={talk.contentId}
                      size={cardSize}
                      aspectRatio={isSelectedRow ? "landscape" : "portrait"}
                      onClick={() => onSelectTalk(talk)}
                      eyebrow={talk.subtitle}
                      title={talk.title ?? ""}
                      image={isSelectedRow || !talk.thumbnailUrlVertical ? talk.thumbnailUrl : talk.thumbnailUrlVertical}
                      active={selectedTalk?.contentId === talk.contentId}
                      hasAccess={userHasAccess}
                    />
                  );
                })}
              </div>
            </Container>

            {/* Expanded section - ContainerWide for full bleed effect */}
            {selectedRowIndex === rowIndex && selectedTalk && (
              <ContainerWide>
                <ExpandableSection isExpanded={true} onClose={onCloseTalk}>
                  <ExpandableSection.Content scrollToRef={{ current: selectedRowRef ?? null }}>
                    <ExpandableSection.CloseButton onClick={onCloseTalk} />
                    <ExpandedTalkView talk={selectedTalk} />
                  </ExpandableSection.Content>
                </ExpandableSection>
              </ContainerWide>
            )}

            {/* Spacing between rows (only if not the last row and no expanded content here) */}
            {rowIndex < rows.length - 1 && selectedRowIndex !== rowIndex && (
              <div style={{ height: `${rowGap}px` }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export async function loader(args: LoaderFunctionArgs) {
  const criticalData = await loadCriticalData(args);

  // Remove userScopedMediaApi from returned data - it's not serializable
  const { userScopedMediaApi: _api, ...returnedCriticalData } = criticalData;

  return returnedCriticalData;
}

/**
 * Load data necessary for rendering content above the fold.
 */
async function loadCriticalData({ context }: LoaderFunctionArgs) {
  const userScopedMediaApi = context.get(userScopedMediaApiContext);

  // Try to get featured talk, fallback to first from list if none configured
  let { featured } = await userScopedMediaApi.talks.getFeatured();

  if (!featured) {
    const { latestReleases } = await userScopedMediaApi.talks.getLatestReleases({ limit: 1 });
    featured = latestReleases?.[0] ?? null;
  }

  // Load initial page of talks sorted alphabetically by title
  const { talks: initialTalks, total } = await userScopedMediaApi.talks.getList({
    limit: PAGE_SIZE,
    offset: 0,
    sortBy: "title",
    desc: false,
  });

  const featuredTags = featured ? getTagsFromContent(featured) : null;

  const videoChaptersProps: VideoChaptersProps | null = featured?.video
    ? {
      title: featured.title,
      video: featured.video,
      chapters: featured.video.chapters,
    }
    : null;

  return {
    featured,
    featuredTags,
    videoChaptersProps,
    initialTalks,
    total,
    userScopedMediaApi,
  };
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-32">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-light" />
    </div>
  );
}

export default function Talks() {
  const {
    featured,
    featuredTags,
    videoChaptersProps,
    initialTalks,
    total,
  } = useLoaderData<typeof loader>();
  const [isVideoChaptersVisible, setIsVideoChaptersVisible] = useState(false);
  const { strings } = useTranslations();
  const locale = useLocale();

  // Get root loader data for access control
  const rootData = useRouteLoaderData<RootLoader>("root");
  const subscriptionTier = rootData?.subscriptionTier;
  const user = rootData?.user;

  // Pagination state
  const [talks, setTalks] = useState<Talk[]>(initialTalks);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialTalks.length < total);

  // Expandable section state
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);
  const hasActiveContent = selectedTalk !== null;

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${locale.pathPrefix}/api/talks/all?offset=${talks.length}&limit=${PAGE_SIZE}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json() as { talks: Talk[]; total: number };
      const newTalks = data.talks ?? [];

      setTalks((prev) => [...prev, ...newTalks]);
      setHasMore(talks.length + newTalks.length < data.total);
    } catch (error) {
      console.error("Failed to load more talks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, talks.length, locale.pathPrefix]);

  const handleExpandClick = useCallback((talk: Talk) => {
    setSelectedTalk(talk);
  }, []);

  // Filter to only talks user has access to for "My Talks"
  const myTalks = user
    ? talks.filter((talk) =>
      hasAccessToContent(user, subscriptionTier as SubscriptionTier | undefined, talk as Content)
    )
    : [];
  const hasAccessibleContent = myTalks.length > 0;

  return (
    <MobileWall>
    <div className="talks">
      {featured && (
        <>
          <HeroBackground>
            <BackgroundVideoWithOverlays
              imageUrl={featured.thumbnailUrl || ""}
              mobileImageUrl={featured.thumbnailUrlVertical || undefined}
              altText={featured.title}
              videoId={featured?.video?.videoId?.toString()}
              enableVideo={true}
              startTimeSeconds={featured?.video?.previewStartOffset}
            />
            <Cover minHeight="70vh">
              <Cover.Center>
                <Container>
                  <HeroContent padding="py-128">
                    <Stack gap={3}>
                      <Stack gap={2}>
                        <HeroTags tags={featuredTags ?? undefined} />
                        <HeroTitle uppercase>
                          {featured.title}
                        </HeroTitle>
                      </Stack>
                      <HeroDescription>{featured.summary200 || featured.description}</HeroDescription>

                      <ContentInfoItems content={featured} showDuration />

                      <HeroButtons>
                        <ContentButtons content={featured} contentType="talk" />
                        {(featured.video?.chapters?.length ?? 0) > 0 && (
                          <Button
                            variant="secondary"
                            icon={<IconChapters className="w-20 mr-8" />}
                            onClick={() => setIsVideoChaptersVisible(true)}
                          >
                            {strings.video_see_chapters || "See Chapters"}
                          </Button>
                        )}
                      </HeroButtons>
                    </Stack>
                  </HeroContent>
                </Container>
              </Cover.Center>
            </Cover>

            {/* DRAFT badge for unpublished content - top-left corner */}
            {featured?.isPublished === false && (
              <div className="absolute top-24 left-24 z-10">
                <DraftBadge size="md" />
              </div>
            )}
          </HeroBackground>

          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
          <div
            role="dialog"
            className={`fixed inset-0 bg-brand-dark/90 z-50 flex items-center justify-center transition-opacity duration-300 ${isVideoChaptersVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
            onClick={() => setIsVideoChaptersVisible(false)}
          >
            <div className="relative w-full h-full">
              <button
                className="absolute w-16 text-white right-32 z-30 top-[calc(var(--header-height)+44px)] transition-transform duration-300 hover:scale-110"
                onClick={() => setIsVideoChaptersVisible(false)}
              >
                <IconClose />
              </button>
              <div className="flex items-center justify-center h-full pt-32">
                <div
                  className={`mt-[var(--header-height)] transition-all duration-300 ${isVideoChaptersVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    }`}
                >
                  {videoChaptersProps && <VideoChapters {...videoChaptersProps} />}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Stack gap={7} className={featured ? "mt-[var(--spacing-xs)]" : "pt-[calc(var(--header-height)+32px)]"}>
        {/* My Talks section - carousel style for user's accessible content */}
        {hasAccessibleContent && (
          <TalksComponent
            title={strings.my_talks || "My Talks"}
            talks={myTalks}
            hideExploreLink
          />
        )}

        {/* All Talks - Section Header */}
        <Stack gap={2}>
          <Container>
            <div className="mb-24">
              <SectionHeader title={strings.all_talks || "All Talks"} />
              <p className="body-b2 text-white/70">
                {strings.showing_talks_count?.replace('{count}', String(talks.length)).replace('{total}', String(total)) ||
                  `Showing ${talks.length} of ${total} talks`}
              </p>
            </div>
          </Container>

          {/* All Talks - Paginated Grid with Expandable Cards */}
          {/* TalksGrid handles its own Container/ContainerWide for rows and expanded sections */}
          <TalksGrid
            talks={talks}
            selectedTalk={selectedTalk}
            onSelectTalk={handleExpandClick}
            onCloseTalk={() => setSelectedTalk(null)}
            cardSize="sm"
            rowGap={80}
            columnGap={8}
            user={user}
            subscriptionTier={subscriptionTier}
          />
          <Container>
            {hasMore && (
              <div className="flex justify-center">
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <Button
                    variant="secondary"
                    onClick={loadMore}
                  >
                    {strings.load_more || "Load More"}
                  </Button>
                )}
              </div>
            )}

            {!hasMore && talks.length > 0 && (
              <div className="text-center py-64">
                <p className="body-b2 text-white/50">
                  {strings.showing_all_talks?.replace('{count}', String(total)) ||
                    `Showing all ${total} talks`}
                </p>
              </div>
            )}
          </Container>
        </Stack>
      </Stack>
    </div>
    </MobileWall>
  );
}
