import { ReactNode } from "react";
import { containerClasses } from "~/lib/utils";
import { SizeOptions } from "~/lib/types/general.types";

export interface ContainerProps {
  children: ReactNode;
  className?: string;
  topPadding?: SizeOptions;
  bottomPadding?: SizeOptions;
  topMargin?: SizeOptions;
  bottomMargin?: SizeOptions;
  /** When true, only applies left padding - content bleeds to right edge */
  bleedRight?: boolean;
}

export function Container({
  children,
  className = "",
  topPadding,
  bottomPadding,
  topMargin,
  bottomMargin,
  bleedRight = false,
}: ContainerProps) {
  // Build spacing classes
  const spacingClasses: string[] = [];

  if (topPadding) {
    spacingClasses.push(containerClasses.paddingTop[topPadding]);
  }

  if (bottomPadding) {
    spacingClasses.push(containerClasses.paddingBottom[bottomPadding]);
  }

  if (topMargin) {
    spacingClasses.push(containerClasses.marginTop[topMargin]);
  }

  if (bottomMargin) {
    spacingClasses.push(containerClasses.marginBottom[bottomMargin]);
  }

  // Padding matches Tailwind container config: DEFAULT: 0.75rem, tablet: 1.5rem, desktop: 3.75rem, wide: 3.75rem
  // For bleedRight, use separate left/right utilities to avoid px-* overriding pr-0
  const paddingClasses = bleedRight
    ? "pl-12 tablet:pl-24 desktop:pl-60 wide:pl-60 pr-0" // Left padding only, no right padding
    : "px-12 tablet:px-24 desktop:px-60 wide:px-60"; // Padding on both sides

  // Two-level structure: outer wrapper centers content, inner div has padding and max-width
  // w-full ensures proper centering when Container is inside a flex row container
  const wrapperClasses = "flex justify-center w-full";

  const contentClasses = [
    className,
    "w-full",
    paddingClasses,
    "max-w-[1536px]", // Reasonable max-width (matches Tailwind's 2xl breakpoint)
    ...spacingClasses,
  ].filter(Boolean).join(" ");

  return (
    <div className={wrapperClasses}>
      <div className={contentClasses}>{children}</div>
    </div>
  );
}
