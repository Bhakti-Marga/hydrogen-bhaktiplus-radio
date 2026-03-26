# Debug Utilities

Handy debug tools for development to visualize layout and React components.

## Usage

Open your browser console and use these commands:

### Enable Debug Mode

```javascript
window.debug.enable()
```

This will:
- Add **red borders** around all elements
- Show **React component names** in red labels at the top-left of each component
- Log a confirmation message to the console with component count

### Disable Debug Mode

```javascript
window.debug.disable()
```

This will:
- Remove all debug styling
- Clean up component name labels
- Log a confirmation message to the console

### Filter to Specific Components

```javascript
// Only show HoverVideoCard components
window.debug.filter(['HoverVideoCard'])

// Show multiple specific components
window.debug.filter(['HoverVideoCard', 'Carousel', 'Card'])
```

This will:
- Only show red borders and labels for the specified components
- Hide all other components from the debug view
- Re-scan automatically if debug mode is already enabled

### Ignore Specific Components

```javascript
// Hide Container components (useful when they're everywhere)
window.debug.ignore(['Container', 'ContainerWide'])

// Ignore multiple components
window.debug.ignore(['Container', 'Stack', 'Cover'])
```

This will:
- Hide red borders and labels for the specified components
- Show all other components
- Works with filters (filter takes precedence)

### Clear Filters

```javascript
window.debug.clearFilters()
```

This will:
- Remove all filters and ignore rules
- Show all components again
- Re-scan automatically if debug mode is already enabled

## Example Workflow

### Basic Usage
1. Open your app in the browser
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to the Console tab
4. Type: `window.debug.enable()`
5. All elements now have red borders and component names!
6. When done, type: `window.debug.disable()`

### Debugging Specific Components
```javascript
// Enable debug mode
window.debug.enable()

// Too many components? Filter to just what you need
window.debug.filter(['HoverVideoCard'])

// Found your issue? Clear filters to see everything again
window.debug.clearFilters()

// Container components everywhere? Ignore them
window.debug.ignore(['Container', 'Stack'])

// Done debugging
window.debug.disable()
```

## What It Shows

### Red Borders
Every element gets a 1px red border, making it easy to see:
- Component boundaries
- Spacing issues
- Unexpected nesting
- Layout problems

### Component Names
React components display their names (from `displayName` or function name) in small red labels, helping you:
- Identify which component is which
- Debug component hierarchies
- Find where specific components are rendered

**How it works:**
- Scans all DOM elements for React Fiber properties (`__reactFiber*`)
- Extracts component names from the fiber tree
- Walks up the fiber tree if needed to find named parent components
- Shows a console log with count: `🐛 Found X React components`
- Re-scans when DOM changes (via MutationObserver)

**Note:** Not all elements will show names - only those that have React components directly attached. Plain HTML elements (div, span, etc.) won't show names unless they're the root element of a React component.

## Files

- `/app/lib/debug.ts` - Main debug utility functions
- `/app/lib/debug.d.ts` - TypeScript declarations for window methods
- `/app/root.tsx` - App component loads utilities on mount via useEffect

## Notes

- Only available in development mode
- Uses React Fiber internals to extract component names
- Safe to use - doesn't modify your code, only adds temporary styling
- All changes are removed when you disable debug mode
