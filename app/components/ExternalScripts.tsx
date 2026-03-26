import { Script } from "@shopify/hydrogen";

import { useLoadScript } from "~/hooks";

/**
 * Use useLoadScript hook to lazy load third party scripts.
 * Pass an object with script attributes as first argument. `id` is required
 * Pass 'head' as second argument to load script in the head, if required. Otherwise pass 'body' or undefined
 * Pass a boolean as third argument to conditionally load the script.
 * IMPORTANT: Third party scripts rendered directly, i.e. as <script> tags, will likely cause hydration errors as a gotcha of Remix. Use the useLoadScript hook to avoid this issue.
 */

export function ExternalScripts({ nonce, ENV }: { nonce: string | undefined; ENV?: any }) {
  // useLoadScript(
  //   {
  //     id: "bugherd",
  //     src: "https://www.bugherd.com/sidebarv2.js?apikey=bsluxchv1jrgtmt3w6pnba",
  //     async: true,
  //   },
  //   "head",
  // );

  return (
    // Adds all env vars prefixed with PUBLIC_ to the window for client-side use
    <Script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `window.ENV = ${JSON.stringify(ENV || {})};`,
      }}
    />
  );
}
