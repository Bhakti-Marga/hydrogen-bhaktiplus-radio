import {
  data as remixData,
  type LoaderFunctionArgs,
} from "react-router";
import { Outlet, useLoaderData } from "react-router";
import { CUSTOMER_DETAILS_QUERY } from "~/graphql/customer-account/CustomerDetailsQuery";
import { parseShopifyGidToId } from "~/lib/utils/general";
import { getUrlPrefix } from "~/lib/locale";
import { localeContext } from "~/lib/middleware";

export function shouldRevalidate() {
  return true;
}

export async function loader({ context, request }: LoaderFunctionArgs) {
  console.log('🔵 [ACCOUNT ROUTE] Loader called for /account');
  console.log('🔵 [ACCOUNT ROUTE] Request URL:', request.url);

  // Check if user is logged in first
  console.log('🔵 [ACCOUNT ROUTE] Checking if customer is logged in...');
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  console.log('🔵 [ACCOUNT ROUTE] isLoggedIn:', isLoggedIn);

  if (!isLoggedIn) {
    console.log('🔵 [ACCOUNT ROUTE] ❌ User NOT logged in - redirecting to login');
    const url = new URL(request.url);
    const { countryCode } = context.get(localeContext);
    const pathPrefix = getUrlPrefix(countryCode);
    const loginUrl = `${pathPrefix}/account/login?return_to=${encodeURIComponent(url.pathname)}`;
    console.log('🔵 [ACCOUNT ROUTE] CountryCode from context:', countryCode);
    console.log('🔵 [ACCOUNT ROUTE] Path prefix:', pathPrefix);
    console.log('🔵 [ACCOUNT ROUTE] Redirecting to:', loginUrl);
    throw new Response(null, {
      status: 302,
      headers: { Location: loginUrl },
    });
  }

  console.log('🔵 [ACCOUNT ROUTE] User is logged in, querying customer details...');
  const { data, errors } = await context.customerAccount.query(
    CUSTOMER_DETAILS_QUERY,
  );

  console.log('🔵 [ACCOUNT ROUTE] GraphQL query result:');
  console.log('🔵 [ACCOUNT ROUTE] - Errors:', errors);
  console.log('🔵 [ACCOUNT ROUTE] - Data:', JSON.stringify(data, null, 2));

  if (errors?.length || !data?.customer) {
    console.log('🔵 [ACCOUNT ROUTE] ❌ ERROR: Customer query failed or no customer data');
    console.log('🔵 [ACCOUNT ROUTE] - Errors:', errors);
    console.log('🔵 [ACCOUNT ROUTE] - Data:', data);
    throw new Error("Customer not found");
  }

  const shopifyCustomerId = data?.customer?.id
    ? parseShopifyGidToId(data?.customer?.id)
    : null;

  console.log('🔵 [ACCOUNT ROUTE] ✅ Customer found, shopifyCustomerId:', shopifyCustomerId);

  return remixData(
    {
      customer: data.customer,
      shopifyCustomerId,
    },
    {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    },
  );
}

export default function Account() {
  const { customer, shopifyCustomerId } = useLoaderData<typeof loader>();

  return <Outlet context={{ customer, shopifyCustomerId }} />;
}
