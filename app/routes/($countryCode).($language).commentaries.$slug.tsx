import { Suspense } from "react";
import {
  type LoaderFunctionArgs,
  useLoaderData,
  type MetaFunction,
  useParams,
  Await,
} from "react-router";
import { isPremiumOrSupporter } from "~/lib/utils/content";
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
  return [{ title: `${data?.commentary?.title || "Commentary"} - Bhakti+` }];
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
  // Fetch commentary and featured live in parallel
  const [{ commentary, canonicalSlug }, featuredLiveResponse] =
    await Promise.all([
      userScopedMediaApi.commentaries.getBySlug(slug),
      userScopedMediaApi.lives.getFeatured().catch(() => ({ featured: null })),
    ]);

  if (!commentary) {
    throw new Response("Not Found", { status: 404 });
  }

  // Redirect to canonical slug if different
  if (canonicalSlug && slug !== canonicalSlug) {
    const redirectPath = locale
      ? `/${locale}/commentaries/${canonicalSlug}`
      : `/commentaries/${canonicalSlug}`;
    throw new Response(null, {
      status: 301,
      headers: { Location: redirectPath },
    });
  }

  // If the featured live's ppvTag matches this commentary's ppvTag,
  // the live is the active stream for this commentary.
  // Pass it so the hero shows live CTA buttons instead of the commentary's.
  const featuredLive = featuredLiveResponse?.featured ?? null;
  const activeLive =
    featuredLive && commentary.ppvTag && featuredLive.ppvTag === commentary.ppvTag
      ? featuredLive
      : null;

  return { commentary, activeLive, subscriptionTier, user, userScopedMediaApi };
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
  const commentaries = userScopedMediaApi.commentaries
    .getList()
    .then(({ commentaries }) => commentaries)
    .catch((error) => {
      console.error("Error loading commentaries:", error);
      return [];
    });

  const premiumCommentaries = commentaries.then((commentaries) =>
    commentaries.filter(isPremiumOrSupporter),
  );

  return {
    commentaries,
    premiumCommentaries,
  };
}

export default function CommentaryDetail() {
  const { strings } = useTranslations();
  const { slug } = useParams();
  const { commentary, activeLive, subscriptionTier, user, premiumCommentaries } =
    useLoaderData<typeof loader>();
  const { isPremium, isSupporter } = useSubscription();

  /**
   * key={slug} forces React to unmount/remount when navigating between commentaries.
   * Without this, CSS animations won't retrigger when only the slug param changes.
   * This ensures the background image crossfade animation plays on each navigation.
   */
  return (
    <div key={slug} className="commentary-detail">
      <Stack gap={7}>
        <ContentSeriesHero
          content={commentary}
          contentType="commentary"
          subscriptionTier={subscriptionTier}
          customerId={user?.shopifyCustomerId ?? undefined}
          user={user}
          prependGroupName
          videosSubtitle={(count) => strings.videos_count.replace("{count}", String(count))}
          activeLive={activeLive}
        />

        <div>
          <Suspense
            fallback={
              <Container className="py-40">{strings.loading_general}</Container>
            }
          >
            <Await resolve={premiumCommentaries}>
              {(resolvedCommentaries) => (
                <ContentSeriesCarousel
                  title={
                    isPremium || isSupporter
                      ? strings.my_commentaries
                      : strings.commentaries_premium_access
                  }
                  items={resolvedCommentaries}
                  contentType="commentary"
                  exploreAllLink="/commentaries"
                />
              )}
            </Await>
          </Suspense>
        </div>
      </Stack>
    </div>
  );
}
