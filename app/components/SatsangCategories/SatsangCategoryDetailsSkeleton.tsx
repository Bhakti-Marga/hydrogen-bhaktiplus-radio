import { CardSkeletonList } from "~/components";

export function SatsangCategoryDetailsSkeleton() {
  return (
    <div className="satsang-category-details py-60 bg-brand">
      <div className="satsang-category-details__layout">
        {/* Header skeleton */}
        <div className="satsang-category-details__header mb-[100px] mx-auto px-12 tablet:px-24 desktop:px-60 text-white grid grid-cols-2 gap-80">
          <div className="satsang-category-details__quote">
            {/* Quote skeleton */}
            <div className="h-32 bg-white/10 rounded-md mb-8" />
            <div className="h-32 bg-white/10 rounded-md mb-8 w-3/4" />
            {/* Author skeleton */}
            <div className="h-16 bg-white/10 rounded-md w-1/2 mt-16" />
          </div>
          <div className="satsang-category-details__description">
            {/* Description skeleton */}
            <div className="h-16 bg-white/10 rounded-md mb-8" />
            <div className="h-16 bg-white/10 rounded-md mb-8" />
            <div className="h-16 bg-white/10 rounded-md w-2/3" />
          </div>
        </div>
        {/* Video cards skeleton */}
        <div className="animated-link-chevron-trigger max-w-screen overflow-hidden relative z-10 px-12 tablet:px-24 desktop:px-60">
          <div className="h-32 bg-white/10 rounded-md mb-32 w-64" />
          <CardSkeletonList count={4} />
        </div>
      </div>
    </div>
  );
}
