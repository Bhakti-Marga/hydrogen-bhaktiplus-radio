import React, { useState, useEffect, useRef, useCallback } from "react";
import { useIsomorphicLayoutEffect } from "~/hooks";

const VIEWPORT_PADDING = 12;

interface TooltipProps {
  header?: string;
  description?: string;
  children?: React.ReactNode;
}

export function Tooltip({ description, header, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [clampedLeft, setClampedLeft] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateTooltipPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
      // Reset clamped position so useLayoutEffect recalculates
      setClampedLeft(null);
    }
  }, []);

  // After the tooltip renders at its initial centered position, measure it
  // and clamp so it stays within the viewport.
  useIsomorphicLayoutEffect(() => {
    if (!shouldRender || !tooltipRef.current) return;
    const el = tooltipRef.current;
    const tooltipRect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    // The element is positioned with left = triggerCenter, transform translateX(-50%),
    // so its actual left edge = triggerCenter - tooltipWidth/2
    const centerLeft = tooltipPosition.left;
    const halfWidth = tooltipRect.width / 2;
    const actualLeft = centerLeft - halfWidth;
    const actualRight = centerLeft + halfWidth;

    if (actualLeft < VIEWPORT_PADDING) {
      // Overflowing left: shift right so left edge = VIEWPORT_PADDING
      setClampedLeft(halfWidth + VIEWPORT_PADDING);
    } else if (actualRight > viewportWidth - VIEWPORT_PADDING) {
      // Overflowing right: shift left so right edge = viewportWidth - VIEWPORT_PADDING
      setClampedLeft(viewportWidth - VIEWPORT_PADDING - halfWidth);
    } else {
      setClampedLeft(null);
    }
  }, [shouldRender, tooltipPosition]);

  const showTooltip = useCallback(() => {
    setShouldRender(true);
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const hideTooltip = useCallback(() => {
    setIsVisible(false);
    timeoutRef.current = setTimeout(() => {
      setShouldRender(false);
    }, 200);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.classList?.contains("tooltip-trigger") &&
        container.contains(target)
      ) {
        triggerRef.current = target;
        updateTooltipPosition();
        showTooltip();
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.classList?.contains("tooltip-trigger") &&
        container.contains(target)
      ) {
        hideTooltip();
        triggerRef.current = null;
      }
    };

    const handleScroll = () => {
      if (isVisible && triggerRef.current) {
        updateTooltipPosition();
      }
    };

    const handleResize = () => {
      if (isVisible && triggerRef.current) {
        updateTooltipPosition();
      }
    };

    container.addEventListener("mouseenter", handleMouseEnter, true);
    container.addEventListener("mouseleave", handleMouseLeave, true);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter, true);
      container.removeEventListener("mouseleave", handleMouseLeave, true);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, updateTooltipPosition, showTooltip, hideTooltip]);

  return (
    <div ref={containerRef} className="tooltip-container">
      {children}
      {shouldRender && header && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none transition-all duration-200 ease-in-out"
          style={{
            top: tooltipPosition.top,
            left: clampedLeft ?? tooltipPosition.left,
            transform: `translateX(-50%) translateY(-100%) scale(${
              isVisible ? 1 : 0.95
            })`,
            opacity: isVisible ? 1 : 0,
          }}
        >
          <div
            className="bg-brand rounded-lg text-white p-16 flex flex-col gap-4 pointer-events-auto shadow-lg max-w-sm"
            style={{ boxShadow: "0px 4px 14px 0px #0C162F4D" }}
          >
            {header && <div className="body-b3">{header}</div>}
            {description && (
              <div className="body-b5 text-white/80">{description}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
