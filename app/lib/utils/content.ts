import {
  BADGE_STYLES,
  CONTENT_TYPE_ID_TO_TYPE,
  CUSTOMER_SUBSCRIPTION_TIER_TAGS,
  SUBSCRIPTION_TIERS,
  DISABLED_CONTENT_TIERS,
} from "../constants";
import {
  Badge,
  BadgeType,
  Content,
  ContentType,
  ContentTypeId,
  SubscriptionTier,
  UITag,
  User,
  VideoGroup,
} from "../types";
import type { PreviewVideoDto } from "../api/types";
import { isContentFreeInPrelaunch } from "./prelaunch";

/**
 * Filters out disabled tiers from a list of tier strings.
 * Used to temporarily remove tiers from content requirements.
 *
 * @param tiers - Array of tier strings (can be any case)
 * @returns Filtered array with disabled tiers removed
 */
export function filterDisabledTiers(tiers: string[]): string[] {
  if (!tiers || tiers.length === 0) return tiers;
  if (DISABLED_CONTENT_TIERS.length === 0) return tiers;

  const disabledLower = DISABLED_CONTENT_TIERS.map((t) => t.toLowerCase());
  return tiers.filter((tier) => !disabledLower.includes(tier.toLowerCase()));
}

export function getTagsFromContent(content: Content) {
  if (!content) {
    return [];
  }

  const tags: UITag[] = [];

  if (content.isLiveContent) {
    // Currently streaming
    tags.push({
      label: "• LIVE",
      bgColor: "bg-red",
      textColor: "text-white",
    });
  } else if (content.isUpcoming) {
    // Scheduled for the future
    tags.push({
      label: "Upcoming",
      bgColor: "bg-purple-dark",
      textColor: "text-white",
    });
  }

  content?.tags?.forEach((tag) => {
    tags.push({
      label: tag.name,
      bgColor: "bg-white/10 backdrop-blur-sm",
      textColor: "text-white",
    });
  });

  return tags;
}

export function getBadgesFromContent(content: Content): Badge[] {
  if (!content) {
    return [];
  }

  const tiers =
    content.subscriptionTiers?.map((tier) => tier.toLowerCase()) || [];

  // Only show badge if is premium or supporter
  if (tiers?.includes(SUBSCRIPTION_TIERS.LIVE)) {
    return [];
  }

  return (
    (tiers
      .map((tier) =>
        typeof tier === "string" ? BADGE_STYLES[tier as BadgeType] : null,
      )
      ?.filter((badge) => Boolean(badge)) as Badge[]) ?? []
  );
}

export function getSubscriptionTiersFromContent(
  content: Content,
  lowercase: boolean = false,
): string[] {
  if (!content) {
    return [];
  }

  const subscriptionTiers = content.subscriptionTiers?.map((tier) =>
    lowercase ? tier.toLowerCase() : tier,
  );

  // Filter out disabled tiers (e.g., supporter tier during soft launch)
  return filterDisabledTiers(subscriptionTiers ?? []);
}

export function getSubscriptionTierFromTags(
  tags?: string[] | null,
): SubscriptionTier {
  if (!tags) {
    return "unsubscribed";
  }

  if (tags.includes(CUSTOMER_SUBSCRIPTION_TIER_TAGS.LIVE)) {
    return "live";
  }
  if (tags.includes(CUSTOMER_SUBSCRIPTION_TIER_TAGS.PREMIUM)) {
    return "premium";
  }
  if (tags.includes(CUSTOMER_SUBSCRIPTION_TIER_TAGS.SUPPORTER)) {
    return "supporter";
  }

  return "unsubscribed";
}

export function isPremiumOrSupporter(content: Content) {
  const tiers =
    content.subscriptionTiers?.map((tier) => tier.toLowerCase()) || [];

  // Only show badge if is premium or supporter
  if (tiers?.includes(SUBSCRIPTION_TIERS.LIVE)) {
    return false;
  }

  if (tiers?.includes(SUBSCRIPTION_TIERS.PREMIUM)) {
    return true;
  }

  if (tiers?.includes(SUBSCRIPTION_TIERS.SUPPORTER)) {
    return true;
  }
}

export function isLive(content: Content) {
  const tiers =
    content.subscriptionTiers?.map((tier) => tier.toLowerCase()) || [];

  return tiers?.includes(SUBSCRIPTION_TIERS.LIVE);
}

/**
 * Checks if content qualifies as pay-per-view (PPV)
 * Content qualifies as PPV if it has ppvTag, shopifyProductId, and shopifyVariantId set
 */
export function isPPVContent(content: Content): boolean {
  return !!(
    content?.ppvTag &&
    content?.shopifyProductId &&
    content?.shopifyVariantId
  );
}

/**
 * Maps internal content types to router content types
 * Router accepts: talks, pilgrimages, commentaries
 */
function mapToRouterContentType(
  contentType: ContentType | null,
): string | null {
  if (!contentType) return null;

  switch (contentType) {
    case "talk":
      return "talks";
    case "pilgrimage":
      return "pilgrimages";
    case "commentary":
      return "commentaries";
    default:
      return null;
  }
}

/**
 * Builds a router URL for PPV content purchase
 * Uses the Bhakti Plus router for region-based store routing
 */
export function buildPPVRouterUrl(content: Content): string | null {
  if (!isPPVContent(content)) {
    return null;
  }

  // Determine content type from contentTypeId
  const contentType = content.contentTypeId
    ? CONTENT_TYPE_ID_TO_TYPE[content.contentTypeId]
    : null;

  // Map internal content types to router content types
  const routerContentType = mapToRouterContentType(contentType);

  if (!routerContentType || !content.contentId) {
    return null;
  }

  return `/router?intent=product&content_type=${routerContentType}&content_id=${content.contentId}`;
}

/**
 * @deprecated Use buildPPVRouterUrl instead for multi-store support
 * Builds a Shopify checkout URL for PPV content
 */
export function buildPPVCheckoutUrl(
  content: Content,
  checkoutDomain: string,
): string {
  if (!isPPVContent(content)) {
    throw new Error("Content does not qualify as PPV");
  }

  return `https://${checkoutDomain}/cart/${content.shopifyVariantId}:1`;
}

export function isMultiVideoContent(contentType: ContentType) {
  return (
    contentType === "commentary" ||
    contentType === "pilgrimage" ||
    contentType === "talk"
  );
}

export function getDefaultVideoIdFromMultiVideoContent(
  videos: VideoGroup[] | null,
) {
  if (!videos || videos.length === 0) return null;
  return videos?.[0]?.parts?.[0]?.video?.videoId?.toString() || null;
}

export function getSelectedPartFromVideoId(
  videos: VideoGroup[] | null,
  videoId: string | null,
) {
  if (!videos || videos.length === 0) return null;
  return videos?.find((group) =>
    group?.parts?.find((part) => part?.video?.videoId === Number(videoId)),
  )?.parts?.[0];
}

export function flattenVideoGroupsParts(videos: VideoGroup[] | null) {
  if (!videos || videos.length === 0) return null;
  return videos.flatMap((group) => group.parts).filter((part) => part !== null);
}

interface HasAccessOptions {
  isPrelaunch?: boolean;
}

export function hasAccessToContent(
  user: User | null,
  subscriptionTier: SubscriptionTier | undefined,
  content: Content,
  options?: HasAccessOptions,
) {
  if (content.isLiveFree) {
    return true;
  }

  if (!user || !content) {
    return false;
  }

  // Prelaunch bypass: logged-in users get free access to Lives content
  if (options?.isPrelaunch) {
    const contentType = content.contentTypeId
      ? CONTENT_TYPE_ID_TO_TYPE[content.contentTypeId]
      : undefined;
    if (contentType && isContentFreeInPrelaunch(contentType)) {
      return true;
    }
  }

  // Check PPV access using ppv array from /user/profile
  if (hasAccessViaPPV(user, content)) {
    return true;
  }

  if (subscriptionTier && hasAccessViaSubscription(subscriptionTier, content)) {
    return true;
  }

  return false;
}

/**
 * Defines the subscription tier hierarchy.
 * Higher tiers include access to all lower tier content.
 * Order: live -> premium -> supporter (lowest to highest)
 *
 * IMPORTANT: This is the single source of truth for tier ordering.
 * Import this from ~/lib/utils/content instead of defining locally.
 */
export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  unsubscribed: 0,
  live: 1,
  premium: 2,
  supporter: 3,
};

/**
 * Tiers that should be displayed in the UI for selection.
 * Excludes legacy tiers like 'core'.
 */
export const DISPLAY_TIERS: SubscriptionTier[] = [
  "live",
  "premium",
  "supporter",
];

/**
 * Determines if a plan change is an upgrade or downgrade.
 * @param currentTier - User's current subscription tier
 * @param newTier - The tier they want to change to
 * @returns 'upgrade' | 'downgrade' | 'same'
 */
export function getChangeType(
  currentTier: SubscriptionTier,
  newTier: SubscriptionTier,
): "upgrade" | "downgrade" | "same" {
  if (currentTier === newTier) return "same";
  if (!currentTier || currentTier === "unsubscribed") return "upgrade";

  const currentLevel = TIER_HIERARCHY[currentTier] ?? 0;
  const newLevel = TIER_HIERARCHY[newTier] ?? 0;

  return newLevel > currentLevel ? "upgrade" : "downgrade";
}

/**
 * Checks if a user's subscription tier grants access to content requiring a specific tier.
 * Uses hierarchical checking: higher tiers have access to lower tier content.
 *
 * @param userTier - The user's current subscription tier
 * @param requiredTier - The tier required by the content
 * @returns true if user's tier is equal to or higher than required tier
 */
export function hasHierarchicalAccess(
  userTier: SubscriptionTier,
  requiredTier: string,
): boolean {
  const userLevel = TIER_HIERARCHY[userTier] ?? 0;
  const requiredLevel =
    TIER_HIERARCHY[requiredTier.toLowerCase() as SubscriptionTier] ?? 0;
  return userLevel >= requiredLevel;
}

/**
 * Checks if user has PPV access to content.
 * user.ppv comes from Media API /user/profile - array of ppvTags without prefix.
 * content.ppvTag is the content's PayPerViewTag - also without prefix.
 * Direct comparison determines access.
 */
export function hasAccessViaPPV(user: User | null, content: Content) {
  return content?.ppvTag && user?.ppv?.some((tag) => tag === content.ppvTag);
}

function hasAccessViaSubscription(
  subscriptionTier: SubscriptionTier,
  content: Content,
) {
  // No subscription tiers means no subscription path to access this content.
  // Truly free content is handled upstream (isLiveFree check in hasAccessToContent).
  if (!content.subscriptionTiers || content.subscriptionTiers.length === 0) {
    return false;
  }

  // NOTE: We do NOT filter disabled tiers here. DISABLED_CONTENT_TIERS controls
  // UI visibility (hiding Supporter from plan selection), not access. A Supporter
  // subscriber must still be able to access Supporter-tier content.
  // filterDisabledTiers is used in UI-facing functions like getSubscriptionTiersFromContent.

  // Use hierarchical checking: if user has a higher tier, they can access lower tier content
  // Example: if content requires "live" tier, users with "live", "core", "premium", or "supporter" all have access
  return content.subscriptionTiers.some((requiredTier) =>
    hasHierarchicalAccess(subscriptionTier, requiredTier),
  );
}

/**
 * Checks if user has any subscription plan (not unsubscribed)
 */
export function userHasAnyPlan(subscriptionTier: SubscriptionTier): boolean {
  return subscriptionTier !== "unsubscribed";
}

/**
 * @deprecated No longer used - content must be properly tagged in the backend.
 * Kept for reference but will be removed in a future version.
 *
 * Gets the baseline tier requirement for a content type.
 * This was used when content had no explicit subscription tiers defined.
 *
 * @param contentType - The type of content
 * @returns The minimum subscription tier required, or null if no baseline tier
 */
export function getBaselineTierForContentType(
  contentType: ContentType,
): string | null {
  switch (contentType) {
    case "live":
      return "live";
    case "satsang":
    case "talk":
      return "premium";
    case "pilgrimage":
    case "commentary":
      return null;
    default:
      return null;
  }
}

/**
 * Content shape required for isNewContent check
 */
interface ContentForNewCheck {
  isNew?: boolean;
}

/**
 * Checks if content should show a "NEW" badge.
 * Uses the `isNew` field computed by the API.
 *
 * @param content - Content object with isNew field from API
 * @returns true if content should display "NEW" badge
 */
export function isNewContent(
  content: ContentForNewCheck | null | undefined,
): boolean {
  if (!content) {
    return false;
  }

  return content.isNew === true;
}

/**
 * Data needed for BackgroundVideoWithOverlays component
 */
export interface PreviewVideoData {
  videoId: number | undefined;
  startTimeSeconds: number | undefined;
  previewDurationSeconds: number | undefined;
}

/**
 * Content shape required for getPreviewVideoData
 */
interface ContentWithPreviewVideo {
  previewVideo?: PreviewVideoDto | null;
  video?: {
    videoId?: number;
    previewStartOffset?: number;
    durationSeconds?: number;
  } | null;
}

/**
 * Extracts preview video data from content for use with BackgroundVideoWithOverlays.
 *
 * Priority:
 * 1. If content.previewVideo is set, use it directly
 * 2. Otherwise, fall back to content.video (for single-video content like satsangs/talks/lives)
 *
 * For series content (pilgrimages/commentaries), previewVideo should always be set by the API.
 *
 * @param content - Content object with optional previewVideo and video fields
 * @returns PreviewVideoData for BackgroundVideoWithOverlays component
 */
export function getPreviewVideoData(
  content: ContentWithPreviewVideo | null | undefined,
): PreviewVideoData {
  if (!content) {
    return {
      videoId: undefined,
      startTimeSeconds: undefined,
      previewDurationSeconds: undefined,
    };
  }

  // Priority 1: Use previewVideo if available
  if (content.previewVideo) {
    const {
      videoId,
      previewStartOffset,
      durationSeconds,
      previewDurationSeconds,
    } = content.previewVideo;
    return {
      videoId,
      startTimeSeconds:
        previewStartOffset ??
        (durationSeconds ? Math.floor(durationSeconds / 2) : undefined),
      previewDurationSeconds,
    };
  }

  // Priority 2: Fall back to content.video (for single-video content)
  if (content.video) {
    const { videoId, previewStartOffset, durationSeconds } = content.video;
    return {
      videoId,
      startTimeSeconds:
        previewStartOffset ??
        (durationSeconds ? Math.floor(durationSeconds / 2) : undefined),
      previewDurationSeconds: undefined, // Use default
    };
  }

  return {
    videoId: undefined,
    startTimeSeconds: undefined,
    previewDurationSeconds: undefined,
  };
}

/**
 * Extracts PPV tags from a list of Shopify customer tags.
 * PPV tags have the format "ppv_<content-id>" (e.g., "ppv_holi-2026").
 * Returns array of content IDs without the "ppv_" prefix.
 *
 * @param tags - Array of Shopify customer tags
 * @returns Array of PPV content IDs (without prefix)
 */
export function extractPpvTags(tags: string[]): string[] {
  const PPV_PREFIX = "ppv_";
  return tags
    .filter((tag) => tag.startsWith(PPV_PREFIX))
    .map((tag) => tag.slice(PPV_PREFIX.length));
}
