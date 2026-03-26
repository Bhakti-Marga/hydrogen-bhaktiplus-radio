import { ReactNode } from "react";
import { getThumbnailSizes, getSrcSetFromVariants } from "~/lib/utils";

export type CardSize = "auto" | "xxs" | "xs" | "sm" | "md" | "lg";
export type CardAspectRatio = "square" | "landscape" | "portrait";
export type CardTitleSize = "sm" | "base" | "lg" | "xl";

const sizeClasses: Record<CardSize, string> = {
  auto: "w-full",                   // fluid width (fills container)
  xxs: "w-[var(--card-width-xxs)]", // 158px (30% smaller than xs)
  xs: "w-[var(--card-width-xs)]",   // 226px
  sm: "w-[var(--card-width-sm)]",   // 256px
  md: "w-[var(--card-width-md)]",   // 300px
  lg: "w-[var(--card-width-lg)]",   // 318px
};

const aspectRatioClasses: Record<CardAspectRatio, string> = {
  square: "aspect-square",
  landscape: "aspect-video",
  portrait: "aspect-[2/3]",
};

export interface CardProps {
  children: ReactNode;
  size?: CardSize;
  aspectRatio?: CardAspectRatio;
  className?: string;
}

export function Card({
  children,
  size = "auto",
  aspectRatio = "landscape",
  className = "",
}: CardProps) {
  const sizeClass = sizeClasses[size];
  const aspectRatioClass = aspectRatioClasses[aspectRatio];

  return (
    <div className={`relative overflow-hidden rounded-md ${aspectRatioClass} ${sizeClass} ${className}`}>
      {children}
    </div>
  );
}

export interface CardImageProps {
  src: string;
  alt: string;
  lazy?: boolean;
  className?: string;
  /** Card size for srcset sizes attribute optimization */
  cardSize?: CardSize;
  /** Pre-computed thumbnail variants from API (JSON string) */
  variants?: string | null;
}

// Debug flag - set to true to show srcset overlay on images
const DEBUG_SRCSET = false;

export function CardImage({ src, alt, className = "", lazy = true, cardSize = "auto", variants }: CardImageProps) {
  // Only use srcset if API provides variants AND originalUrl matches src
  const srcSet = variants ? getSrcSetFromVariants(variants, src) : "";
  const sizes = srcSet ? getThumbnailSizes(cardSize) : undefined;
  const imgClassName = `absolute inset-[-1px] w-[calc(100%+4px)] h-[calc(100%+4px)] object-cover ${className}`;

  // Debug overlay component
  const DebugOverlay = () => {
    if (!DEBUG_SRCSET) return null;
    const widths = srcSet ? srcSet.match(/\d+w/g)?.join(", ") : "none";
    return (
      <div className="absolute top-0 left-0 right-0 bg-black/70 text-white text-8 p-4 z-10 overflow-hidden">
        <div className="truncate">srcset: {widths || "none"}</div>
        <div className="truncate">variants: {variants ? "✓" : "✗"}</div>
      </div>
    );
  };

  // Use <picture> with srcset when variants are available
  if (srcSet) {
    return (
      <>
        <picture>
          <source srcSet={srcSet} sizes={sizes} />
          <img src={src} alt={alt} loading={lazy ? "lazy" : "eager"} className={imgClassName} />
        </picture>
        <DebugOverlay />
      </>
    );
  }

  // No variants: regular img tag with original URL
  return (
    <>
      <img src={src} alt={alt} loading={lazy ? "lazy" : "eager"} className={imgClassName} />
      <DebugOverlay />
    </>
  );
}

export interface CardOverlayProps {
  children: ReactNode;
  position?: "top" | "bottom" | "center";
  alignment?: "left" | "center" | "right";
  className?: string;
}

export function CardOverlay({
  children,
  position = "bottom",
  alignment = "left",
  className = "",
}: CardOverlayProps) {
  const positionClass = {
    top: "top-0",
    bottom: "bottom-0",
    center: "top-1/2 -translate-y-1/2",
  }[position];

  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[alignment];

  return (
    <div className={`absolute left-0 right-0 p-16 max-w-[76%] ${positionClass} ${alignmentClass} ${className}`}>
      {children}
    </div>
  );
}

export interface CardTitleProps {
  children: ReactNode;
  className?: string;
  /** Title text size - defaults to "xl" */
  size?: CardTitleSize;
}

const titleSizeClasses: Record<CardTitleSize, string> = {
  sm: "text-sm leading-8",
  base: "text-base leading-14",
  lg: "text-lg leading-20",
  xl: "text-xl leading-20",
};

export function CardTitle({ children, className = "", size = "xl" }: CardTitleProps) {
  const sizeClass = titleSizeClasses[size];
  return (
    <h3 className={`text-white font-avenir-next uppercase font-700 ${sizeClass} ${className}`}>
      {children}
    </h3>
  );
}

export interface CardEyebrowProps {
  children: ReactNode;
  className?: string;
}

export function CardEyebrow({ children, className = "" }: CardEyebrowProps) {
  return (
    <div className={`text-gold text-400 font-avenir-next text-12 leading-[23px] ${className}`}>
      {children}
    </div>
  );
}

// Attach subcomponents
Card.Image = CardImage;
Card.Overlay = CardOverlay;
Card.Title = CardTitle;
Card.Eyebrow = CardEyebrow;
