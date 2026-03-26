import { useEffect } from 'react';

// Central dev store
const devStore = {
  state: {} as Record<string, any>,
  actions: {} as Record<string, any>,

  // Helper to log all state
  logAll() {
    console.group('📊 App State');
    Object.entries(this.state).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.groupEnd();
  },

  // Helper to get specific state
  get(key: string) {
    return this.state[key];
  },

  // Helper to call an action
  call(key: string, actionName: string, ...args: any[]) {
    const actions = this.actions[key];
    if (!actions || !actions[actionName]) {
      console.error(`Action ${key}.${actionName} not found`);
      return;
    }
    return actions[actionName](...args);
  }
};

// Expose to window in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).__APP__ = devStore;
  console.log('🔧 Dev tools enabled. Access app state via window.__APP__');
  console.log('  - window.__APP__.state - view all state');
  console.log('  - window.__APP__.logAll() - log all state to console');
  console.log('  - window.__APP__.actions - view all actions');
}

/**
 * Hook to expose component state to window for debugging in development
 *
 * @example
 * const [activeSubmenu, setActiveSubmenu] = useState(null);
 * useDevExpose('headerSubmenu',
 *   { activeSubmenu },
 *   { setActiveSubmenu, open: (idx) => setActiveSubmenu(idx), close: () => setActiveSubmenu(null) }
 * );
 *
 * // In console:
 * window.__APP__.state.headerSubmenu.activeSubmenu
 * window.__APP__.actions.headerSubmenu.open(2)
 */
export function useDevExpose(
  key: string,
  state: any,
  actions?: Record<string, (...args: any[]) => any>
) {
  useEffect(() => {
    if (import.meta.env.DEV) {
      devStore.state[key] = state;
      if (actions) {
        devStore.actions[key] = actions;
      }

      // Cleanup on unmount
      return () => {
        delete devStore.state[key];
        delete devStore.actions[key];
      };
    }
  }, [key, state, actions]);
}

export { devStore };
