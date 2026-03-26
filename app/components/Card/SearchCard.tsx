import { Card } from "./Card";
import { formatVideoDuration } from "~/lib/utils";
import { IconLock } from "~/components/Icons";

export interface SearchCardProps {
  title: string;
  eyebrow?: string;
  image: string;
  duration?: number;
  className?: string;
  onClick?: () => void;
  /** When true, shows a lock icon overlay indicating content is locked */
  locked?: boolean;
}

export function SearchCard({
  title,
  eyebrow,
  image,
  duration,
  className = "",
  onClick,
  locked = false,
}: SearchCardProps) {
  const content = (
    <Card aspectRatio="landscape" className={className}>
      <Card.Image src={image} alt={title} />

      {/* Lock icon overlay for locked content */}
      {locked && (
        <div
          className="absolute top-8 right-8 rounded-full bg-black/50 flex items-center justify-center w-28 h-28 z-10"
          aria-label="Locked content"
        >
          <IconLock className="text-white w-14 h-14" />
        </div>
      )}

      {duration && (
        <div className="absolute bottom-8 right-8 bg-brand/50 backdrop-blur-md rounded-full px-10 py-2">
          <p className="body-b3 text-white text-nowrap">
            {formatVideoDuration(duration)}
          </p>
        </div>
      )}

      <Card.Overlay>
        {eyebrow && <Card.Eyebrow>{eyebrow}</Card.Eyebrow>}
        <Card.Title className="line-clamp-2">{title}</Card.Title>
      </Card.Overlay>
    </Card>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="block hover:shadow-[0px_4px_14px_0px_#0C162F4D] transition-all duration-300 ease-out"
      >
        {content}
      </button>
    );
  }

  return content;
}
