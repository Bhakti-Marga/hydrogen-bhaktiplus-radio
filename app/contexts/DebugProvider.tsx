import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";
import { enableDebugBoxes, disableDebugBoxes, filterComponents, ignoreComponents, clearFilters } from "~/lib/debug";
import type { UserTierOverride } from "~/lib/debug/mockUsers";
import { useRootLoaderData } from "~/hooks";

export type ComponentFilterMode = "show-all" | "show-only" | "ignore";

export type LanguageSource = "user_preferences" | "url" | "user_selection" | "cookie" | "geoip" | "default";

export interface LocaleDebugInfo {
  language: string;
  country: string;
  languageSource: LanguageSource;
  serverPreferredLanguage: string | undefined;
  cookieLanguage: string | undefined;
}

export interface DebugState {
  isEnabled: boolean;
  showVideoIds: boolean;
  showBoxes: boolean;
  userTierOverride: UserTierOverride;
  componentFilterMode: ComponentFilterMode;
  componentFilters: string[];
}

interface DebugContextValue {
  debug: DebugState;
  localeInfo: LocaleDebugInfo;
  toggleDebug: () => void;
  updateDebugState: (updates: Partial<DebugState>) => void;
}

const DebugContext = createContext<DebugContextValue | undefined>(undefined);

const DEBUG_STORAGE_KEY = 'bhaktimarga-debug-state';

export function DebugProvider({ children }: { children: ReactNode }) {
  const rootData = useRootLoaderData();
  
  const [debug, setDebug] = useState<DebugState>(() => {
    // Load from localStorage and URL params on mount (client-side only)
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      try {
        // Get debug tier from URL param (takes precedence)
        const url = new URL(window.location.href);
        const debugTierFromUrl = url.searchParams.get('debugTier') || 'real-user';

        // Load other settings from localStorage
        const stored = localStorage.getItem(DEBUG_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, unknown>;
          return {
            isEnabled: false, // Always start with menu closed
            showVideoIds: (parsed.showVideoIds as boolean) ?? false,
            showBoxes: (parsed.showBoxes as boolean) ?? false,
            userTierOverride: debugTierFromUrl as UserTierOverride, // From URL
            componentFilterMode: (parsed.componentFilterMode as ComponentFilterMode) ?? "show-all",
            componentFilters: (parsed.componentFilters as string[]) ?? [],
          };
        }

        // If no localStorage, still use URL param
        return {
          isEnabled: false,
          showVideoIds: false,
          showBoxes: false,
          userTierOverride: debugTierFromUrl as UserTierOverride,
          componentFilterMode: "show-all",
          componentFilters: [],
        };
      } catch (e) {
        console.warn('Failed to load debug state from localStorage', e);
      }
    }
    return {
      isEnabled: false,
      showVideoIds: false,
      showBoxes: false,
      userTierOverride: "real-user",
      componentFilterMode: "show-all",
      componentFilters: [],
    };
  });

  const toggleDebug = () => {
    setDebug(prev => {
      const newValue = !prev.isEnabled;
      console.log(`🐛 Debug mode ${newValue ? 'enabled' : 'disabled'}`);
      return { ...prev, isEnabled: newValue };
    });
  };

  const updateDebugState = (updates: Partial<DebugState>) => {
    setDebug(prev => ({ ...prev, ...updates }));
  };

  // Listen for Ctrl+Shift+D keyboard shortcut
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+D
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        toggleDebug();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    console.log('🐛 Debug mode ready. Press Ctrl+Shift+D to toggle.');

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Watch for showBoxes changes and enable/disable debug boxes
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    if (debug.showBoxes) {
      enableDebugBoxes();
    } else {
      disableDebugBoxes();
    }
  }, [debug.showBoxes]);

  // Persist debug state to localStorage (excluding isEnabled and userTierOverride)
  // userTierOverride is stored in URL params, not localStorage
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (typeof window === 'undefined') return;

    try {
      const toPersist = {
        showVideoIds: debug.showVideoIds,
        showBoxes: debug.showBoxes,
        componentFilterMode: debug.componentFilterMode,
        componentFilters: debug.componentFilters,
      };
      localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(toPersist));
    } catch (e) {
      console.warn('Failed to save debug state to localStorage', e);
    }
  }, [debug.showVideoIds, debug.showBoxes, debug.componentFilterMode, debug.componentFilters]);

  // Apply component filters when they change
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (!debug.showBoxes) return; // Only apply when boxes are showing

    if (debug.componentFilterMode === "show-all") {
      clearFilters();
    } else if (debug.componentFilterMode === "show-only") {
      filterComponents(debug.componentFilters);
    } else if (debug.componentFilterMode === "ignore") {
      ignoreComponents(debug.componentFilters);
    }
  }, [debug.componentFilterMode, debug.componentFilters, debug.showBoxes]);

  // Compute locale debug info from root loader data
  // The localeSource is already computed server-side in the root loader
  const localeInfo = useMemo((): LocaleDebugInfo => {
    const language = rootData?.language || 'en';
    const country = rootData?.countryCode || 'us';
    const serverPreferredLanguage = rootData?.userPreferences?.preferredLanguage ?? undefined;
    const languageSource = (rootData?.localeSource || 'default') as LanguageSource;
    // Cookie language is read server-side and passed through root loader
    const cookieLanguage = rootData?.preferredLanguageCookie ?? undefined;
    
    return {
      language,
      country,
      languageSource,
      serverPreferredLanguage,
      cookieLanguage,
    };
  }, [rootData?.language, rootData?.countryCode, rootData?.localeSource, rootData?.userPreferences?.preferredLanguage, rootData?.preferredLanguageCookie]);

  return (
    <DebugContext.Provider value={{ debug, localeInfo, toggleDebug, updateDebugState }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error("useDebug must be used within a DebugProvider");
  }
  return context;
}
