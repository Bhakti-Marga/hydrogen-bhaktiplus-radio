import type { LoaderFunctionArgs } from "react-router";

/**
 * OAuth Callback Route - NO LOCALE PREFIX
 *
 * This route handles the OAuth callback from Shopify's Customer Account API.
 * It must NOT have a locale prefix because Shopify redirects to a fixed callback URL
 * configured in the Customer Account API settings (e.g., https://bhakti.plus/account/authorize).
 *
 * The locale-prefixed version still exists for backwards compatibility and internal redirects.
 */
export async function loader({ context, request }: LoaderFunctionArgs) {
  console.log('🟠 [AUTHORIZE ROUTE] Loader called for /account/authorize (no locale prefix)');
  console.log('🟠 [AUTHORIZE ROUTE] Request URL:', request.url);

  // Check what's in the session before authorization
  console.log('🟠 [AUTHORIZE ROUTE] Session data before authorize:', context.session.get('customerAccount'));

  console.log('🟠 [AUTHORIZE ROUTE] Calling customerAccount.authorize()...');
  const response = await context.customerAccount.authorize();

  console.log('🟠 [AUTHORIZE ROUTE] Authorize response status:', response.status);
  console.log('🟠 [AUTHORIZE ROUTE] Authorize response headers:', Object.fromEntries(response.headers));
  console.log('🟠 [AUTHORIZE ROUTE] Redirect location:', response.headers.get('Location'));

  return response;
}

