import { ReactNode } from "react";
import { HoverVideoCard } from "./HoverVideoCard";
import { useVideoProgress } from "~/contexts/WatchProgressProvider";
import type { VideoChapterDto } from "~/lib/api/types";

interface ProgressAwareHoverVideoCardProps {
  videoId: string | number | undefined;
  title: string;
  thumbnailUrl: string;
  /** Pre-computed thumbnail variants from API (JSON string) */
  thumbnailUrlVariants?: string | null;
  duration?: number;
  eyebrow?: ReactNode;
  size?: "auto" | "xs" | "sm" | "md" | "lg";
  aspectRatio?: "square" | "portrait" | "landscape";
  subscriptionTier?: string;
  customerId?: string | number | null;
  tags?: { name: string }[];
  chapters?: VideoChapterDto[];
  /** If provided, renders directly without lookup (for Continue Watching) */
  progressSeconds?: number;
  /** When true, disables clickable hover styling (shadow, cursor) */
  disableClickableStyle?: boolean;
  /** When true, shows a lock icon overlay indicating content is locked */
  locked?: boolean;
  /** When true, shows a "DAY X" badge on the top-left corner */
  isSatsangOfDay?: boolean;
  /** The day number to display in the badge (e.g., 1 for "DAY 1") */
  dayOfSatsangOfDay?: number | null;
  /** When true, shows a "NEW" badge on the top-left corner */
  isNew?: boolean;
  /** When true, shows an "UPCOMING" badge (takes priority over isNew) */
  isUpcoming?: boolean;
  /** When false, shows a "DRAFT" badge indicating unpublished content */
  isPublished?: boolean;
  /** When true, highlights this card as today's satsang of the week */
  isTodaySatsang?: boolean;
}

export function ProgressAwareHoverVideoCard({
  videoId,
  customerId,
  progressSeconds: explicitProgress,
  ...props
}: ProgressAwareHoverVideoCardProps) {
  // Get progress from context (returns undefined if not loaded or not found)
  const contextProgress = useVideoProgress(videoId);

  // Use explicit progress if provided, otherwise use context progress
  const progress = explicitProgress ?? contextProgress;

  // Convert customerId to string for HoverVideoCard
  const customerIdStr = customerId != null ? String(customerId) : null;

  return (
    <HoverVideoCard
      videoId={videoId ?? ""}
      customerId={customerIdStr}
      progressSeconds={progress}
      {...props}
    />
  );
}
