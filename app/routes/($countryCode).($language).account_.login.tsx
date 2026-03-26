import type { LoaderFunctionArgs } from "react-router";
import { getUrlPrefix } from "~/lib/locale";

export async function loader({ context, request }: LoaderFunctionArgs) {
  console.log('🟡 [LOGIN ROUTE] Loader called for /account/login');
  console.log('🟡 [LOGIN ROUTE] Request URL:', request.url);

  // Check for return_to or redirect query params
  const url = new URL(request.url);
  const returnTo = url.searchParams.get('return_to') || url.searchParams.get('redirect');
  console.log('🟡 [LOGIN ROUTE] return_to/redirect param:', returnTo);
  console.log('🟡 [LOGIN ROUTE] All query params:', Object.fromEntries(url.searchParams));

  // Check Referer header
  const referer = request.headers.get('Referer');
  console.log('🟡 [LOGIN ROUTE] Referer header:', referer);

  // Check session before login
  console.log('🟡 [LOGIN ROUTE] Session data before login:', context.session.get('customerAccount'));

  console.log('🟡 [LOGIN ROUTE] Calling customerAccount.login()...');
  // Hydrogen's login() now uses LoginOptions, not Request
  const response = await context.customerAccount.login();

  console.log('🟡 [LOGIN ROUTE] Login response status:', response.status);
  console.log('🟡 [LOGIN ROUTE] Login response headers:', Object.fromEntries(response.headers));

  // Check session after login (if we can)
  const sessionData = context.session.get('customerAccount');
  console.log('🟡 [LOGIN ROUTE] Session data after login:', sessionData);
  console.log('🟡 [LOGIN ROUTE] Session redirectPath:', sessionData?.redirectPath);

  return response;
}
