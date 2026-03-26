/**
 * Video Player URL Builder Utility
 *
 * Centralizes the logic for building video player URLs.
 * This ensures consistency across all video player implementations.
 */

import type { LanguageCode } from "~/lib/locale/types";

export interface VideoPlayerUrlParams {
  videoId: string | number;
  subscriptionTier?: string;
  customerId?: string | null;
  timestampSeconds?: number;
  autoplay?: boolean;
  muted?: boolean;
  noProgress?: boolean;
  noControls?: boolean;
  /**
   * @deprecated Use subtitleLanguage instead for explicit control
   */
  noSubtitles?: boolean;
  /**
   * Subtitle track language (ISO 639-1 code like "en", "de", "hi")
   * Will be converted to ISO 639-2/B format for HLS (e.g., "eng", "ger", "hin")
   * Set to "off" to disable subtitles
   */
  subtitleLanguage?: LanguageCode | string | "off";
  /**
   * Full locale string (e.g., "en-US", "de-DE")
   * Passed as a query parameter so the player can localize its UI
   */
  locale?: string;
}

// Default player base URLs (used as fallback if env vars not set)
const DEFAULT_PLAYER_BASE_URL =
  "https://bhaktimarga.org/up/bmdatahub/mediaplatform/player/mediaplatformv2.php";

/**
 * Builds a video player URL with the specified parameters
 *
 * @param params - Video player configuration parameters
 * @returns The complete video player URL
 */
export function buildVideoPlayerUrl(params: VideoPlayerUrlParams): string {
  const playerBaseUrl =
    process.env.VIDEO_PLAYER_BASE_URL || DEFAULT_PLAYER_BASE_URL;

  console.log("[buildVideoPlayerUrl] Called with params:", {
    videoId: params.videoId,
    videoIdType: typeof params.videoId,
  });

  // Validate videoId is not null or undefined
  if (params.videoId == null) {
    throw new Error("videoId is required and cannot be null or undefined");
  }

  const urlParams = new URLSearchParams({
    videoid: params.videoId.toString(),
  });

  console.log(
    "[buildVideoPlayerUrl] videoid param set to:",
    params.videoId.toString(),
  );

  if (params.subscriptionTier) {
    urlParams.append("subscriptionTier", params.subscriptionTier);
  }

  if (params.customerId) {
    urlParams.append("shp_customer_id", params.customerId);
  }

  if (
    params.timestampSeconds != null &&
    params.timestampSeconds !== undefined
  ) {
    urlParams.append("t", params.timestampSeconds.toString());
  }

  if (params.autoplay) {
    urlParams.append("autoplay", "true");
  }

  if (params.muted) {
    urlParams.append("mute", "true");
  }

  // https://bhaktimarga.org/up/bmdatahub/mediaplatform/player/mediaplatformv2.php?videoid=123&autoplay=true&mute=true&noprogress=true&nocontrols=true

  if (params.noProgress) {
    urlParams.append("noprogress", "true");
  }

  if (params.noControls) {
    urlParams.append("nocontrols", "true");
  }

  // Handle subtitle language
  // Priority: subtitleLanguage > noSubtitles (deprecated)
  if (params.subtitleLanguage != null) {
    if (params.subtitleLanguage === "off") {
      urlParams.append("subtitles", "off");
    } else {
      // Pass the language code as-is (e.g., "en", "de", "hi")
      urlParams.append("subtitles", params.subtitleLanguage);
    }
  } else if (params.noSubtitles) {
    // Deprecated: use subtitleLanguage="off" instead
    urlParams.append("subtitles", "off");
  }

  // Add locale if provided
  if (params.locale) {
    urlParams.append("locale", params.locale);
  }

  // Add media API base URL if defined
  const mediaApiUrl = process.env.MEDIA_API_URL;
  if (mediaApiUrl) {
    urlParams.append("mediaApiBaseUrl", mediaApiUrl);
  }

  const finalUrl = `${playerBaseUrl}?${urlParams.toString()}`;
  console.log("[buildVideoPlayerUrl] Final URL:", finalUrl);
  return finalUrl;
}
