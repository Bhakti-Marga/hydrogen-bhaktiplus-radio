import { useState, Suspense, useCallback, useMemo } from "react";
import {
  type LoaderFunctionArgs,
  useLoaderData,
  type MetaFunction,
  Await,
  useRouteLoaderData,
} from "react-router";
import { useLocale } from "~/hooks";
import {
  HeroBackground,
  HeroContent,
  HeroTitle,
  HeroButtons,
} from "~/sections";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { useHeaderVisibility } from "~/contexts/HeaderVisibilityProvider";
import { getTagsFromContent, isNewContent } from "~/lib/utils";
import { Z_INDEX } from "~/lib/constants";
import { IconChapters } from "~/components/Icons";
import {
  Container,
  ContentInfoItems,
  VideoChapters,
  VideoChaptersProps,
  Button,
  ContentButtons,
  SatsangsNav,
  SectionHeader,
  Stack,
  Cover,
  ProgressAwareHoverVideoCard,
  CardSkeletonList,
  CarouselLoading,
  HeroOverlay,
  BackgroundVideoWithOverlays,
  ProgressAwareVideoCardLink,
  GenreEyebrow,
  CollapsibleTags,
  MobileWall,
  DraftBadge,
  type Genre,
} from "~/components";
import {
  SatsangContentRow,
  SatsangsOfTheWeekRow,
  HistoryContentRow,
} from "~/components/Homepage/shared-components";
import { Content, SubscriptionTier } from "~/lib/types";
import type { WatchHistoryEntryDto } from "~/lib/api/types";
import type { RootLoader } from "~/root";
import { useVideoPlayer } from "~/contexts/VideoPlayerProvider";
import {
  userScopedMediaApiContext,
  videosInProgressCountContext,
  userContext,
} from "~/lib/middleware";

export const meta: MetaFunction = () => {
  return [
    { title: "Satsangs - Bhakti+" },
    {
      name: "description",
      content:
        "Paramahamsa Vishwananda's wisdom in one place. Watch everywhere, anytime, without distractions. Available in 28+ languages.",
    },
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  const criticalData = await loadCriticalData(args);
  // Use userScopedMediaApi from critical data for deferred loading
  const deferredData = loadDeferredData(
    criticalData.userScopedMediaApi,
    criticalData.user,
  );

  // Remove userScopedMediaApi from returned data - it's not serializable
  const { userScopedMediaApi: _api, ...returnedCriticalData } = criticalData;

  return { ...deferredData, ...returnedCriticalData };
}

const PAGE_SIZE = 24;

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 *
 * IMPORTANT: This function now returns userScopedMediaApi which should be used for ALL
 * content fetching to ensure correct regionId based on user's profile.
 */
async function loadCriticalData({ context }: LoaderFunctionArgs) {
  // Get userScopedMediaApi from middleware context (no async fetch needed!)
  const userScopedMediaApi = context.get(userScopedMediaApiContext);
  const videosInProgressCount = context.get(videosInProgressCountContext);
  const user = context.get(userContext);

  const featuredPromise = userScopedMediaApi.satsangs
    .getFeatured()
    .catch(() => ({ featured: null }));
  const categoriesPromise = userScopedMediaApi.satsangs.getCategories();

  // Fetch daily satsang as fallback if no featured is set
  const todayDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const dailySatsangPromise = userScopedMediaApi.satsangs
    .getDaily(todayDate)
    .catch(() => ({ satsang: null }));

  // Fetch initial paginated satsangs (ascending by publishedAt - oldest first)
  const allSatsangsPromise = userScopedMediaApi.satsangs.getList({
    limit: PAGE_SIZE,
    offset: 0,
    sortBy: "publishedAt",
    desc: false, // ascending order
  });

  const [
    featuredResponse,
    { categories },
    dailySatsangResponse,
    allSatsangsResponse,
  ] = await Promise.all([
    featuredPromise,
    categoriesPromise,
    dailySatsangPromise,
    allSatsangsPromise,
  ]);

  const dailySatsang = dailySatsangResponse?.satsang ?? null;
  const apiFeatured = featuredResponse?.featured ?? null;

  // Use featured if available, otherwise fall back to satsang of the day
  const featured = apiFeatured ?? dailySatsang;

  // If we have no featured content at all, throw an error
  if (!featured) {
    throw new Response("No featured satsang available", { status: 500 });
  }

  // Show "Satsang of the Day" badge if:
  // 1. We're using the daily satsang as fallback (no featured set), OR
  // 2. The featured satsang is the same as the daily satsang
  const isSatsangOfTheDay =
    dailySatsang && featured.contentId === dailySatsang.contentId;

  const featuredTags = getTagsFromContent(featured);

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
    categories, // Just metadata, no content promises
    isSatsangOfTheDay,
    dailySatsang, // Include daily satsang for dayOfSatsangOfDay badge
    initialAllSatsangs: allSatsangsResponse.satsangs ?? [],
    totalAllSatsangs: allSatsangsResponse.total ?? 0,
    videosInProgressCount,
    user,
    userScopedMediaApi,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 *
 * Uses userScopedMediaApi from critical data to ensure correct regionId.
 */
function loadDeferredData(
  userScopedMediaApi: import("~/lib/api").BhaktiMargMediaApi,
  user: import("~/lib/types").User | null,
) {
  // const satsangsTopSearches = userScopedMediaApi.search
  //   .getTrendingSearches()
  //   .then(({ trending }) => {
  //     return trending;
  //   })
  //   .catch((error) => {
  //     console.error('❌ [DEFERRED] Failed to load trending searches:', error);
  //     return [];
  //   });
  //

  // Build userAuth object for authenticated API calls
  const userAuth = user?.email
    ? { email: user.email }
    : ({} as { email?: string });

  // Continue watching - videos in progress
  const continueWatching = userScopedMediaApi.user
    .getInProgressVideos(userAuth)
    .then(({ inProgressVideos }) => inProgressVideos)
    .catch((error) => {
      console.error("❌ [DEFERRED] Failed to load continue watching:", error);
      return [];
    });

  // Satsangs of the week - daily satsangs for the current week
  const todayDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const satsangsWeekly = userScopedMediaApi.satsangs
    .getWeekly(todayDate)
    .then(({ dailySatsangs }) => ({
      satsangs: dailySatsangs.map((d) => d.satsang),
      todayIndex: dailySatsangs.findIndex((d) => d.date === todayDate),
    }))
    .catch((error) => {
      console.error("❌ [DEFERRED] Failed to load satsangs weekly:", error);
      return { satsangs: [], todayIndex: -1 };
    });

  const satsangsLatestReleases = userScopedMediaApi.satsangs
    .getLatestReleases()
    .then(({ latestReleases }) => {
      return latestReleases;
    })
    .catch((error) => {
      console.error("❌ [DEFERRED] Failed to load latest releases:", error);
      return [];
    });

  const commentaries = userScopedMediaApi.commentaries
    .getList()
    .then(({ commentaries }) => {
      return commentaries;
    })
    .catch((error) => {
      console.error("❌ [DEFERRED] Failed to load commentaries:", error);
      return [];
    });

  return {
    // satsangsTopSearches,
    continueWatching,
    satsangsWeekly,
    satsangsLatestReleases,
    commentaries,
  };
}

/**
 * Loading skeleton for SatsangContentRow with title
 */
function LoadingSatsangContentRow({ title }: { title: string }) {
  return (
    <div className="max-w-screen overflow-hidden relative z-10">
      <Container>
        <div className="flex items-center">
          <h2 className="text-white h2-md mr-16">{title}</h2>
        </div>
      </Container>
      <Container bleedRight>
        <CardSkeletonList count={4} />
      </Container>
    </div>
  );
}

/**
 * Loading spinner for pagination
 */
function LoadingSpinner() {
  return (
    <div className="flex justify-center py-32">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-light" />
    </div>
  );
}

export default function Satsangs() {
  const locale = useLocale();
  const { strings } = useTranslations();
  const { expandedPortalContainerId } = useVideoPlayer();

  /**
   * IMPORTANT: Get subscription tier from root loader, NOT from useSubscription() hook
   *
   * Why? Using context hooks like useSubscription() can cause hydration mismatches because:
   * - Server: Context has initial/loader values
   * - Client (during hydration): Context might update from deferred promises
   * - Result: Conditional Suspense boundaries mount/unmount during hydration → ERROR
   *
   * Solution: Use loader data which is stable and consistent between server/client renders
   */
  const rootData = useRouteLoaderData<RootLoader>("root");
  const subscriptionTier = rootData?.subscriptionTier;
  const customerId = rootData?.user?.shopifyCustomerId;
  const memberships = rootData?.memberships;
  const user = rootData?.user;

  const {
    featured,
    featuredTags,
    videoChaptersProps,
    categories,
    isSatsangOfTheDay,
    dailySatsang,
    videosInProgressCount,
    continueWatching,
    satsangsWeekly,
    satsangsLatestReleases,
    // satsangsTopSearches,
    commentaries,
    initialAllSatsangs,
    totalAllSatsangs,
  } = useLoaderData<typeof loader>();
  const [isVideoChaptersVisible, setIsVideoChaptersVisible] = useState(false);

  // Pagination state for all satsangs grid
  const [allSatsangs, setAllSatsangs] = useState<Content[]>(
    initialAllSatsangs as Content[],
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialAllSatsangs.length < totalAllSatsangs,
  );

  const allSatsangsPortalContainerId = "all-satsangs-portal-container";
  const hasExpandedCard =
    expandedPortalContainerId === allSatsangsPortalContainerId;

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `${locale.pathPrefix}/api/satsangs/all?offset=${allSatsangs.length}&limit=${PAGE_SIZE}&desc=false`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = (await response.json()) as {
        satsangs: Content[];
        total: number;
      };
      const newSatsangs = data.satsangs ?? [];

      setAllSatsangs((prev) => [...prev, ...newSatsangs]);
      setHasMore(allSatsangs.length + newSatsangs.length < data.total);
    } catch (error) {
      console.error("Failed to load more satsangs:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, allSatsangs.length, locale.pathPrefix]);

  // Get header visibility state for sticky nav positioning
  const { isHeaderHidden } = useHeaderVisibility();

  // Combine satsang of the day badges with content tags for CollapsibleTags
  const allTags = useMemo(() => {
    const tags: { label: string; bgColor: string; textColor: string }[] = [];

    // Add satsang of the day badges if applicable
    if (featured.isSatsangOfDay) {
      tags.push({
        label: strings.hero_satsang_of_the_day,
        bgColor: "bg-purple-dark",
        textColor: "text-white",
      });

      const dayValue =
        dailySatsang?.dayOfSatsangOfDay || featured.dayOfSatsangOfDay;
      if (dayValue) {
        tags.push({
          label: `${strings.hero_satsang_day} ${dayValue}`,
          bgColor: "bg-purple-dark",
          textColor: "text-white",
        });
      }
    }

    return [...tags, ...(featuredTags || [])];
  }, [
    featured.isSatsangOfDay,
    featured.dayOfSatsangOfDay,
    dailySatsang?.dayOfSatsangOfDay,
    featuredTags,
    strings.hero_satsang_of_the_day,
    strings.hero_satsang_day,
  ]);

  return (
    <MobileWall>
      <div className="satsangs">
        {/* Sticky category navigation - outside hero for proper sticky behavior */}
        <div
          className={`sticky ${Z_INDEX.sticky} transition-all duration-300 hidden tablet:block relative ${
            isHeaderHidden ? "top-0" : "top-[var(--header-height)]"
          }`}
        >
          {/* Gradient background - brand-dark at top fading out */}
          <div
            className={`absolute inset-x-0 top-0 h-[200%] z-0 pointer-events-none transition-opacity duration-300 ${
              isHeaderHidden ? "ease-out opacity-100" : "ease-in opacity-0"
            }`}
            style={{
              background:
                "linear-gradient(to bottom, rgba(4, 18, 54, 1) 0%, rgba(4, 18, 54, 1) 15%, rgba(4, 18, 54, 0) 60%)",
            }}
          />
          <Container className="pt-16 pb-8 relative z-20">
            <SatsangsNav categories={categories} level="category" />
          </Container>
        </div>

        <Stack gap={7}>
          <Stack gap={1} className="-mt-[var(--header-height)]">
            <HeroBackground className="relative">
              <BackgroundVideoWithOverlays
                imageUrl={featured.thumbnailUrl || ""}
                mobileImageUrl={featured.thumbnailUrlVertical || undefined}
                altText={featured.title}
                videoId={featured?.video?.videoId?.toString()}
                subscriptionTier={subscriptionTier}
                customerId={customerId}
                enableVideo={true}
                startTimeSeconds={featured?.video?.previewStartOffset}
              />
              <Cover minHeight="70vh" padding="0">
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
                          <HeroTitle uppercase>{featured.title}</HeroTitle>
                        </Stack>

                        <ContentInfoItems content={featured} showDuration />

                        <HeroButtons>
                          <ContentButtons
                            content={featured}
                            contentType="satsang"
                          />
                          {featured.video?.chapters?.length > 0 && (
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
              {videoChaptersProps && (
                <HeroOverlay
                  isVisible={isVideoChaptersVisible}
                  onClose={() => setIsVideoChaptersVisible(false)}
                  ariaLabel="Video chapters"
                >
                  <VideoChapters {...videoChaptersProps} />
                </HeroOverlay>
              )}

              {/* DRAFT badge for unpublished content - top-left corner */}
              {featured?.isPublished === false && (
                <div className="absolute top-24 left-24 z-10">
                  <DraftBadge size="md" />
                </div>
              )}
            </HeroBackground>

            <div className="w-full">
              <Suspense
                fallback={
                  <LoadingSatsangContentRow
                    title={strings.homepage_satsang_week_title}
                  />
                }
              >
                <Await resolve={satsangsWeekly}>
                  {(resolvedSatsangs) => {
                    const { satsangs, todayIndex } = resolvedSatsangs as unknown as { satsangs: Content[]; todayIndex: number };
                    return (
                      <SatsangsOfTheWeekRow
                        content={satsangs}
                        title={strings.homepage_satsang_week_title}
                        description={strings.homepage_satsang_week_description}
                        aspectRatio="landscape"
                        subscriptionTier={subscriptionTier}
                        customerId={customerId}
                        id="satsang-weekly"
                        todayIndex={todayIndex}
                      />
                    );
                  }}
                </Await>
              </Suspense>
            </div>
          </Stack>

          {/* Continue Watching - shown if user has videos in progress */}
          {videosInProgressCount > 0 && (
            <Suspense fallback={<CarouselLoading />}>
              <Await resolve={continueWatching}>
                {(resolved) => (
                  <HistoryContentRow
                    content={resolved as unknown as WatchHistoryEntryDto[]}
                    title={strings.homepage_continue_watching_title}
                    aspectRatio="landscape"
                    subscriptionTier={subscriptionTier}
                    customerId={customerId}
                    id="continue-watching"
                  />
                )}
              </Await>
            </Suspense>
          )}

          <div className="w-full">
            <Suspense
              fallback={
                <LoadingSatsangContentRow title={strings.latest_satsangs} />
              }
            >
              <Await resolve={satsangsLatestReleases}>
                {(resolvedSatsangs) => (
                  <SatsangContentRow
                    content={resolvedSatsangs as unknown as Content[]}
                    title={strings.latest_satsangs}
                    exploreAllLink="/satsangs/all"
                    aspectRatio="landscape"
                    subscriptionTier={subscriptionTier}
                    customerId={customerId}
                    id="latest-satsangs"
                  />
                )}
              </Await>
            </Suspense>
          </div>

          {/* TODO: re-enable top searches. commented out for now as not working

        {(isPremium || isSupporter) && (
          <>
            <div className="w-full">
              <DebugSuspense name="TopSearches" fallback={<LoadingSatsangContentRow title="Top Searches" />}>
                <Await resolve={satsangsTopSearches}>
                  {(resolvedSatsangs) => (
                    <SatsangContentRow
                      content={resolvedSatsangs as unknown as Content[]}
                      title="Top Searches"
                      exploreAllLink="/satsangs"
                      aspectRatio="landscape"
                      subscriptionTier={subscriptionTier}
                      customerId={customerId}
                    />
                  )}
                </Await>
              </DebugSuspense>
            </div>
          </>
        )}

        */}

          {/* All Satsangs - paginated grid */}
          <div className="w-full">
            <Container>
              <SectionHeader
                title={`${strings.all_satsangs_title} (${totalAllSatsangs})`}
              />

              <div
                id={allSatsangsPortalContainerId}
                className="relative"
                style={{ zIndex: hasExpandedCard ? 50 : 10 }}
              >
                <div
                  className="grid gap-x-16 gap-y-56 mb-48"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(256px, 1fr))",
                  }}
                >
                  {allSatsangs.map((satsang) => (
                    <ProgressAwareVideoCardLink
                      key={satsang.contentId}
                      content={satsang}
                      user={user}
                      subscriptionTier={
                        subscriptionTier as SubscriptionTier | undefined
                      }
                      memberships={memberships}
                      contentType="satsang"
                    >
                      {({ hasAccess }) => (
                        <ProgressAwareHoverVideoCard
                          videoId={satsang.video?.videoId ?? ""}
                          title={satsang.title ?? ""}
                          thumbnailUrl={satsang.thumbnailUrl}
                          thumbnailUrlVariants={satsang.thumbnailUrlVariants}
                          duration={satsang.video?.durationSeconds}
                          eyebrow={
                            satsang.genre ? (
                              <GenreEyebrow
                                genre={satsang.genre as Genre}
                                contentType="Satsang"
                              />
                            ) : undefined
                          }
                          size="auto"
                          aspectRatio="landscape"
                          subscriptionTier={subscriptionTier}
                          customerId={customerId}
                          tags={satsang.tags}
                          chapters={satsang.video?.chapters}
                          locked={!hasAccess}
                          isNew={isNewContent(satsang)}
                          isPublished={satsang.isPublished}
                        />
                      )}
                    </ProgressAwareVideoCardLink>
                  ))}
                </div>
              </div>

              {hasMore && (
                <div className="flex justify-center pb-64">
                  {isLoadingMore ? (
                    <LoadingSpinner />
                  ) : (
                    <Button variant="secondary" onClick={loadMore}>
                      {strings.load_more}
                    </Button>
                  )}
                </div>
              )}

              {!hasMore && allSatsangs.length > 0 && (
                <div className="text-center pb-64">
                  <p className="body-b2 text-white/50">
                    {strings.showing_all_satsangs.replace(
                      "{count}",
                      String(totalAllSatsangs),
                    )}
                  </p>
                </div>
              )}
            </Container>
          </div>
        </Stack>
      </div>
    </MobileWall>
  );
}
