import { Suspense } from "react";
import {
  type LoaderFunctionArgs,
  useLoaderData,
  type MetaFunction,
  Await,
} from "react-router";
import { hasAccessToContent } from "~/lib/utils";
import {
  ContentSeriesCarousel,
  ContentSeriesHero,
  Stack,
  Container,
  MobileWall,
} from "~/components";
import {
  userScopedMediaApiContext,
  userContext,
  subscriptionTierContext,
} from "~/lib/middleware";
import { useTranslations } from "~/contexts/TranslationsProvider";

export const meta: MetaFunction = () => {
  return [
    { title: "Pilgrimages - Bhakti+" },
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
 * IMPORTANT: This function now returns userScopedMediaApi which should be used for ALL
 * content fetching to ensure correct regionId based on user's profile.
 */
async function loadCriticalData({ context }: LoaderFunctionArgs) {
  // Get user subscription info AND userScopedMediaApi from middleware context
  const userScopedMediaApi = context.get(userScopedMediaApiContext);
  const user = context.get(userContext);
  const subscriptionTier = context.get(subscriptionTierContext);

  // Use userScopedMediaApi for all content fetching to ensure correct regionId
  // Fetch pilgrimages and featured live in parallel
  const [{ pilgrimages }, featuredLiveResponse] = await Promise.all([
    userScopedMediaApi.pilgrimages.getList(),
    userScopedMediaApi.lives.getFeatured().catch(() => ({ featured: null })),
  ]);
  const featured = pilgrimages[0];

  // If the featured live's ppvTag matches the featured pilgrimage's ppvTag,
  // the live is the active stream for this pilgrimage (e.g., Holi 2026).
  // Pass it so the hero shows live CTA buttons.
  const featuredLive = featuredLiveResponse?.featured ?? null;
  const activeLive =
    featuredLive && featured?.ppvTag && featuredLive.ppvTag === featured.ppvTag
      ? featuredLive
      : null;

  return {
    featured,
    activeLive,
    subscriptionTier,
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
) {
  const pilgrimages = userScopedMediaApi.pilgrimages
    .getList()
    .then(({ pilgrimages }) => pilgrimages)
    .catch((error) => {
      console.error("Error loading pilgrimages:", error);
      return [];
    });

  return {
    pilgrimages,
  };
}

export default function Pilgrimages() {
  const { featured, activeLive, pilgrimages, subscriptionTier, user } =
    useLoaderData<typeof loader>();
  const { strings } = useTranslations();

  return (
    <MobileWall>
      <div className="pilgrimages">
        <Stack gap={7}>
          <ContentSeriesHero
            content={featured}
            contentType="pilgrimage"
            subscriptionTier={subscriptionTier}
            customerId={user?.shopifyCustomerId ?? undefined}
            user={user}
            videosSubtitle={(count) => strings.days_count.replace("{count}", String(count))}
            activeLive={activeLive}
          />

          <Stack gap={7}>
            <Suspense
              fallback={
                <Container className="py-40">
                  {strings.loading_general}
                </Container>
              }
            >
              <Await resolve={pilgrimages}>
                {(resolvedPilgrimages) => {
                  // Filter to only pilgrimages user has access to
                  const myPilgrimages = user
                    ? resolvedPilgrimages.filter((pilgrimage) =>
                        hasAccessToContent(user, subscriptionTier, pilgrimage),
                      )
                    : [];

                  const hasAccessibleContent = myPilgrimages.length > 0;

                  return (
                    <Stack gap={7}>
                      {hasAccessibleContent && (
                        <ContentSeriesCarousel
                          title={strings.my_pilgrimages || "My Pilgrimages"}
                          items={myPilgrimages}
                          contentType="pilgrimage"
                          exploreAllLink="/pilgrimages"
                          videosSubtitle={(count) => `Days (${count})`}
                        />
                      )}
                      <ContentSeriesCarousel
                        title={strings.all_pilgrimages || "All Pilgrimages"}
                        items={resolvedPilgrimages}
                        contentType="pilgrimage"
                        exploreAllLink="/pilgrimages"
                        videosSubtitle={(count) => `Days (${count})`}
                      />
                    </Stack>
                  );
                }}
              </Await>
            </Suspense>
          </Stack>
        </Stack>
      </div>
    </MobileWall>
  );
}
