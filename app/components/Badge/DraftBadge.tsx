interface DraftBadgeProps {
  className?: string;
  /** Size variant - 'sm' for cards, 'md' for heroes */
  size?: "sm" | "md";
}

/**
 * Badge indicating unpublished/draft content.
 * Displayed when content.isPublished === false.
 *
 * Design: Outlined style with gray border and text on transparent background.
 */
export function DraftBadge({ className = "", size = "sm" }: DraftBadgeProps) {
  const sizeClasses =
    size === "sm" ? "px-8 py-2 text-10" : "px-12 py-4 text-12";

  return (
    <div
      className={`inline-flex items-center justify-center border border-grey-dark rounded bg-black/30 backdrop-blur-sm ${sizeClasses} ${className}`}
    >
      <span className="text-grey-dark font-600 uppercase tracking-wide">
        DRAFT
      </span>
    </div>
  );
}
