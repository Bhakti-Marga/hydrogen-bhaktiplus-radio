import { ReactNode } from "react";
import { HeroContent, HeroContentProps } from "~/sections";

/**
 * CenteredHeroContent - A wrapper around HeroContent that centers the content
 * horizontally and centers text alignment. Used for homepage hero sections where 
 * content should be center-aligned instead of left-aligned.
 * 
 * Note: Vertical centering is handled by Cover.Center in the parent component.
 */
export function CenteredHeroContent({
  children,
  className = "",
  ...props
}: HeroContentProps & { children: ReactNode }) {
  return (
    <HeroContent {...props} className={`!w-auto mx-auto text-center ${className}`}>
      {children}
    </HeroContent>
  );
}
