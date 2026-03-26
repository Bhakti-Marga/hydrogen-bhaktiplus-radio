import { redirect, type LoaderFunctionArgs } from 'react-router';
import { getUrlPrefix } from '~/lib/locale';
import { localeContext } from '~/lib/middleware';

export async function loader({ context }: LoaderFunctionArgs) {
  const { countryCode } = context.get(localeContext);
  const pathPrefix = getUrlPrefix(countryCode);
  const redirectUrl = `${pathPrefix}/my`;
  return redirect(redirectUrl);
}
