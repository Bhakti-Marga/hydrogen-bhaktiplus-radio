import { type LoaderFunctionArgs, useLoaderData, type MetaFunction } from "react-router";
import {
  HeroSchema,
  HeroBackground,
  HeroContent,
  HeroTags,
  HeroTitle,
  HeroButtons,
} from "~/sections";
import { getTagsFromContent } from "~/lib/utils";
import { Button } from "~/components/Button";
import { IconPlay, IconChapters, IconClose } from "~/components/Icons";
import {
  VideoChapters,
  VideoChaptersProps,
  AllVideos,
  Cover,
  Stack,
  BackgroundVideoWithOverlays,
  Container,
  ContentInfoItems,
} from "~/components";
import { SatsangContentGrid } from "~/components/Homepage/shared-components";
import { useState } from "react";
import { SatsangsNav } from "~/components/SatsangsNav/SatsangsNav";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { userScopedMediaApiContext, userContext, subscriptionTierContext } from "~/lib/middleware";
import { EMPTY_ARRAY } from "~/lib/constants";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const category = data?.category?.name || 'Category';
  const subcategory = data?.subcategory?.name || 'Subcategory';
  return [{ title: `${category} > ${subcategory} - Bhakti+` }];
};

export async function loader(args: LoaderFunctionArgs) {
  const criticalData = await loadCriticalData(args);
  const deferredData = loadDeferredData();

  // Remove userScopedMediaApi from returned data - it's not serializable
  const { userScopedMediaApi: _api, ...returnedCriticalData } = criticalData;

  return { ...deferredData, ...returnedCriticalData };
}

/** Limit for subcategory content - show all content for this subcategory */
const SUBCATEGORY_CONTENT_LIMIT = 100;

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 *
 * IMPORTANT: This function now returns userScopedMediaApi which should be used for ALL
 * content fetching to ensure correct regionId based on user's profile.
 */
async function loadCriticalData({ context, params }: LoaderFunctionArgs) {
  const { categoryId, subcategoryId } = params;
  const categoryIdNum = Number(categoryId);
  const subcategoryIdNum = Number(subcategoryId);

  // Get user subscription info AND userScopedMediaApi from middleware context
  const user = context.get(userContext);
  const subscriptionTier = context.get(subscriptionTierContext);
  const userScopedMediaApi = context.get(userScopedMediaApiContext);

  // Fetch category info and subcategory metadata in parallel
  const [{ categories }, { subcategories }] = await Promise.all([
    userScopedMediaApi.satsangs.getCategories(),
    userScopedMediaApi.satsangs.getSubcategories(categoryIdNum),
  ]);

  // Find the specific category and subcategory metadata
  const category = categories.find((c) => c.id === categoryIdNum);
  const subcategoryMeta = subcategories.find((sub) => sub.id === subcategoryIdNum);

  if (!subcategoryMeta) {
    throw new Response("Subcategory not found", { status: 404 });
  }

  // Fetch content for this specific subcategory using topicId filter
  const { satsangs: subcategoryContent } = await userScopedMediaApi.satsangs.getList({
    categoryId: categoryIdNum,
    topicId: subcategoryIdNum,
    limit: SUBCATEGORY_CONTENT_LIMIT,
  });

  // Use first content item as featured, or fetch general featured as fallback
  let featuredContent = subcategoryContent[0];
  if (!featuredContent) {
    const { featured } = await userScopedMediaApi.satsangs.getFeatured();
    featuredContent = featured;
  }

  const tags = getTagsFromContent(featuredContent);

  const heroSchema: HeroSchema = {
    title: featuredContent.title,
    titleUppercase: true,
    description: featuredContent.summary200 || featuredContent.description,
    backgroundImage: {
      url: featuredContent.thumbnailUrl,
      type: "external",
      altText: featuredContent.title,
    },
    verticalAlignment: "center",
    horizontalAlignment: "left",
    tags,
  };

  const videoChaptersProps: VideoChaptersProps | null = featuredContent?.video
    ? {
      title: featuredContent.title,
      video: featuredContent.video,
      chapters: featuredContent.video.chapters ?? EMPTY_ARRAY,
    }
    : null;

  return {
    category,
    subcategory: { ...subcategoryMeta, contents: subcategoryContent },
    heroSchema,
    videoChaptersProps,
    subscriptionTier,
    user,
    userScopedMediaApi,
    featuredContent,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData() {
  return {};
}

export default function SatsangSubcategory() {
  const {
    category,
    subcategory,
    heroSchema,
    videoChaptersProps,
    subscriptionTier,
    user,
    featuredContent,
  } = useLoaderData<typeof loader>();
  const { strings } = useTranslations();
  const [isVideoChaptersVisible, setIsVideoChaptersVisible] = useState(false);

  return (
    <div className="satsang-subcategory">
      <HeroBackground
        className="relative"
      >
        <BackgroundVideoWithOverlays
          imageUrl={heroSchema.backgroundImage?.url || ""}
          mobileImageUrl={featuredContent?.thumbnailUrlVertical || undefined}
          altText={heroSchema.backgroundImage?.altText}
          videoId={videoChaptersProps?.video?.videoId?.toString()}
          subscriptionTier={subscriptionTier}
          customerId={user?.shopifyCustomerId}
          enableVideo={true}
          startTimeSeconds={videoChaptersProps?.video?.previewStartOffset}
        />
        <Cover minHeight="70vh" padding="0">
          <Container>
            <SatsangsNav
              categoryName={category?.name ?? ""}
              subcategoryName={subcategory?.name ?? ""}
              level="subcategory"
              categoryId={category?.id}
            />
          </Container>

          <Cover.Center>
            <Container>
              <HeroContent
                padding="py-128"
              >
                <Stack gap={3}>
                  <Stack gap={2}>
                    <HeroTags tags={heroSchema.tags} />
                    <HeroTitle uppercase={heroSchema.titleUppercase}>
                      {heroSchema.title}
                    </HeroTitle>
                  </Stack>

                  <ContentInfoItems content={featuredContent} showDuration />

                  <HeroButtons>
                    <Button icon={<IconPlay className="w-12 mr-8 relative top-[-1px]" />}>
                      {strings.play || "Play"}
                    </Button>
                    {(videoChaptersProps?.chapters?.length ?? 0) > 0 && (
                      <Button
                        variant="secondary"
                        icon={<IconChapters className="w-20 mr-8" />}
                        onClick={() => setIsVideoChaptersVisible(true)}
                      >
                        {strings.see_chapters || "See Chapters"}
                      </Button>
                    )}
                  </HeroButtons>
                </Stack>
              </HeroContent>
            </Container>
          </Cover.Center>
        </Cover>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className={`absolute inset-0 bg-brand-dark/90 z-50 flex items-center justify-center transition-opacity duration-300 ${isVideoChaptersVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
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

      </HeroBackground>

      <div className="subcategory-content mt-32">
        {subcategory?.contents && subcategory.contents.length > 0 ? (
          <section key={subcategory.id} className="mb-32">
            <SatsangContentGrid
              content={subcategory.contents}
              aspectRatio="landscape"
              subscriptionTier={subscriptionTier}
              customerId={user?.shopifyCustomerId?.toString()}
              id={`subcategory-${subcategory.id}`}
            />
          </section>
        ) : (
          <div className="text-center py-40">
            <h2 className="h2 text-white mb-16">{strings.empty_no_content_title}</h2>
            <p className="body-b2 text-white/80">
              {strings.empty_no_satsangs_subcategory}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
