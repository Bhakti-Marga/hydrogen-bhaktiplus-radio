import React from 'react';
import { Carousel, Container } from '~/components';

interface VideoChaptersLoadingProps {
  className?: string;
}

const HorizontalChapterSlideSkeleton = () => {
  return (
    <div className="flex flex-col gap-24 pb-16 rounded-md">
      <div className="bg-brand-light mx-4 mt-4 rounded-md aspect-[227/121] animate-pulse" />
      <div className="flex items-center w-full">
        <div className="h-[1px] bg-brand-light opacity-20 w-12"></div>
        <div className="rounded-full h-[28px] bg-brand-light animate-pulse"></div>
        <div className="h-[1px] bg-brand-light opacity-20 flex-1"></div>
      </div>
      <div className="px-16">
        <div className="h-16 bg-brand-light rounded animate-pulse w-3/4"></div>
      </div>
    </div>
  );
};

/**
 * VideoChaptersLoading - Horizontal carousel skeleton for loading state
 * Used while video chapters are being fetched
 */
export const VideoChaptersLoading: React.FC<VideoChaptersLoadingProps> = ({
  className
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <Container className="text-white mb-16">
          <div className="h-[60px] bg-brand-light rounded animate-pulse w-1/3 mb-8"></div>
          <div className="h-32 bg-brand-light rounded animate-pulse w-1/4"></div>
        </Container>
        <Container>
          <Carousel>
            {Array.from({ length: 7 }).map((_, index) => (
              <Carousel.Slide key={index}>
                <HorizontalChapterSlideSkeleton />
              </Carousel.Slide>
            ))}
          </Carousel>
        </Container>
      </div>
    </div>
  );
};