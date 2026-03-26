/**
 * API types
 * ------------------------------------------------------------
 * Types derived from swagger API types.
 */

import { ContentTypeId } from "../types";

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  apiVersion: string;
  locale: string;
  countryCode?: string;
  regionId?: number; // 1=EU, 2=ROW - used for multi-store Shopify product lookup
  featuredLiveOverrideId?: string; // Override featured live with specific content ID (for staging)
  /**
   * When true, includes unpublished content in API responses.
   * Internal use only - for staging environment previews.
   * Not intended for production use.
   */
  includeUnpublishedContent?: boolean;
}

export interface UserAuthParams {
  email?: string | null; // Primary identifier for API calls
  userId?: number | null; // Media platform user ID (from /user/profile)
  subscriptionTier?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  desc?: boolean;
}

export interface FilterParams {
  categoryId?: number;
  subscriptionTier?: string | string[];
  /** Topic ID(s) for filtering satsangs by subcategory. Use array for "Other" content (multiple minor topics). */
  topicId?: number | number[];
}

export interface BaseQueryParams extends PaginationParams, FilterParams {
  api_version: string;
  locale: string;
  country_code?: string;
  region_id?: number; // 1=EU, 2=ROW
  email?: string; // Primary identifier for API calls
  subscription_tier?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

export interface LocalesSupportedResponseDto {
  locales: {
    localeCode: string;
    name: string;
    codeShopify: string;
  }[];
}

export interface LocationDto {
  id: number;
  name: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
}

export interface SearchResultDto {
  contentId: string;
  contentType: string;
  videoId?: number;
  title: string;
  thumbnailUrl: string;
  thumbnailUrlVertical: string;
  subscriptionTier: string;
  highlight: string;
  startOffsetSeconds?: number;
}

export interface SearchTrendingItemDto {
  contentId: number;
  title: string | null;
  videoId: number;
  thumbnailUrl: string | null;
}

/**
 * ContentLess - A lightweight content object returned by watch history API.
 * Unlike ContentDto, this does NOT contain a nested `video` property.
 * The video is at the same level as content in WatchHistoryEntryDto.
 */
export interface ContentLessDto {
  id: number;
  slug?: string;
  title: string;
  subtitle: string;
  contentTypeId: ContentTypeId;
  liveStatus?: string | null;
  location?: LocationDto | null;
  startDate?: string | null;
  endDate?: string | null;
  startDateLive?: string | null;
  endDateLive?: string | null;
  publishedAt?: string | null;
  description?: string;
  descriptionHtml?: string | null;
  subscriptionTiers: string[];
  genre?: string;
  ppvTag?: string | null;
  /**
   * Indicates whether this content should display a "NEW" badge.
   * Computed by the API based on IsOngoingSeries and PublishedAt date.
   */
  isNew?: boolean;
  /**
   * Whether this content is published. Currently always true for public API responses.
   * Will be false for unpublished content when using `_includeUnpublishedContent` parameter.
   */
  isPublished?: boolean;
}

/**
 * Watch history entry from /user/watch-history endpoint.
 *
 * Important: The `video` and `content` objects are SIBLINGS, not nested.
 * `content` is ContentLessDto which does NOT have a video property inside it.
 * Use `videoId` at the root level or `video.videoId` for the video ID.
 */
export interface WatchHistoryEntryDto {
  videoId: number;
  contentId: number;
  contentTypeId: ContentTypeId;
  subscriptionTiers?: string[] | null;
  status: string;
  progressSeconds: number;
  totalSeconds: number;
  thumbnailUrl?: string;
  thumbnailUrlVariants?: string | null;
  title?: string;
  subtitle?: string;
  video?: VideoLessDto;
  content?: ContentLessDto;
}

export interface SearchHistoryItemDto {
  query: string;
}

export interface SatsangFeaturedResponseDto {
  featured: SatsangDto;
}

export interface SatsangResponseDto {
  satsang: SatsangDto;
}

export interface SatsangsListResponseDto {
  satsangs: SatsangDto[] | null;
  total: number;
  offset: number;
  limit: number;
}

export interface LatestReleasesContentSeriesResponseDto {
  latestReleases: ContentDto[];
}

export interface LatestReleasesContentSingleResponseDto {
  latestReleases: ContentDto[];
}

export interface ContentDto {
  // API returns 'contentId' for all content endpoints
  contentId: number;
  contentTypeId: ContentTypeId;
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  thumbnailUrlVariants?: string | null;
  thumbnailUrlVertical: string;
  thumbnailUrlVerticalVariants?: string | null;
  bannerImageUrl: string;
  shopifyProductId: string;
  shopifyVariantId: string;
  shopifyPrice?: number | null;
  shopifyCompareAtPrice?: number | null;
  shopifyUnitCost?: number | null;
  subscriptionTiers: string[] | null;
  location: LocationDto;
  genre: string | null;
  description: string;
  descriptionHtml?: string | null;
  summary200?: string; // Short summary, available on some content types
  isLiveContent: boolean;
  isLiveFree?: boolean;
  isLiveNow?: boolean;
  isPreview?: boolean;
  startDateLive?: string | null;
  endDateLive?: string | null;
  liveStatus?: string | null;
  /** Whether this content is an ongoing series (e.g., weekly live series) */
  isOngoingSeries?: boolean;
  ppvTag: string | null;
  shopifyCurrencyCode?: string | null;
  tags: {
    name: string;
  }[];
  isUpcoming?: boolean;
  videoCount: number;
  startDate: string;
  endDate: string;
  publishedAt?: string | null;
  video: VideoDto;
  /**
   * Optional preview video for hero backgrounds. When set, use this instead of
   * deriving from content.video or fetching series videos.
   */
  previewVideo?: PreviewVideoDto | null;
  categories?: CategoryDto[] | null;
  totalVideoDurationSeconds?: number;
  slug?: string;
  // Satsang of the day fields (isSatsangOfDay defaults to false from API)
  isSatsangOfDay: boolean;
  dayOfSatsangOfDay?: number | null;
  /**
   * Indicates whether this content should display a "NEW" badge.
   * Computed by the API based on IsOngoingSeries and PublishedAt date.
   */
  isNew?: boolean;
  /**
   * Whether this content is published. Currently always true for public API responses.
   * Will be false for unpublished content when using `_includeUnpublishedContent` parameter.
   */
  isPublished?: boolean;
}

export interface VideoDto {
  videoId: number;
  title: string;
  description: string;
  descriptionHtml?: string | null;
  durationSeconds: number;
  summary500: string;
  chapters: VideoChapterDto[];
  previewStartOffset?: number;
}

/**
 * Preview video data for hero background video.
 * When set on content, this video is used for hero backgrounds instead of
 * deriving from content.video or fetching series videos.
 */
export interface PreviewVideoDto {
  /** Video ID to use for the preview */
  videoId: number;
  /** Where to start playback (seconds). Falls back to durationSeconds/2 if not set. */
  previewStartOffset?: number;
  /** Total video duration (seconds). Used for fallback start time calculation. */
  durationSeconds?: number;
  /** How long to show the preview before fading back to image (seconds). Defaults to 30. */
  previewDurationSeconds?: number;
}

export interface VideoStandaloneDto {
  contentId: number;
  video: VideoDto;
  content: ContentDto;
}

export interface VideoChapterDto {
  id: number;
  title: string;
  startOffset: number;
  endOffset?: number;
  thumbnailUrl: string;
}

export interface CategoryDto {
  id: number;
  name: string | null;
  quote: string | null;
  quote_author: string | null;
  description: string | null;
  slug: string;
  thumbnailUrl: string;
  thumbnailUrlVariants?: string | null;
  videoCount: number | null;
}

export type LiveDto = ContentDto & {
  categories: CategoryDto[];
  video: VideoDto;
  isUpcoming: boolean;
  // Live-specific fields from /lives/featured endpoint
  isLiveNow?: boolean;
  isPreview?: boolean;
  isLiveFree?: boolean;
  startDateLive?: string | null;
  endDateLive?: string | null;
  liveStatus?: string | null;
  publishedAt?: string;
  summary500?: string | null;
};

export type SatsangDto = ContentDto & {
  categories: CategoryDto[];
  video: VideoDto;
};

export interface LivesListResponseDto {
  lives: LiveDto[] | null;
}

export interface CategoriesResponseDto {
  categories: CategoryDto[] | null;
}

export interface SubCategoryDto {
  id: number | null;
  name: string | null;
  count: number;
}

export interface SubCategoriesResponseDto {
  subcategories: SubCategoryDto[] | null;
  /** Minor topic IDs for fetching "Other" content (topics with fewer items grouped together) */
  otherTopicIds?: number[] | null;
}

export interface SubCategoryGroupDto {
  id: number | null;
  name: string | null;
  count: number;
  contents: SatsangDto[] | null;
}

export interface SubCategoryGroupsResponseDto {
  subcategories: SubCategoryGroupDto[] | null;
}

export interface SearchQueryResponseDto {
  searchId: string | null;
  results: SearchResultDto[] | null;
}

export interface WatchHistoryResponseDto {
  watchHistory: WatchHistoryEntryDto[] | null;
}

// ============================================================================
// Video Progress API Types (condensed /user/video-progress endpoint)
// ============================================================================

/**
 * A single video progress entry from the /user/video-progress endpoint.
 * Condensed format compared to WatchHistoryEntryDto — no video/content metadata.
 */
export interface VideoProgressEntryDto {
  videoId: number;
  contentId: number;
  progressSeconds: number;
  totalSeconds: number;
  isCompleted: boolean;
  updatedAt: string;
}

/**
 * Response from GET /user/video-progress.
 */
export interface VideoProgressResponseDto {
  progress: VideoProgressEntryDto[];
  total: number;
}

export interface SearchHistoryResponseDto {
  history: SearchHistoryItemDto[] | null;
}

export interface SearchTrendingResponseDto {
  trending: SearchTrendingItemDto[] | null;
}

export interface WatchHistoryUpsertRequest {
  videoId: number;
  progressSeconds: number;
  status: string | null;
}

export interface MetaDto {
  id: number;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export type CommentaryDto = ContentDto & {
  totalVideoDurationSeconds: number;
};

export type PilgrimageDto = ContentDto & {
  totalVideoDurationSeconds: number;
};

export type TalkDto = ContentDto & {
  categories?: CategoryDto[];
  video: VideoDto;
};

export interface TalkFeaturedResponseDto {
  featured: TalkDto;
}

export interface TalksListResponseDto {
  talks: TalkDto[] | null;
  total: number;
  offset: number;
  limit: number;
}

export interface TalkSubCategoryGroupDto {
  id: number | null;
  name: string | null;
  count: number;
  contents: TalkDto[] | null;
}

export interface TalkSubCategoryGroupsResponseDto {
  subcategories: TalkSubCategoryGroupDto[] | null;
}

export interface CommentariesLatestReleasesResponseDto {
  latestReleases: CommentaryDto[];
}

export interface LivesLatestReleasesResponseDto {
  latestReleases: LiveDto[];
}

export interface PilgrimagesLatestReleasesResponseDto {
  latestReleases: PilgrimageDto[];
}

export interface SatsangsLatestReleasesResponseDto {
  latestReleases: SatsangDto[];
}

export interface DailySatsangDto {
  date: string;
  satsang: SatsangDto;
}

export interface WeekSatsangsResponseDto {
  weekStartDate: string;
  weekEndDate: string;
  dailySatsangs: DailySatsangDto[];
  total: number;
}

export interface DailySatsangResponseDto {
  date: string;
  satsang: SatsangDto | null;
}

export interface TalksLatestReleasesResponseDto {
  latestReleases: TalkDto[];
}

// Slug-aware response types
export interface SlugAwareResponse<T> {
  data: T;
  canonicalSlug: string;
}

export type CommentarySlugAwareResponse = SlugAwareResponse<CommentaryDto>;
export type PilgrimageSlugAwareResponse = SlugAwareResponse<PilgrimageDto>;
export type LiveSlugAwareResponse = SlugAwareResponse<LiveDto>;
export type SatsangSlugAwareResponse = SlugAwareResponse<SatsangDto>;
export type TalkSlugAwareResponse = SlugAwareResponse<TalkDto>;

// New types for video and series-summary endpoints
export interface VideoLessDto {
  videoId: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  descriptionHtml?: string | null;
  summary500: string | null;
  summary200: string | null;
  durationSeconds: number;
  thumbnailUrl: string | null;
  thumbnailUrlVariants?: string | null;
  thumbnailUrlVertical: string | null;
  thumbnailUrlVerticalVariants?: string | null;
  chapters: VideoChapterDto[] | null;
  previewStartOffset?: number;
  /**
   * Whether this content is published. Currently always true for public API responses.
   * Will be false for unpublished content when using `_includeUnpublishedContent` parameter.
   */
  isPublished?: boolean;
}

export interface VideoPartDto {
  day: number | null;
  part: number | null;
  partName: string | null;
  video: VideoLessDto;
}

export interface VideoGroupDto {
  id: number | null;
  order: number | null;
  name: string | null;
  description?: string | null; // Optional description for fallback
  descriptionHtml?: string | null;
  parts: VideoPartDto[] | null;
}

export interface SerieVideosResponseDto {
  videoGroups: VideoGroupDto[] | null;
}

export interface SeriesSummaryResponseDto {
  groupName: string | null;
  groupNamePlural: string | null;
  groupCount: number;
  videoCount: number;
  totalVideoDurationSeconds: number;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
}

// Player video types based on API spec
export interface NextVideoDto {
  autoSecond: number;
  title: string | null;
  url: string | null;
  thumbnailUrl: string | null;
}

export interface ChapterDto {
  id: number;
  title: string | null;
  startOffset: number;
  endOffset: number;
  thumbnailUrl: string | null;
}

export interface PlayerVideoDto {
  id: number;
  mamId: number | null;
  title: string | null;
  bannerUrl: string | null;
  thumbnail: string | null;
  contentTypeId: number;
  category: string | null;
  country: string | null;
  hlsUrl: string | null;
  vodId: number | null;
  vodStartOffset: number | null;
  vodEndOffset: number | null;
  subtitlesVttLinks: string | null;
  nextVideo: NextVideoDto | null;
  chapters: ChapterDto[] | null;
}

export interface SubscriptionInfo {
  // Existing fields
  subscriptionTier: string | null;
  subscriptionBillingPeriod?: string | null; // "monthly" or "yearly", null if unsubscribed
  ppv: any[] | null;
  videosInProgressCount?: number;

  // New fields from 2025-12-16 backend update
  userId?: number | null; // MediaPlatUser ID - use for subsequent API calls
  email?: string | null; // User's email address
  preferredLanguage?: string | null; // User's preferred UI language
  preferredAudioLanguage?: string | null; // User's preferred audio language
  preferredSubtitleLanguage?: string | null; // User's preferred subtitle language
  isPayingCustomer?: boolean; // True if user has placed any orders
  shopifyCustomerId?: number | null; // Shopify customer ID
  firstMembershipDateStart?: string | null; // When user's first membership started
  lastMembershipDateExpired?: string | null; // When user's last membership expired
  lastLoginDate?: string | null; // Last login date

  // Subscription contract fields from 2025-12-20 backend update
  shopifySubscriptionContractId?: number | null; // Shopify subscription contract ID
  appstleMembershipId?: string | null; // Appstle membership/subscription ID

  // Region fields from 2025-12-18 backend update
  stampedRegionId?: number | null; // Region ID (1=EU, 2=ROW) derived from stampedCountryCode or userSelectCountryCode
  stampedRegionName?: string | null; // Region name (e.g., "Europe", "Rest of World")
  stampedShopId?: number | null; // Shopify shop ID for this region
  stampedCountryCode?: string | null; // Country code from Stamped.io integration
  stampedCountryCodeSource?: string | null; // Source of the Stamped country code
  stampedCountryCodeUpdatedAt?: string | null; // When Stamped country code was last updated
  userSelectCountryCode?: string | null; // Country code manually selected by user
  userSelectCountryCodeUpdatedAt?: string | null; // When user-selected country code was last updated
}

// Membership types from /memberships endpoint
export interface MembershipDto {
  id: string;
  title: string;
  description: string | null;
  shopifyProductId: number;
  shopifyVariantIdMonthly: number;
  shopifyVariantIdYearly: number;
  shopifySellingPlanIdMonthly: number;
  shopifySellingPlanIdYearly: number;
  shopifyCheckoutLinkMonthly: string;
  shopifyCheckoutLinkYearly: string;
  priceMonthly: number;
  compareAtPriceMonthly: number | null;
  priceYearly: number;
  compareAtPriceYearly: number | null;
  currencyCode: string;
}

export interface MembershipListResponseDto {
  memberships: MembershipDto[];
  currencyCode: string;
  regionId: number; // Changed from countryCode - 1=EU, 2=ROW
}

// Purchase types from /user/purchases endpoint
export interface PurchaseDto {
  id: number;
  contentId: number;
  videoId: number;
  title: string;
  thumbnailUrl?: string | null;
  thumbnailUrlVertical?: string | null;
  purchaseDate?: string | null;
  availableUntil?: string | null;
  isExpired: boolean;
  shopifyProductId: number;
  shopifyVariantId: number;
  shopifyPrice?: number | null;
  shopifyCompareAtPrice?: number | null;
  shopifyUnitCost?: number | null;
  ppvTag: string;
}

export interface PurchasesResponseDto {
  purchases: PurchaseDto[];
}

/**
 * User preferences DTO
 */
export interface UserPreferencesDto {
  preferredLanguage?: string;
  // Add other preferences here as needed
}

/**
 * Response from GET /user/preferences
 */
export interface UserPreferencesResponseDto {
  preferences: UserPreferencesDto;
}

/**
 * Response from PUT /user/preferences
 */
export interface UserPreferencesUpdateResponseDto {
  success: boolean;
  preferences?: UserPreferencesDto;
}

// ============================================================================
// Content Languages API Types (for Content Availability page)
// ============================================================================

/**
 * Response DTO for GET /meta/content-languages endpoint.
 * Returns aggregated language availability data for the Content Availability page.
 */
export interface ContentLanguagesResponseDto {
  summary: ContentLanguagesSummaryDto;
  talks: ContentLanguageItemDto[];
  pilgrimages: ContentLanguageItemDto[];
  commentaries: ContentLanguageItemDto[];
  premiumIncluded: PremiumIncludedContentDto;
}

/**
 * Summary statistics for all content types
 */
export interface ContentLanguagesSummaryDto {
  satsangs: ContentTypeSummaryDto;
  talks: ContentTypeSummaryDto;
  pilgrimages: ContentTypeSummaryDto;
  commentaries: ContentTypeSummaryDto;
}

/**
 * Summary for a single content type
 */
export interface ContentTypeSummaryDto {
  totalCount: number;
  totalVideoCount: number;
  /** Total duration of all videos in seconds */
  totalDurationSeconds: number;
  audioLanguages: LanguageAvailabilityDto[];
  subtitleLanguages: LanguageAvailabilityDto[];
}

/**
 * Language availability statistics
 */
export interface LanguageAvailabilityDto {
  languageCode: string;
  languageName: string;
  /** Total number of content items with this language available */
  count: number;
  /** Number of content items where this language is auto-generated (AI voice/subtitles) */
  autoGeneratedCount: number;
  // Note: Human-reviewed count = count - autoGeneratedCount
}

/**
 * Per-item language details
 */
export interface ContentLanguageItemDto {
  contentId: number;
  title: string;
  slug: string | null;
  videoCount: number;
  /** Total duration of all videos in seconds */
  durationSeconds: number;
  thumbnailUrl: string;
  subscriptionTiers: string[] | null;
  isPremiumIncluded: boolean;
  shopifyPrice: number | null;
  audioLanguages: LanguageInfoDto[];
  subtitleLanguages: LanguageInfoDto[];
}

/**
 * Language information for audio/subtitle tracks
 */
export interface LanguageInfoDto {
  languageCode: string;
  languageName: string;
  /** Number of videos in this content that have this language available. For single-video content this will be 1 if available, 0 if not. */
  count: number;
  /** Number of videos where this language is auto-generated (AI voice/subtitles). Human-created count = count - autoGeneratedCount */
  autoGeneratedCount: number;
}

/**
 * Premium-included content
 */
export interface PremiumIncludedContentDto {
  pilgrimages: ContentLanguageItemDto[];
  commentaries: ContentLanguageItemDto[];
}

// ============================================================================
// Watch Next API Types
// ============================================================================

/**
 * Video recommendation from watch-next endpoint
 */
export interface WatchNextVideoDto {
  videoId: number;
  contentId: number;
  contentTypeId: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  descriptionHtml?: string | null;
  thumbnailUrl: string | null;
  thumbnailUrlVariants?: string | null;
  thumbnailUrlVertical: string | null;
  thumbnailUrlVerticalVariants?: string | null;
  durationSeconds: number;
  contentSlug: string | null;
  subscriptionTiers: string[] | null;
  groupName: string | null;
  partName: string | null;
  liveStatus: string | null;
  isAccessible: boolean;
  /** Genre of the content (e.g., 'Exclusive', 'Darshan', 'Event', 'Q&A') */
  genre?: string | null;
  /**
   * Whether this content is published. Currently always true for public API responses.
   * Will be false for unpublished content when using `_includeUnpublishedContent` parameter.
   */
  isPublished?: boolean;
}

/**
 * Response from GET /video/{videoId}/watch-next
 */
export interface WatchNextResponseDto {
  sourceVideoId: number;
  algorithm: string | null;
  videos: WatchNextVideoDto[];
  resolvedUserId: number | null;
  resolvedUserEmail: string | null;
}

// ============================================================================
// Thumbnail Variants Types (for srcset optimization)
// ============================================================================

/**
 * A single thumbnail variant at a specific width
 */
export interface ThumbnailVariant {
  width: number;
  url: string;
}

/**
 * Thumbnail variants object returned by API for optimized image loading.
 * Contains original URL and pre-generated WebP variants at multiple widths.
 */
export interface ThumbnailVariants {
  originalUrl: string;
  variants: ThumbnailVariant[];
}

// ============================================================================
// Series Featured Video API Types (from /next-video endpoint)
// ============================================================================

/**
 * Marker indicating why a video was selected as the series featured video.
 * - "watch": User hasn't started the series yet, showing the first video
 * - "continue": User is in the middle of watching this video (has progress)
 * - "watch-next": User finished the previous video, showing the next one
 * - "watch-again": User has finished all videos in the series
 */
export type SeriesFeaturedVideoMarker =
  | "watch"
  | "continue"
  | "watch-next"
  | "watch-again";

/**
 * Response from GET /commentaries/{id}/next-video and GET /pilgrimages/{id}/next-video.
 *
 * Named "SeriesFeaturedVideo" to distinguish from existing "next video" concepts:
 * - NextVideoDto: Player-level autoplay (in-player next)
 * - WatchNextResponseDto: Recommendation engine ("watch more" section)
 * - SeriesFeaturedVideoResponseDto: The video to feature in a series hero
 */
export interface SeriesFeaturedVideoResponseDto {
  /** Video details (VideoLess format) for the featured video */
  video: VideoLessDto;
  /** Why this video was selected */
  marker: SeriesFeaturedVideoMarker;
  /** Playback progress in seconds (only populated when marker is "continue") */
  progressSeconds: number | null;
  /** Zero-based index of the video within the ordered series */
  videoIndex: number;
  /** Total number of videos in the series */
  totalVideos: number;
}

// ============================================================================
// Content New Status API Types (for header NEW badge)
// ============================================================================

/**
 * Content type IDs used in the API
 */
export const CONTENT_TYPE_IDS = {
  SATSANG: 1,
  COMMENTARY: 2,
  PILGRIMAGE: 3,
  TALK: 6,
} as const;

/**
 * Individual content type status from GET /meta/content/new
 */
export interface ContentTypeNewStatusDto {
  contentTypeId: number;
  contentTypeName: string;
  latestPublishedAt: string | null;
  hasNewContent: boolean;
  hasUpcomingContent: boolean;
}

/**
 * Response from GET /meta/content/new endpoint.
 * Returns new/upcoming status for each content type.
 */
export interface ContentNewStatusResponseDto {
  contentTypes: ContentTypeNewStatusDto[];
}
