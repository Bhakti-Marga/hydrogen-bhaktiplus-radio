import { format } from "date-fns";

interface ContentWithInfo {
  startDate?: string | null;
  location?: {
    city?: string | null;
    country?: string | null;
  } | null;
  video?: {
    durationSeconds?: number | null;
  } | null;
}

interface ContentInfoItemsProps {
  content: ContentWithInfo | null | undefined;
  /** Show video duration (default: false) */
  showDuration?: boolean;
  className?: string;
}

/**
 * Displays location, date, and optionally duration info for content in a subtle inline format.
 * Renders nothing if no data is available.
 * 
 * @example
 * <ContentInfoItems content={featured} />
 * // Renders: Date: 17 March 2025 • Location: India
 * 
 * @example
 * <ContentInfoItems content={talk} showDuration />
 * // Renders: Date: 17 March 2025 • Location: India • Duration: 1h 45m
 */
export function ContentInfoItems({ content, showDuration = false, className = "" }: ContentInfoItemsProps) {
  if (!content) return null;

  const dateValue = content.startDate 
    ? format(new Date(content.startDate), "dd MMMM yyyy")
    : null;

  const locationParts = [content.location?.city, content.location?.country].filter(Boolean);
  const locationValue = locationParts.length > 0 ? locationParts.join(", ") : null;

  // Format duration as "Xh Ym" for >= 1 hour, or "Xm" for < 1 hour
  const durationValue = showDuration && content.video?.durationSeconds
    ? (() => {
        const totalMinutes = Math.floor(content.video.durationSeconds! / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0) {
          return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
        return `${minutes}m`;
      })()
    : null;

  if (!dateValue && !locationValue && !durationValue) return null;

  return (
    <div className={`flex flex-wrap gap-x-24 gap-y-8 text-white/80 text-14 ${className}`}>
      {dateValue && (
        <span>
          <span className="font-600">Date:</span> {dateValue}
        </span>
      )}
      {locationValue && (
        <span>
          <span className="font-600">Location:</span> {locationValue}
        </span>
      )}
      {durationValue && (
        <span>
          <span className="font-600">Duration:</span> {durationValue}
        </span>
      )}
    </div>
  );
}

