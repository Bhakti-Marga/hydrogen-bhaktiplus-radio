/**
 * User Preferences Management
 *
 * This module handles user preferences with localStorage as the current storage mechanism.
 * It can be easily migrated to a backend API by updating the storage functions.
 */

export interface UserPreferences {
  videoAutoplayMuted: boolean;
  // Note: preferredLanguage is now managed by the API via UserPreferencesProvider
  // Future preferences can be added here:
  // subtitlesEnabled?: boolean;
  // videoQuality?: 'auto' | '720p' | '1080p';
}

const STORAGE_KEY = 'bhakti-user-preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  videoAutoplayMuted: true, // Start muted for autoplay compatibility
};

/**
 * Get user preferences from storage
 * Falls back to defaults if not found or if there's an error
 */
export function getPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFERENCES;

    const parsed = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_PREFERENCES;
    }
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (error) {
    console.error('Failed to load preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save user preferences to storage
 * Merges with existing preferences rather than replacing them
 */
export function savePreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}

/**
 * Clear all user preferences from storage
 * Useful for debugging or user-initiated reset
 */
export function clearPreferences(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear preferences:', error);
  }
}

/**
 * Session-based interaction tracking
 * Used to determine if user has clicked/interacted with the site this session
 * This enables autoplay with sound after user interaction
 */
const SESSION_INTERACTION_KEY = 'bhakti-has-interacted';

/**
 * Check if user has interacted with the site this session
 * Returns false on initial page load, true after any interaction
 */
export function hasUserInteractedThisSession(): boolean {
  if (typeof window === 'undefined') {
    console.debug('💾 [Preferences] hasUserInteractedThisSession: server-side, returning false');
    return false;
  }
  const value = sessionStorage.getItem(SESSION_INTERACTION_KEY);
  const result = value === 'true';
  console.debug('💾 [Preferences] hasUserInteractedThisSession:', result, '(raw value:', value, ')');
  return result;
}

/**
 * Mark that user has interacted with the site this session
 * Call this after user clicks the welcome interstitial or any initial interaction
 */
export function setUserInteractedThisSession(): void {
  if (typeof window === 'undefined') {
    console.debug('💾 [Preferences] setUserInteractedThisSession: server-side, skipping');
    return;
  }
  console.debug('💾 [Preferences] setUserInteractedThisSession: setting to true');
  sessionStorage.setItem(SESSION_INTERACTION_KEY, 'true');
}

// Future: Backend API integration
//
// export async function savePreferences(preferences: Partial<UserPreferences>): Promise<void> {
//   if (typeof window === 'undefined') return;
//
//   try {
//     // Save to backend
//     await fetch('/api/preferences', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(preferences),
//     });
//
//     // Keep local cache in sync
//     const current = getPreferences();
//     const updated = { ...current, ...preferences };
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
//   } catch (error) {
//     console.error('Failed to save preferences:', error);
//     throw error;
//   }
// }
//
// export async function fetchPreferences(): Promise<UserPreferences> {
//   try {
//     const response = await fetch('/api/preferences');
//     const data = await response.json();
//
//     // Cache locally
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
//     return data;
//   } catch (error) {
//     // Fallback to local storage if API fails
//     return getPreferences();
//   }
// }
