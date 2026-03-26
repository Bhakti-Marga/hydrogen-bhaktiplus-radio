import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { useDevExpose } from "~/lib/devTools";

interface HeaderSubmenuContextType {
  activeSubmenu: number | null;
  setActiveSubmenu: (idx: number | null) => void;
}

const HeaderSubmenuContext = createContext<HeaderSubmenuContextType | undefined>(undefined);

export function HeaderSubmenuProvider({ children }: { children: ReactNode }) {
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);

  // Expose to window in development for easy debugging
  useDevExpose(
    'headerSubmenu',
    { activeSubmenu },
    {
      set: setActiveSubmenu,
      open: (idx: number) => setActiveSubmenu(idx),
      close: () => setActiveSubmenu(null),
    }
  );

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ activeSubmenu, setActiveSubmenu }),
    [activeSubmenu]
  );

  return (
    <HeaderSubmenuContext.Provider value={value}>
      {children}
    </HeaderSubmenuContext.Provider>
  );
}

export function useHeaderSubmenu() {
  const context = useContext(HeaderSubmenuContext);
  if (context === undefined) {
    throw new Error("useHeaderSubmenu must be used within a HeaderSubmenuProvider");
  }
  return context;
}
