# Development Tools Guide

This app includes a comprehensive development debugging system that exposes app state to the browser console.

## Quick Start

Open your browser console in development mode and type:

```js
// View all app state
window.__APP__.state

// Log all state nicely formatted
window.__APP__.logAll()

// View all available actions
window.__APP__.actions
```

## Current Available State

### Header Submenu
```js
// Check current state
window.__APP__.state.headerSubmenu.activeSubmenu  // Returns: number | null

// Open submenu #2
window.__APP__.actions.headerSubmenu.open(2)

// Close submenu
window.__APP__.actions.headerSubmenu.close()

// Set directly
window.__APP__.actions.headerSubmenu.set(1)
```

## Adding State to Dev Tools

### In a Context Provider

```tsx
import { useDevExpose } from "~/lib/devTools";

export function MyContextProvider({ children }: { children: ReactNode }) {
  const [myState, setMyState] = useState(initialValue);
  const [otherState, setOtherState] = useState(otherValue);

  // Expose to dev tools
  useDevExpose(
    'myContext',  // Key to access in window.__APP__
    { myState, otherState },  // State to expose
    {  // Actions (optional)
      setMyState,
      setOtherState,
      doSomething: () => {
        // Custom action
      }
    }
  );

  return (
    <MyContext.Provider value={{ myState, setMyState }}>
      {children}
    </MyContext.Provider>
  );
}
```

### In a Component

```tsx
import { useDevExpose } from "~/lib/devTools";

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useDevExpose(
    'myComponent',
    { isOpen, selectedId },
    { setIsOpen, setSelectedId, toggle: () => setIsOpen(!isOpen) }
  );

  return (
    // ...
  );
}
```

## Console Helpers

```js
// Get specific state quickly
window.__APP__.get('headerSubmenu')

// Call an action
window.__APP__.call('headerSubmenu', 'open', 2)

// Log everything
window.__APP__.logAll()
```

## TypeScript Support

The dev tools are fully typed. Your IDE will autocomplete:
- `window.__APP__.state.*`
- `window.__APP__.actions.*`

## Examples for Other Contexts

### TranslationsProvider
```tsx
useDevExpose(
  'translations',
  { currentLocale, strings },
  { switchLocale: (locale: string) => { /* ... */ } }
);

// Usage:
// window.__APP__.state.translations.currentLocale
// window.__APP__.actions.translations.switchLocale('fr-FR')
```

### User Context
```tsx
useDevExpose(
  'user',
  { isLoggedIn, user, isPremium, isSupporter },
  { logout, refreshUser }
);

// Usage:
// window.__APP__.state.user.isPremium
// window.__APP__.actions.user.logout()
```

### Search State
```tsx
useDevExpose(
  'search',
  { isOpen, query, results },
  { open: () => setIsOpen(true), close: () => setIsOpen(false), setQuery }
);

// Usage:
// window.__APP__.state.search.query
// window.__APP__.actions.search.setQuery('satsang')
```

## Best Practices

1. **Only expose in development** - The `useDevExpose` hook automatically only runs in dev mode
2. **Use descriptive keys** - Use clear, unique keys for each context/component
3. **Group related state** - Put related state values in the same object
4. **Provide useful actions** - Include helper actions beyond just setters
5. **Clean naming** - Use consistent naming patterns

## Tips

- Add `useDevExpose` to all your context providers for full visibility
- Add it to complex components that have tricky state
- Use `window.__APP__.logAll()` to quickly see everything at once
- Bookmark `copy(window.__APP__.state)` to copy state to clipboard
