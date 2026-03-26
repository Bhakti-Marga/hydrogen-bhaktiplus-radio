import { Suspense, useState, useEffect } from "react";
import { useLoaderData, Await } from "react-router";
import {
  Stack,
  Cover,
  Button,
  Container,
  CarouselLoading,
  ContentSeriesCarousel,
  SatsangCategories,
  Talks,
} from "~/components";
import { IconPlay } from "~/components/Icons";
import { FullscreenVideoModal } from "~/components/Modal";
import {
  HeroBackground,
  HeroContent,
  HeroTitle,
  HeroDescription,
  HeroButtons,
  PlatformFeatures,
  SubscriptionTiers,
  Faqs,
} from "~/sections";
import { CenteredHeroContent } from "./CenteredHeroContent";
import { VideoPreview } from "./VideoPreview";
import { FeaturedLiveHero } from "./shared-components";
import type { CategoryDto } from "~/lib/api/types";
import type { Content } from "~/lib/types";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { usePrelaunch } from "~/contexts/PrelaunchProvider";
import { useRootLoaderData, useCountryCode, useIsMobile } from "~/hooks";
import type { loader } from "~/routes/($countryCode).($language)._index";
import { buildVideoPlayerUrl } from "~/lib/utils/videoPlayer";
import { signVideoId } from "~/lib/utils/video-token";
import { toMediaApiLocale } from "~/lib/locale";
import introVideoThumbnail from "~/assets/images/introvideo.png";
import introVideoThumbnailWebp from "~/assets/images/introvideo.webp";
import introWebp480 from "~/assets/images/introvideo/introvideo-480w.webp";
import introWebp780 from "~/assets/images/introvideo/introvideo-780w.webp";
import introWebp1080 from "~/assets/images/introvideo/introvideo-1080w.webp";
import introWebp1560 from "~/assets/images/introvideo/introvideo-1560w.webp";
import introWebp1920 from "~/assets/images/introvideo/introvideo-1920w.webp";
import introPng480 from "~/assets/images/introvideo/introvideo-480w.png";
import introPng780 from "~/assets/images/introvideo/introvideo-780w.png";
import introPng1080 from "~/assets/images/introvideo/introvideo-1080w.png";
import introPng1560 from "~/assets/images/introvideo/introvideo-1560w.png";
import introPng1920 from "~/assets/images/introvideo/introvideo-1920w.png";
import attendLivestreamImage from "~/assets/images/attend-livestream-section.jpg";
import liveBlockImage from "~/assets/images/live-block.png";
import liveBlockImageWebp from "~/assets/images/live-block.webp";
import unsubscribedHeroBg from "~/assets/images/unsubscribed-hero-bg.png";
import unsubscribedHeroBgWebp from "~/assets/images/unsubscribed-hero-bg.webp";
import freeLiveHeroBg from "~/assets/images/new-hero-image.png";
import freeLiveHeroBgWebp from "~/assets/images/new-hero-image.webp";

// Background images for unsubscribed heroes
const UNSUBSCRIBED_HERO_BG = unsubscribedHeroBg;
const FREE_LIVE_HERO_BG = freeLiveHeroBg;
const UNSUBSCRIBED_LIVE_HERO_BG = attendLivestreamImage;

// Default V1 HLS player base URL (used as fallback if env var not set)
const DEFAULT_V1_HLS_PLAYER_BASE_URL =
  "https://bhaktimarga.org/up/bmdatahub/mediaplatform/player/mediaplatformv1hls.php";

// Presentation video URL (intro video) - always shown in VideoPreview section
const PRESENTATION_VIDEO_HLS_URL =
  "https://bhaktimarga.cdn.mediactive-network.net/bhaktiplus/mediaserver/final/2025-12-30-Promo-MediaPlatform-20251230/hls/master.m3u8";

function getPresentationVideoUrl(locale?: string): string {
  const playerBaseUrl =
    process.env.VIDEO_PLAYER_V1_HLS_BASE_URL || DEFAULT_V1_HLS_PLAYER_BASE_URL;
  const mediaApiUrl = process.env.MEDIA_API_URL;

  let url = `${playerBaseUrl}?url=${encodeURIComponent(
    PRESENTATION_VIDEO_HLS_URL,
  )}&autoplay=true`;

  if (locale) {
    url += `&locale=${encodeURIComponent(locale)}`;
  }

  if (mediaApiUrl) {
    url += `&mediaApiBaseUrl=${encodeURIComponent(mediaApiUrl)}`;
  }

  return url;
}

export function UnsubscribedHomepage() {
  const {
    featuresSchema,
    faqsSchema,
    satsangCategories,
    commentaries,
    pilgrimages,
    talks,
    featuredLive,
  } = useLoaderData<typeof loader>();

  // Get memberships from root loader (fetched with correct user region)
  const { memberships } = useRootLoaderData();
  const { strings } = useTranslations();
  const { isPrelaunchActive } = usePrelaunch();
  const { language, countryCode } = useCountryCode();
  const locale = toMediaApiLocale(countryCode, language);
  const isMobile = useIsMobile();

  // Determine if we have a free live video to show
  // Only use the featured live when isLiveFree is explicitly true
  const hasFreeLive =
    featuredLive?.isLiveFree === true && featuredLive?.video?.videoId;

  // Presentation video URL (always used for VideoPreview section)
  const presentationVideoUrl = getPresentationVideoUrl(locale);

  // Live video URL state (used for FeaturedLiveHero)
  const [liveVideoUrl, setLiveVideoUrl] = useState<string>("");

  // Sign the videoId and build the player URL for the live video
  useEffect(() => {
    async function buildSignedLiveUrl() {
      if (hasFreeLive && featuredLive?.video?.videoId) {
        const videoToken = await signVideoId(featuredLive.video.videoId);
        const signedUrl = buildVideoPlayerUrl({
          videoId: videoToken,
          autoplay: true,
          // Default subtitles to interface language
          // subtitleLanguage: language,
          locale,
        });
        setLiveVideoUrl(signedUrl);
      }
    }
    buildSignedLiveUrl();
  }, [hasFreeLive, featuredLive?.video?.videoId, language, locale]);

  // Modal state - tracks which video URL to show
  const [modalVideoUrl, setModalVideoUrl] = useState<string>("");
  const [modalVideoTitle, setModalVideoTitle] =
    useState<string>("Watch Preview");

  // VideoPreview always uses intro thumbnail
  const videoThumbnailUrl = introVideoThumbnail;

  // Hero button text - "Watch LIVE" when free live available, otherwise "Watch intro"
  const heroButtonText =
    strings.homepage_unsubscribed_hero_button_watch_preview;

  // Fullscreen video modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  // Details overlay state for FeaturedLiveHero
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  // Open modal with presentation video (used by VideoPreview)
  const openPresentationVideoModal = () => {
    setModalVideoUrl(presentationVideoUrl);
    setModalVideoTitle("Watch Preview");
    setIsVideoModalOpen(true);
  };

  // Open modal with live video (used by FeaturedLiveHero)
  const openLiveVideoModal = () => {
    setModalVideoUrl(liveVideoUrl);
    setModalVideoTitle(featuredLive?.title || "Live");
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => setIsVideoModalOpen(false);

  return (
    <div className="homepage">
      <Stack gap={5} className="tablet:gap-sp-7">
        {/* Featured Live Hero - shown at top when there's a free live */}
        {hasFreeLive && featuredLive && (
          <FeaturedLiveHero
            featuredLive={featuredLive as Content}
            isDetailsVisible={isDetailsVisible}
            setIsDetailsVisible={setIsDetailsVisible}
            onPlayClick={openLiveVideoModal}
            showLearnMoreLink={true}
            learnMoreTargetId="hero-content-unsubscribed"
          />
        )}

        {/* Hero + VideoPreview wrapper - background image extends behind both */}
        <div
          className={`relative ${
            hasFreeLive ? "" : "-mt-[var(--header-height)]"
          }`}
        >
          {/* Background image - absolutely positioned, full natural height, extends behind VideoPreview */}
          <picture>
            <source
              srcSet={hasFreeLive ? freeLiveHeroBgWebp : unsubscribedHeroBgWebp}
              type="image/webp"
            />
            <img
              src={hasFreeLive ? FREE_LIVE_HERO_BG : UNSUBSCRIBED_HERO_BG}
              alt=""
              className="absolute top-0 left-0 w-full h-auto pointer-events-none"
              style={{ zIndex: 0 }}
            />
          </picture>

          {/* Hero content - normal flow, on top of image */}
          <section
            className={`hero relative w-full pt-[var(--header-height)] ${
              hasFreeLive ? "-mt-[120px]" : ""
            }`}
            style={{ zIndex: 1 }}
          >
            <Stack gap={4}>
              <Cover minHeight="auto" className="tablet:min-h-[60vh]">
                {/* When free live is active, position content at top with some padding; otherwise center it */}
                <div
                  id="hero-content-unsubscribed"
                  className={hasFreeLive ? "" : "my-auto"}
                >
                  <Container>
                    <CenteredHeroContent contentWidth="medium">
                      <Stack gap={3}>
                        <Stack gap={2}>
                          <div className={"max-w-[600px] mx-auto"}>
                            <HeroTitle
                              dangerouslySetInnerHTML={{
                                __html:
                                  strings.homepage_unsubscribed_hero_title,
                              }}
                            />
                          </div>
                        </Stack>
                        <div className="hidden tablet:block">
                          <HeroDescription>
                            {strings.homepage_unsubscribed_hero_description}
                          </HeroDescription>
                        </div>

                        <HeroButtons horizontalAlignment="center">
                          <a href="#subscription-tiers" className="mb-16 tablet:mb-0">
                            <Button
                              as="button"
                              variant="primary"
                              size="large"
                              className="w-full tablet:w-auto"
                            >
                              {strings.content_choose_plan}
                            </Button>
                          </a>
                          <div className="hidden tablet:block">
                            <Button
                              as="button"
                              variant="secondary"
                              size="large"
                              icon={<IconPlay className="w-16 h-16" />}
                              onClick={openPresentationVideoModal}
                            >
                              {heroButtonText}
                            </Button>
                          </div>
                        </HeroButtons>
                      </Stack>
                    </CenteredHeroContent>
                  </Container>
                </div>
              </Cover>
            </Stack>
          </section>

          {/* Video Preview - on top of image, normal flow */}
          <div className="relative -mt-[48px]" style={{ zIndex: 1 }}>
            <VideoPreview
              thumbnailUrl={videoThumbnailUrl}
              thumbnailUrlWebp={introVideoThumbnailWebp}
              thumbnailSrcSetWebp={`${introWebp480} 480w, ${introWebp780} 780w, ${introWebp1080} 1080w, ${introWebp1560} 1560w, ${introWebp1920} 1920w`}
              thumbnailSrcSet={`${introPng480} 480w, ${introPng780} 780w, ${introPng1080} 1080w, ${introPng1560} 1560w, ${introPng1920} 1920w`}
              onPlayClick={openPresentationVideoModal}
            />
          </div>
        </div>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={satsangCategories}>
            {(resolvedCategories) => (
              <SatsangCategories
                categories={resolvedCategories as CategoryDto[]}
                title={strings.homepage_satsang_title}
                aspectRatio="square"
                // Disable video links for unsubscribed users
                disableLinks={true}
                // Disable expand on mobile - UI not optimized for small screens
                interactive={!isMobile}
                showLock={false}
              />
            )}
          </Await>
        </Suspense>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={commentaries}>
            {(resolvedCommentaries) => (
              <ContentSeriesCarousel
                title={strings.homepage_commentaries_title}
                items={resolvedCommentaries}
                contentType="commentary"
                exploreAllLink="/commentaries"
                ctaScrollToId="subscription-tiers"
                disableLinks={true}
                // Disable expand on mobile - UI not optimized for small screens
                interactive={!isMobile}
                showLock={false}
              />
            )}
          </Await>
        </Suspense>

        {/* Attend LIVEstreams section - constrained width card with rounded corners */}
        <Container>
          <div className="relative w-full overflow-hidden rounded-2xl min-h-[420px] tablet:min-h-0">
            {/* Background image - uses natural aspect ratio with min-height on mobile */}
            <picture>
              <source srcSet={liveBlockImageWebp} type="image/webp" />
              <img
                src={liveBlockImage}
                alt="Attend LIVEstreams"
                className="w-full h-auto min-h-[420px] tablet:min-h-0 object-cover"
              />
            </picture>
            {/* Overlay content */}
            <div className="absolute inset-0 flex items-start pt-24 tablet:pt-96 desktop:pt-120">
              <div className="w-full px-12 tablet:px-24">
                <div className="min-h-[200px]">
                  <HeroContent contentWidth="small" padding="py-0">
                    <Stack gap={3}>
                      <Stack gap={2}>
                        <HeroTitle
                          size="h1-sm"
                          dangerouslySetInnerHTML={{
                            __html:
                              strings.homepage_unsubscribed_live_hero_title,
                          }}
                        />
                      </Stack>
                      <HeroDescription>
                        {strings.homepage_unsubscribed_live_hero_description}
                      </HeroDescription>
                    </Stack>
                  </HeroContent>
                </div>
              </div>
            </div>
          </div>
        </Container>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={pilgrimages}>
            {(resolvedPilgrimages) => (
              <ContentSeriesCarousel
                title={strings.homepage_pilgrimages_title}
                items={resolvedPilgrimages}
                contentType="pilgrimage"
                exploreAllLink="/pilgrimages"
                ctaScrollToId="subscription-tiers"
                disableLinks={true}
                videosSubtitle={(count) => `Days (${count})`}
                // Disable expand on mobile - UI not optimized for small screens
                interactive={!isMobile}
                showLock={false}
              />
            )}
          </Await>
        </Suspense>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={talks}>
            {(resolvedTalks) => (
              <Talks
                talks={resolvedTalks}
                title={strings.homepage_talks_title}
                ctaScrollToId="subscription-tiers"
                hideExploreLink={true}
                // Disable expand on mobile - UI not optimized for small screens
                interactive={!isMobile}
                showLock={false}
              />
            )}
          </Await>
        </Suspense>

        <PlatformFeatures schema={featuresSchema} />

        <SubscriptionTiers memberships={memberships} showToggle={false} />

        <Faqs
          showMoreLink={true}
          bottomPadding="lg"
          schema={faqsSchema}
          withImageBackground
        />
      </Stack>

      {/* Fullscreen Video Modal */}
      <FullscreenVideoModal
        isOpen={isVideoModalOpen}
        onClose={closeVideoModal}
        iframeUrl={modalVideoUrl}
        title={modalVideoTitle}
      />
    </div>
  );
}
