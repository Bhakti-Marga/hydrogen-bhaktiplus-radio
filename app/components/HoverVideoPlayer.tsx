import { useRef, useEffect, useState } from "react";
import { buildVideoPlayerUrl } from "~/lib/utils/videoPlayer";
import { useVideoPlayer } from "~/contexts/VideoPlayerProvider";
import { useHasUserInteracted, useCountryCode } from "~/hooks";
import { toMediaApiLocale } from "~/lib/locale";

interface HoverVideoPlayerProps {
  videoId: string | number;
  title: string;
  eyebrow?: string;
  subscriptionTier?: string;
  customerId?: string | null;
  progressSeconds?: number;
  muted?: boolean;
  /** Thumbnail URL to show while video is loading */
  thumbnailUrl?: string;
}

export function HoverVideoPlayer({
  videoId,
  title,
  eyebrow,
  subscriptionTier,
  customerId,
  progressSeconds,
  muted = true,
  thumbnailUrl,
}: HoverVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { registerPlayingVideo } = useVideoPlayer();
  const { hasInteracted } = useHasUserInteracted();
  const { language, countryCode } = useCountryCode();
  const locale = toMediaApiLocale(countryCode, language);
  const [isVideoVisible, setIsVideoVisible] = useState(false);

  // Capture the initial muted value - this won't change even if muted prop changes
  // Only autoplay if user has interacted with the site
  // If user hasn't interacted, always start muted. Otherwise, use muted prop.
  const initialVideoPlayerUrlParams = useRef({
    videoId,
    subscriptionTier,
    customerId,
    timestampSeconds: progressSeconds,
    autoplay: true,
    muted: !hasInteracted ? true : muted,
    noProgress: true,
    noControls: true,
    // Subtitles disabled for hover preview
    subtitleLanguage: "off" as const,
    locale,
  });

  // Build the video player URL once with initial muted state
  // we build once to render the initial iframe. after that, we update the iframe
  // player via postMessage callbacks. otherwise, we would cause re-loading the video every time
  const videoUrl = buildVideoPlayerUrl(initialVideoPlayerUrlParams.current);

  // Register this video as playing when component mounts
  useEffect(() => {
    const videoIdStr = String(videoId);
    registerPlayingVideo(videoIdStr, 'hover');
  }, [videoId, registerPlayingVideo]);

  // Send mute/unmute commands to the iframe when muted state changes
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;

    const action = muted ? 'mute' : 'unmute';

    // Send the command to the iframe player
    iframeRef.current.contentWindow.postMessage(
      { action },
      '*'
    );
  }, [muted]);

  // Fade in the video after a short delay to allow it to start loading
  useEffect(() => {
    const fadeInTimer = setTimeout(() => {
      setIsVideoVisible(true);
    }, 1200); // 1.2s delay before starting fade-in

    return () => clearTimeout(fadeInTimer);
  }, []);

  return (
    <div className="w-full h-full bg-black overflow-hidden">
      {/* Video Player - Full size with thumbnail background */}
      <div 
        className="relative w-full h-full overflow-hidden"
        style={{
          backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <iframe
          ref={iframeRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full border-none overflow-hidden transition-opacity duration-1000 ease-in-out"
          style={{
            objectFit: "cover",
            opacity: isVideoVisible ? 1 : 0,
          }}
          allow="autoplay; fullscreen; picture-in-picture"
          title={title}
          loading="eager"
          scrolling="no"
        />
      </div>
    </div>
  );
}

HoverVideoPlayer.displayName = 'HoverVideoPlayer';
