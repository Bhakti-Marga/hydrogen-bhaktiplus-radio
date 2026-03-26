/// <reference types="vite/client" />
/// <reference types="@shopify/remix-oxygen" />
/// <reference types="@shopify/oxygen-workers-types" />

// Enhance TypeScript's built-in typings.
import "@total-typescript/ts-reset";

import type {
  HydrogenContext,
  HydrogenSessionData,
  HydrogenEnv,
} from "@shopify/hydrogen";
import type { createAppLoadContext } from "~/lib/context";
import { SubscriptionTier, User } from "~/lib/types";

declare global {
  /**
   * A global `process` object is only available during build to access NODE_ENV.
   */
  const process: { env: { NODE_ENV: "production" | "development" } };

  interface Env extends HydrogenEnv {
    // declare additional Env parameter use in the fetch handler and Remix loader context here
    MEDIA_API_URL: string;
    MEDIA_API_KEY: string;
    MEDIA_API_VERSION: string;
    ENVIRONMENT: "production" | "development";
    DEVELOPMENT_USER_TAGS: string; // Comma-separated Shopify customer tags, e.g., "premium-member,ppv_holi-2026"
    DEVELOPMENT_USER_ALLOW_OVERRIDE: string;
    PUBLIC_BASE_URL: string;
    PUBLIC_CUSTOMER_ACCOUNT_API_URL: string;
    PUBLIC_COOKIE_DOMAIN: string;
    APPLE_TEAM_ID?: string; // Apple Team ID for Universal Links (iOS app)
    ANDROID_APP_FINGERPRINT?: string; // SHA256 cert fingerprint for Android App Links

    // Prelaunch mode configuration
    PRELAUNCH_MODE?: string; // "true" to enable prelaunch mode
    PRELAUNCH_END_DATE?: string; // ISO date string, e.g., "2025-01-15"

    // Third-party integrations
    APPSTLE_API_KEY?: string; // Appstle subscription management API key (EU store)
    APPSTLE_API_KEY_ROW?: string; // Appstle subscription management API key (ROW store)

    // Shopify Admin API (for cross-store order queries)
    PRIVATE_ADMIN_API_TOKEN?: string; // EU store Admin API token
    PRIVATE_ADMIN_API_TOKEN_ROW?: string; // ROW store Admin API token
    PUBLIC_STORE_DOMAIN_ROW?: string; // ROW store domain (e.g., "guruconnect-108-row.myshopify.com")
    SENTRY_DSN?: string; // Sentry error tracking DSN

    // Router monitoring
    ROUTER_MONITORING_URL?: string; // URL for router analytics/monitoring
    ROUTER_MONITORING_KEY?: string; // API key for router monitoring

    // Development/testing
    FEATURED_LIVE_OVERRIDE_ID?: string; // Override featured live with specific content ID (for staging)
    INCLUDE_UNPUBLISHED_CONTENT?: string; // "true" to include unpublished/draft content in API responses (for staging)

    // Load test configuration
    LOADTEST_USER_EMAIL?: string; // Email for load test user - bypasses Shopify auth
    LOADTEST_SENTRY_DSN?: string; // Separate Sentry DSN for load test errors

    /**
     * Multi-store checkout configuration
     *
     * We have two Shopify stores (EU and ROW) but a single frontend domain (bhakti.plus).
     * The key distinction:
     *
     * - PUBLIC_STORE_DOMAIN: The Shopify backend store domain (e.g., "guruconnect-108.myshopify.com")
     *   Used for: CSP headers, Hydrogen internals, API authentication context
     *   Note: This is the EU store domain by default. The ROW store domain is not exposed
     *   to the frontend since we don't need it for any client-facing functionality.
     *
     * - PUBLIC_CHECKOUT_DOMAIN / PUBLIC_CHECKOUT_DOMAIN_ROW: Customer-facing checkout domains
     *   Used for: Building cart/checkout URLs that customers are redirected to
     *   These differ between stores because Shopify checkout is store-specific.
     *
     * The /subscribe route determines which checkout domain to use based on customer's
     * billing country (detected via Cloudflare headers or user selection).
     */
    PUBLIC_CHECKOUT_DOMAIN_ROW: string; // ROW (Rest of World) checkout domain
  }
}

declare module "@shopify/remix-oxygen" {
  interface AppLoadContext
    extends Awaited<ReturnType<typeof createAppLoadContext>> {
    // to change context type, change the return of createAppLoadContext() instead
    // NOTE: mediaApi is NOT on context - use userScopedMediaApi from middleware instead
    // via context.get(userScopedMediaApiContext)
    user: User;
    subscriptionTier: SubscriptionTier;
  }

  interface SessionData extends HydrogenSessionData {
    // declare local additions to the Remix session data here
  }
}
