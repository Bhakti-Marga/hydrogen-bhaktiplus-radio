import { cn, formatVideoDuration } from "~/lib/utils";
import { useRootLoaderData } from "~/hooks";
import { userHasAnyPlan } from "~/lib/utils/content";
import { CONTENT_TYPE_ID_TO_TYPE } from "~/lib/constants";
import { CTAButtons } from "~/components/ContentButtons/CTAButtons";
import { Card, type CardSize, type CardAspectRatio } from "./Card";
import type { Content, ContentType } from "~/lib/types";

export interface CatalogCardProps {
  /** The content object with all necessary data for CTAButtons */
  content: Content;
  /** Override title (defaults to content.title) */
  title?: string;
  /** Eyebrow text (e.g., subtitle) */
  eyebrow?: string;
  /** Override image URL (defaults to content.thumbnailUrl) */
  image?: string;
  /** Pre-computed thumbnail variants from API (JSON string) */
  imageVariants?: string | null;
  size?: CardSize;
  aspectRatio?: CardAspectRatio;
  className?: string;
  /** Description text to show below the card */
  description?: string | null;
  /** Duration in seconds to display */
  durationSeconds?: number | null;
}

/**
 * Get content type from content object
 */
function getContentType(content: Content): ContentType | undefined {
  if (!content.contentTypeId) return undefined;
  return CONTENT_TYPE_ID_TO_TYPE[content.contentTypeId as keyof typeof CONTENT_TYPE_ID_TO_TYPE];
}

/**
 * Catalog card component that displays purchasable content.
 * Shows subscription plan and/or PPV purchase buttons based on content configuration.
 */
export function CatalogCard({
  content,
  title,
  eyebrow,
  image,
  imageVariants,
  size = "md",
  aspectRatio = "portrait",
  className = "",
  description,
  durationSeconds,
}: CatalogCardProps) {
  const { subscriptionTier } = useRootLoaderData();
  
  // Use content data with optional overrides
  const displayTitle = title ?? content.title;
  const displayImage = image ?? content.thumbnailUrl;
  
  // Get content type for CTAButtons
  const contentType = getContentType(content);
  
  // Check if user has any subscription plan
  const hasAnyPlan = userHasAnyPlan(subscriptionTier);
  
  const sizeClasses: Record<CardSize, string> = {
    auto: "w-full",
    xxs: "w-[var(--card-width-xxs)]",
    xs: "w-[var(--card-width-xs)]",
    sm: "w-[var(--card-width-sm)]",
    md: "w-[var(--card-width-md)]",
    lg: "w-[var(--card-width-lg)]",
  };
  
  const wrapperWidthClass = sizeClasses[size];

  return (
    <div className={cn(
      "relative flex flex-col h-full transition-all duration-300 ease-out",
      "bg-brand rounded-lg overflow-hidden",
      "hover:shadow-card",
      wrapperWidthClass
    )}>
      {/* Image fills full width - no padding */}
      <Card size={size} aspectRatio={aspectRatio} className={cn("rounded-none", className)}>
        <Card.Image src={displayImage} alt={displayTitle} cardSize={size} variants={imageVariants} />

        <Card.Overlay>
          {eyebrow && <Card.Eyebrow>{eyebrow}</Card.Eyebrow>}
          <Card.Title>{displayTitle}</Card.Title>
        </Card.Overlay>

        {/* Duration badge - bottom right corner (same style as VideoCard) */}
        {durationSeconds !== null && durationSeconds !== undefined && durationSeconds > 0 && (
          <div className="absolute bottom-8 right-8 bg-brand/50 backdrop-blur-md rounded-full px-10 py-2">
            <p className="body-b3 text-white text-nowrap">
              {formatVideoDuration(durationSeconds)}
            </p>
          </div>
        )}
      </Card>
      
      {/* Content below image has padding */}
      <div className="p-12 flex flex-col flex-1">
        {/* Description */}
        {description && (
          <p className="text-grey-light/80 text-14">
            {description}
          </p>
        )}
        
        {/* CTA Buttons - stacked vertically, full width, always reserve space for 2 buttons */}
        {contentType && (
          <div className="mt-auto pt-12 flex flex-col gap-8">
            <CTAButtons
              content={content}
              contentType={contentType}
              userHasAnyPlan={hasAnyPlan}
              variant="catalog"
            />
          </div>
        )}
      </div>
    </div>
  );
}
