import { useGlobal } from "./useGlobal";

/**
 * Hook to check if user has interacted with the site this session
 *
 * Returns:
 * - hasInteracted: boolean - true if user has clicked/interacted this session
 * - setHasInteracted: (value: boolean) => void - function to mark interaction
 *
 * Used to gate autoplay behavior and satisfy browser autoplay policies
 */
export function useHasUserInteracted() {
  const globalContext = useGlobal();

  const { hasInteracted, setHasInteracted } = globalContext;

  return {
    hasInteracted,
    setHasInteracted,
  };
}
