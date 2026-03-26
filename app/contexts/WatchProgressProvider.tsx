import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import type { VideoProgressEntryDto } from '~/lib/api/types';

interface WatchProgressContextValue {
  /** Resolved watch progress entries, empty array if not yet loaded or no data */
  watchProgress: VideoProgressEntryDto[];
  /** Whether the watch progress data has been loaded */
  isLoaded: boolean;
}

const WatchProgressContext = createContext<WatchProgressContextValue>({
  watchProgress: [],
  isLoaded: false,
});

// Stable empty array to avoid re-renders
const EMPTY_ARRAY: VideoProgressEntryDto[] = [];

interface WatchProgressProviderProps {
  /** The watchProgress promise from root loader (or already-resolved array) */
  watchProgressPromise: Promise<VideoProgressEntryDto[]> | VideoProgressEntryDto[] | undefined;
  children: ReactNode;
}

export function WatchProgressProvider({ watchProgressPromise, children }: WatchProgressProviderProps) {
  const [watchProgress, setWatchProgress] = useState<VideoProgressEntryDto[]>(EMPTY_ARRAY);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // If already an array (e.g., in tests or after hydration), use it directly
    if (Array.isArray(watchProgressPromise)) {
      setWatchProgress(watchProgressPromise);
      setIsLoaded(true);
      return;
    }

    // If no promise, mark as loaded with empty data
    if (!watchProgressPromise) {
      setIsLoaded(true);
      return;
    }

    // Resolve the promise
    let cancelled = false;
    watchProgressPromise.then((resolved) => {
      if (!cancelled) {
        setWatchProgress(resolved ?? EMPTY_ARRAY);
        setIsLoaded(true);
      }
    }).catch((error) => {
      console.error('[WatchProgressProvider] Error resolving watchProgress:', error);
      if (!cancelled) {
        setIsLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [watchProgressPromise]);

  const value = useMemo(() => ({ watchProgress, isLoaded }), [watchProgress, isLoaded]);

  return (
    <WatchProgressContext.Provider value={value}>
      {children}
    </WatchProgressContext.Provider>
  );
}

/**
 * Get the resolved watch progress data.
 * Returns empty array if not yet loaded.
 */
export function useWatchProgressContext(): WatchProgressContextValue {
  return useContext(WatchProgressContext);
}

/**
 * Get progress for a specific video.
 * Returns undefined if video not found or data not yet loaded.
 */
export function useVideoProgress(videoId: string | number | undefined): number | undefined {
  const { watchProgress } = useWatchProgressContext();

  if (!videoId) return undefined;

  const videoIdNum = typeof videoId === 'string' ? parseInt(videoId, 10) : videoId;
  const entry = watchProgress.find(p => p.videoId === videoIdNum);

  return entry?.progressSeconds;
}
