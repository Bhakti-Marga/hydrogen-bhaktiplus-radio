import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getUrlPrefix } from "~/lib/locale";
import { localeContext } from "~/lib/middleware";

export async function loader({ request, context }: LoaderFunctionArgs) {
  console.log('🟢 [ACCOUNT INDEX] Loader called for /account index');
  console.log('🟢 [ACCOUNT INDEX] Request URL:', request.url);

  const { countryCode, language } = context.get(localeContext);
  const pathPrefix = getUrlPrefix(countryCode);
  const redirectUrl = `${pathPrefix}/my`;

  console.log('🟢 [ACCOUNT INDEX] CountryCode/Language from context:', countryCode, language);
  console.log('🟢 [ACCOUNT INDEX] Path prefix:', pathPrefix);
  console.log('🟢 [ACCOUNT INDEX] Redirecting to:', redirectUrl);

  return redirect(redirectUrl);
}
