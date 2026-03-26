import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import {
  generateRequestId,
  logRedirect,
  addDebugParams,
  getDebugParams,
} from "~/lib/logger";

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const to = formData.get('to');
  const reason = formData.get('reason') || 'api_redirect';

  const url = new URL(request.url);
  const debugParams = getDebugParams(url);
  const requestId = debugParams.debugRid || generateRequestId();

  if (!to || typeof to !== 'string') {
    logRedirect({
      id: requestId,
      from: url.pathname,
      to: '/',
      status: 302,
      reason: 'api_redirect_fallback',
      region: context.urlCountryCode,
      lang: context.urlLanguage,
    });
    return redirect('/');
  }

  // Log the redirect
  logRedirect({
    id: requestId,
    from: debugParams.debugFrom || url.pathname,
    to,
    status: 302,
    reason: String(reason),
    region: context.urlCountryCode,
    lang: context.urlLanguage,
  });

  // Add debug params to track redirect chain
  const debugRedirectUrl = addDebugParams(
    to,
    debugParams.debugFrom || url.pathname,
    requestId,
  );

  return redirect(debugRedirectUrl);
}

export default function Redirect() {
  return null;
} 