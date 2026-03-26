import { useState, useMemo } from "react";
import { Link } from "~/components/Link/Link";
import { IconChevron } from "~/components/Icons/IconChevron";
import { formatVideoDuration } from "~/lib/utils/general";
import { VideoChapterDto } from "~/lib/api/types";
import { cn } from "~/lib/utils";
import { encodeVideoId } from "~/lib/utils/video-id-encoder";

interface CompactChaptersListProps {
  chapters: VideoChapterDto[];
  videoId: string | number;
  initialExpanded?: boolean;
  className?: string;
}

/**
 * CompactChaptersList - Collapsible vertical list of chapters
 * Used in hover video cards and other compact contexts
 */
export function CompactChaptersList({
  chapters,
  videoId,
  initialExpanded = false,
  className = ""
}: CompactChaptersListProps) {
  const [chaptersExpanded, setChaptersExpanded] = useState(initialExpanded);

  // Sort chapters by startOffset to ensure correct chronological order
  // Memoized to prevent unnecessary re-sorting on every render
  // Move useMemo before early return to satisfy hooks rules
  const sortedChapters = useMemo(
    () => chapters ? [...chapters].sort((a, b) => a.startOffset - b.startOffset) : [],
    [chapters]
  );

  if (!chapters || chapters.length === 0) {
    return null;
  }

  return (
    <div className={`relative z-20 ${className}`}>
      {/* Chapters Header with Chevron */}
      <button
        className="w-full flex justify-center items-center gap-8 text-white body-b4 opacity-80 hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          setChaptersExpanded(!chaptersExpanded);
        }}
        aria-label={chaptersExpanded ? "Collapse chapters" : "Expand chapters"}
      >
        <span>
          {sortedChapters.length} Chapter{sortedChapters.length !== 1 ? 's' : ''}
        </span>
        <IconChevron
          className={cn(`w-16 h-16 transition-transform duration-200`, chaptersExpanded && 'rotate-180')}
        />
      </button>

      {/* Chapters List */}
      {chaptersExpanded && (
        <div className="mt-8 max-h-[200px] overflow-y-auto bg-brand rounded-md [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {sortedChapters.map((chapter, idx) => {
            const encodedVideoId = typeof videoId === 'number' ? encodeVideoId(videoId) : videoId;
            const chapterUrl = `/video?videoId=${encodedVideoId}&progress=${chapter.startOffset}`;

            return (
              <Link
                key={chapter.id}
                to={chapterUrl}
                className="flex gap-8 p-8 hover:bg-brand-light transition-colors group items-center"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {/* Chapter Number */}
                <div className="text-xs min-w-16 font-avenir-next font-700 opacity-60">
                  {idx + 1}
                </div>

                {/* Chapter Thumbnail */}
                <div className="aspect-[16/9] w-80 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={chapter.thumbnailUrl}
                    alt={chapter.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Chapter Info */}
                <div className="flex flex-col gap-4 flex-1 min-w-0">
                  <div className="text-xs font-600 text-left truncate">
                    {chapter.title}
                  </div>
                  <div className="text-xs font-500 opacity-60">
                    {formatVideoDuration(chapter.startOffset)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

CompactChaptersList.displayName = 'CompactChaptersList';
