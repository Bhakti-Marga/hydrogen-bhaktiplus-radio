import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { CUSTOMER_ACCOUNT_QUERY } from "~/graphql/customer-account/CustomerAccountQuery";
import { userScopedMediaApiContext } from "~/lib/middleware";

/**
 * DUAL-STORE LOGOUT
 * =================
 * When a user logs out, we need to clear sessions from BOTH stores:
 * - EU Store: The main authentication store (via Customer Account API)
 * - US Store: The commerce store for US users (via redirect to their logout)
 *
 * Flow for US users:
 * 1. POST to /account/logout
 * 2. Check user's region via Media API
 * 3. Call EU store logout with postLogoutRedirectUri pointing to US logout
 * 4. EU logout completes, redirects to US logout
 * 5. US logout completes, redirects to final destination
 *
 * Flow for EU users:
 * 1. POST to /account/logout
 * 2. Check user's region via Media API
 * 3. Call EU store logout with postLogoutRedirectUri pointing to final destination
 */

// if we don't implement this, /account/logout will get caught by account.$.tsx to do login
export async function loader() {
  return redirect("/");
}

export async function action({ context, request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  // Ensure HTTPS for ngrok URLs (local dev tunnels)
  let origin = url.origin;
  if (origin.includes("ngrok") && origin.startsWith("http:")) {
    origin = origin.replace("http:", "https:");
  }
  const returnTo = url.searchParams.get("return_to") || "/";
  const finalRedirectUrl = `${origin}${returnTo}`;

  // Get user's email BEFORE logging out (we lose access after logout)
  let userEmail: string | null = null;
  let isUSUser = false;

  try {
    if (await context.customerAccount.isLoggedIn()) {
      const { data } = await context.customerAccount.query(
        CUSTOMER_ACCOUNT_QUERY,
      );
      userEmail = data?.customer?.emailAddress?.emailAddress || null;

      if (userEmail) {
        // Check user's region via Media API
        const mediaApi = context.get(userScopedMediaApiContext);
        const userProfile = await mediaApi.user.getUserProfile({
          email: userEmail,
        });

        // US region ID is 2 (from store-routing config)
        isUSUser = userProfile.stampedRegionId === 2;

        console.log("[Logout] User region check:", {
          email: userEmail,
          stampedRegionId: userProfile.stampedRegionId,
          isUSUser,
        });
      }
    }
  } catch (error) {
    console.error("[Logout] Error checking user region:", error);
    // Continue with logout even if we can't determine region
  }

  // Build the post-logout redirect URL
  let postLogoutRedirectUri: string;

  if (isUSUser) {
    // Chain: EU logout → US store logout → final destination
    // After EU logout, redirect to US store's logout page
    // Shopify store logout URL format: /account/logout?return=URL
    postLogoutRedirectUri = `https://us.bhakti.plus/account/logout?return=${encodeURIComponent(
      `${origin}/`,
    )}`;
    console.log(
      "[Logout] US user - chaining to US store logout:",
      postLogoutRedirectUri,
    );
  } else {
    // EU user: just redirect to final destination after EU logout
    postLogoutRedirectUri = finalRedirectUrl;
    console.log("[Logout] EU user - redirecting to:", postLogoutRedirectUri);
  }

  // Perform the EU store logout (clears Hydrogen session)
  return context.customerAccount.logout({
    postLogoutRedirectUri,
  });
}
