import type { ActionFunctionArgs } from "react-router";
import { CUSTOMER_ACCOUNT_QUERY } from "~/graphql/customer-account/CustomerAccountQuery";
import { userScopedMediaApiContext } from "~/lib/middleware";

/**
 * API route to persist user's country/region selection.
 * Called from CountrySelector when a logged-in user selects a country.
 *
 * POST /api/user/select-region
 * Body: { countryCode: string }
 *
 * Response: { success: boolean, persisted: boolean, userSelectCountryCode?: string }
 */
export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { customerAccount } = context;
  const userScopedMediaApi = context.get(userScopedMediaApiContext);

  // Check if user is logged in
  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    // For non-logged-in users, just return success (selection is URL-based only)
    return Response.json({ success: true, persisted: false });
  }

  // Get user email from customer account
  const { data, errors } = await customerAccount.query(CUSTOMER_ACCOUNT_QUERY);

  if (errors?.length || !data?.customer) {
    console.error('[api.user.select-region] Failed to fetch customer data:', errors);
    return Response.json({ error: "Could not get customer data" }, { status: 400 });
  }

  const email = data.customer.emailAddress?.emailAddress;
  if (!email) {
    return Response.json({ error: "Could not get user email" }, { status: 400 });
  }

  // Parse request body
  let body: { countryCode?: string };
  try {
    body = await request.json() as { countryCode?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { countryCode } = body;

  if (!countryCode) {
    return Response.json({ error: "countryCode is required" }, { status: 400 });
  }

  // Call backend API to persist selection
  try {
    const result = await userScopedMediaApi.user.selectRegion(email, countryCode.toUpperCase());

    if (!result) {
      return Response.json({ error: "Failed to save region selection" }, { status: 500 });
    }

    return Response.json({
      success: true,
      persisted: true,
      userSelectCountryCode: result.userSelectCountryCode,
    });
  } catch (error) {
    console.error('[api.user.select-region] Error:', error);
    return Response.json({ error: "Failed to save region selection" }, { status: 500 });
  }
}
