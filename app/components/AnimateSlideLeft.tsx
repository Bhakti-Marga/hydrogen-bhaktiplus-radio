import React from 'react';

interface AnimateSlideLeftProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Total duration of the stagger effect in seconds (default: 0.58s)
   * This controls how long it takes for all items to start animating
   */
  duration?: number;
}

/**
 * Convenience wrapper for the `animate-slide-left-container` utility class.
 *
 * Animates children with a staggered slide-in from the right using an ease-in wave:
 * - First 10 children: ease-in stagger (slow start, quick end)
 * - Children beyond 10: use the full duration as their delay
 *
 * Usage (choose one):
 * 1. Use this component: <AnimateSlideLeft duration={0.8}>{children}</AnimateSlideLeft>
 * 2. Apply utility class directly: <Stack className="animate-slide-left-container">{children}</Stack>
 * 3. With Swiper: <Swiper wrapperClass="animate-slide-left-container">
 * 4. Custom duration with inline style: <div className="animate-slide-left-container" style={{'--slide-duration': '1s'}}>{children}</div>
 *
 * Note: Import `~/styles/animations.css` where you need the animation styles.
 */
export function AnimateSlideLeft({
  children,
  className = '',
  duration = 0.58,
}: AnimateSlideLeftProps) {
  return (
    <div
      className={`animate-slide-left-container ${className}`}
      style={{ '--slide-duration': `${duration}s` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
