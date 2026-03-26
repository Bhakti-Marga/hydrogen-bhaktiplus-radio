import { ReactNode, useRef, useState, useEffect, Children, ReactElement, cloneElement, isValidElement } from "react";
import "./MobileSlideshow.css";

export interface MobileSlideshowProps {
  children: ReactNode;
  /** Custom class for the container */
  className?: string;
  /** Gap between items on tablet+ view (default: 8px) */
  gap?: number;
  /** Show progress bar instead of dots for many items */
  showProgressBar?: boolean;
}

/**
 * MobileSlideshow - Instagram-style horizontal swipe gallery for mobile
 * 
 * On mobile: Shows one full-width slide at a time with dot indicators and swipe gesture
 * On tablet+: Renders children in a normal stacked layout
 * 
 * Usage:
 * ```tsx
 * <MobileSlideshow>
 *   <MobileSlideshow.Slide>
 *     <FeatureCard ... />
 *   </MobileSlideshow.Slide>
 *   <MobileSlideshow.Slide>
 *     <FeatureCard ... />
 *   </MobileSlideshow.Slide>
 * </MobileSlideshow>
 * ```
 */
export function MobileSlideshow({
  children,
  className = "",
  gap = 8,
  showProgressBar = false,
}: MobileSlideshowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  const slides = Children.toArray(children).filter(
    (child) => isValidElement(child) && (child.type as { displayName?: string }).displayName === 'MobileSlideshowSlide'
  ) as ReactElement[];
  
  const slideCount = slides.length;

  // Check if we're on mobile (below tablet breakpoint of 640px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Track scroll position to update active dot
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const slideWidth = container.clientWidth;
      const newIndex = Math.round(scrollLeft / slideWidth);
      setActiveIndex(Math.min(Math.max(newIndex, 0), slideCount - 1));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isMobile, slideCount]);

  // Scroll to a specific slide when dot is clicked
  const scrollToSlide = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const slideWidth = container.clientWidth;
    container.scrollTo({
      left: slideWidth * index,
      behavior: "smooth",
    });
  };

  // Desktop/Tablet view - render children normally
  if (!isMobile) {
    return (
      <div className={`mobile-slideshow-desktop ${className}`} style={{ gap: `${gap}px` }}>
        {slides.map((slide, index) => (
          <div key={index} className="mobile-slideshow-desktop-item">
            {isValidElement(slide) ? (slide.props as { children?: ReactNode }).children : slide}
          </div>
        ))}
      </div>
    );
  }

  // Mobile view - horizontal swipe gallery
  return (
    <div className={`mobile-slideshow ${className}`}>
      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="mobile-slideshow-scroll"
      >
        {slides.map((slide, index) => (
          <div key={index} className="mobile-slideshow-slide">
            {isValidElement(slide) ? (slide.props as { children?: ReactNode }).children : slide}
          </div>
        ))}
      </div>

      {/* Indicators */}
      {slideCount > 1 && (
        <div className="mobile-slideshow-indicators">
          {showProgressBar ? (
            // Progress bar style for many items
            <div className="mobile-slideshow-progress-bar">
              <div 
                className="mobile-slideshow-progress-fill"
                style={{ width: `${((activeIndex + 1) / slideCount) * 100}%` }}
              />
            </div>
          ) : (
            // Dot indicators
            <div className="mobile-slideshow-dots">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => scrollToSlide(index)}
                  className={`mobile-slideshow-dot ${index === activeIndex ? 'active' : ''}`}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === activeIndex ? 'true' : 'false'}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Slide wrapper component
export interface MobileSlideshowSlideProps {
  children: ReactNode;
  className?: string;
}

export function MobileSlideshowSlide({ children, className = "" }: MobileSlideshowSlideProps) {
  return <div className={className}>{children}</div>;
}
MobileSlideshowSlide.displayName = 'MobileSlideshowSlide';

// Attach Slide as static property
MobileSlideshow.Slide = MobileSlideshowSlide;

export default MobileSlideshow;

