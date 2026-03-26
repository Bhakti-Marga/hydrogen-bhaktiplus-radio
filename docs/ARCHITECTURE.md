# Architecture Guide: Server vs Client in Hydrogen + React Router

This guide explains how your application works, what runs on the server vs client, and how to think about the architecture—especially important for integrating tools like Sentry.

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Entry Points](#entry-points)
3. [The Request Lifecycle](#the-request-lifecycle)
4. [What Runs Where](#what-runs-where)
5. [Understanding Sentry Integration](#understanding-sentry-integration)
6. [Practical Mental Model](#practical-mental-model)
7. [Common Patterns in This Project](#common-patterns-in-this-project)

---

## High-Level Overview

Your application uses **Hydrogen** (Shopify's React framework) built on **React Router v7**. This is a **Server-Side Rendering (SSR)** application with **hydration**, meaning:

1. **Server renders HTML** → User gets a fully-rendered page fast
2. **Browser "hydrates"** → React takes over the static HTML and makes it interactive
3. **Client-side navigation** → Subsequent page changes happen without full page reloads

Think of it like this:
```
First Visit:  Server → (HTML) → Browser → Hydrate
Navigation:   Browser → (fetch data) → Re-render
```

---

## Entry Points

There are **3 critical entry files** that define how your app works:

### 1. `app/entry.server.tsx` (SERVER ONLY)

**When it runs:** Every time a user requests a page from your server

**What it does:**
- Takes the React app and renders it to HTML on the server
- Sets up Content Security Policy (CSP)
- Wraps the app with Sentry for server-side error tracking
- Handles server-side rendering errors

**Key code:**
```tsx
// Renders your React app to HTML
const body = await renderToReadableStream(
  <ServerRouter context={reactRouterContext} url={request.url} />
)

// Wraps the default export with Sentry
export default Sentry.wrapSentryHandleRequest(handleRequest);

// Catches loader/action errors
export const handleError: HandleErrorFunction = (error, { request }) => {
  Sentry.captureException(error);
  console.error(error);
};
```

**Important:** This code NEVER runs in the browser. It runs on the server (or edge worker in production).

---

### 2. `app/entry.client.tsx` (CLIENT ONLY)

**When it runs:** Once, when the browser first loads the page

**What it does:**
- Initializes Sentry in the browser
- "Hydrates" the server-rendered HTML to make it interactive
- Only runs once per page load (not on client-side navigation)

**Key code:**
```tsx
// Initialize Sentry for browser errors
Sentry.init({
  dsn: window.ENV?.SENTRY_DSN,
  integrations: [Sentry.reactRouterTracingIntegration()],
});

// Hydrate the server-rendered HTML
hydrateRoot(
  document,
  <HydratedRouter />
);
```

**Important:** This runs ONLY in the browser. It has access to `window`, `document`, DOM APIs, etc.

---

### 3. `app/root.tsx` (BOTH SERVER AND CLIENT)

**When it runs:** On BOTH server (during SSR) and client (during hydration and navigation)

**What it does:**
- Exports a `loader` function (runs on server only)
- Exports `Layout` component (runs on both)
- Exports default `App` component (runs on both)
- Exports `ErrorBoundary` component (runs on both)

**Key distinction:**

```tsx
// RUNS ON SERVER ONLY (during SSR)
export async function loader(args: LoaderFunctionArgs) {
  // Can access server context, databases, APIs
  const { storefront, env } = args.context;
  return {
    user: context.user,
    translations: await fetchFromShopify(),
    ENV: { // Only these env vars are exposed to client
      PUBLIC_BASE_URL: env.PUBLIC_BASE_URL,
      SENTRY_DSN: env.SENTRY_DSN
    }
  };
}

// RUNS ON BOTH SERVER AND CLIENT
export function Layout({ children }: { children?: React.ReactNode }) {
  const data = useRouteLoaderData<RootLoader>("root"); // Data from loader

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// RUNS ON BOTH SERVER AND CLIENT
export function ErrorBoundary() {
  const error = useRouteError();
  captureException(error); // Sentry runs on client here
  return <div>Error: {error.message}</div>;
}
```

---

## The Request Lifecycle

### First Page Load (SSR)

```
1. Browser requests https://yoursite.com/
   ↓
2. Server (entry.server.tsx) receives request
   ↓
3. Server runs root loader + route loaders
   - Calls your APIs, databases
   - Has access to context.env, context.user
   - Returns data
   ↓
4. Server renders React components to HTML
   - Layout, App, Route components render with loader data
   - Sentry.injectTraceMetaTags adds trace metadata
   ↓
5. Server sends HTML to browser
   ↓
6. Browser receives HTML (user sees content!)
   ↓
7. Browser downloads JavaScript bundles
   ↓
8. entry.client.tsx runs:
   - Initializes Sentry with window.ENV.SENTRY_DSN
   - Hydrates the HTML (React attaches event listeners)
   ↓
9. Page is now interactive!
```

### Client-Side Navigation (after hydration)

```
1. User clicks <Link to="/satsangs">
   ↓
2. React Router intercepts (no page reload!)
   ↓
3. Browser fetches data:
   - Calls /satsangs route loader
   - Loader runs on SERVER
   ↓
4. Browser receives JSON data
   ↓
5. React re-renders components with new data
   ↓
6. Page updates without reload
```

---

## What Runs Where

### Server Only

✅ Runs on the server:
- `entry.server.tsx` - entire file
- `loader` functions in routes
- `action` functions in routes
- Anything inside loader/action
- Server utilities in `lib/utils/server.utils.ts`
- Context objects (storefront, cart, user)

```tsx
// app/routes/$(locale)._index.tsx
export async function loader({ context }: LoaderFunctionArgs) {
  // SERVER ONLY - can access databases, APIs, secrets
  const { mediaApi, user } = context; // context only exists on server

  const data = await mediaApi.lives.getFeatured(); // Server API call
  return { data };
}
```

### Client Only

✅ Runs in the browser:
- `entry.client.tsx` - entire file
- Browser APIs: `window`, `document`, `localStorage`
- Event handlers: `onClick`, `onChange`, etc.
- `useEffect`, `useState` hooks
- Client-side Sentry initialization

```tsx
// app/components/VideoPlayer.tsx
export function VideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // CLIENT ONLY - accessing window
    if (window.innerWidth < 768) {
      setIsPlaying(false);
    }
  }, []);

  return <video onClick={() => setIsPlaying(!isPlaying)} />;
}
```

### Both Server and Client

✅ Runs on both:
- React components (JSX)
- Component render logic
- `Layout`, `App`, `ErrorBoundary` exports
- Utility functions that don't use server/client-specific APIs

```tsx
// app/root.tsx
export function Layout({ children }) {
  // Runs on SERVER (during SSR) and CLIENT (during hydration)
  const nonce = useNonce(); // Works on both
  const data = useRouteLoaderData("root"); // Data from server loader

  return (
    <html>
      <head>
        <Meta /> {/* Renders on both */}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Understanding Sentry Integration

Your Sentry setup has **two separate instances**:

### Server-Side Sentry (`entry.server.tsx`)

```tsx
import * as Sentry from "@sentry/react-router/cloudflare";

// Wraps the server handler
export default Sentry.wrapSentryHandleRequest(handleRequest);

// Catches server errors (loader/action failures)
export const handleError: HandleErrorFunction = (error) => {
  Sentry.captureException(error); // Server Sentry
};
```

**Captures:**
- Server rendering errors
- Loader function errors
- Action function errors
- API failures during SSR

---

### Client-Side Sentry (`entry.client.tsx`)

```tsx
import * as Sentry from "@sentry/react-router/cloudflare";

// Initialize once when page loads
Sentry.init({
  dsn: window.ENV.SENTRY_DSN, // From server loader
  integrations: [Sentry.reactRouterTracingIntegration()],
});
```

**Captures:**
- Browser errors (undefined variables, etc.)
- React errors (component crashes)
- ErrorBoundary catches
- User interactions errors

---

### How Sentry Gets Configuration

```tsx
// root.tsx loader (SERVER)
export async function loader(args) {
  return {
    ENV: {
      SENTRY_DSN: env.SENTRY_DSN // Server env var
    }
  };
}

// root.tsx Layout (SERVER → CLIENT)
export function Layout() {
  const data = useRouteLoaderData("root");
  return (
    <html>
      <head>
        {/* Inject env vars into HTML */}
        <script dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(data.ENV)}`
        }} />
      </head>
    </html>
  );
}

// entry.client.tsx (CLIENT)
Sentry.init({
  dsn: window.ENV.SENTRY_DSN // Read from window
});
```

**Flow:**
1. Server loader returns `ENV` object
2. Server renders `<script>window.ENV = {...}</script>` in HTML
3. Browser receives HTML with `window.ENV` set
4. `entry.client.tsx` reads `window.ENV.SENTRY_DSN`
5. Client Sentry initializes

---

## Practical Mental Model

### Think of Your App as Two Programs

```
┌─────────────────────────────────┐
│       SERVER PROGRAM            │
│                                 │
│  • entry.server.tsx             │
│  • Route loaders                │
│  • Route actions                │
│  • context.* (user, cart, etc)  │
│  • Can access secrets/DBs       │
│  • Runs on every request        │
└─────────────────────────────────┘
           ↓ (HTML + Data)
┌─────────────────────────────────┐
│       CLIENT PROGRAM            │
│                                 │
│  • entry.client.tsx             │
│  • React components             │
│  • Event handlers               │
│  • Browser APIs (window, etc)   │
│  • Runs once, then navigates    │
└─────────────────────────────────┘
```

### Rules of Thumb

| Can I use...                     | Server | Client | Both |
|----------------------------------|--------|--------|------|
| `window`, `document`, `localStorage` | ❌ | ✅ | ❌ |
| `context.env`, `context.user`    | ✅ | ❌ | ❌ |
| `fetch()`, `await`               | ✅ | ✅ | ✅ |
| React hooks (`useState`, etc)    | ❌ | ✅ | ❌ |
| JSX rendering                    | ✅ | ✅ | ✅ |
| Database queries                 | ✅ | ❌ | ❌ |
| Click handlers                   | ❌ | ✅ | ❌ |

---

## Common Patterns in This Project

### Pattern 1: Route with Loader

```tsx
// app/routes/$(locale).satsangs._index.tsx

// RUNS ON SERVER
export async function loader({ context }: LoaderFunctionArgs) {
  const { mediaApi, user } = context; // Server-only context

  const categories = await mediaApi.satsangs.getCategories();

  return { categories, user };
}

// RUNS ON BOTH (Server during SSR, Client during hydration/navigation)
export default function SatsangsPage() {
  const { categories } = useLoaderData<typeof loader>();

  return (
    <div>
      {categories.map(cat => <Card key={cat.id} {...cat} />)}
    </div>
  );
}
```

### Pattern 2: Client-Side Interactivity

```tsx
export default function VideoPage() {
  const { video } = useLoaderData(); // Data from server
  const [isPlaying, setIsPlaying] = useState(false); // Client state

  useEffect(() => {
    // CLIENT ONLY - runs after hydration
    const handleKeyPress = (e) => {
      if (e.key === ' ') setIsPlaying(!isPlaying);
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  return <video playing={isPlaying} src={video.url} />;
}
```

### Pattern 3: Conditional Server/Client Code

```tsx
export default function MyComponent() {
  // Check if we're in the browser
  const isClient = typeof window !== 'undefined';

  if (isClient) {
    // Client-only code
    return <ClientComponent />;
  } else {
    // Server rendering fallback
    return <div>Loading...</div>;
  }
}
```

### Pattern 4: Critical vs Deferred Data

```tsx
// app/routes/$(locale)._index.tsx
export async function loader(args) {
  // Critical data - blocks rendering
  const criticalData = await loadCriticalData(args);

  // Deferred data - loads in background
  const deferredData = loadDeferredData(args); // No await!

  return { ...criticalData, ...deferredData };
}

async function loadCriticalData({ context }) {
  // Must have this to render the page
  const featuredLive = await mediaApi.lives.getFeatured();
  return { featuredLive };
}

function loadDeferredData({ context }) {
  // Returns promises, not awaited data
  return {
    pilgrimages: mediaApi.pilgrimages.getList(), // Promise
    commentaries: mediaApi.commentaries.getList(), // Promise
  };
}
```

---

## Debugging Tips

### How to tell where code is running:

```tsx
// Add this to any file
console.log('Running on:', typeof window === 'undefined' ? 'SERVER' : 'CLIENT');
```

### Common Issues:

1. **"window is not defined"**
   - You're using browser API on the server
   - Wrap in `typeof window !== 'undefined'` check or move to `useEffect`

2. **"context is undefined"**
   - You're trying to use server context on client
   - Move code into a loader function

3. **Sentry not capturing errors**
   - Check if error is on server (check server logs) or client (check browser console)
   - Ensure Sentry is initialized in the right place

4. **Data not available**
   - If it's null on first render, data might be deferred (returned as Promise)
   - Use React Suspense or check for null

---

## Summary

**Think of it this way:**

1. **entry.server.tsx** = The kitchen (prepares the meal)
2. **entry.client.tsx** = The dining room setup (prepares the table)
3. **root.tsx loader** = The chef (makes the food)
4. **root.tsx Layout/App** = The meal itself (enjoyed by everyone)
5. **Route loaders** = Individual dishes (prepared in kitchen)
6. **Route components** = Serving the dishes (both kitchen and table)

**For Sentry:**
- Server Sentry catches kitchen problems (cooking failures)
- Client Sentry catches dining problems (spills, complaints)
- Both are needed for full coverage!

When in doubt, ask yourself: "Does this code need access to the server (database, secrets, context)?" If yes → loader. If no → component/useEffect.
