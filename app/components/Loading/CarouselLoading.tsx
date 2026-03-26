import { CardSkeletonList } from "~/components";

export const CarouselLoading = ({ className }: { className?: string }) => {
  return (
    <div className={`${className} px-12 tablet:px-24 desktop:px-60`}>
      <CardSkeletonList count={4} />
    </div>
  );
};
