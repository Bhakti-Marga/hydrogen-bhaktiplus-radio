import { useRef, useState, useCallback, useEffect } from "react";

/**
 * Hook that detects scroll position to control a bottom fade mask.
 *
 * Returns a ref to attach to the scrollable container, plus a boolean
 * indicating whether the fade should be shown. The fade is visible when
 * the content overflows and the user has NOT scrolled to the bottom.
 *
 * @param threshold - Pixel threshold for "at bottom" detection (default 2)
 * @returns { ref, showFade } - Attach ref to the scrollable element
 */
export function useScrollFade(threshold = 2) {
  const ref = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const isScrollable = el.scrollHeight > el.clientHeight;
    const isAtBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;

    setShowFade(isScrollable && !isAtBottom);
  }, [threshold]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Initial check
    check();

    // Re-check on scroll
    el.addEventListener("scroll", check, { passive: true });

    // Re-check when container resizes (content or viewport change)
    const observer = new ResizeObserver(check);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", check);
      observer.disconnect();
    };
  }, [check]);

  return { ref, showFade };
}
