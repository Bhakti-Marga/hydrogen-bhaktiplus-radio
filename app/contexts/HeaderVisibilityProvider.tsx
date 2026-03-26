import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef } from "react";

interface HeaderVisibilityContextType {
  isHeaderHidden: boolean;
}

const HeaderVisibilityContext = createContext<HeaderVisibilityContextType | undefined>(undefined);

/**
 * Provider that tracks header visibility based on scroll direction.
 * - Scrolling down (past threshold) → header hidden
 * - Scrolling up → header visible
 * 
 * This allows other components (like sticky navs) to react to header visibility.
 */
export function HeaderVisibilityProvider({ children }: { children: ReactNode }) {
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  // Use ref for lastScrollY to avoid re-creating scroll listener on every scroll
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const lastScrollY = lastScrollYRef.current;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderHidden(true);
      } else {
        setIsHeaderHidden(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []); // Empty dependency array - listener attached once

  const value = useMemo(
    () => ({ isHeaderHidden }),
    [isHeaderHidden]
  );

  return (
    <HeaderVisibilityContext.Provider value={value}>
      {children}
    </HeaderVisibilityContext.Provider>
  );
}

export function useHeaderVisibility() {
  const context = useContext(HeaderVisibilityContext);
  if (context === undefined) {
    throw new Error("useHeaderVisibility must be used within a HeaderVisibilityProvider");
  }
  return context;
}

