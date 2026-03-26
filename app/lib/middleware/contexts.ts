/**
 * Middleware Context Keys
 *
 * These context keys are used by the auth middleware to pass data to child loaders.
 * Child loaders can access these values via context.get(contextKey).
 *
 * This pattern eliminates duplicate getAuthenticatedUser() calls across routes.
 * Instead of each route fetching auth data independently, the middleware runs once
 * and sets these context values for all child loaders to access.
 *
 * @example
 * ```typescript
 * // In a child route loader:
 * import { userScopedMediaApiContext, userProfileContext } from '~/lib/middleware';
 *
 * export async function loader({ context }: Route.LoaderArgs) {
 *   const userProfile = context.get(userProfileContext);
 *   const mediaApi = context.get(userScopedMediaApiContext);
 *
 *   // Use immediately - no async fetch needed
 *   const data = await mediaApi.satsangs.getFeatured();
 *   return { data };
 * }
 * ```
 */

import { createContext } from 'react-router';
import type { SubscriptionInfo } from '~/lib/api/types';
import type { BhaktiMargMediaApi } from '~/lib/api';
import type { CountryCode, LanguageCode } from '~/lib/locale';
import type { User, SubscriptionTier } from '~/lib/types';

/**
 * Middleware-provided context for user profile data.
 * This is set once in authMiddleware and available to all child loaders.
 */
export const userProfileContext = createContext<SubscriptionInfo | null>();

/**
 * Middleware-provided context for user-scoped Media API.
 * Uses the correct regionId based on user's stampedRegionId or GeoIP fallback.
 */
export const userScopedMediaApiContext = createContext<BhaktiMargMediaApi>();

/**
 * Middleware-provided context for authenticated user data.
 */
export const userContext = createContext<User | null>();

/**
 * Middleware-provided context for subscription tier.
 */
export const subscriptionTierContext = createContext<SubscriptionTier>();

/**
 * Middleware-provided context for videos in progress count.
 */
export const videosInProgressCountContext = createContext<number>();

/**
 * Determined locale from the middleware cascade.
 *
 * The cascade priority is:
 * 1. URL explicit locale (highest priority)
 * 2. User-selected country (from CountrySelector, persisted in backend)
 * 3. GeoIP detection
 * 4. Default fallback
 *
 * For language specifically:
 * 1. URL explicit language
 * 2. Server preferences (userProfile.preferredLanguage)
 * 3. Cookie preference
 * 4. Country's default language
 */
export interface DeterminedLocaleContext {
  countryCode: CountryCode;
  language: LanguageCode;
  source: 'url' | 'user_selection' | 'user_preferences' | 'cookie' | 'geoip' | 'default';
}

/**
 * Middleware-provided context for determined locale.
 */
export const localeContext = createContext<DeterminedLocaleContext>();
