import React, { useState, useRef, useCallback } from "react";
import { Tag } from "~/components";
import { IconChevron } from "~/components/Icons";
import { useIsomorphicLayoutEffect } from "~/hooks";
import { UITag } from "~/lib/types";

interface CollapsibleTagsProps {
  tags: UITag[];
  /** Fixed max visible count - when set, disables dynamic width calculation */
  maxVisible?: number;
  /** Max width constraint - when set without maxVisible, dynamically calculates how many tags fit */
  maxWidth?: string;
  minWidth?: string;
  className?: string;
}

const GAP_SIZE = 8; // gap-8 = 8px
const TOGGLE_BUTTON_WIDTH = 40; // Approximate width of the "+n" button

export function CollapsibleTags({
  tags,
  maxVisible,
  maxWidth,
  minWidth = "60px",
  className = "",
}: CollapsibleTagsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [calculatedMaxVisible, setCalculatedMaxVisible] = useState<number | null>(null);
  const [isMeasured, setIsMeasured] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
// Determine if we need dynamic measurement
 const needsDynamicMeasurement = maxVisible === undefined && !!maxWidth;
  // Move useCallback before early return to satisfy hooks rules
  const handleExpandClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  }, []);

  // Measure tags and calculate how many fit
  useIsomorphicLayoutEffect(() => {
    // Skip if using fixed maxVisible or no maxWidth constraint
    if (!needsDynamicMeasurement || !measureRef.current) {
      setIsMeasured(true);
      return;
    }

    const measureContainer = measureRef.current;
    const tagElements = measureContainer.querySelectorAll('[data-tag]');
    
    if (tagElements.length === 0) {
      setIsMeasured(true);
      return;
    }

    // Parse maxWidth to pixels
    const maxWidthPx = parseInt(maxWidth!, 10);
    if (isNaN(maxWidthPx)) {
      setIsMeasured(true);
      return;
    }

    let totalWidth = 0;
    let fittingCount = 0;
    const availableWidth = maxWidthPx - TOGGLE_BUTTON_WIDTH - GAP_SIZE; // Reserve space for toggle button

    tagElements.forEach((tagEl, index) => {
      const tagWidth = (tagEl as HTMLElement).offsetWidth;
      const widthWithGap = index === 0 ? tagWidth : tagWidth + GAP_SIZE;
      
      if (totalWidth + widthWithGap <= availableWidth) {
        totalWidth += widthWithGap;
        fittingCount++;
      }
    });

    // Ensure at least 1 tag is shown
    setCalculatedMaxVisible(Math.max(1, fittingCount));
    setIsMeasured(true);
  }, [tags, needsDynamicMeasurement, maxWidth]);

  if (!tags || tags.length === 0) return null;

  // Use fixed maxVisible if provided, otherwise use calculated value, fallback to showing all
  const effectiveMaxVisible = maxVisible ?? calculatedMaxVisible ?? tags.length;
  const visibleTags = isExpanded ? tags : tags.slice(0, effectiveMaxVisible);
  const hiddenCount = tags.length - effectiveMaxVisible;
  const shouldShowToggle = tags.length > effectiveMaxVisible;

  // Don't apply maxWidth when expanded so tags can use full available space
  const containerStyle = isExpanded ? undefined : { maxWidth };

  // Hide container until measurement is complete to prevent flash
  const isReady = !needsDynamicMeasurement || isMeasured;

  return (
    <>
      {/* Hidden measurement container - renders all tags to measure their widths */}
      {needsDynamicMeasurement && (
        <div
          ref={measureRef}
          className="flex flex-wrap items-stretch gap-8 absolute opacity-0 pointer-events-none"
          style={{ visibility: 'hidden' }}
          aria-hidden="true"
        >
          {tags.map((tag) => (
            <div key={`measure-${tag.label}`} className="flex h-32" data-tag>
              <Tag tag={tag} maxWidth="200px" minWidth={minWidth} />
            </div>
          ))}
        </div>
      )}

      {/* Visible tags container - hidden until measurement complete */}
      <div
        ref={containerRef}
        className={`flex flex-wrap items-stretch gap-8 ${className} ${isReady ? '' : 'invisible'}`}
        style={containerStyle}
      >
        {visibleTags.map((tag, index) => (
          <div
            key={tag.label}
            className={
              isExpanded && index >= effectiveMaxVisible
                ? "flex h-32 animate-[fade-in_300ms_ease-in]"
                : "flex h-32"
            }
          >
            <Tag
              tag={tag}
              maxWidth="200px"
              minWidth={minWidth}
            />
          </div>
        ))}
        {shouldShowToggle && (
          <div className="flex h-32">
            <button
              onClick={handleExpandClick}
              className="h-full px-8 py-4 rounded-sm bg-white/10 text-gold-light inline-flex items-center justify-center gap-4 hover:bg-white/20 transition-colors animate-[fade-in_300ms_ease-in]"
            >
              {isExpanded ? (
                <IconChevron className="w-12 h-12 rotate-90" />
              ) : (
                <span className="body-b3">+{hiddenCount}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
