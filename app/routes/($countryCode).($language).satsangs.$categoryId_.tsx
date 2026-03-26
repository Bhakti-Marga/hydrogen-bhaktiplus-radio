import { type LoaderFunctionArgs, useLoaderData, type MetaFunction, Await, useParams } from "react-router";
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
import { VideoChapters, VideoChaptersProps, Cover, BackgroundVideoWithOverlays, Stack, Container, ContentInfoItems, SectionHeader } from "~/components";
import { SatsangContentRow, SatsangContentGrid } from "~/components/Homepage/shared-components";
import { useState, Suspense } from "react";
import { SatsangsNav } from "~/components/SatsangsNav/SatsangsNav";
import { userScopedMediaApiContext, userContext, subscriptionTierContext } from "~/lib/middleware";
import { EMPTY_ARRAY } from "~/lib/constants";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { SatsangSubcategory, Satsang } from "~/lib/types";

export const meta: MetaFunction<typeof loader> = () => {
  return [{ title: "Satsangs - Bhakti+" }];
};

export async function loader(args: LoaderFunctionArgs) {
  const criticalData = await loadCriticalData(args);
  // Use userScopedMediaApi from critical data for deferred loading
  const deferredData = loadDeferredData(criticalData.userScopedMediaApi, args.params);

  // Remove userScopedMediaApi from returned data - it's not serializable
  const { userScopedMediaApi: _api, ...returnedCriticalData } = criticalData;

  return { ...returnedCriticalData, ...deferredData };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 *
 * IMPORTANT: This function now returns userScopedMediaApi which should be used for ALL
 * content fetching to ensure correct regionId based on user's profile.
 */
async function loadCriticalData({ context, params }: LoaderFunctionArgs) {
  const { categoryId } = params;

  // Get user subscription info AND userScopedMediaApi from middleware context
  const user = context.get(userContext);
  const subscriptionTier = context.get(subscriptionTierContext);
  const userScopedMediaApi = context.get(userScopedMediaApiContext);

  // Use userScopedMediaApi for all content fetching to ensure correct regionId
  const { satsangs } = await userScopedMediaApi.satsangs.getList({ categoryId: Number(categoryId), limit: 1 });

  const featured = satsangs[0];
  const tags = getTagsFromContent(featured);

  const heroSchema: HeroSchema = {
    title: featured.title,
    titleUppercase: true,
    description: featured.summary200 || featured.description,
    backgroundImage: {
      url: featured.thumbnailUrl,
      type: "external",
      altText: featured.title,
    },
    verticalAlignment: "center",
    horizontalAlignment: "left",
    tags,
  };

  const videoChaptersProps: VideoChaptersProps = {
    title: featured.title,
    video: featured.video,
    chapters: featured.video?.chapters ?? EMPTY_ARRAY,
  };

  return {
    heroSchema,
    videoChaptersProps,
    featured,
    subscriptionTier,
    user,
    userScopedMediaApi,
  };
}

/** Limit for content per subcategory row */
const SUBCATEGORY_CONTENT_LIMIT = 20;

/**
 * Data structure for a subcategory with its content promise
 */
interface SubcategoryWithContentPromise {
  subcategory: SatsangSubcategory;
  contentPromise: Promise<Satsang[]>;
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 *
 * Uses userScopedMediaApi from critical data to ensure correct regionId.
 *
 * New pattern: Fetches subcategory metadata first, then lazy-loads content for each
 * subcategory individually using the /satsangs endpoint with topicId filter.
 */
function loadDeferredData(userScopedMediaApi: import("~/lib/api").BhaktiMargMediaApi, params: LoaderFunctionArgs["params"]) {
  const { categoryId } = params;
  const categoryIdNum = Number(categoryId);

  // Fetch category info
  const categoryPromise = userScopedMediaApi.satsangs.getCategories()
    .then(({ categories }) => categories.find(c => c.id === categoryIdNum) ?? null)
    .catch((error) => {
      console.error('Failed to load category:', error);
      return null;
    });

  // Fetch subcategories metadata (includes otherTopicIds for "Other" section)
  const subcategoriesMetaPromise = userScopedMediaApi.satsangs.getSubcategories(categoryIdNum)
    .catch((error) => {
      console.error('Failed to load subcategories:', error);
      return { subcategories: [] as SatsangSubcategory[], otherTopicIds: [] as number[] };
    });

  // Create promises for each subcategory's content - these will be resolved in parallel on the client
  const subcategoriesWithContentPromises = subcategoriesMetaPromise.then(({ subcategories, otherTopicIds }) => {
    // Separate regular subcategories (positive IDs) from "Other" (id=-1)
    const regularSubcategories = subcategories.filter((sub) => sub.id !== null && sub.id > 0);
    const hasOtherSection = subcategories.some((sub) => sub.id === -1 || sub.id === null);

    // Create content promises for regular subcategories
    const regularPromises: SubcategoryWithContentPromise[] = regularSubcategories.map((subcategory) => ({
      subcategory,
      contentPromise: userScopedMediaApi.satsangs.getList({
        categoryId: categoryIdNum,
        topicId: subcategory.id!,
        limit: SUBCATEGORY_CONTENT_LIMIT,
      })
        .then(({ satsangs }) => satsangs)
        .catch((error) => {
          console.error(`Failed to load content for subcategory ${subcategory.id}:`, error);
          return [];
        }),
    }));

    // Create content promise for "Other" section (minor topics + no topics)
    let otherPromise: SubcategoryWithContentPromise | null = null;
    if (hasOtherSection) {
      // Combine otherTopicIds with -1 to get content with no topic as well
      const otherTopicIdsWithNoTopic = [...otherTopicIds, -1];
      const otherSubcategory = subcategories.find((sub) => sub.id === -1 || sub.id === null);

      if (otherSubcategory) {
        otherPromise = {
          subcategory: { ...otherSubcategory, id: -1 }, // Normalize to -1
          contentPromise: userScopedMediaApi.satsangs.getList({
            categoryId: categoryIdNum,
            topicId: otherTopicIdsWithNoTopic,
            limit: SUBCATEGORY_CONTENT_LIMIT,
          })
            .then(({ satsangs }) => satsangs)
            .catch((error) => {
              console.error('Failed to load "Other" content:', error);
              return [];
            }),
        };
      }
    }

    return {
      regular: regularPromises,
      other: otherPromise,
    };
  });

  return {
    category: categoryPromise,
    subcategories: subcategoriesMetaPromise.then(({ subcategories }) => subcategories),
    subcategoriesWithContentPromises,
  };
}

export default function Satsangs() {
  const { strings } = useTranslations();
  const { categoryId } = useParams();
  const { category, heroSchema, videoChaptersProps, subcategories, subcategoriesWithContentPromises, featured, subscriptionTier, user } =
    useLoaderData<typeof loader>();
  const [isVideoChaptersVisible, setIsVideoChaptersVisible] = useState(false);

  /**
   * key={categoryId} forces React to unmount/remount when navigating between categories.
   * Without this, React Router reuses the component instance when only params change,
   * preventing CSS animations (like crossfade) from retriggering.
   * This ensures smooth fade-in animations for hero background and ContentRow items.
   */
  return (
    <div key={categoryId} className="satsangs">
      <HeroBackground
        className="-mt-[var(--header-height)] overflow-hidden relative"
      >
        <BackgroundVideoWithOverlays
          imageUrl={heroSchema.backgroundImage?.url || ""}
          mobileImageUrl={featured?.thumbnailUrlVertical || undefined}
          videoId={featured?.video?.videoId?.toString()}
          startTimeSeconds={featured?.video?.previewStartOffset ?? (featured?.video?.durationSeconds ? Math.floor(featured.video.durationSeconds / 2) : undefined)}
          altText={heroSchema.backgroundImage?.altText}
          subscriptionTier={subscriptionTier}
          customerId={user?.shopifyCustomerId}
          enableVideo={true}
        />
        <Cover minHeight="70vh" padding="0">
          <Container>
            <Suspense fallback={<div className="py-8">{strings.loading_navigation}</div>}>
              <Await resolve={Promise.all([category, subcategories])}>
                {([resolvedCategory, resolvedSubcategories]) => (
                  <SatsangsNav
                    categoryName={resolvedCategory?.name ?? ""}
                    categories={resolvedSubcategories}
                    level="subcategory"
                    categoryId={resolvedCategory?.id}
                  />
                )}
              </Await>
            </Suspense>
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

                  <ContentInfoItems content={featured} showDuration />

                  <HeroButtons>
                    <Button icon={<IconPlay className="w-12 mr-8 relative top-[-1px]" />}>
                      {strings.play}
                    </Button>
                    {videoChaptersProps.chapters.length > 0 && (
                      <Button
                        variant="secondary"
                        icon={<IconChapters className="w-20 mr-8" />}
                        onClick={() => setIsVideoChaptersVisible(true)}
                      >
                        {strings.see_chapters}
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
                <VideoChapters {...videoChaptersProps} />
              </div>
            </div>
          </div>
        </div>
      </HeroBackground>

      <div className="categories mt-32">
        <Suspense fallback={<div className="text-center py-16">{strings.loading_general}</div>}>
          <Await resolve={Promise.all([category, subcategoriesWithContentPromises])}>
            {([resolvedCategory, resolvedPromises]) => (
              <>
                {/* Regular subcategories - each loads independently */}
                {resolvedPromises.regular.map((item) => (
                  <section key={item.subcategory.id} className="mb-32">
                    <Suspense fallback={<SubcategoryRowSkeleton title={item.subcategory.name ?? ""} />}>
                      <Await resolve={item.contentPromise}>
                        {(content) => content.length > 0 ? (
                          <SatsangContentRow
                            content={content}
                            title={item.subcategory.name ?? ""}
                            exploreAllLink={`/satsangs/${resolvedCategory?.id}/subcategories/${item.subcategory.id}`}
                            aspectRatio="landscape"
                            subscriptionTier={subscriptionTier}
                            customerId={user?.shopifyCustomerId?.toString()}
                            id={`subcategory-${item.subcategory.id}`}
                          />
                        ) : null}
                      </Await>
                    </Suspense>
                  </section>
                ))}

                {/* "Others" section - displayed as a grid with "All {categoryName}" title */}
                {resolvedPromises.other && (
                  <section className="mb-32">
                    <Suspense fallback={<SubcategoryGridSkeleton title={`All ${resolvedCategory?.name ?? ""}`} />}>
                      <Await resolve={resolvedPromises.other.contentPromise}>
                        {(content) => content.length > 0 ? (
                          <SatsangContentGrid
                            content={content}
                            title={`All ${resolvedCategory?.name ?? ""}`}
                            aspectRatio="landscape"
                            subscriptionTier={subscriptionTier}
                            customerId={user?.shopifyCustomerId?.toString()}
                            id="all-category-satsangs"
                          />
                        ) : null}
                      </Await>
                    </Suspense>
                  </section>
                )}
              </>
            )}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}

/**
 * Skeleton loading state for a subcategory row (carousel)
 */
function SubcategoryRowSkeleton({ title }: { title: string }) {
  return (
    <div className="animated-link-chevron-trigger max-w-screen overflow-hidden">
      <Container>
        <SectionHeader title={title} />
      </Container>
      <Container bleedRight>
        <div className="flex gap-16 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[280px]">
              <div className="aspect-video bg-grey-darker rounded-lg animate-pulse" />
              <div className="mt-12 h-16 bg-grey-darker rounded animate-pulse w-3/4" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}

/**
 * Skeleton loading state for a subcategory grid
 */
function SubcategoryGridSkeleton({ title }: { title: string }) {
  return (
    <Container>
      <SectionHeader title={title} />
      <div className="grid grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4 gap-16">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-video bg-grey-darker rounded-lg animate-pulse" />
            <div className="mt-12 h-16 bg-grey-darker rounded animate-pulse w-3/4" />
          </div>
        ))}
      </div>
    </Container>
  );
}
