import { ReactNode } from "react";

export type StackGap = 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface StackProps {
  children: ReactNode;
  gap?: StackGap;
  className?: string;
}

const gapClasses: Record<StackGap, string> = {
  0.5: "gap-sp-0.5",
  1: "gap-sp-1",
  1.5: "gap-sp-1.5",
  2: "gap-sp-2",
  3: "gap-sp-3",
  4: "gap-sp-4",
  5: "gap-sp-5",
  6: "gap-sp-6",
  7: "gap-sp-7",
  8: "gap-sp-8",
  9: "gap-sp-9",
};

export function Stack({ children, gap = 6, className = "" }: StackProps) {
  const gapClass = gapClasses[gap];

  return (
    <div className={`stack flex flex-col min-w-0 ${gapClass} ${className}`}>
      {children}
    </div>
  );
}
