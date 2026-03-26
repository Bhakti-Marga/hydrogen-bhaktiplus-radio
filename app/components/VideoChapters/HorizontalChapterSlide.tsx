import React from "react";
import { Link } from "~/components";
import { formatTimestamp, formatVideoDuration } from "~/lib/utils";
import { VideoChapterDto } from "~/lib/api/types";
import { format } from "date-fns";
import { Video } from "~/lib/types";
import { encodeVideoId } from "~/lib/utils/video-id-encoder";

interface HorizontalChapterSlideProps {
  chapter: VideoChapterDto;
  index: number;
  isActive: boolean;
  isBefore: boolean;
  totalChapters: number;
  video: Video;
}

export const HorizontalChapterSlide: React.FC<HorizontalChapterSlideProps> = ({
  chapter,
  index,
  isActive,
  isBefore,
  totalChapters,
  video,
}) => {
  return (
    <Link
      to={`/video?videoId=${encodeVideoId(video.videoId)}&progress=${chapter.startOffset}`}
      className={`flex flex-col gap-24 pb-16 rounded-md hover:bg-brand-light cursor-pointer w-[var(--video-width-sm)]`}
    >
      <div className="bg-white mx-4 mt-4 rounded-md aspect-[227/121] overflow-hidden">
        <img
          src={chapter.thumbnailUrl}
          alt={chapter.title}
          className="w-full h-full object-cover object-center"
          loading={"lazy"}
        />
      </div>
      <div className="flex items-center w-full">
        <div
          className={`h-[1px] bg-white opacity-20 w-8 transition-opacity duration-200 ${index === 0 ? "invisible" : ""
            }`}
        ></div>
        <span
          className={`body-b5 rounded-full px-8 h-[28px] flex items-center justify-center transition-colors duration-200 ${isActive ? "bg-white text-brand" : "bg-[#41455D] text-white"
            }`}
        >
          {formatVideoDuration(chapter.startOffset)}
        </span>
        <div
          className={`h-[1px] bg-white opacity-20 flex-1 transition-opacity duration-200 ${index === totalChapters - 1 ? "invisible" : ""
            }`}
        ></div>
      </div>
      <div
        className={`body-b3 px-16 transition-opacity duration-200 -mt-[.25rem]
        ${isBefore ? "text-white opacity-30" : "text-white"} 
        ${isActive ? "font-600" : ""}`}
      >
        {chapter.title}
      </div>
    </Link>
  );
};
