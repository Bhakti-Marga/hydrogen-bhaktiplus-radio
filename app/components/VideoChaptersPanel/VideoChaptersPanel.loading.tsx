import React from 'react';
import { useTranslations } from "~/contexts/TranslationsProvider";

export const VideoChaptersPanelSkeleton: React.FC = () => {
  const { strings } = useTranslations();
  return (
    <div className="w-full h-full bg-brand rounded-lg flex flex-col pt-8 gap-8 overflow-hidden">
      <div className="px-16 py-8 text-sm font-600 shrink-0">{strings.video_chapters}</div>
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {Array(8).fill(null).map((_, index) => (
          <div key={index} className="p-8 flex gap-8 items-center">
            <div className="text-xs min-w-16 font-avenir-next font-700 opacity-60">{index + 1}</div>
            <div className="grid grid-cols-[1fr_2fr] gap-16 items-center w-full">
              <div className="aspect-[16/9] rounded-md bg-brand-light animate-pulse" />
              <div className="font-figtree flex flex-col gap-4">
                <div className="text-sm font-600 text-transparent bg-brand-light animate-pulse">{strings.video_chapter_title_placeholder}</div>
                <div className="text-xs font-500 bg-brand-light rounded-full px-8 w-fit text-transparent animate-pulse">00:00</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 