import { ReactNode } from "react";

interface TabButtonProps {
  children: ReactNode;
  isActive: boolean;
}

/**
 * Styled button component for tab interfaces.
 * Provides consistent styling for tab buttons with active/inactive states.
 */
export function TabButton({ children, isActive }: TabButtonProps) {
  return (
    <span
      className={`
        backdrop-blur-sm text-14 leading-6 font-600 px-24 py-8 rounded-md
        ${
          isActive
            ? "opacity-100"
            : "opacity-80 hover:opacity-100 bg-transparent hover:bg text-grey-dark"
        }
      `}
      style={
        isActive
          ? {
              background: "rgb(var(--white))",
              color: "rgb(var(--brand))",
            }
          : undefined
      }
    >
      {children}
    </span>
  );
}
