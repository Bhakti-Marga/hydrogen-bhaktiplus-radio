import { ReactNode } from "react";
import { containerClasses } from "~/lib/utils";
import { SizeOptions } from "~/lib/types/general.types";

export interface ContainerWideProps {
  children: ReactNode;
  className?: string;
  topPadding?: SizeOptions;
  bottomPadding?: SizeOptions;
  topMargin?: SizeOptions;
  bottomMargin?: SizeOptions;
}

export function ContainerWide({
  children,
  className = "",
  topPadding,
  bottomPadding,
  topMargin,
  bottomMargin,
}: ContainerWideProps) {
  const spacingClasses = ["w-full"];

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

  return (
    <div className={`${className} ${spacingClasses.join(" ")}`}>
      {children}
    </div>
  );
}
