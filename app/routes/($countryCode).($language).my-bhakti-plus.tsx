import { redirect, type LoaderFunctionArgs } from 'react-router';
import { getUrlPrefix } from '~/lib/locale';
import { localeContext } from '~/lib/middleware';

/**
 * Redirect from old /{locale}/my-bhakti-plus path to new /{locale}/my path
 */
export async function loader({ context }: LoaderFunctionArgs) {
  const { countryCode } = context.get(localeContext);
  const pathPrefix = getUrlPrefix(countryCode);
  return redirect(`${pathPrefix}/my`, 301);
}
