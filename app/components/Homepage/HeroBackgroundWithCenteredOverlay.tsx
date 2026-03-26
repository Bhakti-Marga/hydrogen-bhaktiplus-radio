import { ReactNode } from "react";
import { Image } from "~/lib/types";

interface HeroBackgroundWithCenteredOverlayProps {
  backgroundImage?: Image;
  backgroundColor?: string;
  imagePosition?: "center" | "top" | "bottom";
  children: ReactNode;
}

/**
 * Hero background with overlays optimized for centered content.
 * Uses a radial gradient that darkens edges while keeping center readable.
 */
export function HeroBackgroundWithCenteredOverlay({
  backgroundImage,
  backgroundColor,
  imagePosition = "center",
  children,
}: HeroBackgroundWithCenteredOverlayProps) {
  // For 'center' position, use hero__background-image class which shifts right on mobile
  // For 'top' and 'bottom', use Tailwind classes directly (no mobile shift)
  const positionClass = imagePosition === "center" 
    ? "hero__background-image" 
    : imagePosition === "top" 
      ? "object-top" 
      : "object-bottom";

  return (
    <section
      className="hero relative w-full -mt-[var(--header-height)] overflow-hidden"
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 w-full h-full">
          <img
            src={backgroundImage.url}
            alt={backgroundImage.altText || ""}
            className={`w-full h-full object-cover ${positionClass}`}
          />
        </div>
      )}

      {/* Centered content overlay - darker overall with vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 70% at 50% 50%, rgba(5, 18, 55, 0.3) 0%, rgba(5, 18, 55, 0.7) 100%),
            linear-gradient(to top, rgba(5, 18, 55, 0.9) 0%, rgba(5, 18, 55, 0.1) 40%)
          `,
        }}
      />

      {/* Content */}
      <div className="relative pt-[var(--header-height)]">{children}</div>
    </section>
  );
}
