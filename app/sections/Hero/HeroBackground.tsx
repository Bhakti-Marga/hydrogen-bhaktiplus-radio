import { ReactNode } from "react";
import { Image } from "~/lib/types";

export interface HeroBackgroundProps {
  backgroundImage?: Image;
  backgroundColor?: string;
  showBackgroundImage?: boolean;
  imageCover?: boolean;
  /**
   * Responsive object-position for background image
   * Default shifts right on mobile to show more of right side, centers on tablet+
   * Use 'top' or 'bottom' for vertical positioning (overrides mobile shift behavior)
   */
  imagePosition?: 'center' | 'top' | 'bottom';
  className?: string;
  children: ReactNode;
}

export function HeroBackground({
  backgroundImage,
  backgroundColor,
  showBackgroundImage = true,
  imageCover = true,
  imagePosition = 'center',
  className = "",
  children,
}: HeroBackgroundProps) {
  // For 'center' position, use hero__background-image class which shifts right on mobile
  // For 'top' and 'bottom', use Tailwind classes directly (no mobile shift)
  const positionClass = imagePosition === 'center' 
    ? 'hero__background-image' 
    : imagePosition === 'top' 
      ? 'object-top' 
      : 'object-bottom';

  return (
    <section
      className={`hero relative w-full -mt-[var(--header-height)] ${className} overflow-hidden`}
    >
      <div
        className="hero__background absolute inset-0 w-full h-full overflow-hidden"
        style={{
          backgroundColor: backgroundColor || undefined,
        }}
      >
        {backgroundImage && showBackgroundImage && (
          <img
            src={backgroundImage.url}
            alt={backgroundImage.altText || ""}
            className={`w-full h-full ${imageCover ? "object-cover" : "object-contain"} ${positionClass}`}
          />
        )}
      </div>
      <div className="relative pt-[var(--header-height)]">{children}</div>
    </section>
  );
}
