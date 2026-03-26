import { useState, useEffect } from "react";
import {
  redirect,
  type LoaderFunctionArgs,
  useLoaderData,
  type MetaFunction,
  useSearchParams,
  useNavigate,
} from "react-router";
import { useSubscription, useUser, useRootLoaderData } from "~/hooks";
import { useVideoProgress, useWatchProgressContext } from "~/contexts/WatchProgressProvider";
import {
  Container,
  VideoChaptersPanel,
  VideoPlayer,
  VideoPartsGrid,
  RelatedVideosGrid,
  WatchMoreCarousel,
  ContentInfoItems,
  MobileWall,
} from "~/components";
import SubscriptionModal from "~/components/SubscriptionModal";
import { ComingSoonModal } from "~/components/Modal/ComingSoonModal";
import { PurchaseSeparateButton } from "~/components/ContentButtons/PurchaseSeparateButton";
import { usePrelaunch } from "~/contexts/PrelaunchProvider";
import {
  getPrelaunchConfig,
  isPrelaunchActive as checkPrelaunchActive,
  isContentFreeInPrelaunch,
} from "~/lib/utils/prelaunch";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { ExpandableText } from "~/components/ExpandableText/ExpandableText";
import {
  Content,
  ContentType,
  Video as VideoType,
  VideoGroup,
  VideoPart,
} from "~/lib/types";
import { signVideoId } from "~/lib/utils/video-token";
import {
  VideoChapterDto,
  PlayerVideoDto,
  VideoLessDto,
  ContentDto,
} from "~/lib/api";
import {
  fetchVideosByContentId,
  hasAccessToContent,
  getRequiredSubscriptionTiers,
} from "~/lib/utils/server.utils";
import {
  userScopedMediaApiContext,
  userContext,
  subscriptionTierContext,
} from "~/lib/middleware";
import { decodeVideoId, encodeVideoId } from "~/lib/utils/video-id-encoder";
import {
  flattenVideoGroupsParts,
  getDefaultVideoIdFromMultiVideoContent,
  isMultiVideoContent,
  filterDisabledTiers,
  isPPVContent,
  buildPPVRouterUrl,
} from "~/lib/utils/content";
import { EMPTY_ARRAY, CONTENT_TYPE_ID_TO_TYPE } from "~/lib/constants";
import logoWhite from "~/assets/images/bhakti-marga-logo-white.svg";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const videoTitle = data?.video?.title || "Video Player";
  return [
    { title: `${videoTitle} - Bhakti+` },
    { name: "robots", content: "noindex, nofollow" },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  // Get user subscription info AND userScopedMediaApi from middleware context
  const userScopedMediaApi = context.get(userScopedMediaApiContext);
  const user = context.get(userContext);
  const subscriptionTier = context.get(subscriptionTierContext);

  const url = new URL(request.url);
  const videoIdHash = url.searchParams.get("videoId");
  const progress = url.searchParams.get("progress");

  // Require videoId parameter
  if (!videoIdHash) {
    throw new Response("Video ID is required", { status: 400 });
  }

  // Decode the hashed video ID
  const videoId = decodeVideoId(videoIdHash);

  if (!videoId) {
    throw new Response("Invalid video ID", { status: 400 });
  }

  // Fetch video and content data by videoId using userScopedMediaApi
  const res = await userScopedMediaApi.video.getById(videoId.toString());
  const video = res.video;
  const content = res.content;

  if (!video) {
    throw new Response("Video not found", { status: 404 });
  }

  if (!content) {
    throw new Response("Content not found", { status: 404 });
  }

  // For multi-video content (commentaries, pilgrimages), fetch all videos
  let videos: VideoGroup[] | null = null;
  let parts: VideoPart[] | null = null;
  const contentType = content.contentTypeId
    ? CONTENT_TYPE_ID_TO_TYPE[content.contentTypeId]
    : null;

  if (contentType && isMultiVideoContent(contentType) && content.contentId) {
    const result = await fetchVideosByContentId(
      context,
      content.contentId.toString(),
      contentType,
      userScopedMediaApi,
    );

    videos = result.videoGroups;
    parts = flattenVideoGroupsParts(result.videoGroups);
  }

  // Check prelaunch mode
  const prelaunchConfig = getPrelaunchConfig(context.env);
  const isPrelaunch = checkPrelaunchActive(prelaunchConfig);

  // Check if content is free during prelaunch
  const isFreeInPrelaunch =
    isPrelaunch && contentType && isContentFreeInPrelaunch(contentType);

  // Check if user has access
  // During prelaunch, logged-in users get free access to Lives content
  const userHasAccess =
    isFreeInPrelaunch && user
      ? true
      : hasAccessToContent(user, subscriptionTier, video, content);

  // Only generate video token if user has access
  let videoToken = null;
  if (userHasAccess) {
    videoToken = await signVideoId(videoId);
    if (!videoToken) {
      throw new Response("Failed to generate video token", { status: 500 });
    }
  }

  // Use userScopedMediaApi for pilgrimages as well
  const pilgrimages = userScopedMediaApi.pilgrimages
    .getList()
    .then(({ pilgrimages }) => pilgrimages)
    .catch((error) => {
      console.error("Error loading pilgrimages:", error);
      return [];
    });

  // NOTE: Memberships are fetched in root loader with correct user region.
  // Component uses useRootLoaderData() to access them for the subscription modal.

  // For satsang content type, fetch watch-next recommendations to show in "Watch more" section
  type RelatedSatsang = {
    videoId: number;
    title: string | null;
    thumbnailUrl?: string | null;
    thumbnailUrlVariants?: string | null;
    durationSeconds?: number | null;
    eyebrow?: string | null;
    subscriptionTiers?: string[] | null;
    genre?: string | null;
  };

  let relatedSatsangs: RelatedSatsang[] | null = null;

  if (contentType === "satsang") {
    try {
      // Build user auth params if user is available
      const userAuth = user?.email ? { email: user.email } : undefined;

      const watchNextResponse = await userScopedMediaApi.video.getWatchNext(
        videoId,
        userAuth,
        20, // Get up to 20 recommendations
      );

      // Map the response to our RelatedSatsang type
      relatedSatsangs = watchNextResponse.videos.map((v) => ({
        videoId: v.videoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl || v.thumbnailUrlVertical,
        thumbnailUrlVariants:
          v.thumbnailUrlVariants || v.thumbnailUrlVerticalVariants,
        durationSeconds: v.durationSeconds,
        subscriptionTiers: v.subscriptionTiers,
        genre: v.genre,
      }));
    } catch (error) {
      console.error(
        "[Video Route] Error fetching watch-next recommendations:",
        error,
      );
      relatedSatsangs = [];
    }
  }

  // Fetch latest releases for "Watch more" carousels
  type WatchMoreVideo = {
    videoId?: number | null;
    contentId?: number | null;
    slug?: string | null;
    title: string | null;
    subtitle?: string | null;
    thumbnailUrl?: string | null;
    thumbnailUrlVariants?: string | null;
    thumbnailUrlVertical?: string | null;
    thumbnailUrlVerticalVariants?: string | null;
    durationSeconds?: number | null;
    subscriptionTiers?: string[] | null;
  };

  type WatchMoreGroups = {
    pilgrimages: WatchMoreVideo[];
    talks: WatchMoreVideo[];
    commentaries: WatchMoreVideo[];
    lives: WatchMoreVideo[];
  };

  let watchMoreGroups: WatchMoreGroups = {
    pilgrimages: [],
    talks: [],
    commentaries: [],
    lives: [],
  };

  // Get the current content's contentId to filter out the current series
  const currentContentId = content.contentId;

  // Fetch latest releases for each category in parallel
  try {
    const [pilgrimagesRes, talksRes, commentariesRes, livesRes] =
      await Promise.all([
        userScopedMediaApi.pilgrimages
          .getLatestReleases({ limit: 10 })
          .catch(() => ({ latestReleases: [] })),
        userScopedMediaApi.talks
          .getLatestReleases({ limit: 10 })
          .catch(() => ({ latestReleases: [] })),
        userScopedMediaApi.commentaries
          .getLatestReleases({ limit: 10 })
          .catch(() => ({ latestReleases: [] })),
        userScopedMediaApi.lives
          .getLatestReleases({ limit: 10 })
          .catch(() => ({ latestReleases: [] })),
      ]);

    // Map pilgrimages (bundled content - navigate to detail page)
    watchMoreGroups.pilgrimages = pilgrimagesRes.latestReleases
      .filter((p: any) => p.contentId !== currentContentId)
      .slice(0, 8)
      .map((p: any) => ({
        videoId: p.video?.videoId || null,
        contentId: p.contentId,
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        thumbnailUrl: p.thumbnailUrl,
        thumbnailUrlVariants: p.thumbnailUrlVariants,
        thumbnailUrlVertical: p.thumbnailUrlVertical,
        thumbnailUrlVerticalVariants: p.thumbnailUrlVerticalVariants,
        durationSeconds: p.video?.durationSeconds,
        subscriptionTiers: p.subscriptionTiers,
      }));

    // Map talks (can be single or bundled)
    watchMoreGroups.talks = talksRes.latestReleases
      .filter((t: any) => t.contentId !== currentContentId)
      .slice(0, 8)
      .map((t: any) => ({
        videoId: t.video?.videoId || null,
        contentId: t.contentId,
        slug: t.slug,
        title: t.title,
        subtitle: t.subtitle,
        thumbnailUrl: t.thumbnailUrl,
        thumbnailUrlVariants: t.thumbnailUrlVariants,
        thumbnailUrlVertical: t.thumbnailUrlVertical,
        thumbnailUrlVerticalVariants: t.thumbnailUrlVerticalVariants,
        durationSeconds: t.video?.durationSeconds,
        subscriptionTiers: t.subscriptionTiers,
      }));

    // Map commentaries (bundled content - navigate to detail page)
    watchMoreGroups.commentaries = commentariesRes.latestReleases
      .filter((c: any) => c.contentId !== currentContentId)
      .slice(0, 8)
      .map((c: any) => ({
        videoId: c.video?.videoId || null,
        contentId: c.contentId,
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        thumbnailUrl: c.thumbnailUrl,
        thumbnailUrlVariants: c.thumbnailUrlVariants,
        thumbnailUrlVertical: c.thumbnailUrlVertical,
        thumbnailUrlVerticalVariants: c.thumbnailUrlVerticalVariants,
        durationSeconds: c.video?.durationSeconds,
        subscriptionTiers: c.subscriptionTiers,
      }));

    // Map lives (single videos - navigate to video player)
    watchMoreGroups.lives = livesRes.latestReleases
      .filter((l: any) => l.contentId !== currentContentId)
      .slice(0, 8)
      .map((l: any) => ({
        videoId: l.video?.videoId || null,
        contentId: l.contentId,
        slug: l.slug,
        title: l.title,
        subtitle: l.subtitle,
        thumbnailUrl: l.thumbnailUrl,
        thumbnailUrlVariants: l.thumbnailUrlVariants,
        thumbnailUrlVertical: l.thumbnailUrlVertical,
        thumbnailUrlVerticalVariants: l.thumbnailUrlVerticalVariants,
        durationSeconds: l.video?.durationSeconds,
        subscriptionTiers: l.subscriptionTiers,
      }));
  } catch (error) {
    console.error("[Video Route] Error fetching latest releases:", error);
  }

  return {
    videoId,
    videoToken,
    video,
    content,
    contentType,
    videos,
    pilgrimages,
    progress,
    parts,
    userHasAccess,
    subscriptionTier,
    isPrelaunch,
    isFreeInPrelaunch,
    relatedSatsangs,
    watchMoreGroups,
  };
}

/**
 * Helper component for the locked content overlay.
 * Shows either "View Subscription Plans" button or "Purchase separately" button
 * based on whether there are valid subscription plans after filtering disabled tiers.
 */
function LockedContentOverlay({
  content,
  strings,
  onShowModal,
}: {
  content: Content;
  strings: Record<string, string>;
  onShowModal: () => void;
}) {
  // Check if content has valid subscription plans after filtering disabled tiers
  const contentTiers = content.subscriptionTiers ?? [];
  const validTiers = filterDisabledTiers(contentTiers);
  const hasValidSubscriptionPlans = validTiers.length > 0;

  // Check if content is PPV
  const isContentPPV = isPPVContent(content);

  // Get PPV data if applicable
  let ppvLink = "";
  let ppvPrice: string | null = null;

  if (isContentPPV) {
    ppvLink = buildPPVRouterUrl(content) || "";
    if (content.shopifyPrice != null) {
      const currencyCode = content.shopifyCurrencyCode || "EUR";
      ppvPrice = `${currencyCode} ${content.shopifyPrice.toFixed(2)}`;
    }
  }

  return (
    <div className="w-full aspect-video bg-gradient-to-b from-brand-dark to-brand flex items-center justify-center rounded-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 text-center px-32">
        <div className="mb-24">
          <svg
            className="w-96 h-96 mx-auto text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-28 font-700 text-white mb-12">
          {strings.video_subscription_required}
        </h2>
        <p className="text-16 text-grey-light mb-24">
          {strings.video_subscription_description}
        </p>
        {hasValidSubscriptionPlans ? (
          <button
            onClick={onShowModal}
            className="px-32 py-12 bg-brand text-white font-600 rounded-md hover:bg-brand/80 transition-colors"
          >
            {strings.video_view_plans_button}
          </button>
        ) : isContentPPV ? (
          <PurchaseSeparateButton
            link={ppvLink}
            price={ppvPrice}
            btnVariant="primary"
          />
        ) : (
          // Fallback: show subscription button even if no valid plans (shouldn't happen in practice)
          <button
            onClick={onShowModal}
            className="px-32 py-12 bg-brand text-white font-600 rounded-md hover:bg-brand/80 transition-colors"
          >
            {strings.video_view_plans_button}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Video() {
  const {
    videoId,
    videoToken,
    video,
    pilgrimages,
    videos,
    content,
    contentType,
    progress,
    parts,
    userHasAccess,
    subscriptionTier: loaderSubscriptionTier,
    isPrelaunch: loaderIsPrelaunch,
    isFreeInPrelaunch: loaderIsFreeInPrelaunch,
    relatedSatsangs,
    watchMoreGroups,
  } = useLoaderData<typeof loader>();

  // Get memberships from root loader (fetched with correct user region)
  const { memberships } = useRootLoaderData();
  const { isPrelaunchActive } = usePrelaunch();
  const navigate = useNavigate();
  const { strings } = useTranslations();

  const [timestampSeconds, setTimestampSeconds] = useState<number>(0);
  const [showLoading, setShowLoading] = useState(true);
  const [showOm, setShowOm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [chaptersExpanded, setChaptersExpanded] = useState(true);
  const { subscriptionTier } = useSubscription();
  const { user } = useUser();

  // Get customer ID from user data
  const customerId = user?.shopifyCustomerId
    ? user.shopifyCustomerId.toString()
    : null;

  // Use progress from URL param, falling back to saved progress from WatchProgressProvider.
  // We must wait for the context to load before rendering the player when there's no URL progress,
  // otherwise the player renders at t=0 then bounces to t=N when the context resolves.
  const { isLoaded: isProgressLoaded } = useWatchProgressContext();
  const contextProgress = useVideoProgress(videoId);
  const hasUrlProgress = !!progress;
  const effectiveProgress = hasUrlProgress ? Number(progress) : contextProgress;
  // If we have URL progress, we can render immediately. Otherwise, wait for context to load.
  const isProgressReady = hasUrlProgress || isProgressLoaded;

  // Log for debugging (remove in production)
  // console.log("Video player data:", {
  //   videoId,
  //   videoToken,
  //   subscriptionTier,
  //   customerId,
  // });

  const [splashTimerDone, setSplashTimerDone] = useState(false);

  useEffect(() => {
    // Always show Om logo splash on video page load
    console.debug("🎬 [Video Route] Starting video splash sequence");

    // Show blank screen for 500ms
    const blankTimer = setTimeout(() => {
      console.debug("🎬 [Video Route] Showing Om logo");
      setShowOm(true);
    }, 500);

    // Mark splash timer as done after 2500ms (500ms blank + 2000ms logo animation)
    const loadingTimer = setTimeout(() => {
      console.debug("🎬 [Video Route] Splash timer done");
      setSplashTimerDone(true);
    }, 2500);

    return () => {
      clearTimeout(blankTimer);
      clearTimeout(loadingTimer);
    };
  }, []); // Run once on mount

  // Hide loading screen only when both the splash animation is done AND progress data is ready.
  // This prevents the player from rendering at t=0 then bouncing to t=N when progress loads.
  useEffect(() => {
    if (splashTimerDone && isProgressReady) {
      console.debug("🎬 [Video Route] Hiding loading/splash (progress ready)");
      setShowLoading(false);
    }
  }, [splashTimerDone, isProgressReady]);

  const handleChapterClick = (chapter: VideoChapterDto) => {
    setTimestampSeconds(chapter.startOffset);
  };

  const handlePartSelect = (part: VideoPart) => {
    if (part?.video?.videoId) {
      navigate(`/video?videoId=${encodeVideoId(part.video.videoId)}`);
    }
  };

  const handleRelatedVideoSelect = (relatedVideoId: number) => {
    navigate(`/video?videoId=${encodeVideoId(relatedVideoId)}`);
  };

  return (
    <MobileWall>
      {/* Show Om logo splash on video page load */}
      {showLoading && (
        <div className="fixed inset-0 z-50 bg-brand flex items-center justify-center">
          {showOm && (
            <div className="animate-fade-in">
              <img
                src={logoWhite}
                alt="Bhakti Marga"
                className="h-[120px] w-auto"
              />
            </div>
          )}
        </div>
      )}

      <div className={`video-page ${showLoading ? "opacity-0" : ""}`}>
        <Container className="text-white">
          {/* Video player + chapters panel */}
          <section
            className={`grid grid-rows-1 items-stretch gap-16 mt-24 mb-32 transition-[grid-template-columns] duration-300 ease-out ${
              chaptersExpanded
                ? "grid-cols-[2.54fr_1fr]"
                : "grid-cols-[1fr_48px]"
            }`}
          >
            <div className="w-full rounded-lg">
              {userHasAccess && videoToken ? (
                <VideoPlayer
                  videoToken={videoToken}
                  subscriptionTier={subscriptionTier || undefined}
                  customerId={customerId || undefined}
                  timestampSeconds={timestampSeconds}
                  progress={effectiveProgress}
                  shouldAutoplay={!showLoading}
                />
              ) : (
                <LockedContentOverlay
                  content={content}
                  strings={strings}
                  onShowModal={() => setShowModal(true)}
                />
              )}
            </div>
            <VideoChaptersPanel
              chapters={video?.chapters ?? EMPTY_ARRAY}
              isExpanded={chaptersExpanded}
              onToggle={() => setChaptersExpanded(!chaptersExpanded)}
              onChapterClick={handleChapterClick}
            />
          </section>

          {/* For multi-video content with multiple parts: 1/4 title+description | 3/4 days grid */}
          {contentType &&
          isMultiVideoContent(contentType) &&
          parts &&
          parts.length > 1 ? (
            <section className="grid grid-cols-1 gap-24 mb-80 desktop:grid-cols-[1.2fr_2.8fr]">
              <div className="flex flex-col gap-16">
                <div className="flex flex-col gap-4">
                  <h1 className="text-24 font-700 text-white leading-tight">
                    {content?.title}
                  </h1>
                  <p className="text-20 font-500 text-white/80 leading-5">
                    {video?.title}
                  </p>
                </div>
                <ContentInfoItems
                  content={content}
                  className="text-white/70"
                  showDuration
                />
                <ExpandableText
                  html={video?.descriptionHtml || video?.summary500 || video?.description || ""}
                  className="text-16 text-white/60 leading-relaxed mt-8 max-w-[500px]"
                />
              </div>
              <VideoPartsGrid
                parts={parts}
                selectedVideoId={videoId}
                onSelect={handlePartSelect}
              />
            </section>
          ) : (
            <section className="mb-64">
              <h1 className="text-24 font-700 text-white leading-tight mb-16">
                {video?.title}
              </h1>
              <ContentInfoItems
                content={content}
                className="text-white/70 mb-16"
                showDuration
              />
              <ExpandableText
                html={video?.descriptionHtml || video?.summary500 || video?.description || ""}
                className="text-white/80 rounded-lg max-w-[850px]"
              />
            </section>
          )}

          {/* Watch more section for satsang videos */}
          {contentType === "satsang" &&
            relatedSatsangs &&
            relatedSatsangs.length > 0 && (
              <section className="mb-128">
                <RelatedVideosGrid
                  title={strings.watch_more}
                  videos={relatedSatsangs}
                  onVideoSelect={handleRelatedVideoSelect}
                  currentVideoId={videoId}
                  subscriptionTier={subscriptionTier}
                  contentType="Satsang"
                />
              </section>
            )}
        </Container>

        {/* Watch more carousels - ordered by current content type first */}
        {(() => {
          // Define carousel configs with their content type priorities
          const carouselConfigs = [
            // Lives carousel - only show for satsang content, with landscape cards
            ...(contentType === "satsang" && watchMoreGroups.lives.length > 0
              ? [
                  {
                    key: "lives",
                    title: "Latest",
                    categoryName: "Livestreams",
                    videos: watchMoreGroups.lives,
                    priority: 0, // First for satsang
                    exploreAllLink: "/lives",
                    carouselContentType: "live" as const,
                    aspectRatio: "landscape" as const,
                  },
                ]
              : []),
            {
              key: "pilgrimages",
              title: "Watch more",
              categoryName: "Virtual pilgrimages",
              videos: watchMoreGroups.pilgrimages,
              priority: contentType === "pilgrimage" ? 0 : 1,
              exploreAllLink: "/pilgrimages",
              carouselContentType: "pilgrimage" as const,
              aspectRatio: "portrait" as const,
            },
            {
              key: "talks",
              title: "Watch more",
              categoryName: "BhaktiTalk",
              videos: watchMoreGroups.talks,
              priority: contentType === "talk" ? 0 : 2,
              exploreAllLink: "/talks",
              carouselContentType: "talk" as const,
              aspectRatio: "portrait" as const,
            },
            {
              key: "commentaries",
              title: "Watch more",
              categoryName: "Commentaries",
              videos: watchMoreGroups.commentaries,
              priority: contentType === "commentary" ? 0 : 3,
              exploreAllLink: "/commentaries",
              carouselContentType: "commentary" as const,
              aspectRatio: "portrait" as const,
            },
          ];

          // Sort by priority (current content type first)
          const sortedConfigs = carouselConfigs
            .filter((config) => config.videos.length > 0)
            .sort((a, b) => a.priority - b.priority);

          if (sortedConfigs.length === 0) {
            return null;
          }

          return (
            <div className="flex flex-col gap-128">
              {sortedConfigs.map((config) => (
                <WatchMoreCarousel
                  key={config.key}
                  title={config.title}
                  categoryName={config.categoryName}
                  videos={config.videos}
                  currentVideoId={videoId}
                  exploreAllLink={config.exploreAllLink}
                  contentType={config.carouselContentType}
                  aspectRatio={config.aspectRatio}
                  subscriptionTier={subscriptionTier}
                />
              ))}
            </div>
          );
        })()}
      </div>

      {/* Show Coming Soon modal during prelaunch for non-Lives content */}
      {showModal &&
        !userHasAccess &&
        isPrelaunchActive &&
        !loaderIsFreeInPrelaunch && (
          <ComingSoonModal
            onClose={() => setShowModal(false)}
            contentType={contentType || undefined}
          />
        )}

      {/* Show subscription modal if user doesn't have access (normal mode) */}
      {showModal &&
        !userHasAccess &&
        (!isPrelaunchActive || loaderIsFreeInPrelaunch) &&
        content &&
        contentType && (
          <SubscriptionModal
            content={content}
            contentTitle={content.title}
            contentType={contentType as any}
            userCurrentPlan={loaderSubscriptionTier}
            memberships={memberships}
            onClose={() => setShowModal(false)}
          />
        )}
    </MobileWall>
  );
}
