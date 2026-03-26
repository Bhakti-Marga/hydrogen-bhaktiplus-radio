import { sentryInitialized } from '../instrument.server';
import type { EntryContext, HandleErrorFunction } from "react-router";

// Use the import to prevent tree-shaking
if (!sentryInitialized) {
  console.warn('Sentry not initialized');
}
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { createContentSecurityPolicy, type HydrogenContext } from "@shopify/hydrogen";
import * as Sentry from "@sentry/react-router/cloudflare";

async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenContext,
) {
  const { nonce, header, NonceProvider } = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    frameSrc: ["*"],
    connectSrc: [
      "wss://bhaktimarga.ngrok.dev:*",
      "wss://bhaktimarga.eu.ngrok.dev:*",
      "https://*.ingest.sentry.io",
      "https://*.ingest.de.sentry.io",
      // HubSpot
      "https://*.hubspot.com",
      "https://*.hsappstatic.net",
      "https://*.hscollectedforms.net",
    ],
    imgSrc: ["*"],
    styleSrc: ["*"],
    // styleSrc: ["https://use.typekit.net", "https://p.typekit.net/"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://cdn.shopify.com",
      // HubSpot
      "https://js.hs-scripts.com",
      "https://*.hubspot.com",
      "https://*.hs-analytics.net",
      "https://*.hsforms.com",
      "https://js.hsadspixel.net",
      "https://js.usemessages.com",
      "https://js.hs-banner.com",
      "https://js.hscollectedforms.net",
    ],
    fontSrc: [
      // "'self'",
      "data:",
      // "https://use.typekit.net",
      // "https://p.typekit.net/",
      "*",
    ],
  });

  const body = Sentry.injectTraceMetaTags(
    await renderToReadableStream(
      <NonceProvider>
        <ServerRouter context={reactRouterContext} url={request.url} nonce={nonce} />
      </NonceProvider>,
      {
        nonce,
        signal: request.signal,
        onError(error) {
          console.error('Render error:', error);
          if (error instanceof Error) {
            console.error('Error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name,
            });
          }
          // Capture rendering errors in Sentry
          Sentry.captureException(error);
          responseStatusCode = 500;
        },
      },
    ));

  if (isbot(request.headers.get("user-agent"))) {
    // allReady is part of React's ReadableStream extension, type assertion needed
    await (body as ReadableStream & { allReady: Promise<void> }).allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  responseHeaders.set("Content-Security-Policy", header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

export const handleError: HandleErrorFunction = (error, { request }) => {
  // React Router may abort some interrupted requests, don't log those
  if (!request.signal.aborted) {
    Sentry.captureException(error);
    console.error(error);
  }
};

export default Sentry.wrapSentryHandleRequest(handleRequest);
