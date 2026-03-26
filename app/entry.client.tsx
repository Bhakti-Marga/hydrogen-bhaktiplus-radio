import { HydratedRouter } from "react-router/dom";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { NonceProvider } from "@shopify/hydrogen";
import * as Sentry from "@sentry/react-router/cloudflare";

declare global {
  interface Window {
    ENV: {
      SENTRY_DSN: string;
      SENTRY_RELEASE: string;
      ENVIRONMENT: string;
    };
    Sentry: typeof Sentry;
  }
}

if (!window.location.origin.includes("webcache.googleusercontent.com")) {
  Sentry.init({
    dsn: window.ENV?.SENTRY_DSN || '',
    release: window.ENV?.SENTRY_RELEASE,
    environment: window.ENV?.ENVIRONMENT || 'development',
    integrations: [
      Sentry.reactRouterTracingIntegration(),
    ],
    tracesSampleRate: 0.05, // Sample 5% of traces
  });

  window.Sentry = Sentry;

  startTransition(() => {
    const existingNonce = document
      .querySelector<HTMLScriptElement>("script[nonce]")
      ?.nonce || undefined;

    hydrateRoot(
      document,
      <StrictMode>
        <NonceProvider value={existingNonce}>
          <HydratedRouter />
        </NonceProvider>
      </StrictMode>,
    );
  });
}
