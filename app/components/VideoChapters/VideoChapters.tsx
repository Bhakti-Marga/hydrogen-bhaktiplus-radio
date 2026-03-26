import React, { useState, useMemo } from "react";
import "~/styles/components/videoChapters.css";

import { Carousel, Container } from "~/components";
import { HorizontalChapterSlide } from "./HorizontalChapterSlide";
import { Video } from "~/lib/types";
import { VideoChapterDto } from "~/lib/api/types";

export interface VideoChaptersProps {
  title?: string;
  video: Video;
  chapters: VideoChapterDto[];
  activeChapter?: VideoChapterDto;
  onChapterClick?: (chapter: VideoChapterDto) => void;
  initialActiveIndex?: number;
}

/**
 * VideoChapters - Horizontal carousel layout for displaying video chapters
 * Used in full-screen chapter modals on category/subcategory pages
 */
export const VideoChapters: React.FC<VideoChaptersProps> = ({
  title,
  video,
  chapters,
  activeChapter,
  onChapterClick,
  initialActiveIndex = 0,
}) => {
  const [currentChapter, setCurrentChapter] = useState<VideoChapterDto | null>(
    activeChapter || null,
  );

  const handleChapterSelect = (chapter: VideoChapterDto) => {
    setCurrentChapter(chapter);
    onChapterClick?.(chapter);
  };

  // Sort chapters by startOffset to ensure correct chronological order
  // Memoized to prevent unnecessary re-sorting on every render
  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => a.startOffset - b.startOffset),
    [chapters]
  );

  return (
    <div className="relative w-full">
      <div className="relative">
        <Container className="flex flex-col items-inline-start">
          <div className="h1-sm opacity-20 leading-[60px] uppercase">
            {title}
          </div>
          <div className="body-b1 font-600 leading-8 text-white">
            Chapters ({sortedChapters.length})
          </div>
        </Container>
        <Container className="animate-slide-in-from-right">
          <Carousel spaceBetween={0}>
            {sortedChapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className={`relative transition-transform duration-300 ease-out`}
                style={{
                  scrollSnapAlign: "start",
                  scrollSnapStop: "normal",
                }}
              >
                <div>
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                  <div onClick={() => handleChapterSelect(chapter)}>
                    <HorizontalChapterSlide
                      chapter={chapter}
                      video={video}
                      index={index}
                      isActive={
                        currentChapter?.id === chapter.id
                      }
                      isBefore={
                        currentChapter !== null &&
                        sortedChapters.findIndex((c) => c.id === currentChapter.id) >
                        sortedChapters.findIndex((c) => c.id === chapter.id)
                      }
                      totalChapters={sortedChapters.length}
                    />
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </Container>
      </div>
    </div>
  );
};

export default VideoChapters;
