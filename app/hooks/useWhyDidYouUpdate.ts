import { useEffect, useRef } from 'react';

/**
 * Modern hook for debugging component re-renders
 *
 * Usage:
 * ```tsx
 * function MyComponent({ prop1, prop2 }) {
 *   const [state1, setState1] = useState(0);
 *
 *   // Only runs in development
 *   useWhyDidYouUpdate('MyComponent', { prop1, prop2, state1 });
 *
 *   return <div>...</div>;
 * }
 * ```
 *
 * Output in console:
 * [why-did-you-update] MyComponent
 *   prop1: oldValue -> newValue
 *   state1: 0 -> 1
 *
 * @param componentName - Name to display in console
 * @param props - Object containing props/state to track
 */
export function useWhyDidYouUpdate<T extends Record<string, any>>(
  componentName: string,
  props: T
) {
  // Hooks must be called unconditionally to satisfy React hooks rules
  const renderCount = useRef(0);
  const previousProps = useRef<T>();

  // Only run logic in development
  const isProduction = process.env.NODE_ENV === 'production';

  // THIS RUNS ON EVERY RENDER (not just in useEffect)
  // This catches infinite render loops even when props don't change
  if (!isProduction) {
    renderCount.current += 1;
  }

  useEffect(() => {
    if (isProduction) return;
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        const prevValue = previousProps.current?.[key];
        const currentValue = props[key];

        // Deep comparison for objects/arrays
        if (!Object.is(prevValue, currentValue)) {
          changedProps[key] = {
            from: prevValue,
            to: currentValue,
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.group(`🔄 [render #${renderCount.current}] ${componentName} - Props changed`);
        Object.entries(changedProps).forEach(([key, { from, to }]) => {
          console.log(`  ${key}:`, from, '→', to);
        });
        console.groupEnd();
      } else {
        // Log EVERY render, even when props don't change
        // This is critical for catching infinite render loops!
        console.log(`🔄 [render #${renderCount.current}] ${componentName} - Re-rendered but no props changed (possible infinite loop!)`);
      }
    } else {
      console.log(`🎬 [render #${renderCount.current}] ${componentName} - Initial render`);
    }

    previousProps.current = props;
  });
}

/**
 * Simple render count tracking - logs on EVERY render
 *
 * Usage:
 * ```tsx
 * function MyComponent({ prop1 }) {
 *   useRenderCount('MyComponent');
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRenderCount(componentName: string) {
  // Hooks must be called unconditionally to satisfy React hooks rules
  const renderCount = useRef(0);

  // Only run logic in development
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) return;

  // Increment on EVERY render (before useEffect)
  renderCount.current += 1;

  // Log the count
  console.log(`📊 [render #${renderCount.current}] ${componentName}`);
}

/**
 * Comprehensive debugging that combines both
 *
 * Usage:
 * ```tsx
 * function MyComponent({ prop1, prop2 }) {
 *   const [state1, setState1] = useState(0);
 *
 *   useDebugRender('MyComponent', { prop1, prop2, state1 });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useDebugRender<T extends Record<string, any>>(
  componentName: string,
  props: T
) {
  useRenderCount(componentName);
  useWhyDidYouUpdate(componentName, props);
}
