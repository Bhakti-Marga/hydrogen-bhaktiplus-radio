import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { useCountryCode } from "~/hooks/useCountryCode";
import { buildVideoPlayerUrl } from "~/lib/utils/videoPlayer";
import { toMediaApiLocale } from "~/lib/locale";

const MAX_LOAD_RETRIES = 3;
const LOAD_TIMEOUT_MS = 15000; // 15 seconds before considering load failed
const METADATA_POLL_INTERVAL_MS = 500; // Poll for metadata every 500ms

export interface VideoPlayerProps {
  videoToken: string;
  subscriptionTier?: string;
  customerId?: string | null;
  timestampSeconds?: number;
  progress?: number;
  shouldAutoplay?: boolean;
}

export function VideoPlayer({
  videoToken,
  subscriptionTier,
  customerId,
  timestampSeconds,
  progress,
  shouldAutoplay = true,
}: VideoPlayerProps) {
  const { strings } = useTranslations();
  const { language, countryCode } = useCountryCode();
  const locale = toMediaApiLocale(countryCode, language);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const metadataPollRef = useRef<NodeJS.Timeout | null>(null);
  const mountTimeRef = useRef<number>(Date.now());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const lastSeekTimeRef = useRef<number | null>(null);

  // Build the player URL only based on initial progress, not timestampSeconds
  // This ensures the URL doesn't change when chapters are clicked
  const playerUrl = useMemo(
    () =>
      buildVideoPlayerUrl({
        videoId: videoToken,
        subscriptionTier,
        customerId,
        timestampSeconds: progress, // Only use initial progress from URL
        autoplay: false,
        // Default subtitles to interface language
        subtitleLanguage: language,
        locale,
      }),
    [videoToken, subscriptionTier, customerId, progress, language, locale],
  );

  // Reset retry count when video changes
  useEffect(() => {
    console.debug(
      "[VideoPlayer] 🔄 Video token changed, resetting retry state",
      { videoToken },
    );
    setRetryCount(0);
    setLoadError(false);
  }, [videoToken]);

  // Helper to stop polling
  const stopMetadataPolling = () => {
    if (metadataPollRef.current) {
      const elapsed = Date.now() - mountTimeRef.current;
      console.debug("[VideoPlayer] Stopping metadata polling", {
        elapsed: `${elapsed}ms`,
      });
      clearInterval(metadataPollRef.current);
      metadataPollRef.current = null;
    }
  };

  // Helper to request status from player (player supports 'getStatus' action)
  const requestPlayerStatus = () => {
    if (iframeRef.current?.contentWindow) {
      const elapsed = Date.now() - mountTimeRef.current;
      console.debug("[VideoPlayer] 📤 Polling: requesting status from player", {
        elapsed: `${elapsed}ms`,
      });
      iframeRef.current.contentWindow.postMessage({ action: "getStatus" }, "*");
    } else {
      console.debug(
        "[VideoPlayer] ⚠️ Cannot request status - iframe not available",
      );
    }
  };

  // Helper to mark player as ready
  const markPlayerReady = (source: string) => {
    const elapsed = Date.now() - mountTimeRef.current;
    console.debug("[VideoPlayer] ✅ Player ready!", {
      source,
      elapsed: `${elapsed}ms`,
      videoToken,
      retryCount,
    });
    setIsPlayerReady(true);
    setIsLoading(false);
    stopMetadataPolling();

    // Clear load timeout since we received confirmation
    if (loadTimeoutRef.current) {
      console.debug("[VideoPlayer] Clearing load timeout (player is ready)");
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    // Execute any pending seek
    if (pendingSeekRef.current != null && iframeRef.current?.contentWindow) {
      console.debug(
        "[VideoPlayer] Executing pending seek to:",
        pendingSeekRef.current,
      );
      iframeRef.current.contentWindow.postMessage(
        { action: "seek", time: pendingSeekRef.current },
        "*",
      );
      pendingSeekRef.current = null;
    }
  };

  // Listen for messages from iframe to know when player is ready
  useEffect(() => {
    console.debug(
      "[VideoPlayer] Setting up message listener for player ready signals",
    );

    const handleMessage = (event: MessageEvent) => {
      // Only log messages that look like they're from the video player
      const messageType = event.data?.type;
      if (messageType) {
        const elapsed = Date.now() - mountTimeRef.current;
        console.debug("[VideoPlayer] 📩 Received message from iframe", {
          type: messageType,
          elapsed: `${elapsed}ms`,
          isPlayerReady,
          data: event.data,
        });
      }

      // Check for various player ready signals
      if (
        messageType === "videoMetadataLoaded" ||
        messageType === "videoLoaded" ||
        messageType === "statusResponse" // Response to our getStatus poll
      ) {
        if (!isPlayerReady) {
          markPlayerReady(messageType);
        } else {
          console.debug("[VideoPlayer] Ignoring ready signal (already ready)", {
            messageType,
          });
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      console.debug("[VideoPlayer] Removing message listener");
      window.removeEventListener("message", handleMessage);
    };
  }, [isPlayerReady]);

  // Handle chapter navigation via postMessage seek
  useEffect(() => {
    // Skip if no timestamp or it's the same as last seek
    if (
      timestampSeconds == null ||
      timestampSeconds === lastSeekTimeRef.current
    ) {
      return;
    }

    // Skip initial render (timestampSeconds starts at 0)
    if (timestampSeconds === 0 && lastSeekTimeRef.current === null) {
      console.debug("[VideoPlayer] Skipping initial seek to 0");
      lastSeekTimeRef.current = 0;
      return;
    }

    console.debug("[VideoPlayer] 🎯 Seek requested", {
      timestampSeconds,
      lastSeekTime: lastSeekTimeRef.current,
      isPlayerReady,
    });

    lastSeekTimeRef.current = timestampSeconds;

    if (isPlayerReady && iframeRef.current?.contentWindow) {
      // Player is ready, send seek command immediately
      console.debug(
        "[VideoPlayer] ⏩ Seeking via postMessage to:",
        timestampSeconds,
      );
      iframeRef.current.contentWindow.postMessage(
        { action: "seek", time: timestampSeconds },
        "*",
      );
    } else {
      // Player not ready yet, queue the seek
      console.debug(
        "[VideoPlayer] ⏳ Queueing seek for when player is ready:",
        timestampSeconds,
      );
      pendingSeekRef.current = timestampSeconds;
    }
  }, [timestampSeconds, isPlayerReady]);

  const handleIframeLoad = () => {
    const loadTime = Date.now() - mountTimeRef.current;
    console.debug("[VideoPlayer] 🖼️ iframe onLoad fired", {
      videoToken,
      loadTime: `${loadTime}ms`,
      isPlayerReady,
      isLoading,
    });
    // Polling is already started from the main effect
    // This is just for logging purposes
  };

  // Timeout fallback, loading state management, and retry logic
  useEffect(() => {
    // Skip during SSR
    if (typeof window === "undefined") {
      console.debug("[VideoPlayer] Skipping effect during SSR");
      return;
    }

    console.debug("[VideoPlayer] 🎬 Starting video load sequence", {
      videoToken,
      playerUrl,
      attempt: retryCount + 1,
      maxRetries: MAX_LOAD_RETRIES,
      timeoutMs: LOAD_TIMEOUT_MS,
      pollIntervalMs: METADATA_POLL_INTERVAL_MS,
    });

    setIsLoading(true);
    setIsPlayerReady(false); // Reset ready state for new video
    setLoadError(false);
    lastSeekTimeRef.current = null; // Reset seek tracking
    pendingSeekRef.current = null; // Clear pending seeks
    mountTimeRef.current = Date.now();

    console.debug(
      "[VideoPlayer] State reset: isLoading=true, isPlayerReady=false, loadError=false",
    );

    // Start polling for player status immediately
    // Don't wait for iframe onLoad - it may have already fired or may not fire reliably
    stopMetadataPolling();

    // Small delay to let iframe start loading, then begin polling
    const pollStartDelay = setTimeout(() => {
      console.debug("[VideoPlayer] 🔄 Starting status polling (every 500ms)");
      requestPlayerStatus(); // Request immediately
      metadataPollRef.current = setInterval(
        requestPlayerStatus,
        METADATA_POLL_INTERVAL_MS,
      );
    }, 500);

    // Timeout: If no response received, retry or show error
    console.debug(
      `[VideoPlayer] ⏱️ Setting load timeout for ${LOAD_TIMEOUT_MS}ms`,
    );
    loadTimeoutRef.current = setTimeout(() => {
      setIsPlayerReady((ready) => {
        if (!ready) {
          const elapsed = Date.now() - mountTimeRef.current;
          console.debug("[VideoPlayer] ⏰ Load timeout reached!", {
            videoToken,
            elapsed: `${elapsed}ms`,
            attempt: retryCount + 1,
            maxRetries: MAX_LOAD_RETRIES,
            willRetry: retryCount < MAX_LOAD_RETRIES - 1,
          });

          if (retryCount < MAX_LOAD_RETRIES - 1) {
            // Retry by incrementing retry count (will re-render iframe with new key)
            console.debug(
              "[VideoPlayer] 🔁 Retrying load (incrementing retryCount)...",
            );
            setRetryCount((prev) => prev + 1);
          } else {
            // Max retries reached, show error
            console.error(
              "[VideoPlayer] ❌ Max retries reached, showing error state",
              {
                videoToken,
                totalAttempts: MAX_LOAD_RETRIES,
              },
            );
            setIsLoading(false);
            setLoadError(true);
          }
        } else {
          console.debug(
            "[VideoPlayer] Timeout fired but player is already ready, ignoring",
          );
        }
        return ready;
      });
    }, LOAD_TIMEOUT_MS);

    return () => {
      const elapsed = Date.now() - mountTimeRef.current;
      console.debug("[VideoPlayer] 🧹 Cleanup for video:", {
        videoToken,
        elapsed: `${elapsed}ms`,
      });
      clearTimeout(pollStartDelay);
      if (loadTimeoutRef.current) {
        console.debug("[VideoPlayer] Clearing pending load timeout");
        clearTimeout(loadTimeoutRef.current);
      }
      stopMetadataPolling();
    };
  }, [videoToken, playerUrl, retryCount]);

  // Send play command when shouldAutoplay becomes true
  useEffect(() => {
    console.debug("[VideoPlayer] Autoplay effect triggered", {
      shouldAutoplay,
      isPlayerReady,
      hasIframe: !!iframeRef.current?.contentWindow,
    });
    if (shouldAutoplay && iframeRef.current?.contentWindow) {
      console.debug("[VideoPlayer] ▶️ Sending play command to iframe", {
        videoToken,
      });
      iframeRef.current.contentWindow.postMessage({ action: "play" }, "*");
    }
  }, [shouldAutoplay, videoToken]);

  return (
    <div className="video-player-container relative w-full">
      {/* Error state - show after max retries */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-20 rounded-lg">
          <div className="text-white text-center px-24">
            <div className="mb-16">
              <svg
                className="w-64 h-64 mx-auto text-white/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="text-18 font-600 mb-8">
              {strings.video_load_error || "Video failed to load"}
            </div>
            <p className="text-14 text-white/60 mb-24">
              {strings.video_load_error_description ||
                "There was a problem loading the video. Please try refreshing the page."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-24 py-12 bg-brand text-white font-600 rounded-md hover:bg-brand/80 transition-colors"
            >
              {strings.refresh_page || "Refresh Page"}
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
          <div className="text-white text-center">
            <div className="text-18 font-600">{strings.video_loading}</div>
            {retryCount > 0 && (
              <div className="text-14 text-white/60 mt-8">
                Retry attempt {retryCount} of {MAX_LOAD_RETRIES}...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responsive iframe container with 16:9 aspect ratio */}
      <div
        className="relative w-full"
        style={{
          aspectRatio: "16/9",
        }}
      >
        <iframe
          ref={iframeRef}
          key={`${videoToken}-${retryCount}`}
          src={playerUrl}
          className="absolute inset-0 w-full h-full border-none rounded-lg"
          allow="autoplay; fullscreen; picture-in-picture;"
          allowFullScreen
          onLoad={handleIframeLoad}
          title="Video Player"
        />
      </div>
    </div>
  );
}
