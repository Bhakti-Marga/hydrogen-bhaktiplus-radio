import { ApiClient } from "../client";
import type {
  LiveStatusEvent,
  LiveStatusInfo,
  LiveStatusResponse,
} from "~/lib/types/live-status.types";

/**
 * Live status values that indicate content is currently streaming
 */
const LIVE_STATUSES = ["live", "streaming"] as const;

/**
 * Transform the raw backend LiveStatusEvent into a more usable LiveStatusInfo
 */
function transformLiveStatus(event: LiveStatusEvent | null): LiveStatusInfo {
  if (!event) {
    return { isCurrentlyLive: false };
  }

  const isCurrentlyLive =
    event.liveStatus !== null &&
    LIVE_STATUSES.includes(
      event.liveStatus.toLowerCase() as (typeof LIVE_STATUSES)[number]
    );

  return {
    isCurrentlyLive,
    contentId: event.contentId,
    videoId: event.videoId ?? undefined,
    title: event.title ?? undefined,
    liveStatus: event.liveStatus ?? undefined,
    startDate: event.startDate ?? undefined,
    endDate: event.endDate ?? undefined,
    timestamp: event.timestamp,
  };
}

export class LiveStatusService extends ApiClient {
  /**
   * Check if there's currently a live stream
   * This endpoint should be lightweight for polling
   */
  async getCurrentLiveStatus(): Promise<LiveStatusInfo> {
    try {
      const response = await this.get<LiveStatusResponse>("/lives/status");
      return transformLiveStatus(response.data?.status ?? null);
    } catch (error) {
      // Fail silently - live status is enhancement, not critical
      console.warn("Failed to fetch live status:", error);
      return { isCurrentlyLive: false };
    }
  }
}
