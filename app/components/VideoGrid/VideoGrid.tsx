import { ReactNode } from "react";

export interface VideoGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * A responsive grid layout for video cards.
 * 
 * Uses CSS Grid with auto-fill to automatically adjust the number of columns
 * based on available width. Cards maintain a fixed width (--card-width-md = 300px).
 * Gap matches Carousel spacing (8px horizontal, 24px vertical for readability).
 * 
 * Usage:
 * ```tsx
 * <VideoGrid>
 *   {videos.map((video) => (
 *     <VideoGrid.Item key={video.id}>
 *       <VideoCard ... />
 *     </VideoGrid.Item>
 *   ))}
 * </VideoGrid>
 * ```
 * 
 * Note: This component should be used inside a Container component.
 * It does not handle horizontal padding (per design system rules).
 */
export function VideoGrid({ children, className = "" }: VideoGridProps) {
  return (
    <div
      className={`grid grid-cols-[repeat(auto-fill,var(--card-width-md))] gap-x-8 gap-y-24 pt-8 ${className}`}
    >
      {children}
    </div>
  );
}

export interface VideoGridItemProps {
  children: ReactNode;
  className?: string;
}

/**
 * Individual item wrapper for VideoGrid.
 * Ensures consistent sizing for each grid cell.
 */
export function VideoGridItem({ children, className = "" }: VideoGridItemProps) {
  return (
    <div className={`w-[var(--card-width-md)] ${className}`}>
      {children}
    </div>
  );
}

VideoGrid.Item = VideoGridItem;

