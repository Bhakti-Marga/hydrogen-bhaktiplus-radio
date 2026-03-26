import { cn } from "~/lib/utils";
import { Card, type CardSize, type CardAspectRatio } from "./Card";

export interface CategoryCardProps {
  title: string;
  image: string;
  videoCount?: number;
  aspectRatio?: CardAspectRatio;
  size?: CardSize;
  className?: string;
  videosSuffix?: string;
  active?: boolean;
  onClick?: () => void;
  /** Pre-computed thumbnail variants from API (JSON string) for srcset optimization */
  imageVariants?: string | null;
}

export function CategoryCard({
  title,
  image,
  videoCount,
  size = "xs",
  className = "",
  videosSuffix = "Satsangs",
  active = false,
  onClick,
  imageVariants,
}: CategoryCardProps) {
  const content = (
    <Card size={size} aspectRatio="square" className={cn(
      className,
      active && "border-2 border-gold-light"
    )}>
      <Card.Image src={image} alt={title} variants={imageVariants} cardSize={size} />

      <div className="absolute inset-0 flex items-end align-center justify-center pb-sp-2">
        <div className="flex flex-col">
          <Card.Title>{title}</Card.Title>

          {/* {videoCount !== undefined && videoCount > 0 && (
            <span>
              {videoCount} {videosSuffix}
            </span>
          )} */}
        </div>
      </div>
    </Card>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="block transition-all duration-300 ease-out hover:shadow-[0px_4px_14px_0px_#0C162F4D]"
      >
        {content}
      </button>
    );
  }

  return content;
}

