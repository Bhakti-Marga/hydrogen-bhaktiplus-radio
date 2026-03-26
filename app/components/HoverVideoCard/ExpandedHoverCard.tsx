import { createPortal } from "react-dom";
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
  RefObject,
} from "react";
import { HoverVideoPlayer } from "~/components/HoverVideoPlayer";
import { CollapsibleTags, Stack, DraftBadge } from "~/components";
import { CompactChaptersList } from "~/components/CompactChaptersList";
import { UITag } from "~/lib/types";
import { Z_INDEX } from "~/lib/constants";
import { IconSoundOff } from "~/components/Icons/IconSoundOff";
import { IconSoundOn } from "~/components/Icons/IconSoundOn";
import { IconLock } from "~/components/Icons";
import { useGlobal } from "~/hooks";
import { VideoChapterDto } from "~/lib/api/types";

interface ExpandedHoverCardProps {
  videoId: string | number;
  title: string;
  thumbnailUrl: string;
  duration?: number;
  eyebrow?: ReactNode;
  subscriptionTier?: string;
  customerId?: string | null;
  progressSeconds?: number;
  tags?: { name: string }[];
  chapters?: VideoChapterDto[];
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  portalContainer: HTMLElement;
  onMouseLeave: (e: React.MouseEvent) => void;
  /** When true, shows a lock icon overlay indicating content is locked */
  locked?: boolean;
  /** When true, shows a "DAY X" badge on the top-left corner */
  isSatsangOfDay?: boolean;
  /** The day number to display in the badge (e.g., 1 for "DAY 1") */
  dayOfSatsangOfDay?: number | null;
  /** Ref to the carousel scroll container for forwarding wheel events */
  carouselScrollContainerRef?: RefObject<HTMLDivElement | null>;
  /** When false, shows a "DRAFT" badge indicating unpublished content */
  isPublished?: boolean;
  /** When true, highlights this card as today's satsang of the week */
  isTodaySatsang?: boolean;
}

export function ExpandedHoverCard({
  videoId,
  title,
  thumbnailUrl,
  duration,
  eyebrow,
  subscriptionTier,
  customerId,
  progressSeconds,
  tags,
  chapters,
  position,
  portalContainer,
  onMouseLeave,
  locked = false,
  isSatsangOfDay = false,
  dayOfSatsangOfDay,
  carouselScrollContainerRef,
  isPublished,
  isTodaySatsang = false,
}: ExpandedHoverCardProps) {
  const { settings, updatePreferences } = useGlobal();
  const [showVideo, setShowVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(settings.videoAutoplayMuted);
  const [showDayBadge, setShowDayBadge] = useState(true);
  const expandedWidth = position.width * 1.2;

  // Transform tags to UITag format
  const uiTags: UITag[] = useMemo(() => {
    if (!tags) return [];
    return tags.map((tag) => ({
      label: tag.name,
      bgColor: "bg-white/10",
      textColor: "text-white",
    }));
  }, [tags]);

  // After 30 seconds, fade back to thumbnail
  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setShowVideo(false);
    }, 30000);

    return () => {
      clearTimeout(hideTimer);
    };
  }, []);

  // Hide the day badge after a short delay when video starts playing
  useEffect(() => {
    if (showVideo && isSatsangOfDay && dayOfSatsangOfDay) {
      const badgeTimer = setTimeout(() => {
        setShowDayBadge(false);
      }, 1500); // Hide badge after 1.5 seconds when video starts

      return () => clearTimeout(badgeTimer);
    } else if (!showVideo) {
      // Show badge again when we switch back to thumbnail
      setShowDayBadge(true);
    }
  }, [showVideo, isSatsangOfDay, dayOfSatsangOfDay]);

  // Calculate position relative to portal container - memoized to prevent recalculation on re-renders
  const { centerX, centerY } = useMemo(() => {
    const containerRect = portalContainer.getBoundingClientRect();
    const relativeX = position.x - containerRect.left;
    const relativeY = position.y - containerRect.top;
    return {
      centerX: relativeX + position.width / 2,
      centerY: relativeY + position.height / 2,
    };
  }, [
    portalContainer,
    position.x,
    position.y,
    position.width,
    position.height,
  ]);

  // =============================================================================
  // CAROUSEL SCROLL FORWARDING
  // =============================================================================
  // When this expanded card is rendered inside a Carousel, wheel events on the
  // card would normally be captured and not reach the carousel's scroll container
  // (since this card is rendered via a portal outside the carousel's DOM tree).
  //
  // This implementation forwards wheel events to the carousel so users can scroll
  // the carousel while hovering over the expanded card.
  //
  // Key challenges solved:
  //
  // 1. PORTAL ISOLATION: Since ExpandedHoverCard uses createPortal, it's rendered
  //    outside the Carousel's DOM hierarchy. Wheel events don't naturally bubble
  //    to the carousel. Solution: Carousel provides its scroll container ref via
  //    React Context (CarouselContext), and we manually forward wheel events.
  //
  // 2. SCROLL-SNAP INTERFERENCE: Carousels typically use `scroll-snap-type: x mandatory`
  //    which causes jarring jumps when programmatically scrolling with scrollBy().
  //    Even a 1px scroll would snap to the next slide. Solution: Temporarily disable
  //    scroll-snap during wheel interaction, restore it after 150ms of inactivity.
  //
  // 3. BROWSER NAVIGATION GESTURES: Without preventDefault(), horizontal wheel/trackpad
  //    gestures at scroll boundaries trigger browser back/forward navigation.
  //    Solution: Use native addEventListener with { passive: false } instead of React's
  //    onWheel (which is passive by default and can't preventDefault).
  //
  // 4. TOUCH DEVICE SUPPORT: CSS `touch-action: pan-x` on the container allows
  //    horizontal touch/trackpad scrolling to pass through natively.
  // =============================================================================

  const wheelEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const originalScrollSnapTypeRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = carouselScrollContainerRef?.current;
    const container = containerRef.current;
    if (!scrollContainer || !container) return;

    // Store the carousel's original scroll-snap setting to restore later
    originalScrollSnapTypeRef.current = scrollContainer.style.scrollSnapType;

    const handleWheel = (e: WheelEvent) => {
      // Prevent browser's back/forward navigation gestures when scrolling
      // at the edges of the carousel
      e.preventDefault();

      // Disable scroll-snap to allow smooth incremental scrolling.
      // Without this, scroll-snap-type: x mandatory causes the carousel
      // to jump to the next slide even with tiny scroll deltas.
      scrollContainer.style.scrollSnapType = "none";

      // Clear any pending restore timeout (we're still scrolling)
      if (wheelEndTimeoutRef.current) {
        clearTimeout(wheelEndTimeoutRef.current);
      }

      // Use deltaX for horizontal scroll, fall back to deltaY for mice/trackpads
      // that only report vertical deltas for horizontal scrolling
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      scrollContainer.scrollBy({ left: delta });

      // Restore scroll-snap after user stops scrolling (debounced 150ms).
      // This allows the carousel to snap to the nearest slide when done.
      wheelEndTimeoutRef.current = setTimeout(() => {
        if (originalScrollSnapTypeRef.current !== null) {
          scrollContainer.style.scrollSnapType =
            originalScrollSnapTypeRef.current;
        }
      }, 150);
    };

    // IMPORTANT: Must use native addEventListener with { passive: false }.
    // React's onWheel is passive by default (for performance), which prevents
    // calling preventDefault() and results in:
    // "Unable to preventDefault inside passive event listener invocation"
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (wheelEndTimeoutRef.current) {
        clearTimeout(wheelEndTimeoutRef.current);
      }
      // Restore scroll-snap when expanded card unmounts
      if (originalScrollSnapTypeRef.current !== null) {
        scrollContainer.style.scrollSnapType =
          originalScrollSnapTypeRef.current;
      }
    };
  }, [carouselScrollContainerRef]);

  return createPortal(
    <div
      className={`absolute ${Z_INDEX.header} bg-brand rounded-md overflow-hidden shadow-[0px_8px_32px_0px_rgba(0,0,0,0.4)]`}
      style={{
        left: `${centerX}px`,
        top: `${centerY}px`,
        width: `${expandedWidth}px`,
        transform: "translate(-50%, -50%) scale(1)",
        pointerEvents: "auto",
        animation: "expandCard 450ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        touchAction: "pan-x", // Allow horizontal touch scrolling to pass through
      }}
      onMouseLeave={onMouseLeave}
      ref={containerRef}
    >
      <Stack gap={2} className="pb-12">
        <div className="relative w-full h-full flex flex-col">
          {/* Video/Thumbnail Section - Landscape aspect ratio (16:9) */}
          <div className="relative w-full aspect-video flex-shrink-0">
            {/* Video Player - fades out after 15s */}
            {showVideo && (
              <div
                className={`absolute inset-0 ${
                  !showVideo ? "animate-[fadeOut_500ms_ease-out_forwards]" : ""
                }`}
              >
                <HoverVideoPlayer
                  videoId={videoId}
                  title={title}
                  subscriptionTier={subscriptionTier}
                  customerId={customerId}
                  progressSeconds={progressSeconds}
                  muted={isMuted}
                  thumbnailUrl={thumbnailUrl}
                />
              </div>
            )}

            {/* Thumbnail - fades in after 15s */}
            {!showVideo && (
              <div className="absolute inset-0 w-full h-full animate-[crossFade_700ms_ease-out_forwards]">
                <div className="relative w-full h-full">
                  <img
                    src={thumbnailUrl}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
                  />
                </div>
              </div>
            )}

            {/* Mute/Unmute Button */}
            {showVideo && (
              <button
                className="absolute top-[75%] left-[85%] z-20 text-white hover:opacity-80 transition-opacity backdrop-blur-xl rounded-full"
                onClick={(e) => {
                  e.nativeEvent.stopImmediatePropagation(); // Stop native event BEFORE state update
                  e.stopPropagation(); // Stop React synthetic event
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  updatePreferences({ videoAutoplayMuted: newMuted });
                }}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? (
                  <IconSoundOff className="icon-xl" />
                ) : (
                  <IconSoundOn className="icon-xl" />
                )}
              </button>
            )}

            {/* Lock icon overlay for locked content */}
            {locked && (
              <div
                className="absolute top-8 right-8 w-28 h-28 rounded-full bg-black/50 flex items-center justify-center z-20"
                aria-label="Locked content"
              >
                <IconLock className="w-14 h-14 text-white" />
              </div>
            )}

            {/* Day badge for Satsang of the Week - fades out when video starts playing */}
            {isSatsangOfDay && dayOfSatsangOfDay && (
              <div
                className={`absolute top-8 left-8 rounded-sm px-8 py-4 flex items-center justify-center gap-4 z-20 transition-opacity duration-500 ${isTodaySatsang ? "bg-gold" : "bg-purple-dark"} ${
                  showDayBadge ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                aria-label={isTodaySatsang ? `Today - Day ${dayOfSatsangOfDay}` : `Day ${dayOfSatsangOfDay}`}
              >
                <span className={`text-10 font-700 uppercase tracking-wide ${isTodaySatsang ? "text-brand-dark" : "text-white"}`}>
                  {isTodaySatsang ? `Today` : `Day ${dayOfSatsangOfDay}`}
                </span>
              </div>
            )}

            {/* DRAFT badge for unpublished content - bottom-left corner */}
            {isPublished === false && (
              <div className="absolute bottom-8 left-8 z-20">
                <DraftBadge size="sm" />
              </div>
            )}

            {/* Clickable overlay to capture clicks - iframe blocks click events */}
            {/* Note: This is intentionally NOT a Link - clicks bubble up through React's event tree
                to the parent ProgressAwareVideoCardLink which handles access checks and navigation */}
            <div
              className="absolute inset-0 z-10 cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label="Navigate to video"
              onKeyDown={(e) => {
                // Allow keyboard activation (Enter/Space) to bubble up like a click
                if (e.key === "Enter" || e.key === " ") {
                  e.currentTarget.click();
                }
              }}
            />
          </div>
        </div>

        {/* Info Section: Title, Eyebrow, Tags, and Chapters */}
        <div className="flex-shrink-0">
          {/* Title and Eyebrow */}
          <div className="mb-12 px-16">
            {eyebrow &&
              (typeof eyebrow === "string" ? (
                <p className="text-gold text-12 font-avenir-next mb-4 uppercase">
                  {eyebrow}
                </p>
              ) : (
                <div className="mb-4">{eyebrow}</div>
              ))}
            <p className="text-white text-16 font-avenir-next uppercase font-900 leading-20">
              {title}
            </p>
          </div>

          {/* Tags */}
          {uiTags.length > 0 && (
            <CollapsibleTags
              tags={uiTags}
              maxVisible={3}
              maxWidth="100%"
              minWidth="50px"
              className="px-16"
            />
          )}

          {/* Chapters */}
          {chapters && chapters.length > 0 && (
            <CompactChaptersList
              className="border-t-2 border-brand-light mt-12 pt-12"
              chapters={chapters}
              videoId={videoId}
              initialExpanded={false}
            />
          )}
        </div>
      </Stack>
    </div>,
    portalContainer,
  );
}

ExpandedHoverCard.displayName = "ExpandedHoverCard";
