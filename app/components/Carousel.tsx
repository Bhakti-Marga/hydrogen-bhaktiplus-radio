import {
  ReactNode,
  useRef,
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";
import { IconChevron } from "~/components/Icons";
import "./Carousel.css";

// =============================================================================
// CAROUSEL CONTEXT
// =============================================================================
// Provides the carousel's scroll container ref to descendant components.
// This is used by ExpandedHoverCard to forward wheel events to the carousel
// when the expanded card is rendered via a portal (outside the carousel's DOM tree).
// See ExpandedHoverCard.tsx for detailed documentation on the scroll forwarding logic.
// =============================================================================
interface CarouselContextValue {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

export function useCarouselContext() {
  return useContext(CarouselContext);
}

export interface CarouselProps {
  children: ReactNode;
  spaceBetween?: number;
  className?: string;
  disableAnimation?: boolean;
  disableScrollSnap?: boolean;
  /** Custom background classes for arrow buttons. Defaults to dark variant. */
  arrowBgClass?: string;
  /** Hide the left/right navigation buttons */
  hideNavigation?: boolean;
  /** Index of the slide to scroll to on mount (0-based). Defaults to 0 (leftmost). */
  initialIndex?: number;
}

/** Default arrow background: dark blue with hover state */
const DEFAULT_ARROW_BG = "bg-brand-dark/80 hover:bg-brand-dark/90";

export function Carousel({
  children,
  spaceBetween = 8,
  className = "",
  disableAnimation = false,
  disableScrollSnap = false,
  arrowBgClass = DEFAULT_ARROW_BG,
  hideNavigation = false,
  initialIndex,
}: CarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Start with both buttons hidden to prevent hydration mismatch.
  // Server renders with these initial values, and useEffect updates them after hydration.
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position to show/hide navigation buttons
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;

    // Scroll to initial slide if specified (instant, before user sees the carousel)
    if (container && initialIndex && initialIndex > 0) {
      const targetSlide = container.children[initialIndex] as HTMLElement;
      if (targetSlide) {
        container.scrollTo({ left: targetSlide.offsetLeft, behavior: "instant" });
      }
    }

    checkScrollPosition();
    if (!container) return;

    container.addEventListener("scroll", checkScrollPosition);
    window.addEventListener("resize", checkScrollPosition);

    // Use ResizeObserver to detect when content changes size (e.g., async-loaded items)
    // This ensures arrows appear after children are rendered in Suspense/Await scenarios
    const resizeObserver = new ResizeObserver(() => {
      checkScrollPosition();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Get the width of the first card to create an overlap effect
    // This ensures the last partially visible card becomes the first visible card
    const firstCard = container.firstElementChild as HTMLElement;
    const cardWidth = firstCard?.offsetWidth ?? 0;
    const gap = spaceBetween;

    // Scroll by container width minus one card width (plus gap)
    // This creates overlap so users don't miss any content
    const scrollAmount = container.clientWidth - cardWidth - gap;
    const targetScroll =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  return (
    <CarouselContext.Provider value={{ scrollContainerRef }}>
      <div
        className={`carousel-container group relative min-w-0 w-full ${className} ${
          canScrollLeft ? "can-scroll-left" : ""
        } ${canScrollRight ? "can-scroll-right" : ""}`}
      >
        {/* Scroll Container - pt-8 allows space for hover translate-y effect, items-stretch ensures equal heights */}
        <div
          ref={scrollContainerRef}
          className={`overflow-x-auto scrollbar-hide flex items-stretch pt-8 ${
            disableAnimation ? "" : "animate-slide-left-container"
          }`}
          style={{
            scrollSnapType: disableScrollSnap ? "none" : "x mandatory",
            gap: `${spaceBetween}px`,
          }}
        >
          {children}
        </div>

        {/* Navigation Buttons */}
        {!hideNavigation && canScrollLeft && (
          <button
            className={`absolute left-0 top-0 bottom-0 w-60 px-16 flex items-center justify-center z-50 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${arrowBgClass}`}
            onClick={() => scroll("left")}
            aria-label="Previous slide"
          >
            <IconChevron className="rotate-[90deg]" />
          </button>
        )}
        {!hideNavigation && canScrollRight && (
          <button
            className={`absolute right-0 top-0 bottom-0 w-60 px-16 flex items-center justify-center z-50 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${arrowBgClass}`}
            onClick={() => scroll("right")}
            aria-label="Next slide"
          >
            <IconChevron className="rotate-[-90deg]" />
          </button>
        )}
      </div>
    </CarouselContext.Provider>
  );
}

// Slide component for scroll-snap
export interface CarouselSlideProps {
  children: ReactNode;
  className?: string;
  /** Disable the hover translate-y effect */
  disableHover?: boolean;
}

export function CarouselSlide({
  children,
  className = "",
  disableHover = false,
}: CarouselSlideProps) {
  return (
    <div
      className={`relative transition-transform duration-300 ease-out flex-shrink-0 flex flex-col ${className} group/slide`}
      style={{
        scrollSnapAlign: "start",
        scrollSnapStop: "normal",
      }}
    >
      <div
        className={`h-full flex-1 ${
          disableHover
            ? ""
            : "group-hover/slide:-translate-y-8 group-hover/slide:z-10 transition-transform duration-300 ease-out"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

Carousel.Slide = CarouselSlide;
