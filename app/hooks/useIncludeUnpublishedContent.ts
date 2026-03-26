import { useState, useEffect, useCallback } from 'react';
import { useRootLoaderData } from './useRootLoaderData';

/**
 * SessionStorage key for the "include unpublished content" flag.
 */
const STORAGE_KEY = 'bp_include_unpublished';

/**
 * Cookie name that syncs with sessionStorage.
 * Must match the value in auth.middleware.ts
 */
const COOKIE_NAME = 'bp_include_unpublished';

/**
 * Hook to manage the "include unpublished content" flag for admin preview.
 * 
 * IMPORTANT: This hook only works in non-production environments (staging, development).
 * In production, it always returns `includeUnpublished: false` and `isEnabled: false`.
 * 
 * This hook:
 * 1. Reads/writes to sessionStorage (persists for browser session)
 * 2. Syncs to a cookie so the server can read the flag
 * 3. Triggers a page reload when toggled to refetch content
 * 
 * @returns Object with current state and toggle function
 * 
 * @example
 * ```tsx
 * function AdminControls() {
 *   const { includeUnpublished, toggleIncludeUnpublished, isLoading, isEnabled } = useIncludeUnpublishedContent();
 *   
 *   if (!isEnabled) return null; // Don't show in production
 *   
 *   return (
 *     <button onClick={toggleIncludeUnpublished} disabled={isLoading}>
 *       {includeUnpublished ? 'Hide Drafts' : 'Show Drafts'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useIncludeUnpublishedContent() {
  const rootData = useRootLoaderData();
  const isProduction = rootData?.ENV?.ENVIRONMENT === 'production';
  
  const [includeUnpublished, setIncludeUnpublished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Read initial value from sessionStorage on mount (only in non-production)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // In production, always disabled
    if (isProduction) {
      setIncludeUnpublished(false);
      setIsLoading(false);
      return;
    }

    const stored = sessionStorage.getItem(STORAGE_KEY);
    setIncludeUnpublished(stored === 'true');
    setIsLoading(false);
  }, [isProduction]);

  // Sync to cookie whenever value changes (so server can read it)
  // Only in non-production environments
  useEffect(() => {
    if (typeof document === 'undefined' || isLoading || isProduction) return;

    // Set cookie with SameSite=Lax for security, no expiry (session cookie)
    document.cookie = `${COOKIE_NAME}=${includeUnpublished}; path=/; SameSite=Lax`;
  }, [includeUnpublished, isLoading, isProduction]);

  const toggleIncludeUnpublished = useCallback(() => {
    if (typeof window === 'undefined' || isProduction) return;

    const newValue = !includeUnpublished;
    
    // Update sessionStorage
    sessionStorage.setItem(STORAGE_KEY, String(newValue));
    
    // Update state (which will trigger cookie sync via useEffect)
    setIncludeUnpublished(newValue);
    
    // Reload page to refetch content with new flag
    // Use a small delay to ensure cookie is set before reload
    setTimeout(() => {
      window.location.reload();
    }, 50);
  }, [includeUnpublished, isProduction]);

  const setIncludeUnpublishedContent = useCallback((value: boolean) => {
    if (typeof window === 'undefined' || isProduction) return;

    // Update sessionStorage
    sessionStorage.setItem(STORAGE_KEY, String(value));
    
    // Update state (which will trigger cookie sync via useEffect)
    setIncludeUnpublished(value);
    
    // Reload page to refetch content with new flag
    setTimeout(() => {
      window.location.reload();
    }, 50);
  }, [isProduction]);

  return {
    /** Whether unpublished/draft content should be included */
    includeUnpublished: isProduction ? false : includeUnpublished,
    /** Toggle the include unpublished flag (will reload page). No-op in production. */
    toggleIncludeUnpublished,
    /** Set the include unpublished flag to a specific value (will reload page). No-op in production. */
    setIncludeUnpublished: setIncludeUnpublishedContent,
    /** Whether the initial value is still loading from sessionStorage */
    isLoading,
    /** Whether this feature is enabled (false in production) */
    isEnabled: !isProduction,
    /** Current environment name */
    environment: rootData?.ENV?.ENVIRONMENT,
  };
}
