import type { ReactNode } from "react";
import { useScrollFade } from "~/hooks";

interface ScrollFadeProps {
  children: ReactNode;
  className?: string;
}

const FADE_MASK =
  "[mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)]";

/**
 * Wrapper that adds a bottom fade gradient on scrollable content.
 * The fade appears only when content overflows, and disappears
 * when the user scrolls to the bottom.
 *
 * Applies `overflow-y: auto` automatically.
 *
 * @example
 * <ScrollFade className="max-h-[300px]">
 *   <p>Long content that may overflow...</p>
 * </ScrollFade>
 */
export function ScrollFade({ children, className = "" }: ScrollFadeProps) {
  const { ref, showFade } = useScrollFade();

  return (
    <div
      ref={ref}
      className={`overflow-y-auto ${showFade ? FADE_MASK : ""} ${className}`}
    >
      {children}
    </div>
  );
}
