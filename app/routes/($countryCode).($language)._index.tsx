import { type LoaderFunctionArgs, useLoaderData, type MetaFunction } from "react-router";
import { faqsLoader } from "~/sections/Faqs/Faqs.loader";
import { platformFeaturesLoader } from "~/sections/PlatformFeatures/PlatformFeatures.loader";

import {
  SUBSCRIPTION_TIERS,
  SATSANG_CATEGORIES_ID,
} from "~/lib/constants";

// Translation hook - strings come from Shopify metaobjects
// See docs/TRANSLATIONS.md for complete translation system documentation
import {
  userContext,
  subscriptionTierContext,
  videosInProgressCountContext,
  userScopedMediaApiContext,
  localeContext,
} from "~/lib/middleware";
import { UnsubscribedHomepage } from "~/components/Homepage/UnsubscribedHomepage";
import { LiveHomepage } from "~/components/Homepage/LiveHomepage";
import { PremiumHomepage } from "~/components/Homepage/PremiumHomepage";
import {
  getPrelaunchConfig,
  isPrelaunchActive,
} from "~/lib/utils/prelaunch";
import type { BhaktiMargMediaApi } from "~/lib/api";

const PLATFORM_FEATURES_HANDLE_UNSUBSCRIBED = "homepage-platform-features";
const FAQS_HANDLE_UNSUBSCRIBED = "homepage-faqs";

export const meta: MetaFunction = () => {
  return [
    { title: "Bhakti+" },
    { name: "description", content: "Paramahamsa Vishwananda's wisdom in one place. Watch everywhere, anytime, without distractions. Available in 28+ languages." },
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  console.log('🏠 Homepage loader called at:', new Date().toISOString());

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  // Get locale options for Shopify queries
  const determinedLocale = args.context.get(localeContext);
  const localeOptions = {
    language: determinedLocale.language,
    country: determinedLocale.countryCode
  };

  // Load tier-specific deferred data
  const isSubscribed = criticalData.subscriptionTier &&
    criticalData.subscriptionTier !== SUBSCRIPTION_TIERS.UNSUBSCRIBED;

  const deferredData = isSubscribed
    ? loadSubscribedDeferredData(criticalData, args.context, localeOptions)
    : loadUnsubscribedDeferredData(criticalData.userScopedMediaApi, args.context, localeOptions);

  // Remove userScopedMediaApi from returned data - it's not serializable
  const { userScopedMediaApi: _api, ...serializableCriticalData } = criticalData;

  // Prelaunch configuration
  const prelaunchConfig = getPrelaunchConfig(args.context.env);
  const isPrelaunch = isPrelaunchActive(prelaunchConfig);

  return {
    ...deferredData,
    ...serializableCriticalData,
    isPrelaunch,
    prelaunchEndDateFormatted: prelaunchConfig.prelaunchEndDateFormatted,
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 *
 * IMPORTANT: Returns userScopedMediaApi which should be used for ALL content fetching.
 */
async function loadCriticalData({ context }: LoaderFunctionArgs) {
  // Get auth data from middleware context (no async fetch needed!)
  const user = context.get(userContext);
  const subscriptionTier = context.get(subscriptionTierContext);
  const videosInProgressCount = context.get(videosInProgressCountContext);
  const userScopedMediaApi = context.get(userScopedMediaApiContext);

  const featuredLiveResponse = await userScopedMediaApi.lives.getFeatured();
  const featuredLive = featuredLiveResponse?.featured ?? null;

  // Fetch daily satsang as fallback hero when no featured live
  const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const dailySatsangResponse = await userScopedMediaApi.satsangs.getDaily(todayDate);
  const dailySatsang = dailySatsangResponse?.satsang ?? null;

  return {
    user,
    subscriptionTier,
    videosInProgressCount,
    featuredLive,
    dailySatsang,
    userScopedMediaApi,
  };
}

// ============================================================
// UNSUBSCRIBED HOMEPAGE DATA
// Minimal data for marketing/landing page experience
// ============================================================

interface LocaleOptions {
  language: string;
  country: string;
}

/**
 * Load deferred data for UnsubscribedHomepage.
 * 
 * This is a marketing page with static content previews.
 * We only need category metadata (not full satsang lists) and content previews.
 */
function loadUnsubscribedDeferredData(
  userScopedMediaApi: BhaktiMargMediaApi,
  context: any,
  localeOptions: LocaleOptions
) {
  // Shopify metaobject content for marketing sections
  const featuresSchema = platformFeaturesLoader(
    context,
    PLATFORM_FEATURES_HANDLE_UNSUBSCRIBED,
    localeOptions,
  ).catch((error) => {
    console.error('Error loading features schema:', error);
    return null;
  });

  const faqsSchema = faqsLoader(context, FAQS_HANDLE_UNSUBSCRIBED, localeOptions).catch((error) => {
    console.error('Error loading FAQs schema:', error);
    return null;
  });

  // Category metadata only - for static category cards (not expandable)
  const satsangCategories = userScopedMediaApi.satsangs
    .getCategories()
    .then(({ categories }) => categories)
    .catch((error) => {
      console.error('Error loading satsang categories:', error);
      return [];
    });

  // Content previews - shown as non-interactive carousels
  const commentaries = userScopedMediaApi.commentaries
    .getList()
    .then(({ commentaries }) => commentaries)
    .catch((error) => {
      console.error('Error loading commentaries:', error);
      return [];
    });

  const pilgrimages = userScopedMediaApi.pilgrimages
    .getList()
    .then(({ pilgrimages }) => pilgrimages)
    .catch((error) => {
      console.error('Error loading pilgrimages:', error);
      return [];
    });

  const talks = userScopedMediaApi.talks
    .getList({ sortBy: "title", desc: false })
    .then(({ talks }) => talks)
    .catch((error) => {
      console.error('Error loading talks:', error);
      return [];
    });

  // Return empty promises for subscribed-only data to maintain type consistency
  return {
    // Unsubscribed-specific data
    featuresSchema,
    faqsSchema,
    satsangCategories,
    commentaries,
    pilgrimages,
    talks,
    // Empty data for subscribed-only features (maintains loader return type)
    lives: Promise.resolve([]),
    watchHistory: Promise.resolve([]),
    continueWatching: Promise.resolve([]),
    purchases: Promise.resolve([]),
    satsangsLatestReleases: Promise.resolve([]),
    satsangsLive: Promise.resolve([]),
    satsangsGod: Promise.resolve([]),
    satsangsSaints: Promise.resolve([]),
    satsangsBhakti: Promise.resolve([]),
    satsangsHappiness: Promise.resolve([]),
    satsangsWeekly: Promise.resolve([]),
  };
}

// ============================================================
// SUBSCRIBED HOMEPAGE DATA
// Full data for Live, Core, and Premium homepage variants
// ============================================================

interface CriticalData {
  user: any;
  subscriptionTier: string | null;
  videosInProgressCount: number;
  featuredLive: any;
  dailySatsang: any;
  userScopedMediaApi: BhaktiMargMediaApi;
}

/**
 * Load deferred data for subscribed homepages (Live, Core, Premium).
 * 
 * These homepages show:
 * - Interactive content carousels with video previews
 * - User watch history (continue watching)
 * - Full satsang content organized by category
 */
function loadSubscribedDeferredData(
  criticalData: CriticalData,
  context: any,
  localeOptions: LocaleOptions
) {
  const { user, userScopedMediaApi } = criticalData;

  // Build userAuth object for authenticated API calls
  const userAuth = user?.email ? { email: user.email } : {};

  // ---- User-specific data ----

  const watchHistory = userScopedMediaApi.user
    .getWatchHistory(userAuth)
    .then(({ watchHistory }) =>
      Array.isArray(watchHistory) ? watchHistory : [],
    ).catch((error) => {
      console.error('Error loading watch history:', error);
      return [];
    });

  const continueWatching = userScopedMediaApi.user
    .getInProgressVideos(userAuth)
    .then(({ inProgressVideos }) => inProgressVideos)
    .catch((error) => {
      console.error('Error loading continue watching:', error);
      return [];
    });

  // ---- Content data ----

  const satsangCategories = userScopedMediaApi.satsangs
    .getCategories()
    .then(({ categories }) => categories)
    .catch((error) => {
      console.error('Error loading satsang categories:', error);
      return [];
    });

  const lives = userScopedMediaApi.lives
    .getList()
    .then(({ lives }) => lives)
    .catch((error) => {
      console.error('Error loading lives:', error);
      return [];
    });

  const commentaries = userScopedMediaApi.commentaries
    .getList()
    .then(({ commentaries }) => commentaries)
    .catch((error) => {
      console.error('Error loading commentaries:', error);
      return [];
    });

  const pilgrimages = userScopedMediaApi.pilgrimages
    .getList()
    .then(({ pilgrimages }) => pilgrimages)
    .catch((error) => {
      console.error('Error loading pilgrimages:', error);
      return [];
    });

  const talks = userScopedMediaApi.talks
    .getList({ sortBy: "title", desc: false })
    .then(({ talks }) => talks)
    .catch((error) => {
      console.error('Error loading talks:', error);
      return [];
    });

  // ---- Satsang content rows ----

  const satsangsLatestReleases = userScopedMediaApi.satsangs
    .getLatestReleases()
    .then(({ latestReleases }) => latestReleases)
    .catch((error) => {
      console.error('Error loading satsangs latest releases:', error);
      return [];
    });

  const satsangsLive = userScopedMediaApi.satsangs
    .getList()
    .then(({ satsangs }) =>
      satsangs.filter((satsang) => satsang.isLiveContent),
    ).catch((error) => {
      console.error('Error loading satsangs live:', error);
      return [];
    });

  const satsangsGod = userScopedMediaApi.satsangs
    .getList({ categoryId: SATSANG_CATEGORIES_ID.GOD })
    .then(({ satsangs }) => satsangs)
    .catch((error) => {
      console.error('Error loading satsangs God:', error);
      return [];
    });

  const satsangsSaints = userScopedMediaApi.satsangs
    .getList({ categoryId: SATSANG_CATEGORIES_ID.SAINTS })
    .then(({ satsangs }) => satsangs)
    .catch((error) => {
      console.error('Error loading satsangs Saints:', error);
      return [];
    });

  const satsangsBhakti = userScopedMediaApi.satsangs
    .getList({ categoryId: SATSANG_CATEGORIES_ID.BHAKTI })
    .then(({ satsangs }) => satsangs)
    .catch((error) => {
      console.error('Error loading satsangs Bhakti:', error);
      return [];
    });

  const satsangsHappiness = userScopedMediaApi.satsangs
    .getList({ categoryId: SATSANG_CATEGORIES_ID.HAPPINESS })
    .then(({ satsangs }) => satsangs)
    .catch((error) => {
      console.error('Error loading satsangs Happiness:', error);
      return [];
    });

  const todayDate = new Date().toISOString().split('T')[0];
  const satsangsWeekly = userScopedMediaApi.satsangs
    .getWeekly(todayDate)
    .then(({ dailySatsangs }) => ({
      satsangs: dailySatsangs.map((d) => d.satsang),
      todayIndex: dailySatsangs.findIndex((d) => d.date === todayDate),
    }))
    .catch((error) => {
      console.error('Error loading satsangs weekly:', error);
      return { satsangs: [], todayIndex: -1 };
    });

  // ---- User purchases ----
  const purchases = userScopedMediaApi.user
    .getPurchases(userAuth)
    .then(({ purchases }) => purchases)
    .catch((error) => {
      console.error('Error loading purchases:', error);
      return [];
    });

  // FAQs content - also shown for subscribed users
  const faqsSchema = faqsLoader(context, FAQS_HANDLE_UNSUBSCRIBED, localeOptions).catch((error) => {
    console.error('Error loading FAQs schema:', error);
    return null;
  });

  return {
    // User data
    watchHistory,
    continueWatching,
    purchases,
    // Content data
    satsangCategories,
    lives,
    commentaries,
    pilgrimages,
    talks,
    // Satsang content rows
    satsangsLatestReleases,
    satsangsLive,
    satsangsGod,
    satsangsSaints,
    satsangsBhakti,
    satsangsHappiness,
    satsangsWeekly,
    // Shared content
    faqsSchema,
    // Empty data for unsubscribed-only features (maintains loader return type)
    featuresSchema: Promise.resolve(null),
  };
}

export default function Homepage() {
  // Get subscription tier from server-side loader
  const { subscriptionTier } = useLoaderData<typeof loader>();

  // Not logged in or unsubscribed - show marketing homepage
  // (Available Soon banner is shown when isPrelaunchActive in the component)
  if (!subscriptionTier || subscriptionTier === SUBSCRIPTION_TIERS.UNSUBSCRIBED) {
    return <UnsubscribedHomepage />;
  }

  switch (subscriptionTier) {
    case SUBSCRIPTION_TIERS.LIVE:
      return <LiveHomepage />;
    case SUBSCRIPTION_TIERS.PREMIUM:
    case SUBSCRIPTION_TIERS.SUPPORTER:
      return <PremiumHomepage />;
    default:
      return <UnsubscribedHomepage />;
  }
}
