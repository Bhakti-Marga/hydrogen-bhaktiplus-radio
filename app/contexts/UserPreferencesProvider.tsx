import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { UserPreferencesDto } from '~/lib/api/types';

/** Query parameter used to trigger preference save after navigation */
export const SET_PREFERRED_LANGUAGE_PARAM = 'setPreferredLanguage';

/** Cookie name for preferred language (essential cookie) */
const PREFERRED_LANGUAGE_COOKIE = 'preferredLanguage';

/** 
 * Set preferred language cookie (essential cookie - no consent required)
 * Cookie is set with:
 * - 1 year expiry
 * - SameSite=Lax for security
 * - Path=/ for all routes
 */
function setPreferredLanguageCookie(languageCode: string): void {
  if (typeof document === 'undefined') return;
  
  const maxAge = 60 * 60 * 24 * 365; // 1 year in seconds
  document.cookie = `${PREFERRED_LANGUAGE_COOKIE}=${languageCode}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

interface UserPreferencesContextValue {
  /** Current user preferences (null if not logged in or not fetched) */
  preferences: UserPreferencesDto | null;
  /** Whether the user is logged in and has preferences */
  hasPreferences: boolean;
  /** The preferred language from preferences (server) or cookie */
  preferredLanguage: string | null;
  /** Update a single preference - calls API and updates local state */
  updatePreference: <K extends keyof UserPreferencesDto>(
    key: K,
    value: UserPreferencesDto[K]
  ) => Promise<void>;
  /** Update the preferred language specifically - sets cookie and API (if logged in) */
  setPreferredLanguage: (languageCode: string) => Promise<void>;
  /** Whether an update is in progress */
  isUpdating: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextValue | undefined>(undefined);

interface UserPreferencesProviderProps {
  children: ReactNode;
  /** Initial preferences fetched from the server */
  initialPreferences: UserPreferencesDto | null;
  /** User email for API calls (null if not logged in) */
  userEmail: string | null;
  /** User ID for API calls (null if not logged in) */
  userId: number | null;
}

export function UserPreferencesProvider({
  children,
  initialPreferences,
  userEmail,
  userId,
}: UserPreferencesProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferencesDto | null>(initialPreferences);
  const [isUpdating, setIsUpdating] = useState(false);

  const hasPreferences = preferences !== null;
  // Prefer server preferences (API-backed for logged-in users)
  const preferredLanguage = preferences?.preferredLanguage ?? null;

  // Update a single preference via API (for logged-in users)
  const updatePreference = useCallback(async <K extends keyof UserPreferencesDto>(
    key: K,
    value: UserPreferencesDto[K]
  ) => {
    // Can't update API if not logged in
    if (!userEmail) {
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`);
      }

      const data = await response.json() as { preferences?: UserPreferencesDto };
      
      // Update local state with new preferences
      if (data.preferences) {
        setPreferences(data.preferences);
      } else {
        // Optimistic update if API doesn't return full preferences
        setPreferences(prev => prev ? { ...prev, [key]: value } : { [key]: value });
      }

    } catch (error) {
      console.error('[UserPreferences] Failed to update API:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [userEmail]);

  // Convenience method for setting preferred language
  // Sets cookie (for all users) and API (for logged-in users)
  const setPreferredLanguage = useCallback(async (languageCode: string) => {
    // Always save to cookie (works for both logged-in and anonymous)
    // This is an essential cookie - no consent required
    setPreferredLanguageCookie(languageCode);
    
    // Also save to API if logged in
    if (userEmail) {
      await updatePreference('preferredLanguage', languageCode);
    }
  }, [userEmail, updatePreference]);

  // Watch for setPreferredLanguage query param and save preference
  // This is triggered after navigation from LanguageSelector
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const url = new URL(window.location.href);
    const languageToSet = url.searchParams.get(SET_PREFERRED_LANGUAGE_PARAM);
    
    if (languageToSet) {
      // Remove the query param from URL (clean up)
      url.searchParams.delete(SET_PREFERRED_LANGUAGE_PARAM);
      window.history.replaceState({}, '', url.pathname + url.search);

      // Save to cookie (always) and API (if logged in)
      setPreferredLanguage(languageToSet).catch(() => {
        // Silently fail - preference saving is non-critical
      });
    }
  }, [setPreferredLanguage]);

  // Note: No client-side redirect needed for anonymous users!
  // The server reads the preferredLanguage cookie and handles locale determination
  // in determineLocale() - this happens server-side so there's no flash

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        hasPreferences,
        preferredLanguage,
        updatePreference,
        setPreferredLanguage,
        isUpdating,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

/**
 * Hook to access user preferences.
 * Must be used within a UserPreferencesProvider.
 */
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}
