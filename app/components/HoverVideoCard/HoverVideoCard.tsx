import { useState, useRef, useEffect, useId, ReactNode } from "react";
import { VideoCard, DraftBadge } from "~/components";
import { ExpandedHoverCard } from "./ExpandedHoverCard";
import { useVideoPlayer } from "~/contexts/VideoPlayerProvider";
import { useCarouselContext } from "~/components/Carousel";
import { IconLock, IconBadgeNew, IconBadgeUpcoming } from "~/components/Icons";
import type { VideoChapterDto } from "~/lib/api/types";

interface HoverVideoCardProps {
  videoId: string | number;
  title: string;
  thumbnailUrl: string;
  /** Pre-computed thumbnail variants from API (JSON string) */
  thumbnailUrlVariants?: string | null;
  duration?: number;
  eyebrow?: ReactNode;
  size?: "auto" | "xs" | "sm" | "md" | "lg";
  aspectRatio?: "square" | "portrait" | "landscape";
  subscriptionTier?: string;
  customerId?: string | null;
  progressSeconds?: number;
  tags?: { name: string }[];
  chapters?: VideoChapterDto[];
  /** When true, disables clickable hover styling (shadow, cursor) */
  disableClickableStyle?: boolean;
  /** When true, shows a lock icon overlay indicating content is locked */
  locked?: boolean;
  /** When true, shows a "DAY X" badge on the top-left corner */
  isSatsangOfDay?: boolean;
  /** The day number to display in the badge (e.g., 1 for "DAY 1") */
  dayOfSatsangOfDay?: number | null;
  /** When true, shows a "NEW" badge on the top-left corner */
  isNew?: boolean;
  /** When true, shows an "UPCOMING" badge (takes priority over isNew) */
  isUpcoming?: boolean;
  /** When false, shows a "DRAFT" badge indicating unpublished content */
  isPublished?: boolean;
  /** When true, highlights this card as today's satsang of the week */
  isTodaySatsang?: boolean;
}

export function HoverVideoCard({
  videoId,
  title,
  thumbnailUrl,
  thumbnailUrlVariants,
  duration,
  eyebrow,
  size = "md",
  aspectRatio = "landscape",
  subscriptionTier,
  customerId,
  progressSeconds,
  tags,
  chapters,
  disableClickableStyle = false,
  locked = false,
  isSatsangOfDay = false,
  dayOfSatsangOfDay,
  isNew = false,
  isUpcoming = false,
  isPublished,
  isTodaySatsang = false,
}: HoverVideoCardProps) {
  const cardId = useId();
  const { expandedCardId, setExpandedCard, stopSignal, playingVideoId } =
    useVideoPlayer();
  const carouselContext = useCarouselContext();
  const showExpandedCard = expandedCardId === cardId;
  const lastStopSignalRef = useRef(stopSignal);

  const [cardPosition, setCardPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);
  const scrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);

  // Track scroll state to prevent opening expanded card while scrolling
  useEffect(() => {
    if (!cardRef.current) return;

    const scrollContainer = cardRef.current.closest(".overflow-x-auto");
    if (!scrollContainer) return;

    const handleScroll = () => {
      isScrollingRef.current = true;

      // Clear any existing timeout
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }

      // Reset scrolling flag after scroll ends (150ms debounce)
      // If mouse is still hovering over this card, open the expanded card
      scrollEndTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        if (isHoveringRef.current) {
          setExpandedCard(cardId, portalContainer?.id || null);
        }
      }, 150);
    };

    scrollContainer.addEventListener("scroll", handleScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
    };
  }, [cardId, portalContainer?.id, setExpandedCard]);

  // Find portal container on mount
  useEffect(() => {
    if (!cardRef.current) return;

    // Look for the nearest portal container (ends with -portal-container)
    let element = cardRef.current.parentElement;
    while (element) {
      if (element.id && element.id.endsWith("-portal-container")) {
        setPortalContainer(element);
        break;
      }
      element = element.parentElement;
    }
  }, [videoId]);

  // Set position once when expanded card is shown, and close on carousel scroll
  useEffect(() => {
    if (!showExpandedCard || !cardRef.current) return;

    // Initialize lastStopSignalRef to current value when card first expands
    // This prevents responding to "old" stop signals sent before this card expanded
    lastStopSignalRef.current = stopSignal;

    // Set position once
    const rect = cardRef.current.getBoundingClientRect();
    setCardPosition({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });

    // Close expanded card if carousel scrolls
    const scrollContainer = cardRef.current.closest(".overflow-x-auto");
    const handleScroll = () => {
      setExpandedCard(null, null);
    };

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [showExpandedCard, setExpandedCard, videoId, stopSignal]);

  // Watch for stop signals from the global provider - collapse this card if another video starts
  useEffect(() => {
    // Only respond to stop signals if:
    // 1. This card is currently expanded
    // 2. The stop signal changed
    // 3. This video is not the one currently playing
    if (
      showExpandedCard &&
      stopSignal !== lastStopSignalRef.current &&
      playingVideoId !== videoId
    ) {
      setExpandedCard(null, null);
    }
    lastStopSignalRef.current = stopSignal;
  }, [stopSignal, playingVideoId, videoId, showExpandedCard, setExpandedCard]);

  const handleOriginalCardMouseEnter = (e: React.MouseEvent) => {
    isHoveringRef.current = true;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      // Don't open expanded card if carousel is currently scrolling
      // (it will open when scrolling stops if still hovering)
      if (isScrollingRef.current) {
        return;
      }
      setExpandedCard(cardId, portalContainer?.id || null);
    }, 200);
  };

  const handleOriginalCardMouseLeave = (e: React.MouseEvent) => {
    isHoveringRef.current = false;
    // Don't do anything else - let the expanded card handle the mouse leave
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleExpandedCardMouseLeave = (e: React.MouseEvent) => {
    setExpandedCard(null, null);
  };

  return (
    <div
      ref={cardRef}
      className={`relative ${disableClickableStyle ? "cursor-default" : ""}`}
    >
      <div
        onMouseEnter={handleOriginalCardMouseEnter}
        onMouseLeave={handleOriginalCardMouseLeave}
        className="hover:shadow-[0px_4px_14px_0px_#0C162F4D]"
      >
        <VideoCard
          size={size}
          aspectRatio={aspectRatio}
          eyebrow={eyebrow}
          title={title}
          duration={duration}
          image={thumbnailUrl}
          imageVariants={thumbnailUrlVariants}
          progress={
            progressSeconds && duration
              ? Math.round((progressSeconds / duration) * 100)
              : undefined
          }
          videoId={videoId}
          isPublished={isPublished}
        />
        {/* Lock icon overlay for locked content */}
        {locked && (
          <div
            className={`absolute top-8 right-8 rounded-full bg-black/50 flex items-center justify-center ${
              aspectRatio === "portrait" ? "w-48 h-48" : "w-28 h-28"
            }`}
            aria-label="Locked content"
          >
            <IconLock
              className={`text-white ${
                aspectRatio === "portrait" ? "w-24 h-24" : "w-14 h-14"
              }`}
            />
          </div>
        )}
        {/* Day badge for Satsang of the Week */}
        {isSatsangOfDay && dayOfSatsangOfDay && (
          <div
            className={`absolute top-8 left-8 rounded-sm px-8 py-4 flex items-center justify-center gap-4 ${isTodaySatsang ? "bg-gold" : "bg-purple-dark"}`}
            aria-label={isTodaySatsang ? `Today - Day ${dayOfSatsangOfDay}` : `Day ${dayOfSatsangOfDay}`}
          >
            <span className={`text-10 font-700 uppercase tracking-wide ${isTodaySatsang ? "text-brand-dark" : "text-white"}`}>
              {isTodaySatsang ? `Today` : `Day ${dayOfSatsangOfDay}`}
            </span>
          </div>
        )}
        {/* UPCOMING badge takes priority over NEW badge */}
        {isUpcoming && !isSatsangOfDay && (
          <div className="absolute top-12 left-0 drop-shadow-md">
            <IconBadgeUpcoming className="w-56 h-auto" />
          </div>
        )}
        {/* NEW badge for recently published content (only if not upcoming) */}
        {isNew && !isSatsangOfDay && !isUpcoming && (
          <div className="absolute top-12 left-0 drop-shadow-md">
            <IconBadgeNew className="w-56 h-auto" />
          </div>
        )}
      </div>
      {showExpandedCard && cardPosition && portalContainer && (
        <ExpandedHoverCard
          videoId={videoId}
          title={title}
          thumbnailUrl={thumbnailUrl}
          duration={duration}
          eyebrow={eyebrow}
          subscriptionTier={subscriptionTier}
          customerId={customerId}
          progressSeconds={progressSeconds}
          tags={tags}
          chapters={chapters}
          position={cardPosition}
          portalContainer={portalContainer}
          onMouseLeave={handleExpandedCardMouseLeave}
          locked={locked}
          isSatsangOfDay={isSatsangOfDay}
          dayOfSatsangOfDay={dayOfSatsangOfDay}
          isTodaySatsang={isTodaySatsang}
          carouselScrollContainerRef={carouselContext?.scrollContainerRef}
          isPublished={isPublished}
        />
      )}
    </div>
  );
}

HoverVideoCard.displayName = "HoverVideoCard";
