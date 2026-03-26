import { useMemo } from "react";
import type { GlobalContext } from "~/lib/types";
import { useGlobalContext } from "~/contexts";

export function useGlobal(): GlobalContext["state"] & GlobalContext["actions"] {
  const { state, actions } = useGlobalContext() as GlobalContext;

  return useMemo(
    () => ({
      ...state,
      ...actions,
    }),
    [state, actions]
  );
}
