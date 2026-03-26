import { AppLoadContext } from "react-router";
import { Product } from "@shopify/hydrogen/storefront-api-types";

import { HeaderNav, HeaderSubmenuData } from "~/components/Header/Header.types";
import { SHOPIFY_SUBSCRIPTION_PRODUCTS_HANDLES } from "../constants";
import {
  Commentary,
  Content,
  ShopifySubscriptionProducts,
  Video,
  ContentType,
} from "../types";
import { PRODUCTS_QUERY, PRODUCT_ITEM_QUERY } from "~/graphql/product.queries";
import type { BhaktiMargMediaApi } from "~/lib/api";
import type { ContentNewStatusResponseDto } from "~/lib/api/types";

// ============================================================
// HEADER NAVIGATION
// Split into structure (sync) and submenu data (deferred)
// ============================================================

/**
 * Get static header navigation structure.
 * This is synchronous - no API calls needed.
 *
 * Used by: All users (subscribed and unsubscribed)
 */
export function getHeaderNavStructure(): HeaderNav {
  return {
    links: [
      { name: "Livestreams", link: "/livestreams", id: "lives" },
      { name: "Satsangs", link: "/satsangs", id: "satsangs" },
      { name: "Commentaries", link: "/commentaries", id: "commentaries" },
      { name: "Virtual Pilgrimages", link: "/pilgrimages", id: "pilgrimages" },
      { name: "Talks", link: "/talks", id: "talks" },
    ],
  };
}

/**
 * Load header submenu data for mega-menu dropdowns.
 * This is deferred - called only for subscribed users.
 *
 * Returns a promise that resolves to all submenu data.
 * The Header component can await individual submenus as needed.
 *
 * @param mediaApi - The user-scoped Media API instance
 */
export function loadHeaderSubmenuData(
  mediaApi: BhaktiMargMediaApi,
): Promise<HeaderSubmenuData> {
  // Cap submenu items to keep the mega-menu focused. "View All" links provide access to full lists.
  const HEADER_SUBMENU_ITEMS_LIMIT = 4;

  // Start all fetches in parallel
  const livesPromise = mediaApi.lives
    .getLatestReleases({
      limit: HEADER_SUBMENU_ITEMS_LIMIT,
    })
    .then(({ latestReleases }) => {
      const items = latestReleases ?? [];
      return {
        type: "lives" as const,
        latestLives: items,
        hasNewContent: items.some((item) => item.isNew === true),
        hasUpcomingContent: items.some((item) => item.isUpcoming === true),
      };
    })
    .catch((error) => {
      console.error("Error loading lives submenu:", error);
      return {
        type: "lives" as const,
        latestLives: [],
        hasNewContent: false,
        hasUpcomingContent: false,
      };
    });

  const satsangsCategoriesPromise = mediaApi.satsangs.getCategories();
  const satsangsListPromise = mediaApi.satsangs.getList({
    limit: HEADER_SUBMENU_ITEMS_LIMIT,
  });
  const satsangsPromise = Promise.all([
    satsangsCategoriesPromise,
    satsangsListPromise,
  ])
    .then(([categoriesResult, listResult]) => {
      const items = listResult?.satsangs ?? [];
      return {
        type: "satsangs" as const,
        categories: categoriesResult?.categories ?? [],
        latestReleases: items,
        hasNewContent: items.some((item) => item.isNew === true),
        hasUpcomingContent: items.some((item) => item.isUpcoming === true),
      };
    })
    .catch((error) => {
      console.error("Error loading satsangs submenu:", error);
      return {
        type: "satsangs" as const,
        categories: [],
        latestReleases: [],
        hasNewContent: false,
        hasUpcomingContent: false,
      };
    });

  const commentariesPromise = mediaApi.commentaries
    .getList()
    .then(({ commentaries }) => {
      const exclusiveCommentaries: Commentary[] = [];
      const publicCommentaries: Commentary[] = [];

      commentaries?.forEach((commentary) => {
        if (
          commentary.subscriptionTiers?.includes("SUPPORTER") ||
          commentary.subscriptionTiers?.includes("PREMIUM")
        ) {
          exclusiveCommentaries.push(commentary);
        } else {
          publicCommentaries.push(commentary);
        }
      });

      // Cap to submenu limit - "View All" provides access to full list
      const cappedPublic = publicCommentaries.slice(
        0,
        HEADER_SUBMENU_ITEMS_LIMIT,
      );
      const cappedExclusive = exclusiveCommentaries.slice(
        0,
        HEADER_SUBMENU_ITEMS_LIMIT,
      );

      return {
        type: "commentaries" as const,
        publicCommentaries: cappedPublic,
        exclusiveCommentaries: cappedExclusive,
        hasNewContent:
          cappedPublic.some((item) => item.isNew === true) ||
          cappedExclusive.some((item) => item.isNew === true),
        hasUpcomingContent:
          cappedPublic.some((item) => item.isUpcoming === true) ||
          cappedExclusive.some((item) => item.isUpcoming === true),
      };
    })
    .catch((error) => {
      console.error("Error loading commentaries submenu:", error);
      return {
        type: "commentaries" as const,
        publicCommentaries: [],
        exclusiveCommentaries: [],
        hasNewContent: false,
        hasUpcomingContent: false,
      };
    });

  const pilgrimagesPromise = mediaApi.pilgrimages
    .getList()
    .then(({ pilgrimages }) => {
      // Cap to submenu limit - "View All" provides access to full list
      const items = (pilgrimages ?? []).slice(0, HEADER_SUBMENU_ITEMS_LIMIT);
      return {
        type: "pilgrimages" as const,
        pilgrimages: items,
        hasNewContent: items.some((item) => item.isNew === true),
        hasUpcomingContent: items.some((item) => item.isUpcoming === true),
      };
    })
    .catch((error) => {
      console.error("Error loading pilgrimages submenu:", error);
      return {
        type: "pilgrimages" as const,
        pilgrimages: [],
        hasNewContent: false,
        hasUpcomingContent: false,
      };
    });

  const talksPromise = mediaApi.talks
    .getLatestReleases({
      limit: HEADER_SUBMENU_ITEMS_LIMIT,
    })
    .then(({ latestReleases }) => {
      const items = latestReleases ?? [];
      return {
        type: "talks" as const,
        latestTalks: items,
        hasNewContent: items.some((item) => item.isNew === true),
        hasUpcomingContent: items.some((item) => item.isUpcoming === true),
      };
    })
    .catch((error) => {
      console.error("Error loading talks submenu:", error);
      return {
        type: "talks" as const,
        latestTalks: [],
        hasNewContent: false,
        hasUpcomingContent: false,
      };
    });

  // Combine all promises into a single object
  return Promise.all([
    livesPromise,
    satsangsPromise,
    commentariesPromise,
    pilgrimagesPromise,
    talksPromise,
  ]).then(([lives, satsangs, commentaries, pilgrimages, talks]) => ({
    lives,
    satsangs,
    commentaries,
    pilgrimages,
    talks,
  }));
}

/**
 * Load content new status for header NEW badge.
 * This is deferred - provides lightweight data for all users.
 *
 * @param mediaApi - The user-scoped Media API instance
 */
export function loadContentNewStatus(
  mediaApi: BhaktiMargMediaApi,
): Promise<ContentNewStatusResponseDto | null> {
  return mediaApi.meta
    .getContentNewStatus()
    .catch((error) => {
      console.error("Error loading content new status:", error);
      return null;
    });
}

export async function getShopifySubscriptionProducts(context: AppLoadContext) {
  const { storefront } = context;

  // Query for each subscription product by handle directly
  // This ensures we get the right products regardless of how many products exist in the store
  const [liveResult, premiumResult, supporterResult] = await Promise.all([
    storefront.query(PRODUCT_ITEM_QUERY, {
      variables: { handle: SHOPIFY_SUBSCRIPTION_PRODUCTS_HANDLES.LIVE },
    }),
    storefront.query(PRODUCT_ITEM_QUERY, {
      variables: { handle: SHOPIFY_SUBSCRIPTION_PRODUCTS_HANDLES.PREMIUM },
    }),
    storefront.query(PRODUCT_ITEM_QUERY, {
      variables: { handle: SHOPIFY_SUBSCRIPTION_PRODUCTS_HANDLES.SUPPORTER },
    }),
  ]);

  const subscriptionProducts: ShopifySubscriptionProducts = {
    live: liveResult.product || null,
    premium: premiumResult.product || null,
    supporter: supporterResult.product || null,
  };

  return subscriptionProducts;
}

/**
 * Fetch videos for a content item by ID and type.
 *
 * @param context - The app context (unused, kept for backwards compatibility)
 * @param contentId - The content ID to fetch videos for
 * @param contentType - The type of content (commentary, pilgrimage, etc.)
 * @param mediaApi - The API instance to use (required - must be userScopedMediaApi)
 */
export async function fetchVideosByContentId(
  _context: AppLoadContext,
  contentId: string,
  contentType: ContentType,
  mediaApi: BhaktiMargMediaApi,
) {
  switch (contentType) {
    case "commentary":
      return mediaApi.commentaries.getVideos(contentId);
    case "pilgrimage":
      return mediaApi.pilgrimages.getVideos(contentId);
    default:
      return { videoGroups: null };
  }
}

export function getRequiredSubscriptionTiers(
  content: Content,
): string[] | null {
  if (!content?.subscriptionTiers || content.subscriptionTiers.length === 0) {
    return null; // No subscription required
  }

  // Filter out disabled tiers (e.g., supporter tier during soft launch)
  const filteredTiers = filterDisabledTiers(content.subscriptionTiers);
  return filteredTiers.length > 0 ? filteredTiers : null;
}

// Import from centralized location - don't duplicate!
import {
  hasHierarchicalAccess,
  hasAccessViaPPV,
  filterDisabledTiers,
} from "./content";

export function hasAccessToContent(
  user: import("~/lib/types").User | null,
  subscriptionTier: import("~/lib/types").SubscriptionTier,
  video: Video,
  content: Content,
) {
  if (!user) return false;

  if (!content && !video) return false;

  // Check PPV access using centralized function
  if (hasAccessViaPPV(user, content)) {
    return true;
  }

  // No subscription tiers means no subscription path to access this content.
  // Truly free content is handled upstream (isLiveFree check in the caller).
  if (!content.subscriptionTiers || content.subscriptionTiers.length === 0)
    return false;

  // NOTE: We do NOT filter disabled tiers here. DISABLED_CONTENT_TIERS controls
  // UI visibility (hiding Supporter from plan selection), not access. A Supporter
  // subscriber must still be able to access Supporter-tier content.

  // Use hierarchical checking: if user has a higher tier, they can access lower tier content
  // Example: if content requires "live" tier, users with "live", "core", "premium", or "supporter" all have access
  if (
    content.subscriptionTiers.some((requiredTier) =>
      hasHierarchicalAccess(subscriptionTier, requiredTier),
    )
  ) {
    return true;
  }

  return false;
}
