import { useMemo } from "react";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { useWatchProgressContext } from "~/contexts/WatchProgressProvider";
import type { VideoPart } from "~/lib/types";
import { Card } from "./Card";
import { formatVideoDuration } from "~/lib/utils";

interface VideoPartsGridProps {
  parts: VideoPart[];
  selectedVideoId: number;
  onSelect: (part: VideoPart) => void;
}

function sortParts(parts: VideoPart[]) {
  return [...parts].sort((a, b) => {
    const dayA = a.day ?? Number.MAX_SAFE_INTEGER;
    const dayB = b.day ?? Number.MAX_SAFE_INTEGER;
    if (dayA !== dayB) return dayA - dayB;

    const partA = a.part ?? Number.MAX_SAFE_INTEGER;
    const partB = b.part ?? Number.MAX_SAFE_INTEGER;
    if (partA !== partB) return partA - partB;

    const idA = a.video?.videoId ?? 0;
    const idB = b.video?.videoId ?? 0;
    return idA - idB;
  });
}

export function VideoPartsGrid({
  parts,
  selectedVideoId,
  onSelect,
}: VideoPartsGridProps) {
  const { strings } = useTranslations();
  const { watchProgress } = useWatchProgressContext();
  const sortedParts = useMemo(() => sortParts(parts), [parts]);

  // Create a lookup map for quick progress access
  const progressMap = useMemo(() => {
    const map = new Map<number, number>();
    watchProgress.forEach((entry) => {
      if (entry.videoId && entry.progressSeconds) {
        map.set(entry.videoId, entry.progressSeconds);
      }
    });
    return map;
  }, [watchProgress]);

  return (
    <div className="flex flex-col gap-32">
      <span className="text-24 font-700 text-white leading-tight">{`Days (${parts.length})`}</span>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-x-12 gap-y-32">
        {sortedParts.map((part, idx) => {
          const isActive = part.video?.videoId === selectedVideoId;
          const dayNumber = part.day ?? idx + 1;
          const labelTemplate =
            strings?.video_pilgrimage_day || "Day {day} {partName}";
          const label = labelTemplate
            .replace("{day}", String(dayNumber))
            .replace("{partName}", part.partName || "");
          const thumbnailUrl =
            part.video?.thumbnailUrl || part.video?.thumbnailUrlVertical;
          const title = part.partName || part.video?.title || label;
          const duration = part.video?.durationSeconds;

          // Get progress for this video
          const progressSeconds = part.video?.videoId
            ? progressMap.get(part.video.videoId)
            : undefined;
          const progressPercent =
            progressSeconds && duration
              ? Math.min(100, Math.round((progressSeconds / duration) * 100))
              : undefined;

          return (
            <button
              key={`${part.day}-${part.part}-${part.partName}-${part.video?.videoId}-${idx}`}
              onClick={() => onSelect(part)}
              className={`block text-left rounded-md transition-transform duration-300 ease-out hover:-translate-y-8 hover:shadow-[0px_4px_14px_0px_#0C162F4D] ${
                isActive
                  ? "ring-2 ring-gold-light ring-offset-2 ring-offset-brand"
                  : ""
              }`}
            >
              <Card size="auto" aspectRatio="landscape">
                {/* Thumbnail or gradient fallback */}
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-light to-brand-dark" />
                )}

                {/* Duration badge */}
                {duration && (
                  <div className="absolute bottom-8 right-8 bg-brand/50 backdrop-blur-md rounded-full px-10 py-2">
                    <p className="body-b3 text-white text-nowrap">
                      {formatVideoDuration(duration)}
                    </p>
                  </div>
                )}

                {/* Title overlay */}
                <Card.Overlay>
                  <Card.Eyebrow>{`Day ${dayNumber}`}</Card.Eyebrow>
                  <Card.Title>{title}</Card.Title>
                </Card.Overlay>

                {/* Progress bar */}
                {progressPercent !== undefined && progressPercent > 0 && (
                  <div className="absolute bottom-0 w-full h-4 bg-grey-light/30">
                    <div
                      className="h-full bg-grey-light"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
