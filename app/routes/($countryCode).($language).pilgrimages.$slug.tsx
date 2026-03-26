import { Suspense } from "react";
import {
  type LoaderFunctionArgs,
  useLoaderData,
  type MetaFunction,
  useParams,
  Await,
} from "react-router";
import { isPremiumOrSupporter } from "~/lib/utils";
import {
  Stack,
  ContentSeriesCarousel,
  ContentSeriesHero,
  Container,
} from "~/components";
import { useSubscription } from "~/hooks";
import {
  userScopedMediaApiContext,
  userContext,
  subscriptionTierContext,
} from "~/lib/middleware";
import { useTranslations } from "~/contexts/TranslationsProvider";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `${data?.pilgrimage?.title || "Pilgrimage"} - Bhakti+` }];
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
async function loadCriticalData({ context, params }: LoaderFunctionArgs) {
  const { slug, locale } = params;

  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  // Get user subscription info AND userScopedMediaApi from middleware context
  const userScopedMediaApi = context.get(userScopedMediaApiContext);
  const user = context.get(userContext);
  const subscriptionTier = context.get(subscriptionTierContext);

  // Use userScopedMediaApi for all content fetching to ensure correct regionId
  // Fetch pilgrimage and featured live in parallel
  const [pilgrimageResult, featuredLiveResponse] = await Promise.all([
    userScopedMediaApi.pilgrimages.getBySlug(slug),
    userScopedMediaApi.lives.getFeatured().catch(() => ({ featured: null })),
  ]);

  const { pilgrimage, canonicalSlug } = pilgrimageResult;

  if (!pilgrimage) {
    throw new Response("Not Found", { status: 404 });
  }

  // Redirect to canonical slug if different
  if (canonicalSlug && slug !== canonicalSlug) {
    const redirectPath = locale
      ? `/${locale}/pilgrimages/${canonicalSlug}`
      : `/pilgrimages/${canonicalSlug}`;
    throw new Response(null, {
      status: 301,
      headers: { Location: redirectPath },
    });
  }

  // If the featured live's ppvTag matches this pilgrimage's ppvTag,
  // the live is the active stream for this pilgrimage.
  // Pass it so the hero shows live CTA buttons instead of the pilgrimage's.
  const featuredLive = featuredLiveResponse?.featured ?? null;
  const activeLive =
    featuredLive && pilgrimage.ppvTag && featuredLive.ppvTag === pilgrimage.ppvTag
      ? featuredLive
      : null;

  return { pilgrimage, activeLive, subscriptionTier, user, userScopedMediaApi };
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

  const premiumPilgrimages = pilgrimages.then((pilgrimages) =>
    pilgrimages.filter(isPremiumOrSupporter),
  );

  return {
    pilgrimages,
    premiumPilgrimages,
  };
}

export default function PilgrimageDetail() {
  const { strings } = useTranslations();
  const { slug } = useParams();
  const {
    pilgrimage,
    activeLive,
    subscriptionTier,
    user,
    pilgrimages,
    premiumPilgrimages,
  } = useLoaderData<typeof loader>();
  const { isPremium, isSupporter } = useSubscription();

  /**
   * key={slug} forces React to unmount/remount when navigating between pilgrimages.
   * Without this, CSS animations won't retrigger when only the slug param changes.
   * This ensures the background image crossfade animation plays on each navigation.
   */
  return (
    <div key={slug} className="pilgrimage-detail">
      <Stack gap={7}>
        <ContentSeriesHero
          content={pilgrimage}
          contentType="pilgrimage"
          subscriptionTier={subscriptionTier}
          customerId={user?.shopifyCustomerId ?? undefined}
          user={user}
          videosSubtitle={(count) => strings.days_count.replace("{count}", String(count))}
          activeLive={activeLive}
        />

        <Suspense
          fallback={
            <Container className="py-40">{strings.loading_general}</Container>
          }
        >
          <Await resolve={pilgrimages}>
            {(resolvedPilgrimages) => (
              <ContentSeriesCarousel
                title={strings.pilgrimages_join_heading}
                items={resolvedPilgrimages}
                contentType="pilgrimage"
                exploreAllLink="/pilgrimages"
                videosSubtitle={(count) => `Days (${count})`}
              />
            )}
          </Await>
        </Suspense>
      </Stack>
    </div>
  );
}
