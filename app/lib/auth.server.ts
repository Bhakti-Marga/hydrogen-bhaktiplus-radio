import type { AppLoadContext } from "react-router";
import { CUSTOMER_DETAILS_QUERY } from "~/graphql/customer-account/CustomerDetailsQuery";
import {
  parseShopifyGidToId,
  getSubscriptionTierFromTags,
  extractPpvTags,
} from "~/lib/utils";
import type { User, SubscriptionTier } from "~/lib/types";
import type { SubscriptionInfo } from "~/lib/api/types";
import type { BhaktiMargMediaApi } from "~/lib/api";
import { MOCK_USER_STATES, type UserTierOverride } from "~/lib/debug/mockUsers";

/**
 * Return type for getAuthenticatedUser
 *
 * This function returns auth info only. The userScopedMediaApi is created separately
 * in the middleware after locale determination, and accessed via context.get(userScopedMediaApiContext).
 */
export interface AuthenticatedUserResult {
  user: User | null;
  subscriptionTier: SubscriptionTier;
  videosInProgressCount: number;
  userProfile: SubscriptionInfo | null;
}

/**
 * Fetches authenticated user data from Shopify Customer Account API.
 *
 * This function:
 * - Checks if user is logged in via customerAccount
 * - Fetches user details from Shopify Customer Account API
 * - Returns user, subscriptionTier, and userProfile
 * - Handles development mode user stubbing (via DEVELOPMENT_USER_TAGS env var)
 * - Supports debug tier override via ?debugTier= query param (dev mode only)
 *
 * NOTE: This function is called by the auth middleware. The middleware creates
 * userScopedMediaApi separately after locale determination. Route loaders should access
 * the results via context.get(userScopedMediaApiContext), context.get(userProfileContext), etc.
 *
 * @param context - The Hydrogen app context
 * @param env - Environment variables
 * @param request - The request object (optional, for debug tier override)
 * @param bootstrapApi - A BhaktiMargMediaApi instance for fetching user profile
 * @returns Object containing user, subscriptionTier, videosInProgressCount, and userProfile
 */
export async function getAuthenticatedUser(
  context: AppLoadContext,
  env: Env,
  request: Request | undefined,
  bootstrapApi: BhaktiMargMediaApi,
): Promise<AuthenticatedUserResult> {
  console.log("🔐 [AUTH FLOW] Starting getAuthenticatedUser");
  console.log("🔐 [AUTH FLOW] Environment:", env.ENVIRONMENT);

  // Load test mode: bypass Shopify Customer Account API entirely
  // Uses the configured email directly with Media API
  // The load test user must be configured on the Media Platform backend
  if (env.LOADTEST_USER_EMAIL) {
    console.log(
      "🔧 [LOADTEST] Bypassing Shopify auth, using email:",
      env.LOADTEST_USER_EMAIL,
    );

    const email = env.LOADTEST_USER_EMAIL;

    // Call Media API with the load test email
    const userProfile = await bootstrapApi.user.getUserProfile({ email });
    console.log("🔧 [LOADTEST] Media API response:", userProfile);

    const subscriptionTier = (userProfile.subscriptionTier ||
      "unsubscribed") as SubscriptionTier;
    const ppv = (userProfile.ppv as string[]) || [];
    const videosInProgressCount = userProfile.videosInProgressCount || 0;

    const user: User = {
      shopifyCustomerId: `loadtest-${email}`, // Synthetic ID for load test
      firstName: "LoadTest",
      lastName: "User",
      ppv,
      email,
      stampedRegionId: userProfile.stampedRegionId ?? null,
      userSelectCountryCode: userProfile.userSelectCountryCode ?? null,
      resolvedRegionId: userProfile.stampedRegionId ?? 1,
    };

    return { user, subscriptionTier, videosInProgressCount, userProfile };
  }

  // Development mode: check for debug tier override via query param
  if (env.ENVIRONMENT === "development" && request) {
    const url = new URL(request.url);
    const debugTier = url.searchParams.get(
      "debugTier",
    ) as UserTierOverride | null;
    console.log(
      "🔐 [AUTH FLOW] Checking for debugTier query param:",
      debugTier,
    );

    if (debugTier && debugTier !== "real-user" && MOCK_USER_STATES[debugTier]) {
      const mockState = MOCK_USER_STATES[debugTier];
      console.log(
        "🔐 [AUTH FLOW] ✅ Using MOCK USER STATE for debugTier:",
        debugTier,
      );
      console.log("🔐 [AUTH FLOW] Mock user:", mockState.user);
      console.log("🔐 [AUTH FLOW] Mock tier:", mockState.subscriptionTier);
      return {
        user: mockState.user
          ? {
              ...mockState.user,
              stampedRegionId: null,
              userSelectCountryCode: null,
              resolvedRegionId: 1,
            }
          : null,
        subscriptionTier: mockState.subscriptionTier || "unsubscribed",
        videosInProgressCount: 0,
        userProfile: null, // Mock state doesn't have real user profile
      };
    }
  }
  // Development mode: stub a user if DEVELOPMENT_USER_TAGS is set
  if (
    env.ENVIRONMENT === "development" &&
    env.DEVELOPMENT_USER_TAGS &&
    (env.DEVELOPMENT_USER_ALLOW_OVERRIDE == "1" ||
      env.DEVELOPMENT_USER_ALLOW_OVERRIDE == "true")
  ) {
    console.log("🔐 [AUTH FLOW] ✅ Using DEVELOPMENT USER STUB");
    console.log(
      "🔐 [AUTH FLOW] DEVELOPMENT_USER_TAGS:",
      env.DEVELOPMENT_USER_TAGS,
    );
    console.log(
      "🔐 [AUTH FLOW] DEVELOPMENT_USER_ALLOW_OVERRIDE:",
      env.DEVELOPMENT_USER_ALLOW_OVERRIDE,
    );

    const stubShopifyCustomerId = "23866754957691";
    console.log(
      "🔐 [AUTH FLOW] Stub Shopify Customer ID:",
      stubShopifyCustomerId,
    );

    // Still call /user/profile API even in dev mode to test the integration
    const stubEmail = "dev@example.com";
    console.log("🔐 [AUTH FLOW] Calling Media API getUserProfile...");
    const userProfile = await bootstrapApi.user.getUserProfile({
      email: stubEmail,
    });
    console.log("🔐 [AUTH FLOW] Media API response:", userProfile);

    const devTags = env.DEVELOPMENT_USER_TAGS.split(",").map((tag) =>
      tag.trim(),
    );
    // Dev tags OVERRIDE the API response (that's the point of the override)
    const subscriptionTierFromTags = getSubscriptionTierFromTags(devTags);
    const subscriptionTier = (subscriptionTierFromTags ||
      userProfile.subscriptionTier ||
      "unsubscribed") as SubscriptionTier;
    const ppvFromTags = extractPpvTags(devTags);
    const ppv =
      ppvFromTags.length > 0
        ? ppvFromTags
        : (userProfile.ppv as string[]) || [];
    const videosInProgressCount = userProfile.videosInProgressCount || 0;

    console.log(
      "🔐 [AUTH FLOW] Dev tags override - subscriptionTierFromTags:",
      subscriptionTierFromTags,
    );
    console.log("🔐 [AUTH FLOW] Dev tags override - ppvFromTags:", ppvFromTags);

    console.log("🔐 [AUTH FLOW] Final subscription tier:", subscriptionTier);
    console.log("🔐 [AUTH FLOW] PPV content:", ppv);
    console.log("🔐 [AUTH FLOW] Videos in progress:", videosInProgressCount);

    const user: User = {
      // WARNING: this shopify customer id is a real test customer set up in the guruconnect-108 shopify store. will not work on other stores
      shopifyCustomerId: stubShopifyCustomerId,
      firstName: "Dev",
      lastName: "User",
      ppv,
      email: "dev@example.com",
      // Region fields
      stampedRegionId: userProfile.stampedRegionId ?? null,
      userSelectCountryCode: userProfile.userSelectCountryCode ?? null,
      resolvedRegionId: userProfile.stampedRegionId ?? 1, // Default to EU if not set
    };

    console.log("🔐 [AUTH FLOW] Returning dev stub user:", user);
    return { user, subscriptionTier, videosInProgressCount, userProfile };
  }

  // Production mode or development without stub
  console.log(
    "🔐 [AUTH FLOW] ✅ Using REAL USER AUTHENTICATION (production or no dev stub)",
  );
  console.log("🔐 [AUTH FLOW] Checking if user is logged in...");
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  console.log("🔐 [AUTH FLOW] isLoggedIn:", isLoggedIn);

  if (!isLoggedIn) {
    console.log("🔐 [AUTH FLOW] ❌ User not logged in - returning null user");
    return {
      user: null,
      subscriptionTier: "unsubscribed",
      videosInProgressCount: 0,
      userProfile: null,
    };
  }

  console.log("🔐 [AUTH FLOW] Querying Shopify Customer Account API...");
  const { data } = await context.customerAccount.query(CUSTOMER_DETAILS_QUERY);
  console.log(
    "🔐 [AUTH FLOW] Full GraphQL response data:",
    JSON.stringify(data, null, 2),
  );
  console.log("🔐 [AUTH FLOW] Shopify customer data:", data?.customer);
  console.log(
    "🔐 [AUTH FLOW] firstName from response:",
    data?.customer?.firstName,
  );
  console.log(
    "🔐 [AUTH FLOW] lastName from response:",
    data?.customer?.lastName,
  );

  if (!data?.customer) {
    console.log(
      "🔐 [AUTH FLOW] ❌ ERROR: No customer data found despite being logged in",
    );
    throw new Error("No customer data existed even though user is logged in.");
  }

  const shopifyCustomerId = data?.customer?.id
    ? parseShopifyGidToId(data?.customer?.id)
    : null;
  const email = data?.customer?.emailAddress?.emailAddress ?? null;
  console.log("🔐 [AUTH FLOW] Parsed Shopify Customer ID:", shopifyCustomerId);
  console.log("🔐 [AUTH FLOW] Customer email:", email);

  if (!email) {
    console.log(
      "🔐 [AUTH FLOW] ❌ ERROR: No email found for logged in customer",
    );
    throw new Error("No email found for logged in customer.");
  }

  // Fetch user profile from media API using email
  console.log("🔐 [AUTH FLOW] Calling Media API getUserProfile...");
  const userProfile = await bootstrapApi.user.getUserProfile({
    email,
  });
  console.log("🔐 [AUTH FLOW] Media API response:", userProfile);

  const subscriptionTier = (userProfile.subscriptionTier ||
    "unsubscribed") as SubscriptionTier;
  const ppv = (userProfile.ppv as string[]) || [];
  const videosInProgressCount = userProfile.videosInProgressCount || 0;

  console.log("🔐 [AUTH FLOW] Final subscription tier:", subscriptionTier);
  console.log("🔐 [AUTH FLOW] PPV content:", ppv);
  console.log("🔐 [AUTH FLOW] Videos in progress:", videosInProgressCount);

  const user: User = {
    shopifyCustomerId,
    firstName: data?.customer?.firstName ?? null,
    lastName: data?.customer?.lastName ?? null,
    ppv,
    email: data?.customer?.emailAddress?.emailAddress ?? null,
    // Region fields
    stampedRegionId: userProfile.stampedRegionId ?? null,
    userSelectCountryCode: userProfile.userSelectCountryCode ?? null,
    resolvedRegionId: userProfile.stampedRegionId ?? 1, // Default to EU if not set
  };

  console.log("🔐 [AUTH FLOW] ✅ Returning authenticated user:", user);
  return { user, subscriptionTier, videosInProgressCount, userProfile };
}
