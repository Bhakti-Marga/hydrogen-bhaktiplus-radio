import { Carousel } from "~/components";
import { VideoCard } from "~/components/Card/VideoCard";
import { Link } from "~/components/Link/Link";
import { useHeaderSubmenu } from "~/contexts/HeaderSubmenuProvider";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { IconChevron } from "~/components/Icons";
import { useCallback } from "react";
import type { CardSize, CardTitleSize } from "~/components/Card/Card";

interface VideoItem {
  title: string;
  link: string;
  image?: string | null;
  imageVariants?: string | null;
  /** When true, shows a "NEW" badge on the card */
  isNew?: boolean;
  /** When true, shows an "UPCOMING" badge (takes priority over isNew) */
  isUpcoming?: boolean;
}

/** Maps CardSize to corresponding CSS variable class for width */
const sizeWidthClasses: Record<CardSize, string> = {
  auto: "w-full",
  xxs: "w-[var(--card-width-xxs)]",
  xs: "w-[var(--card-width-xs)]",
  sm: "w-[var(--card-width-sm)]",
  md: "w-[var(--card-width-md)]",
  lg: "w-[var(--card-width-lg)]",
};

interface SubmenuVideoCarouselProps {
  items: VideoItem[];
  /** When provided, shows a "View All" button at the end of the carousel */
  viewAllLink?: string;
  /** Card size - defaults to "xs" (226px). Use "xxs" for smaller cards (158px) */
  cardSize?: CardSize;
  /** Title text size - defaults to "base" for submenu cards */
  titleSize?: CardTitleSize;
  /** Gap between cards in pixels - defaults to 8 */
  gap?: number;
}

export function SubmenuVideoCarousel({
  items,
  viewAllLink,
  cardSize = "xs",
  titleSize = "base",
  gap = 8,
}: SubmenuVideoCarouselProps) {
  const { setActiveSubmenu } = useHeaderSubmenu();
  const { strings } = useTranslations();

  /**
   * Close the megamenu immediately when a video card is clicked.
   * Provides instant feedback and prevents the menu from lingering during navigation.
   */
  const handleCardClick = useCallback(() => {
    setActiveSubmenu(null);
  }, [setActiveSubmenu]);

  // Get the width class for the "Explore All" button based on card size
  const exploreAllWidthClass = sizeWidthClasses[cardSize];

  return (
    <Carousel
      spaceBetween={gap}
      disableScrollSnap
      arrowBgClass="bg-brand/90 hover:bg-brand"
    >
      {items.map((item, idx) => (
        <Carousel.Slide key={idx} className="flex-shrink-0">
          <Link to={item.link} onClick={handleCardClick}>
            <VideoCard
              title={item.title}
              image={item.image ?? ""}
              imageVariants={item.imageVariants}
              aspectRatio="landscape"
              size={cardSize}
              titleSize={titleSize}
              isNew={item.isNew}
              isUpcoming={item.isUpcoming}
            />
          </Link>
        </Carousel.Slide>
      ))}
      {viewAllLink && (
        <Carousel.Slide className="flex-shrink-0">
          <Link
            to={viewAllLink}
            onClick={handleCardClick}
            className={`flex flex-col items-center justify-center ${exploreAllWidthClass} aspect-video group`}
          >
            <div className="w-48 h-48 rounded-full bg-brand-light flex items-center justify-center">
              <span className="w-16 -rotate-90 text-white">
                <IconChevron />
              </span>
            </div>
            <span className="body-b4 text-white mt-8">
              {strings.explore_all}
            </span>
          </Link>
        </Carousel.Slide>
      )}
    </Carousel>
  );
}
