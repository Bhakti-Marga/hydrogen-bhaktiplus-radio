import { ReactNode } from "react";
import "./Cover.css";

export interface CoverProps {
  children: ReactNode;
  /** Min height for desktop screens (default: 100vh) */
  minHeight?: string;
  /** Min height for mobile/tablet screens (defaults to minHeight if not provided) */
  mobileMinHeight?: string;
  padding?: string;
  className?: string;
}

export interface CoverCenterProps {
  children: ReactNode;
  className?: string;
}

function CoverCenter({ children, className = "" }: CoverCenterProps) {
  return (
    <div className={`cover-center my-auto ${className}`}>
      {children}
    </div>
  );
}

export function Cover({
  children,
  minHeight = "100vh",
  mobileMinHeight,
  padding = "",
  className = ""
}: CoverProps) {
  // Use CSS custom properties for responsive minHeight when mobileMinHeight is provided
  const style = mobileMinHeight ? {
    '--cover-mobile-height': mobileMinHeight,
    '--cover-desktop-height': minHeight,
    ...(padding && { padding }),
  } as React.CSSProperties : {
    minBlockSize: minHeight,
    ...(padding && { padding }),
  };

  const responsiveClass = mobileMinHeight
    ? 'min-h-[var(--cover-mobile-height)] desktop:min-h-[var(--cover-desktop-height)]'
    : '';

  return (
    <div
      className={`cover flex flex-col ${responsiveClass} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

Cover.Center = CoverCenter;
