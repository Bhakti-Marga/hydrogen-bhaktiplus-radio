/**
 * Live status event from the backend API
 * Matches the LiveStatusUpdateEvent model from /lives/status endpoint
 */
export interface LiveStatusEvent {
  contentId: number;
  liveStatus: string | null;
  title: string | null;
  videoId: number | null;
  startDate: string | null;
  endDate: string | null;
  timestamp: string;
}

/**
 * Response from GET /lives/status endpoint
 */
export interface LiveStatusResponse {
  status: LiveStatusEvent;
}

/**
 * Processed live status info for use in components
 * Derived from LiveStatusEvent with computed convenience properties
 */
export interface LiveStatusInfo {
  /** Whether content is currently live streaming */
  isCurrentlyLive: boolean;
  /** Content ID of the live stream */
  contentId?: number;
  /** Video ID associated with the live stream */
  videoId?: number;
  /** Title of the live content */
  title?: string;
  /** The raw live status string from the backend */
  liveStatus?: string;
  /** Scheduled start date */
  startDate?: string;
  /** Scheduled end date */
  endDate?: string;
  /** Timestamp when this status was generated */
  timestamp?: string;
}
