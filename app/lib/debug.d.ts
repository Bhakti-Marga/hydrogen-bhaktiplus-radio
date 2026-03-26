/**
 * TypeScript declarations for debug utilities
 */

declare global {
  interface Window {
    /**
     * Debug utilities for visualizing layout and React components
     */
    debug: {
      /**
       * Enable debug mode - shows red borders around all elements
       * and displays React component names
       */
      enable: () => void;

      /**
       * Disable debug mode - removes all debug styling
       */
      disable: () => void;

      /**
       * Filter to show only specific components by name
       * @param componentNames - Array of component names to show
       * @example window.debug.filter(['HoverVideoCard', 'Carousel'])
       */
      filter: (componentNames: string[]) => void;

      /**
       * Ignore specific components by name
       * @param componentNames - Array of component names to hide
       * @example window.debug.ignore(['Container', 'div'])
       */
      ignore: (componentNames: string[]) => void;

      /**
       * Clear all filters and show all components
       */
      clearFilters: () => void;
    };
  }
}

export {};
