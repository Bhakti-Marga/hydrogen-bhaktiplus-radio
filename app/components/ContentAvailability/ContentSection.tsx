import { ReactNode } from "react";
import { formatDurationHuman } from "~/lib/utils/general";

interface ContentSectionProps {
  title: string;
  count?: number;
  videoCount?: number;
  /** Total duration in seconds */
  durationSeconds?: number;
  subtitle?: string;
  children: ReactNode;
}

export function ContentSection({
  title,
  count,
  videoCount,
  durationSeconds,
  subtitle,
  children,
}: ContentSectionProps) {
  const displayTitle = count !== undefined ? `${title} (${count})` : title;

  // Format video count and duration together: "100 videos (5h 30m)"
  const formatVideoInfo = () => {
    if (videoCount === undefined) return null;
    const duration = durationSeconds ? formatDurationHuman(durationSeconds) : null;
    if (duration) {
      return `${videoCount} videos (${duration})`;
    }
    return `${videoCount} videos available`;
  };

  const videoInfo = formatVideoInfo();

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-24">
      <div className="mb-16">
        <h3 className="h3-lg text-white">{displayTitle}</h3>
        {videoInfo && (
          <p className="body-b3 text-white/70 mt-4">{videoInfo}</p>
        )}
        {subtitle && (
          <p className="body-b3 text-white/70 mt-4">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

