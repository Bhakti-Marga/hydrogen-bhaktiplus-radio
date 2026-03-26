/**
 * Sentry Server-Side Instrumentation
 *
 * This file initializes Sentry for server-side error tracking in Cloudflare Workers.
 *
 * IMPORTANT SETUP NOTES:
 *
 * 1. WHY THIS FILE EXISTS:
 *    - Sentry needs to be initialized BEFORE any app code runs to catch all errors
 *    - This runs at module initialization time (when the worker starts)
 *
 * 2. CLOUDFLARE WORKERS LIMITATION:
 *    - Cloudflare Workers don't have `process.env` at runtime
 *    - We use Vite's `define` option (see vite.config.ts) to inline env vars at BUILD time
 *    - `process.env.SENTRY_DSN` gets replaced with the actual DSN string during build
 *
 * 3. TREE-SHAKING PREVENTION:
 *    - We export `sentryInitialized` and import it in entry.server.tsx
 *    - Without this, Vite would tree-shake this entire file (remove it from bundle)
 *    - The export + import ensures the side effects (Sentry.init) are preserved
 *
 * 4. DEPLOYMENT REQUIREMENTS:
 *    - SENTRY_DSN must be available as an environment variable during CI/CD build
 *    - It gets inlined into the bundle at build time (NOT runtime)
 *    - If you see an empty DSN in logs, check your build-time environment variables
 */

import * as Sentry from "@sentry/react-router/cloudflare";

console.log('=== INSTRUMENT.SERVER.MJS IS RUNNING ===');
console.log('process.env.SENTRY_DSN:', process.env.SENTRY_DSN);
console.log('process.env.SENTRY_RELEASE:', process.env.SENTRY_RELEASE);

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.SENTRY_RELEASE,
  sendDefaultPii: true,
  tracesSampleRate: 0.05,
});

console.log('=== SENTRY INITIALIZED ===');

// IMPORTANT: This export prevents tree-shaking
// Without it, Vite removes this entire file from the bundle
// See entry.server.tsx where this is imported
export const sentryInitialized = true;
