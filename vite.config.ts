import { defineConfig, loadEnv } from "vite";
import { hydrogen } from "@shopify/hydrogen/vite";
import { oxygen } from "@shopify/mini-oxygen/vite";
import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router";
import { execSync } from "child_process";

import tsconfigPaths from "vite-tsconfig-paths";

// Generate release identifier from git commit SHA
const getRelease = () => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch (e) {
    console.warn("[Vite] Could not get git SHA for release:", e);
    return process.env.SENTRY_RELEASE || "unknown";
  }
};

export default defineConfig((config) => {
  const { mode } = config;
  const env = loadEnv(mode, process.cwd(), "");
  const release = getRelease();

  return {
    /**
     * SENTRY CONFIGURATION FOR CLOUDFLARE WORKERS
     *
     * Cloudflare Workers don't have access to `process.env` at runtime.
     * We use Vite's `define` to replace `process.env.SENTRY_DSN` with the
     * actual DSN string at BUILD time.
     *
     * Example: `process.env.SENTRY_DSN` → `"https://abc123@sentry.io/456"`
     *
     * CRITICAL: SENTRY_DSN must be set as an environment variable during
     * your CI/CD build process (not just in Oxygen runtime config).
     */
    define: {
      "process.env.SENTRY_DSN": JSON.stringify(env.SENTRY_DSN || ""),
      "process.env.SENTRY_RELEASE": JSON.stringify(release),
      "process.env.VIDEO_PLAYER_BASE_URL": JSON.stringify(
        env.VIDEO_PLAYER_BASE_URL ||
          "https://bhaktimarga.org/up/bmdatahub/mediaplatform/player/mediaplatformv2.php",
      ),
      "process.env.VIDEO_PLAYER_V1_HLS_BASE_URL": JSON.stringify(
        env.VIDEO_PLAYER_V1_HLS_BASE_URL ||
          "https://bhaktimarga.org/up/bmdatahub/mediaplatform/player/mediaplatformv1hls.php",
      ),
      "process.env.MEDIA_API_URL": JSON.stringify(env.MEDIA_API_URL || ""),
    },
    plugins: [
      hydrogen(),
      oxygen({
        // Pass custom env vars to the Oxygen runtime
        env: {
          ENVIRONMENT: env.ENVIRONMENT,
          ...(env.DEVELOPMENT_USER_TAGS && {
            DEVELOPMENT_USER_TAGS: env.DEVELOPMENT_USER_TAGS,
          }),
        },
      }),
      reactRouter(),
      sentryReactRouter(
        {
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          release: {
            name: release,
          },
          // Note: sourcemaps are handled by sentry-upload.mjs postbuild script
          // because Hydrogen's buildEnd hook is not supported
          sourceMapsUploadOptions: {
            enabled: false,
          },
        },
        config,
      ),
      tsconfigPaths(),
      // nodePolyfills(),
    ],
    build: {
      // Allow a strict Content-Security-Policy
      // withtout inlining assets as base64:
      assetsInlineLimit: 0,
      sourcemap: true,
    },
    server: {
      allowedHosts: [
        "kalyandas-bhaktiplus.bhaktimarga.ngrok.dev",
        "router.bhaktimarga.ngrok.dev",
        "bhaktiplus-ddd.bhaktimarga.ngrok.dev",
        "bhaktimarga.ngrok.dev",
        "bhaktimarga.eu.ngrok.dev",
        "select-moccasin-eagerly.ngrok-free.app",
        "anantayamediaplat.bhaktimarga.ngrok.dev",
      ],
    },
    ssr: {
      optimizeDeps: {
        /**
         * Include dependencies here if they throw CJS<>ESM errors.
         * For example, for the following error:
         *
         * > ReferenceError: module is not defined
         * >   at /Users/.../node_modules/example-dep/index.js:1:1
         *
         * Include 'example-dep' in the array below.
         * @see https://vitejs.dev/config/dep-optimization-options
         */
        include: [
          "use-sync-external-store/shim",
          "hoist-non-react-statics",
          "react-highlight-words",
          "@headlessui/react",
          "@sentry/react-router",
        ],
      },
    },
  };
});
