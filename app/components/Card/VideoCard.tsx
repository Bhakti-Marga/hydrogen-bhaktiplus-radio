import { ReactNode } from "react";
import {
  Card,
  type CardSize,
  type CardAspectRatio,
  type CardTitleSize,
} from "./Card";
import { formatVideoDuration } from "~/lib/utils";
import { useDebug } from "~/contexts/DebugProvider";
import { IconBadgeNew, IconBadgeUpcoming } from "~/components/Icons";
import { DraftBadge } from "~/components/Badge";

export interface VideoCardProps {
  title: string;
  eyebrow?: ReactNode;
  image: string;
  /** Pre-computed thumbnail variants from API (JSON string) */
  imageVariants?: string | null;
  duration?: number;
  progress?: number;
  size?: CardSize;
  aspectRatio?: CardAspectRatio;
  /** Title text size - defaults to "xl" */
  titleSize?: CardTitleSize;
  className?: string;
  onClick?: () => void;
  videoId?: string | number; // Optional for debug display
  /** When true, shows a "NEW" badge on the top-left corner */
  isNew?: boolean;
  /** When true, shows an "UPCOMING" badge (takes priority over isNew) */
  isUpcoming?: boolean;
  /** When false, shows a "DRAFT" badge indicating unpublished content */
  isPublished?: boolean;
}

export function VideoCard({
  title,
  eyebrow,
  image,
  imageVariants,
  duration,
  progress,
  size = "auto",
  aspectRatio = "landscape",
  titleSize,
  className = "",
  onClick,
  videoId,
  isNew = false,
  isUpcoming = false,
  isPublished,
}: VideoCardProps) {
  const { debug } = useDebug();

  const content = (
    <Card size={size} aspectRatio={aspectRatio} className={className}>
      <Card.Image
        src={image}
        alt={title}
        cardSize={size}
        variants={imageVariants}
      />

      {/* Debug overlay showing videoId */}
      {debug.isEnabled && debug.showVideoIds && videoId && (
        <div className="absolute top-8 left-8 bg-red-600 text-white px-8 py-4 rounded text-12 font-mono font-bold z-50 pointer-events-none">
          ID: {videoId}
        </div>
      )}

      {/* UPCOMING badge takes priority over NEW badge */}
      {isUpcoming && (
        <div className="absolute top-12 left-0 drop-shadow-md">
          <IconBadgeUpcoming className="w-96 h-auto" />
        </div>
      )}
      {/* NEW badge for recently published content (only if not upcoming) */}
      {isNew && !isUpcoming && (
        <div className="absolute top-12 left-0 drop-shadow-md">
          <IconBadgeNew className="w-56 h-auto" />
        </div>
      )}

      {duration && (
        <div className="absolute bottom-8 right-8 bg-brand/50 backdrop-blur-md rounded-full px-10 py-2">
          <p className="body-b3 text-white text-nowrap">
            {formatVideoDuration(duration)}
          </p>
        </div>
      )}

      {/* DRAFT badge for unpublished content - bottom-left corner */}
      {isPublished === false && (
        <div className="absolute bottom-8 left-8">
          <DraftBadge size="sm" />
        </div>
      )}

      <Card.Overlay>
        {eyebrow && <Card.Eyebrow>{eyebrow}</Card.Eyebrow>}
        <Card.Title size={titleSize}>{title}</Card.Title>
      </Card.Overlay>

      {progress !== undefined && progress > 0 && (
        <div className="absolute bottom-0 w-full h-4 bg-grey-light/30">
          <div
            className="h-full bg-grey-light"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </Card>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="block hover:shadow-[0px_4px_14px_0px_#0C162F4D] hover:scale-105 transition-all duration-300 ease-out"
      >
        {content}
      </button>
    );
  }

  return content;
}
