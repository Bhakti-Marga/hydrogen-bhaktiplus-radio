/**
 * Middleware exports
 *
 * This module provides middleware for React Router that runs once per request
 * and sets context values for child loaders to access.
 *
 * Usage in root.tsx:
 * ```typescript
 * import { authMiddleware } from '~/lib/middleware';
 *
 * export const middleware: Route.MiddlewareFunction[] = [authMiddleware];
 * ```
 *
 * Usage in child route loaders:
 * ```typescript
 * import { userScopedMediaApiContext, userProfileContext } from '~/lib/middleware';
 *
 * export async function loader({ context }: Route.LoaderArgs) {
 *   const userProfile = context.get(userProfileContext);
 *   const mediaApi = context.get(userScopedMediaApiContext);
 *
 *   const data = await mediaApi.satsangs.getFeatured();
 *   return { data };
 * }
 * ```
 */

export { authMiddleware, INCLUDE_UNPUBLISHED_COOKIE } from './auth.middleware';
export {
  userProfileContext,
  userScopedMediaApiContext,
  userContext,
  subscriptionTierContext,
  videosInProgressCountContext,
  localeContext,
  type DeterminedLocaleContext,
} from './contexts';
