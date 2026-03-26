import { useVideoProgress } from '~/contexts/WatchProgressProvider';

/**
 * @deprecated Use useVideoProgress from WatchProgressProvider instead
 *
 * Hook to get the watch progress for a specific video
 * @param videoId - The video ID to get progress for
 * @returns The progress in seconds, or undefined if no progress exists
 */
export function useWatchProgress(videoId: string | number | undefined): number | undefined {
  return useVideoProgress(videoId);
}
