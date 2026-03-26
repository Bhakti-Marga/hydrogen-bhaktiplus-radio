import type { devStore } from '~/lib/devTools';

declare global {
  interface Window {
    /**
     * Development tools for inspecting app state
     * Only available in development mode
     *
     * @example
     * // View all state
     * window.__APP__.state
     *
     * // Log all state to console
     * window.__APP__.logAll()
     *
     * // Get specific state
     * window.__APP__.state.headerSubmenu
     *
     * // Call actions
     * window.__APP__.actions.headerSubmenu.open(2)
     */
    __APP__?: typeof devStore;
  }
}

export {};
