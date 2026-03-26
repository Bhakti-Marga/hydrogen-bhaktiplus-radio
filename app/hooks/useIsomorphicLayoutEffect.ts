import { useEffect, useLayoutEffect } from "react";

/**
 * Uses `useLayoutEffect` in the browser (synchronous before paint) and
 * falls back to `useEffect` on the server to avoid SSR warnings.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
