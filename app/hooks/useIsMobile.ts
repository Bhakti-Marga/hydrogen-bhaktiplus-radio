import { useState, useEffect } from "react";

/**
 * Tailwind tablet breakpoint in pixels (40rem = 640px)
 * Below this is considered "mobile"
 */
const TABLET_BREAKPOINT = 640;

/**
 * Hook to detect if the current viewport is mobile-sized
 * 
 * Returns true when viewport width is below the tablet breakpoint (640px).
 * Defaults to false during SSR to avoid hydration mismatches.
 * 
 * @returns boolean - true if mobile, false if tablet or larger
 */
export function useIsMobile(): boolean {
  // Default to false (desktop) during SSR to avoid hydration mismatch
  // This means on mobile, there might be a brief flash of desktop behavior
  // but this is preferable to hydration errors
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < TABLET_BREAKPOINT);
    };

    // Check immediately on mount
    checkIsMobile();

    // Listen for resize events
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}

