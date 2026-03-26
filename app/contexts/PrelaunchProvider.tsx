import { createContext, useContext, ReactNode } from "react";
import { useRouteLoaderData } from "react-router";

interface PrelaunchContextValue {
  isPrelaunchMode: boolean;
  isPrelaunchActive: boolean;
  prelaunchEndDateFormatted: string | null;
}

const PrelaunchContext = createContext<PrelaunchContextValue>({
  isPrelaunchMode: false,
  isPrelaunchActive: false,
  prelaunchEndDateFormatted: null,
});

export function PrelaunchProvider({ children }: { children: ReactNode }) {
  const rootData = useRouteLoaderData("root") as any;
  const prelaunchConfig = rootData?.prelaunchConfig ?? {
    isPrelaunchMode: false,
    isActive: false,
    prelaunchEndDateFormatted: null,
  };

  return (
    <PrelaunchContext.Provider
      value={{
        isPrelaunchMode: prelaunchConfig.isPrelaunchMode,
        isPrelaunchActive: prelaunchConfig.isActive,
        prelaunchEndDateFormatted: prelaunchConfig.prelaunchEndDateFormatted,
      }}
    >
      {children}
    </PrelaunchContext.Provider>
  );
}

export function usePrelaunch() {
  return useContext(PrelaunchContext);
}
