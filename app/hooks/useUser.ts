import { useMemo } from "react";
import type { UserContext } from "~/lib/types";
import { useUserContext } from "~/contexts";

export function useUser(): UserContext["state"] & UserContext["actions"] {
  const { state, actions } = useUserContext() as UserContext;

  return useMemo(
    () => ({
      ...state,
      ...actions,
    }),
    [state, actions]
  );
}
