import { APPSTLE_API_BASE } from "~/lib/constants";

// GraphQL-like response from /api/external/v2/subscription-customers/{customerId}
export interface AppstleCustomerResponse {
  __typename: "Customer";
  id: string; // gid://shopify/Customer/123
  productSubscriberStatus: "ACTIVE" | "PAUSED" | "CANCELLED";
  tags: string[];
  subscriptionContracts: {
    __typename: "SubscriptionContractConnection";
    nodes: AppstleSubscriptionContract[];
    pageInfo?: {
      __typename: "PageInfo";
      hasPreviousPage: boolean;
      hasNextPage: boolean;
      startCursor: string;
      endCursor: string;
    };
  };
}

/**
 * Error response from Appstle API
 * Example: {
 *   "entityName": "subscriptionContractDetails",
 *   "errorKey": "pendingDowngradeExists",
 *   "type": "https://www.jhipster.tech/problem/problem-with-message",
 *   "title": "UserGeneratedError:A membership downgrade is scheduled...",
 *   "status": 400,
 *   "message": "UserGeneratedError:A membership downgrade is scheduled...",
 *   "params": "subscriptionContractDetails"
 * }
 */
interface AppstleErrorResponse {
  entityName?: string;
  errorKey?: string;
  type?: string;
  title?: string;
  status?: number;
  message?: string;
  params?: string;
  detail?: string;
}

/**
 * Parse Appstle API error response and extract a clean error message
 */
async function parseAppstleError(
  response: Response,
  context: string,
): Promise<string> {
  let errorMessage = response.statusText;
  let responseBody: string | null = null;

  try {
    responseBody = await response.text();
    console.log(`[Appstle] ${context} error response body:`, responseBody);
  } catch {
    console.log(`[Appstle] ${context} could not read response body`);
  }

  // Try to parse JSON error response (attempt even if content-type isn't set correctly)
  if (responseBody) {
    try {
      const errorData = JSON.parse(responseBody) as AppstleErrorResponse;
      // Extract clean message, removing "UserGeneratedError:" prefix if present
      const rawMessage =
        errorData.message ||
        errorData.title ||
        errorData.detail ||
        errorMessage;
      errorMessage = rawMessage.replace(/^UserGeneratedError:/i, "").trim();
      console.log(`[Appstle] ${context} parsed error message:`, errorMessage);
    } catch {
      // If JSON parsing fails, use responseBody as-is if it looks like a message
      if (responseBody && !responseBody.startsWith("<")) {
        errorMessage = responseBody;
      }
      console.log(
        `[Appstle] ${context} could not parse JSON, using raw body or statusText`,
      );
    }
  }

  return errorMessage;
}

export interface AppstleSubscriptionContract {
  __typename: "SubscriptionContract";
  id: string; // gid://shopify/SubscriptionContract/123
  createdAt: string;
  nextBillingDate: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED" | "EXPIRED" | "FAILED";
  deliveryPrice: {
    __typename: "MoneyV2";
    amount: string;
  };
  lastPaymentStatus: "SUCCEEDED" | "FAILED";
  billingPolicy: {
    __typename: "SubscriptionBillingPolicy";
    interval: "MONTH" | "YEAR" | "WEEK" | "DAY";
    intervalCount: number;
  };
  lines: {
    __typename: "SubscriptionLineConnection";
    nodes: Array<{
      __typename: "SubscriptionLine";
      id: string;
      sellingPlanId: string;
      sellingPlanName: string;
      productId: string;
      sku: string;
      title: string;
      variantId: string;
      quantity: number;
      lineDiscountedPrice: {
        __typename: "MoneyV2";
        amount: string;
        currencyCode: string;
      };
      variantImage?: {
        __typename: "Image";
        transformedSrc: string;
      };
      variantTitle: string;
      currentPrice: {
        __typename: "MoneyV2";
        amount: string;
        currencyCode: string;
      };
    }>;
    pageInfo?: {
      __typename: "PageInfo";
      hasPreviousPage: boolean;
      hasNextPage: boolean;
      startCursor: string;
      endCursor: string;
    };
  };
  customerPaymentMethod?: {
    __typename: "CustomerPaymentMethod";
    instrument: {
      __typename: "CustomerCreditCard";
      brand: string;
      expiresSoon: boolean;
      expiryMonth: number;
      expiryYear: number;
      firstDigits: string;
      lastDigits: string;
      maskedNumber: string;
      name: string;
      revocable: boolean;
    };
  };
  originOrder: any;
  customer: {
    __typename: "Customer";
    id: string;
  };
}

/**
 * Get customer with subscription contracts in GraphQL format
 */
export async function getCustomerSubscriptions(
  customerId: string,
  apiKey: string,
): Promise<AppstleCustomerResponse> {
  const url = `${APPSTLE_API_BASE}/api/external/v2/subscription-customers/${customerId}`;

  console.log(
    "🔵 [APPSTLE API] Fetching customer subscriptions for:",
    customerId,
  );
  console.log("🔵 [APPSTLE API] URL:", url);

  const response = await fetch(url, {
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  console.log("🔵 [APPSTLE API] Response status:", response.status);
  console.log(
    "🔵 [APPSTLE API] Response headers:",
    Object.fromEntries(response.headers.entries()),
  );

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
      console.error("🔴 [APPSTLE API] Error response body:", errorBody);
    } catch (e) {
      console.error("🔴 [APPSTLE API] Could not read error body");
    }
    throw new Error(
      `Appstle API error: ${response.status} ${response.statusText}. Body: ${errorBody}`,
    );
  }

  // Handle empty response body (content-length: 0)
  const contentLength = response.headers.get("content-length");
  const responseText = await response.text();

  if (!responseText || responseText.trim() === "") {
    console.warn(
      "⚠️ [APPSTLE API] Empty response body received (content-length:",
      contentLength,
      ")",
    );
    console.warn(
      "⚠️ [APPSTLE API] Customer may not exist in Appstle or has no subscriptions",
    );
    // Return a valid empty response structure instead of throwing
    return {
      __typename: "Customer",
      id: `gid://shopify/Customer/${customerId}`,
      productSubscriberStatus: "CANCELLED",
      tags: [],
      subscriptionContracts: {
        __typename: "SubscriptionContractConnection",
        nodes: [],
      },
    } as AppstleCustomerResponse;
  }

  const data = JSON.parse(responseText) as AppstleCustomerResponse;
  console.log("🔵 [APPSTLE API] Customer response type:", typeof data);
  console.log(
    "🔵 [APPSTLE API] Customer response keys:",
    data ? Object.keys(data) : "null/undefined",
  );
  console.log(
    "🔵 [APPSTLE API] Customer response:",
    JSON.stringify(data, null, 2),
  );

  // Check if subscriptionContracts exists and log its structure
  if (data) {
    console.log(
      "🔵 [APPSTLE API] Has subscriptionContracts?",
      "subscriptionContracts" in (data as object),
    );
    if (data.subscriptionContracts) {
      console.log(
        "🔵 [APPSTLE API] subscriptionContracts type:",
        typeof data.subscriptionContracts,
      );
      console.log(
        "🔵 [APPSTLE API] subscriptionContracts keys:",
        Object.keys(data.subscriptionContracts || {}),
      );
      if (data.subscriptionContracts.nodes) {
        console.log(
          "🔵 [APPSTLE API] nodes length:",
          data.subscriptionContracts.nodes.length,
        );
        console.log(
          "🔵 [APPSTLE API] nodes type:",
          Array.isArray(data.subscriptionContracts.nodes),
        );
      } else {
        console.warn(
          "⚠️ [APPSTLE API] subscriptionContracts.nodes is missing from response!",
        );
      }
    } else {
      console.warn(
        "⚠️ [APPSTLE API] subscriptionContracts is missing from response!",
      );
    }
  }

  return data;
}

/**
 * Update subscription variant (change plan)
 * @param skipBilling - If true, skip billing (no charge or refund). Use for downgrades to avoid refunds.
 */
export async function updateSubscriptionVariant(
  contractId: string,
  oldLineId: string,
  oldVariantId: string,
  newVariantId: string,
  apiKey: string,
  skipBilling: boolean = false,
): Promise<{ success: boolean; message: string }> {
  const url = `${APPSTLE_API_BASE}/api/external/v2/subscription-contract-update-variant`;
  const params = new URLSearchParams({
    contractId,
    oldLineId,
    oldVariantId,
    newVariantId,
  });

  // For downgrades: skipBilling=true prevents refunds
  // For upgrades: skipBilling=false (default) triggers immediate charge with proration
  if (skipBilling) {
    params.append("skipBilling", "true");
  }

  const response = await fetch(`${url}?${params}`, {
    method: "PUT",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await parseAppstleError(
      response,
      "updateSubscriptionVariant",
    );
    return {
      success: false,
      message: errorMessage,
    };
  }

  return { success: true, message: "Subscription updated successfully" };
}

/**
 * Cancel subscription
 * Uses the status update endpoint with CANCELLED status
 */
export async function cancelSubscription(
  contractId: string,
  apiKey: string,
): Promise<{ success: boolean; message: string }> {
  const url = `${APPSTLE_API_BASE}/api/external/v2/subscription-contracts-update-status`;
  const params = new URLSearchParams({
    contractId,
    status: "CANCELLED",
  });

  console.log("[Appstle] cancelSubscription request:", {
    url: `${url}?${params}`,
    contractId,
  });

  const response = await fetch(`${url}?${params}`, {
    method: "PUT",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  console.log("[Appstle] cancelSubscription response:", {
    status: response.status,
    statusText: response.statusText,
  });

  // 204 = success with no content
  if (response.status === 204 || response.ok) {
    return { success: true, message: "Subscription cancelled successfully" };
  }

  const errorMessage = await parseAppstleError(response, "cancelSubscription");
  return {
    success: false,
    message: errorMessage,
  };
}

/**
 * Reactivate paused subscription (set status to ACTIVE)
 * Note: Cannot reactivate CANCELLED subscriptions - only PAUSED ones
 */
export async function reactivateSubscription(
  contractId: string,
  apiKey: string,
): Promise<{ success: boolean; message: string }> {
  const url = `${APPSTLE_API_BASE}/api/external/v2/subscription-contracts-update-status`;
  const params = new URLSearchParams({
    contractId,
    status: "ACTIVE",
  });

  const response = await fetch(`${url}?${params}`, {
    method: "PUT",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  // 204 = success with no content
  if (response.status === 204 || response.ok) {
    return { success: true, message: "Subscription reactivated successfully" };
  }

  const errorMessage = await parseAppstleError(
    response,
    "reactivateSubscription",
  );
  return {
    success: false,
    message: errorMessage,
  };
}

/**
 * Pending downgrade response from Appstle API
 * GET /memberships/cp/api/subscription-contract-details/{contractId}/pending-downgrade
 */
export interface PendingDowngrade {
  shop: string;
  contractId: number;
  waitTillTimestamp: string;
  oldLineId: string;
  oldVariantId: string;
  newVariantId: string;
  sellingPlanId: string;
  sellingPlanName: string;
  oldPrice: number;
  newPrice: number;
  newCustomerTag: string;
  oldCustomerTags: string;
  newOrderTag: string;
  customerId: number;
}

/**
 * Get pending downgrade for a subscription contract
 * Returns null if no pending downgrade exists (404)
 */
export async function getPendingDowngrade(
  contractId: string,
  apiKey: string,
): Promise<PendingDowngrade | null> {
  const url = `${APPSTLE_API_BASE}/api/external/v2/subscription-contract-details/${contractId}/pending-downgrade`;

  console.log(
    "🔵 [APPSTLE API] Fetching pending downgrade for contract:",
    contractId,
  );

  const response = await fetch(url, {
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  // 404 means no pending downgrade exists - this is a normal case
  if (response.status === 404) {
    console.log(
      "🔵 [APPSTLE API] No pending downgrade found for contract:",
      contractId,
    );
    return null;
  }

  if (!response.ok) {
    const errorMessage = await parseAppstleError(
      response,
      "getPendingDowngrade",
    );
    console.error(
      "🔴 [APPSTLE API] Error fetching pending downgrade:",
      errorMessage,
    );
    // Return null on error rather than throwing - pending downgrade is optional data
    return null;
  }

  const responseText = await response.text();
  if (!responseText || responseText.trim() === "") {
    console.log(
      "🔵 [APPSTLE API] Empty response body for pending downgrade (treating as no downgrade)",
    );
    return null;
  }

  // Check if response is HTML (endpoint doesn't exist)
  if (
    responseText.trim().startsWith("<!") ||
    responseText.trim().startsWith("<html")
  ) {
    console.log(
      "🔵 [APPSTLE API] Pending downgrade endpoint returned HTML (endpoint may not exist) - treating as no downgrade",
    );
    return null;
  }

  try {
    const data = JSON.parse(responseText) as PendingDowngrade;
    console.log(
      "🔵 [APPSTLE API] Pending downgrade found:",
      JSON.stringify(data, null, 2),
    );
    return data;
  } catch (parseError) {
    console.error(
      "🔴 [APPSTLE API] Failed to parse pending downgrade response:",
      responseText.substring(0, 200),
    );
    return null;
  }
}

/**
 * Cancel a pending downgrade for a subscription contract
 * Returns success if cancelled (204) or if no pending downgrade exists (404)
 */
export async function cancelPendingDowngrade(
  contractId: string,
  apiKey: string,
): Promise<{ success: boolean; message: string }> {
  const url = `${APPSTLE_API_BASE}/api/external/v2/subscription-contract-details/${contractId}/pending-downgrade`;

  console.log("[Appstle] cancelPendingDowngrade request:", { url, contractId });

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  console.log("[Appstle] cancelPendingDowngrade response:", {
    status: response.status,
    statusText: response.statusText,
  });

  // 204 = success with no content
  // 404 = no pending downgrade exists (also treat as success)
  if (response.status === 204 || response.status === 404 || response.ok) {
    return {
      success: true,
      message: "Pending downgrade cancelled successfully",
    };
  }

  const errorMessage = await parseAppstleError(
    response,
    "cancelPendingDowngrade",
  );
  return {
    success: false,
    message: errorMessage,
  };
}

/**
 * Schedule a downgrade for a subscription (to take effect at end of billing period)
 * Uses the variant update endpoint with prorateDowngrade=false to schedule instead of immediate change
 *
 * @param contractId - The subscription contract ID
 * @param oldLineId - The current line item ID
 * @param oldVariantId - The current variant ID
 * @param newVariantId - The target variant ID for downgrade
 * @param apiKey - Appstle API key
 */
export async function scheduleSubscriptionDowngrade(
  contractId: string,
  oldLineId: string,
  oldVariantId: string,
  newVariantId: string,
  apiKey: string,
): Promise<{ success: boolean; message: string }> {
  const url = `${APPSTLE_API_BASE}/api/external/v2/subscription-contract-update-variant`;
  const params = new URLSearchParams({
    contractId,
    oldLineId,
    oldVariantId,
    newVariantId,
    prorateDowngrade: "false", // Schedule downgrade for end of billing period
  });

  console.log("[Appstle] scheduleSubscriptionDowngrade request:", {
    url: `${url}?${params}`,
    contractId,
    oldVariantId,
    newVariantId,
  });

  const response = await fetch(`${url}?${params}`, {
    method: "PUT",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  console.log("[Appstle] scheduleSubscriptionDowngrade response:", {
    status: response.status,
    statusText: response.statusText,
  });

  if (!response.ok) {
    const errorMessage = await parseAppstleError(
      response,
      "scheduleSubscriptionDowngrade",
    );
    return {
      success: false,
      message: errorMessage,
    };
  }

  return { success: true, message: "Downgrade scheduled successfully" };
}
