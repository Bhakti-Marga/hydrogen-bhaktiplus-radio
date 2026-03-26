import { cn } from "~/lib/utils";
import { Card, type CardSize, type CardAspectRatio } from "./Card";
import { IconLock, IconBadgeNew, IconBadgeUpcoming } from "~/components/Icons";
import { DraftBadge } from "~/components/Badge";
import { useTranslations } from "~/contexts/TranslationsProvider";

export interface ContentCardProps {
  title: string;
  eyebrow?: string;
  image: string;
  videoCount?: number;
  size?: CardSize;
  aspectRatio?: CardAspectRatio;
  className?: string;
  onClick?: () => void;
  active?: boolean;
  /** When false, shows a lock icon overlay indicating locked content */
  hasAccess?: boolean;
  showLock?: boolean;
  /** Pre-computed thumbnail variants from API (JSON string) for srcset optimization */
  imageVariants?: string | null;
  /** When true, shows a "NEW" badge on the card */
  isNew?: boolean;
  /** When true, shows an "UPCOMING" badge (takes priority over isNew) */
  isUpcoming?: boolean;
  /** When false, shows a DRAFT badge indicating unpublished content */
  isPublished?: boolean;
}

export function ContentCard({
  title,
  eyebrow,
  image,
  videoCount,
  size = "auto",
  aspectRatio = "portrait",
  className = "",
  onClick,
  active = false,
  hasAccess = true,
  showLock = true,
  imageVariants,
  isNew = false,
  isUpcoming = false,
  isPublished,
}: ContentCardProps) {
  const { strings } = useTranslations();
  // Determine lock icon size based on aspect ratio
  const lockContainerSize =
    aspectRatio === "portrait" ? "w-48 h-48" : "w-28 h-28";
  const lockIconSize = aspectRatio === "portrait" ? "w-24 h-24" : "w-14 h-14";

  const content = (
    <Card
      size={size}
      aspectRatio={aspectRatio}
      className={cn(
        className,
        active && "shadow-lg border-2 border-gold-light",
      )}
    >
      <Card.Image
        src={image}
        alt={title}
        variants={imageVariants}
        cardSize={size}
      />

      {/* UPCOMING badge takes priority over NEW badge */}
      {isUpcoming && (
        <div className="absolute top-12 left-0 drop-shadow-md z-10">
          <IconBadgeUpcoming className="w-96 h-auto" />
        </div>
      )}
      {/* NEW badge for recently published content */}
      {isNew && !isUpcoming && (
        <div className="absolute top-12 left-0 drop-shadow-md z-10">
          <IconBadgeNew className="w-56 h-auto" />
        </div>
      )}

      {/* Lock icon for locked content */}
      {!hasAccess && showLock && (
        <div
          className={`absolute top-8 right-8 rounded-full bg-black/50 flex items-center justify-center z-10 ${lockContainerSize}`}
          aria-label="Locked content"
        >
          <IconLock className={`text-white ${lockIconSize}`} />
        </div>
      )}

      {videoCount !== undefined && videoCount > 0 && (
        <div className="absolute bottom-8 right-8 bg-brand/50 backdrop-blur-md rounded-full px-10 py-2">
          <p className="body-b3 text-white text-nowrap">
            {videoCount}{" "}
            {videoCount === 1 ? strings.video_singular : strings.video_plural}
          </p>
        </div>
      )}

      {/* DRAFT badge for unpublished content */}
      {isPublished === false && (
        <div className="absolute bottom-8 left-8 z-10">
          <DraftBadge size="sm" />
        </div>
      )}

      <Card.Overlay>
        {eyebrow && <Card.Eyebrow>{eyebrow}</Card.Eyebrow>}
        <Card.Title>{title}</Card.Title>
      </Card.Overlay>
    </Card>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`block transition-all duration-300 ease-out hover:shadow-[0px_4px_14px_0px_#0C162F4D]`}
      >
        {content}
      </button>
    );
  }

  return content;
}
