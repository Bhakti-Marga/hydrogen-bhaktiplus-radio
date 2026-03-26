import { BhaktiMargMediaApi } from './index';
import type { SubscriptionInfo } from './types';

export interface CreateUserScopedApiOptions {
  /**
   * Override to include unpublished content.
   * When true, adds _includeUnpublishedContent=true to all API requests.
   * Used for admin preview of draft content.
   */
  includeUnpublishedContent?: boolean;
}

/**
 * Creates a user-scoped API instance with the correct regionId.
 * Use this when you have user profile data and need region-specific API calls.
 *
 * @param env - Environment variables containing API configuration
 * @param userProfile - User profile from /user/profile endpoint
 * @param locale - Media API locale string (e.g., 'de-de', 'en-us')
 * @param countryCode - Country code from URL or geoIP
 * @param contextRegionId - GeoIP-based regionId from server context (fallback for anonymous users)
 * @param options - Additional options for API configuration
 * @returns A new BhaktiMargMediaApi instance configured with the user's regionId
 */
export function createUserScopedApi(
  env: Env,
  userProfile: SubscriptionInfo | null,
  locale: string,
  countryCode: string,
  contextRegionId: number = 1,
  options?: CreateUserScopedApiOptions,
): BhaktiMargMediaApi {
  // Use user's stampedRegionId if available, otherwise use context regionId (GeoIP-based)
  const regionId = userProfile?.stampedRegionId ?? contextRegionId;

  // Include unpublished content if:
  // 1. Explicitly passed via options (from cookie/sessionStorage sync), OR
  // 2. INCLUDE_UNPUBLISHED_CONTENT env var is set to "true" (for staging environment)
  const includeUnpublishedContent =
    options?.includeUnpublishedContent === true ||
    env.INCLUDE_UNPUBLISHED_CONTENT === "true";

  return new BhaktiMargMediaApi({
    baseUrl: env.MEDIA_API_URL,
    apiKey: env.MEDIA_API_KEY,
    apiVersion: env.MEDIA_API_VERSION,
    locale,
    countryCode: countryCode.toUpperCase(),
    regionId,
    featuredLiveOverrideId: env.FEATURED_LIVE_OVERRIDE_ID,
    includeUnpublishedContent,
  });
}
