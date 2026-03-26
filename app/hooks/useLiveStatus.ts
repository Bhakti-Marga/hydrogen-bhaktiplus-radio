import { useState, useEffect, useCallback } from "react";
import type { LiveStatusInfo } from "~/lib/types/live-status.types";

const POLL_INTERVAL = 30000; // 30 seconds

interface UseLiveStatusOptions {
  enabled?: boolean;
  pollInterval?: number;
}

/**
 * API route response shape
 * The API route returns the transformed LiveStatusInfo from the service
 */
interface ApiLiveStatusResponse {
  status: LiveStatusInfo;
  timestamp: string;
}

/**
 * Hook for polling live streaming status
 * Returns current live status and refreshes periodically
 */
export function useLiveStatus(options: UseLiveStatusOptions = {}) {
  const { enabled = true, pollInterval = POLL_INTERVAL } = options;

  const [status, setStatus] = useState<LiveStatusInfo>({
    isCurrentlyLive: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch from API route that calls the backend
      const response = await fetch("/api/live-status");
      if (!response.ok) throw new Error("Failed to fetch live status");

      const data = (await response.json()) as ApiLiveStatusResponse;
      setStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      // Don't update status on error - keep last known state
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchStatus();

    if (enabled && pollInterval > 0) {
      const interval = setInterval(fetchStatus, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, enabled, pollInterval]);

  return {
    ...status,
    isLoading,
    error,
    refresh: fetchStatus,
  };
}
