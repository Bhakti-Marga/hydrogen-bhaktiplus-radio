import { useState, useEffect, useRef } from "react";
import { buildVideoPlayerUrl } from "~/lib/utils/videoPlayer";
import { signVideoId } from "~/lib/utils/video-token";
import { useGlobal, useHasUserInteracted, useCountryCode } from "~/hooks";
import { toMediaApiLocale } from "~/lib/locale";
import { IconSoundOff } from "~/components/Icons/IconSoundOff";
import { IconSoundOn } from "~/components/Icons/IconSoundOn";
import { useVideoPlayer } from "~/contexts/VideoPlayerProvider";

const DEFAULT_PREVIEW_DURATION_SECONDS = 30;


interface BackgroundVideoWithOverlaysProps {
  imageUrl: string;
  /** Optional vertical image URL for mobile. Falls back to imageUrl when not provided. */
  mobileImageUrl?: string;
  videoId?: string;
  altText?: string;
  subscriptionTier?: string;
  customerId?: string | null;
  enableVideo?: boolean;
  startTimeSeconds?: number;
  /** How long to show the video before fading back to image (seconds). Defaults to 30. */
  previewDurationSeconds?: number;
}

export function BackgroundVideoWithOverlays({
  imageUrl,
  mobileImageUrl,
  videoId,
  altText = "",
  subscriptionTier,
  customerId,
  enableVideo = true,
  startTimeSeconds,
  previewDurationSeconds = DEFAULT_PREVIEW_DURATION_SECONDS,
}: BackgroundVideoWithOverlaysProps) {
  const { settings, updatePreferences } = useGlobal();
  const { hasInteracted } = useHasUserInteracted();
  const { language, countryCode } = useCountryCode();
  const locale = toMediaApiLocale(countryCode, language);

  // Whether a vertical mobile image is available (used for CSS-based responsive switching)
  const hasVerticalImage = !!mobileImageUrl;
  const [showVideo, setShowVideo] = useState(false);
  const [hideVideo, setHideVideo] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { registerPlayingVideo, stopSignal, playingVideoId } = useVideoPlayer();
  const lastStopSignal = useRef(stopSignal);
  const wasStopped = useRef(false); // Track if video was manually stopped
  const lastVideoId = useRef(videoId); // Track videoId changes

  // Compute desired muted state: if user hasn't interacted, must be muted for autoplay
  // Otherwise, use their saved preference
  const desiredMuted = !hasInteracted ? true : settings.videoAutoplayMuted;

  // Intersection Observer to hide video when off screen
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);

          // Fade back to image when not visible
          if (!entry.isIntersecting) {
            setHideVideo(true);
          }
        });
      },
      { threshold: 0.1 }, // Trigger when at least 10% is visible
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Only reset wasStopped when videoId actually changes (new video should be allowed to play)
    if (videoId !== lastVideoId.current) {
      wasStopped.current = false;
      lastVideoId.current = videoId;
    }

    setShowVideo(false);
    setHideVideo(false);

    // Show video if enabled and visible
    if (enableVideo && videoId && isVisible) {
      // Delay video load slightly to allow image to render first
      const showTimer = setTimeout(() => {
        // Don't start video if it was manually stopped
        if (wasStopped.current) {
          return;
        }
        setShowVideo(true);
        // Register this video as playing
        registerPlayingVideo(videoId, "background");
      }, 1008);

      // After previewDurationSeconds of video playing, fade back to image
      const hideTimer = setTimeout(() => {
        setHideVideo(true);
      }, 1008 + previewDurationSeconds * 1000); // 1008ms initial delay + preview duration

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [
    enableVideo,
    videoId,
    isVisible,
    registerPlayingVideo,
    previewDurationSeconds,
  ]);

  // Watch for stop signals from the global provider
  useEffect(() => {
    // Respond to stop signals - but only if this video is NOT the currently playing one
    // (the newly registered video shouldn't stop itself when it triggers the stop signal)
    if (stopSignal !== lastStopSignal.current) {
      lastStopSignal.current = stopSignal;

      // If this video is the currently playing video, don't stop it
      // This handles the case where registering a new video triggers a stop signal
      // but the new video shouldn't stop itself
      if (playingVideoId === videoId) {
        return;
      }

      wasStopped.current = true; // Mark as stopped to prevent timer from restarting
      setHideVideo(true);
    }
  }, [stopSignal, playingVideoId, videoId]);

  // Listen for "videoLoaded" message from iframe, then control playback via postMessage
  // NOTE: The video player iframe must send: window.parent.postMessage({type: 'videoLoaded'}, '*')
  // This should be sent after video metadata is loaded and player is ready
  useEffect(() => {
    if (!showVideo || !iframeRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      // Security: verify the message is from our video player
      if (!event.data || event.data.type !== "videoMetadataLoaded") return;

      const iframe = iframeRef.current?.contentWindow;
      if (!iframe) return;

      // Set muted state first
      const muteAction = desiredMuted ? "mute" : "unmute";
      iframe.postMessage({ action: muteAction }, "*");

      // Then start playing (autoplay)
      iframe.postMessage({ action: "play" }, "*");
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [showVideo, desiredMuted]);

  // Sync muted state when user toggles the button (video already playing)
  useEffect(() => {
    if (!showVideo || !iframeRef.current?.contentWindow) return;

    const action = desiredMuted ? "mute" : "unmute";
    iframeRef.current.contentWindow.postMessage({ action }, "*");
  }, [desiredMuted, showVideo]);

  // State for the signed video player URL
  const [videoUrl, setVideoUrl] = useState("");

  // Build the video player URL with signed token - we'll control playback via postMessage
  // This keeps the URL stable so it only remounts when videoId changes
  useEffect(() => {
    async function buildSignedUrl() {
      if (!videoId || !enableVideo) {
        setVideoUrl("");
        return;
      }

      // Parse videoId as number for signing
      const numericVideoId = parseInt(videoId, 10);
      if (isNaN(numericVideoId)) {
        setVideoUrl("");
        return;
      }

      const videoToken = await signVideoId(numericVideoId);
      const url = buildVideoPlayerUrl({
        videoId: videoToken,
        subscriptionTier,
        customerId,
        timestampSeconds: startTimeSeconds,
        autoplay: false, // Disable autoplay - we'll control it via postMessage
        muted: true, // Always start muted
        noProgress: true,
        noControls: true,
        // Subtitles disabled for background video
        subtitleLanguage: "off",
        locale,
      });
      setVideoUrl(url);
    }
    buildSignedUrl();
  }, [videoId, subscriptionTier, customerId, startTimeSeconds, enableVideo, locale]);

  return (
    <div ref={containerRef}>
      {/* Background Image — uses CSS responsive classes to avoid flash when switching
           between landscape and vertical images (useIsMobile defaults to false on SSR) */}
      <div
        className={`absolute inset-0 w-full h-full ${showVideo && !hideVideo
          ? "animate-[fadeOut_500ms_ease-out_forwards]"
          : hideVideo
            ? "animate-[crossFade_700ms_ease-out_forwards]"
            : "animate-[crossFade_300ms_ease-out_forwards]"
          }`}
      >
        {/* Landscape image — always shown on tablet+, shown on mobile only when no vertical exists */}
        <img
          src={imageUrl}
          alt={altText}
          className={`w-full h-full object-cover hero__background-image ${hasVerticalImage ? "hidden tablet:block" : ""}`}
        />
        {/* Vertical image — mobile only, shifted up slightly for better framing */}
        {hasVerticalImage && (
          <img
            src={mobileImageUrl}
            alt={altText}
            className="w-full h-full object-cover object-[center_20%] block tablet:hidden"
          />
        )}
      </div>

      {/* Background Video */}
      {showVideo && !hideVideo && videoUrl && (
        <div
          className="absolute inset-0 w-full h-full animate-[crossFade_700ms_ease-out_forwards] pointer-events-none"
          style={{
            opacity: 0,
          }}
        >
          <iframe
            ref={iframeRef}
            src={videoUrl}
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 border-none pointer-events-none top-[40%] tablet:top-[60%] min-w-full min-h-full tablet:min-w-[120%] tablet:min-h-[120%]"
            style={{
              width: "177.78vh",  // 16:9 aspect ratio (100vh * 16/9)
              height: "56.25vw", // 16:9 aspect ratio (100vw * 9/16)
            }}
            allow="autoplay;"
            title="Background Video"
            loading="eager"
          />
        </div>
      )}

      {/* Mute/Unmute Button — aligned with tab section on mobile (top-left), bottom-right on desktop */}
      {showVideo && !hideVideo && videoUrl && (
        <div
          className={`absolute w-full px-12 tablet:px-24 desktop:px-60 top-[15%] tablet:top-[70%]`}
        >
          <div className="relative mx-auto flex justify-start tablet:justify-end">
            <button
              className="z-20 text-white hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.nativeEvent.stopImmediatePropagation();
                e.stopPropagation();
                // Toggle the preference - desiredMuted will recompute and trigger postMessage
                updatePreferences({ videoAutoplayMuted: !desiredMuted });
              }}
              aria-label={desiredMuted ? "Unmute video" : "Mute video"}
            >
              {desiredMuted ? (
                <IconSoundOff className="icon-2xl" />
              ) : (
                <IconSoundOn className="icon-2xl" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Overlays — mobile gets a single strong vertical gradient, tablet+ gets the standard pair */}
      <div
        className="absolute inset-0 pointer-events-none block tablet:hidden"
        style={{
          background:
            "linear-gradient(to top, #051237 30%, rgba(5, 18, 55, 0.6) 60%, rgba(5, 18, 55, 0) 85%)",
        }}
      />
      <div className="hero__overlay absolute inset-0 pointer-events-none hidden tablet:block" />
      <div className="hero__overlay-vertical absolute inset-0 pointer-events-none hidden tablet:block" />
    </div>
  );
}
