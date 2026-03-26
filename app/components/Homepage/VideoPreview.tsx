import { Container } from "~/components";
import { IconPlay } from "~/components/Icons";

interface VideoPreviewProps {
  thumbnailUrl?: string;
  thumbnailUrlWebp?: string;
  thumbnailSrcSet?: string;
  thumbnailSrcSetWebp?: string;
  thumbnailSizes?: string;
  className?: string;
  onPlayClick?: () => void;
}

/**
 * Max CSS width of the video preview container.
 * Used to compute the sizes attribute for responsive images.
 */
const CONTAINER_MAX_WIDTH = 780;

/**
 * Video preview component for the unsubscribed homepage.
 * Shows a thumbnail with play button overlay.
 * When clicked, triggers onPlayClick callback to open fullscreen video modal.
 *
 * Supports responsive images via srcSet/sizes for both WebP and PNG formats.
 */
export function VideoPreview({
  thumbnailUrl = "https://cdn.shopify.com/s/files/1/0630/3645/7118/files/video-preview-thumbnail.jpg",
  thumbnailUrlWebp,
  thumbnailSrcSet,
  thumbnailSrcSetWebp,
  thumbnailSizes = `(min-width: ${CONTAINER_MAX_WIDTH}px) ${CONTAINER_MAX_WIDTH}px, 100vw`,
  className = "",
  onPlayClick,
}: VideoPreviewProps) {
  return (
    <div id="video-preview" className={`video-preview ${className}`}>
      <Container>
        {/* Match VideoPlayer container styling */}
        <div
          className="video-player-container relative w-full mx-auto"
          style={{
            maxWidth: `${CONTAINER_MAX_WIDTH}px`,
          }}
        >
          {/* Video container with 16:9 aspect ratio - matches VideoPlayer */}
          <div
            className="relative w-full"
            style={{
              aspectRatio: "16/9",
            }}
          >
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              {/* Thumbnail background */}
              <picture className="absolute inset-0">
                {thumbnailUrlWebp && (
                  <source
                    srcSet={thumbnailSrcSetWebp ?? thumbnailUrlWebp}
                    sizes={thumbnailSrcSetWebp ? thumbnailSizes : undefined}
                    type="image/webp"
                  />
                )}
                <img
                  src={thumbnailUrl}
                  srcSet={thumbnailSrcSet}
                  sizes={thumbnailSrcSet ? thumbnailSizes : undefined}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </picture>

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-transparent" />

              {/* Play button */}
              <button
                onClick={onPlayClick}
                className="absolute inset-0 flex items-center justify-center group cursor-pointer"
                aria-label="Watch preview"
              >
                <div className="w-[70px] h-[66px] bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all group-hover:bg-black/30 group-hover:scale-105">
                  <IconPlay className="w-24 h-24 text-white ml-2" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
