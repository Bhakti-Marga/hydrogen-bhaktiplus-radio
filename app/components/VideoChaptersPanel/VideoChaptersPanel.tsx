import React from "react";
import { VideoChaptersPanelSkeleton } from "./VideoChaptersPanel.loading";
import { VideoChapterDto } from "~/lib/api";
import { Image } from "~/components";
import { IconChapters, IconChevron } from "~/components/Icons";
import { formatVideoDuration } from "~/lib/utils/general";

interface VideoChaptersPanelProps {
  chapters: VideoChapterDto[];
  isLoading?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onChapterClick: (chapter: VideoChapterDto) => void;
}

export const VideoChaptersPanel: React.FC<VideoChaptersPanelProps> = ({
  chapters,
  isLoading = false,
  isExpanded,
  onToggle,
  onChapterClick,
}) => {
  if (isLoading) {
    return <VideoChaptersPanelSkeleton />;
  }

  const hasChapters = chapters.length > 0;

  return (
    <div className="w-full" style={{ aspectRatio: "0.7" }}>
      <div className="w-full h-full bg-brand rounded-lg flex flex-col overflow-hidden relative">
        {/* Collapsed state - icons centered, visible when collapsed */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-start py-16 gap-8 transition-opacity duration-300 ${
            isExpanded
              ? "opacity-0 pointer-events-none"
              : "opacity-100 cursor-pointer"
          }`}
          onClick={!isExpanded ? onToggle : undefined}
          role={!isExpanded ? "button" : undefined}
          aria-label={!isExpanded ? "Show chapters" : undefined}
        >
          <IconChapters className="w-20 h-20 text-white" />
          <IconChevron className="w-16 h-16 text-white rotate-90" />
        </div>

        {/* Expanded state - full chapters list */}
        <div
          className={`flex flex-col h-full pt-8 gap-8 transition-opacity duration-300 ${
            isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="px-16 py-8 text-sm font-600 shrink-0 flex items-center justify-between">
            <span>Chapters {hasChapters && `(${chapters.length})`}</span>
            <button
              onClick={onToggle}
              className="p-4 hover:bg-brand-light rounded transition-colors duration-200"
              aria-label="Hide chapters"
            >
              <IconChevron className="w-16 h-16 text-white -rotate-90" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {hasChapters ? (
              chapters.map((chapter, idx) => (
                <button
                  key={chapter.id}
                  className="p-8 flex gap-8 items-center hover:bg-brand-light cursor-pointer transition-colors group"
                  onClick={() => onChapterClick(chapter)}
                >
                  <div className="text-xs min-w-16 font-avenir-next font-700 opacity-60">
                    {idx + 1}
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-16 items-center">
                    <div className="aspect-[16/9] rounded-md overflow-hidden object-cover object-center">
                      {chapter.thumbnailUrl && (
                        <Image
                          data={{ url: chapter.thumbnailUrl }}
                          className="object-cover object-center size-full"
                          pictureClasses="object-cover object-center size-full"
                        />
                      )}
                    </div>
                    <div className="font-figtree flex flex-col gap-4">
                      <div className="text-sm font-400 text-left line-clamp-2">
                        {chapter.title}
                      </div>
                      <div className="text-xs font-500 bg-brand-light rounded-full px-8 w-fit group-hover:bg-brand transition-colors">
                        {formatVideoDuration(chapter.startOffset)}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-16 py-24 text-sm text-white/60 text-center">
                No chapters available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
