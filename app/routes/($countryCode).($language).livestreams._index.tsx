import { useState, Suspense } from "react";
import {
  type LoaderFunctionArgs,
  useLoaderData,
  type MetaFunction,
  Await,
  useRouteLoaderData,
} from "react-router";
import {
  HeroBackground,
  HeroContent,
  HeroTags,
  HeroTitle,
  HeroDescription,
  HeroButtons,
} from "~/sections";
import { getTagsFromContent, isNewContent } from "~/lib/utils";
import { IconChapters, IconClose } from "~/components/Icons";
import {
  Carousel,
  Container,
  ContentInfoItems,
  SectionHeader,
  VideoChapters,
  VideoChaptersProps,
  Button,
  ContentButtons,
  Stack,
  BackgroundVideoWithOverlays,
  Cover,
  ProgressAwareHoverVideoCard,
  ProgressAwareVideoCardLink,
  GenreEyebrow,
  MobileWall,
  DraftBadge,
} from "~/components";
import { getBadgesFromContent } from "~/lib/utils/content";
import { Content, SubscriptionTier } from "~/lib/types";
import { userScopedMediaApiContext } from "~/lib/middleware";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { useVideoPlayer } from "~/contexts/VideoPlayerProvider";
import type { RootLoader } from "~/root";

export const meta: MetaFunction = () => {
  return [
    { title: "Livestreams - Bhakti+" },
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
  const deferredData = loadDeferredData(criticalData.userScopedMediaApi);

  // Remove userScopedMediaApi from returned data - it's not serializable
  const { userScopedMediaApi: _api, ...returnedCriticalData } = criticalData;

  return { ...deferredData, ...returnedCriticalData };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 *
 * IMPORTANT: Returns userScopedMediaApi which should be used for ALL content fetching.
 */
async function loadCriticalData({ context }: LoaderFunctionArgs) {
  // Get userScopedMediaApi from middleware context
  const userScopedMediaApi = context.get(userScopedMediaApiContext);

  // Fetch featured and latest releases in parallel
  const [featuredResponse, latestReleasesResponse] = await Promise.all([
    userScopedMediaApi.lives.getFeatured().catch(() => ({ featured: null })),
    userScopedMediaApi.lives
      .getLatestReleases()
      .catch(() => ({ latestReleases: [] })),
  ]);

  const apiFeatured = featuredResponse?.featured ?? null;
  const latestReleases = latestReleasesResponse?.latestReleases ?? [];

  // Use featured if available, otherwise fall back to the latest livestream
  const featured = apiFeatured ?? latestReleases[0] ?? null;

  // If we have no content at all, throw an error
  if (!featured) {
    throw new Response("No livestream content available", { status: 500 });
  }

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
    userScopedMediaApi,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 *
 * Uses userScopedMediaApi from critical data for correct regionId.
 */
function loadDeferredData(
  userScopedMediaApi: import("~/lib/api").BhaktiMargMediaApi,
) {
  const allLives = userScopedMediaApi.lives
    .getList()
    .then(({ lives }) => lives);

  return {
    allLives,
  };
}

export default function Lives() {
  const { featured, featuredTags, videoChaptersProps, allLives } =
    useLoaderData<typeof loader>();
  const [isVideoChaptersVisible, setIsVideoChaptersVisible] = useState(false);
  const { strings } = useTranslations();

  // Get root loader data for access control
  const rootData = useRouteLoaderData<RootLoader>("root");
  const subscriptionTier = rootData?.subscriptionTier;
  const customerId = rootData?.user?.shopifyCustomerId;
  const memberships = rootData?.memberships;
  const user = rootData?.user;

  // Portal container tracking for HoverVideoCards
  const { expandedPortalContainerId } = useVideoPlayer();
  const allLivesPortalId = "livestreams-all-lives-portal-container";
  const hasExpandedAllLives = expandedPortalContainerId === allLivesPortalId;

  return (
    <MobileWall>
      <div className="lives">
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
                      <HeroTags tags={featuredTags} />
                      <HeroTitle uppercase>{featured.title}</HeroTitle>
                    </Stack>
                    <HeroDescription>{featured.summary200 || featured.description}</HeroDescription>

                    <ContentInfoItems content={featured} showDuration />

                    <HeroButtons>
                      <ContentButtons content={featured} contentType="live" />
                      {featured.video?.chapters?.length > 0 && (
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
          className={`fixed inset-0 bg-brand-dark/90 z-50 flex items-center justify-center transition-opacity duration-300 ${
            isVideoChaptersVisible
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
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
                className={`mt-[var(--header-height)] transition-all duration-300 ${
                  isVideoChaptersVisible
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95"
                }`}
              >
                {videoChaptersProps && (
                  <VideoChapters {...videoChaptersProps} />
                )}
              </div>
            </div>
          </div>
        </div>

        <Stack gap={7} className="mt-[var(--spacing-xs)]">
          <Suspense fallback={<div className="h-64" />}>
            <Await resolve={allLives}>
              {(lives) => (
                <div
                  className="relative"
                  style={{ zIndex: hasExpandedAllLives ? 50 : 10 }}
                  id={allLivesPortalId}
                >
                  <div className="animated-link-chevron-trigger max-w-screen overflow-hidden">
                    <Container>
                      <SectionHeader title={strings.all_livestreams} />
                    </Container>
                    <Container bleedRight>
                      <Carousel>
                        {lives.map((live) => (
                          <Carousel.Slide key={live.contentId}>
                            <ProgressAwareVideoCardLink
                              content={live as Content}
                              user={user}
                              subscriptionTier={
                                subscriptionTier as SubscriptionTier | undefined
                              }
                              memberships={memberships ?? undefined}
                              contentType="livestream"
                            >
                              {({ hasAccess }) => (
                                <ProgressAwareHoverVideoCard
                                  videoId={live.video?.videoId ?? ""}
                                  title={live.title ?? ""}
                                  thumbnailUrl={live.thumbnailUrl}
                                  thumbnailUrlVariants={
                                    live.thumbnailUrlVariants
                                  }
                                  duration={live.video?.durationSeconds}
                                  eyebrow={
                                    <GenreEyebrow contentType="Livestream" />
                                  }
                                  aspectRatio="landscape"
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
                  </div>
                </div>
              )}
            </Await>
          </Suspense>
        </Stack>
      </div>
    </MobileWall>
  );
}
