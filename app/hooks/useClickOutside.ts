import { useEffect, useRef, type RefObject } from 'react';

/**
 * Hook that detects clicks outside of a referenced element and calls a handler.
 *
 * This hook properly handles cases where the DOM changes between mousedown and click events
 * (e.g., when a button click causes a re-render). It ensures that both the mousedown and click
 * events occurred outside the element before triggering the handler.
 *
 * @param ref - The ref object pointing to the element to detect clicks outside of
 * @param handler - Callback function to execute when a click outside is detected
 * @param enabled - Whether the hook is active (default: true)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const ref = useRef<HTMLDivElement>(null);
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   useClickOutside(ref, () => setIsOpen(false), isOpen);
 *
 *   return <div ref={ref}>Content</div>;
 * }
 * ```
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: () => void,
  enabled: boolean = true,
) {
  const mouseDownInsideRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;

    function handleMouseDown(event: MouseEvent) {
      // Store whether the mousedown occurred inside the ref
      // We capture this at mousedown time because the DOM might change before the click event
      mouseDownInsideRef.current = ref.current?.contains(event.target as Node) ?? false;
    }

    function handleClick(event: MouseEvent) {
      const clickInsideRef = ref.current?.contains(event.target as Node) ?? false;

      // Only trigger the handler if both mousedown and click happened outside the element
      // This prevents false positives when:
      // 1. User clicks a button inside the element
      // 2. The click handler causes a re-render that changes the DOM
      // 3. The click event fires but the target is no longer in the same location
      if (!clickInsideRef && !mouseDownInsideRef.current) {
        handler();
      }

      // Reset after handling click
      mouseDownInsideRef.current = false;
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('click', handleClick);
    };
  }, [ref, handler, enabled]);
}
