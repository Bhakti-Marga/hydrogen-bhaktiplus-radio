export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`card-skeleton w-full min-h-[200px] rounded-lg overflow-hidden bg-brand ${className}`}
    />
  );
}

export function CardSkeletonList({
  count,
  cardClassName,
}: {
  count: number;
  cardClassName?: string;
}) {
  return (
    <div
      className="card-skeleton-list grid gap-16"
      style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} className={cardClassName} />
      ))}
    </div>
  );
}
