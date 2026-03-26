/**
 * Debug utilities for development
 *
 * Usage in browser console:
 * - window.debug.enable() - Show red borders and component names
 * - window.debug.disable() - Remove debug styling
 * - window.debug.filter(['ComponentName']) - Only show specific components
 * - window.debug.ignore(['ComponentName']) - Hide specific components
 * - window.debug.clearFilters() - Reset filters
 */

let debugStyleElement: HTMLStyleElement | null = null;
let debugObserver: MutationObserver | null = null;
let componentFilters: string[] = [];
let componentIgnoreList: string[] = [];

export function enableDebugBoxes() {
  if (debugStyleElement) {
    console.warn('Debug boxes already enabled');
    return;
  }

  // Add global CSS for all elements
  const debugStyles = `
    * {
      border: 1px solid #ff0000 !important;
      box-sizing: border-box !important;
    }

    /* Show React component names using data attributes */
    [data-reactroot] * {
      position: relative !important;
    }

    /* Show component names using displayName or data-component */
    [data-component]::before,
    [data-display-name]::before {
      content: attr(data-component) attr(data-display-name) !important;
      position: absolute !important;
      top: -1px !important;
      left: -1px !important;
      background: #ff0000 !important;
      color: white !important;
      font-size: 10px !important;
      font-family: monospace !important;
      font-weight: bold !important;
      padding: 2px 4px !important;
      line-height: 1 !important;
      z-index: 10000 !important;
      pointer-events: none !important;
      white-space: nowrap !important;
    }
  `;

  debugStyleElement = document.createElement('style');
  debugStyleElement.innerHTML = debugStyles;
  debugStyleElement.setAttribute('data-debug-mode', 'true');
  document.head.appendChild(debugStyleElement);

  // Function to scan and label React components
  const scanForReactComponents = () => {
    const elements = document.querySelectorAll('*');
    let foundCount = 0;
    const componentCounts: Record<string, number> = {};
    const filteredOut: string[] = [];

    elements.forEach((element) => {
      const el = element as HTMLElement;

      // Skip if already labeled
      if (el.dataset.displayName) return;

      // Check for React Fiber properties (React 16+)
      const fiberKey = Object.keys(el).find(key =>
        key.startsWith('__reactFiber') ||
        key.startsWith('__reactInternalInstance')
      );

      if (fiberKey) {
        const fiber = (el as any)[fiberKey];

        // Try to get component name from various fiber properties
        let componentName =
          fiber?.type?.displayName ||
          fiber?.type?.name ||
          fiber?.elementType?.displayName ||
          fiber?.elementType?.name;

        // Walk up the fiber tree to find a named component
        if (!componentName || componentName === 'Unknown') {
          let currentFiber = fiber?.return;
          let depth = 0;
          while (currentFiber && depth < 10) {
            const name = currentFiber?.type?.displayName ||
                        currentFiber?.type?.name ||
                        currentFiber?.elementType?.displayName ||
                        currentFiber?.elementType?.name;

            if (name && name !== 'Unknown' && typeof name === 'string') {
              componentName = name;
              break;
            }
            currentFiber = currentFiber.return;
            depth++;
          }
        }

        if (componentName && componentName !== 'Unknown' && typeof componentName === 'string') {
          // Track all component names found
          componentCounts[componentName] = (componentCounts[componentName] || 0) + 1;

          // Apply filters
          const shouldShow = shouldShowComponent(componentName);

          if (shouldShow) {
            el.dataset.displayName = componentName;
            foundCount++;
          } else {
            // Track filtered out components
            if (!filteredOut.includes(componentName)) {
              filteredOut.push(componentName);
            }
          }
        }
      }
    });

    console.log(`🐛 Found ${foundCount} React components (showing)`);
    console.log(`🐛 Component breakdown:`, componentCounts);

    if (componentFilters.length > 0) {
      console.log(`🐛 Active filters:`, componentFilters);
      console.log(`🐛 Filtered out:`, filteredOut);
    }

    if (componentIgnoreList.length > 0) {
      console.log(`🐛 Ignoring:`, componentIgnoreList);
    }
  };

  // Run initial scan
  scanForReactComponents();

  // Watch for DOM changes and re-scan
  debugObserver = new MutationObserver(() => {
    scanForReactComponents();
  });

  debugObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false // Don't trigger on attribute changes to avoid infinite loops
  });

  console.log('🐛 Debug boxes enabled! All elements now have red borders and React component names are shown.');
}

export function disableDebugBoxes() {
  if (debugStyleElement) {
    debugStyleElement.remove();
    debugStyleElement = null;
  }

  if (debugObserver) {
    debugObserver.disconnect();
    debugObserver = null;
  }

  // Clean up data attributes
  document.querySelectorAll('[data-display-name]').forEach(el => {
    delete (el as HTMLElement).dataset.displayName;
  });

  console.log('🐛 Debug boxes disabled.');
}

function shouldShowComponent(componentName: string): boolean {
  // If ignore list has items, check if component is in ignore list
  if (componentIgnoreList.length > 0) {
    if (componentIgnoreList.includes(componentName)) {
      return false;
    }
  }

  // If filter list has items, only show components in filter list
  if (componentFilters.length > 0) {
    return componentFilters.includes(componentName);
  }

  // No filters, show everything
  return true;
}

function rescanWithFilters() {
  // Clear existing labels
  document.querySelectorAll('[data-display-name]').forEach(el => {
    delete (el as HTMLElement).dataset.displayName;
  });

  // Re-scan (need to access the internal scan function)
  // Since we can't call enableDebugMode (it returns early), we need to trigger a rescan
  const elements = document.querySelectorAll('*');
  let foundCount = 0;
  const componentCounts: Record<string, number> = {};
  const filteredOut: string[] = [];

  elements.forEach((element) => {
    const el = element as HTMLElement;

    // Check for React Fiber properties (React 16+)
    const fiberKey = Object.keys(el).find(key =>
      key.startsWith('__reactFiber') ||
      key.startsWith('__reactInternalInstance')
    );

    if (fiberKey) {
      const fiber = (el as any)[fiberKey];

      // Try to get component name from various fiber properties
      let componentName =
        fiber?.type?.displayName ||
        fiber?.type?.name ||
        fiber?.elementType?.displayName ||
        fiber?.elementType?.name;

      // Walk up the fiber tree to find a named component
      if (!componentName || componentName === 'Unknown') {
        let currentFiber = fiber?.return;
        let depth = 0;
        while (currentFiber && depth < 10) {
          const name = currentFiber?.type?.displayName ||
                      currentFiber?.type?.name ||
                      currentFiber?.elementType?.displayName ||
                      currentFiber?.elementType?.name;

          if (name && name !== 'Unknown' && typeof name === 'string') {
            componentName = name;
            break;
          }
          currentFiber = currentFiber.return;
          depth++;
        }
      }

      if (componentName && componentName !== 'Unknown' && typeof componentName === 'string') {
        // Track all component names found
        componentCounts[componentName] = (componentCounts[componentName] || 0) + 1;

        // Apply filters
        const shouldShow = shouldShowComponent(componentName);

        if (shouldShow) {
          el.dataset.displayName = componentName;
          foundCount++;
        } else {
          // Track filtered out components
          if (!filteredOut.includes(componentName)) {
            filteredOut.push(componentName);
          }
        }
      }
    }
  });

  console.log(`🐛 Found ${foundCount} React components (showing)`);
  console.log(`🐛 Component breakdown:`, componentCounts);

  if (componentFilters.length > 0) {
    console.log(`🐛 Active filters:`, componentFilters);
    console.log(`🐛 Filtered out:`, filteredOut);
  }

  if (componentIgnoreList.length > 0) {
    console.log(`🐛 Ignoring:`, componentIgnoreList);
  }
}

export function filterComponents(componentNames: string[]) {
  componentFilters = componentNames;
  console.log(`🐛 Filtering to show only: ${componentNames.join(', ')}`);

  // Re-scan if debug mode is active
  if (debugStyleElement) {
    rescanWithFilters();
  }
}

export function ignoreComponents(componentNames: string[]) {
  componentIgnoreList = componentNames;
  console.log(`🐛 Ignoring components: ${componentNames.join(', ')}`);

  // Re-scan if debug mode is active
  if (debugStyleElement) {
    rescanWithFilters();
  }
}

export function clearFilters() {
  componentFilters = [];
  componentIgnoreList = [];
  console.log('🐛 Filters cleared. Showing all components.');

  // Re-scan if debug mode is active
  if (debugStyleElement) {
    rescanWithFilters();
  }
}

// Export a nice API object
export const debug = {
  enable: enableDebugBoxes,
  disable: disableDebugBoxes,
  filter: filterComponents,
  ignore: ignoreComponents,
  clearFilters,
};
