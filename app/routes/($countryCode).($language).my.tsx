import React, { Suspense, useState } from "react";
import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router";
import { useLoaderData, Form, Link, Await } from "react-router";

import { CUSTOMER_ACCOUNT_QUERY } from "~/graphql/customer-account/CustomerAccountQuery";

import { Tabs } from "radix-ui";
import {
  getCustomerSubscriptions,
  updateSubscriptionVariant,
  cancelSubscription,
  reactivateSubscription,
  getPendingDowngrade,
  cancelPendingDowngrade,
  scheduleSubscriptionDowngrade,
} from "~/lib/api/services/appstle";
import type {
  AppstleCustomerResponse,
  AppstleSubscriptionContract,
  PendingDowngrade,
} from "~/lib/api/services/appstle";
import type { SubscriptionTier } from "~/lib/types";
import type {
  SubscriptionInfo,
  MembershipListResponseDto,
  PurchasesResponseDto,
  CommentaryDto,
  TalkDto,
  PilgrimageDto,
} from "~/lib/api/types";
import MembershipCard from "~/components/Account/MembershipCard";
import PaymentMethodCard from "~/components/Account/PaymentMethodCard";
import BillingAddressCard from "~/components/Account/BillingAddressCard";
import InvoiceTable from "~/components/Account/InvoiceTable";
import { getServerStoreContext } from "~/lib/store-routing/context.server";
import {
  fetchCustomerOrders,
  type CustomerOrder,
} from "~/lib/api/services/shopify-admin.server";

import { toMediaApiLocale, getUrlPrefix } from "~/lib/locale";
import {
  userScopedMediaApiContext,
  userProfileContext,
  userContext,
  localeContext,
} from "~/lib/middleware";
import {
  SubscriptionTierLanding,
  transformMembershipToTier,
  getCurrencySymbol,
  AllPlansBenefits,
} from "~/components/SubscriptionTier";
import {
  TabButton,
  Carousel,
  CatalogCard,
  Container,
  ContentCard,
  MobileSlideshow,
  MoreBhaktiEyebrow,
} from "~/components";
import { useTranslations } from "~/contexts/TranslationsProvider";
import type { VariantIds, Billing } from "~/lib/utils/subscription";
import { encodeVideoId } from "~/lib/utils/video-id-encoder";

interface LoaderData {
  customer: {
    firstName?: string | null;
    lastName?: string | null;
    emailAddress?: {
      emailAddress?: string | null;
    } | null;
    defaultAddress?: any;
    orders?: any;
  };
  customerData: AppstleCustomerResponse | null;
  activeContract: AppstleSubscriptionContract | null;
  latestCancelledContract: AppstleSubscriptionContract | null;
  pendingDowngrade: PendingDowngrade | null;
  subscriptionTier: SubscriptionTier;
  customerAccountUrl: string;
  userProfileData: SubscriptionInfo | null;
  memberships: MembershipListResponseDto | null;
  purchases: PurchasesResponseDto | null;
  catalogCommentaries: CommentaryDto[];
  catalogTalks: TalkDto[];
  catalogPilgrimages: PilgrimageDto[];
  catalogCurrencyCode: string;
  orders: Promise<CustomerOrder[]>;
  error?: string;
  debugInfo?: {
    apiRequestParams: {
      customerId: string;
      customerIdType: string;
      customerEmail: string;
    };
    rawApiResponse: any;
  };
}

/**
 * Filter out content where user's subscriptionTier matches any tier in content's subscriptionTiers array.
 * Case-insensitive comparison.
 */
function filterBySubscriptionTier<
  T extends { subscriptionTiers?: string[] | null },
>(items: T[], userSubscriptionTier: string | null | undefined): T[] {
  if (!userSubscriptionTier) {
    return items;
  }

  const userTierLower = userSubscriptionTier.toLowerCase();

  return items.filter((item) => {
    const tiers = item.subscriptionTiers || [];
    // If no subscriptionTiers, show the item (it's available to all)
    if (tiers.length === 0) {
      return true;
    }
    // Hide if user's tier matches any of the content's tiers
    return !tiers.some((tier) => tier.toLowerCase() === userTierLower);
  });
}

/**
 * Filter out purchased content from catalog items.
 * Matches by contentId or ppvTag.
 */
function filterPurchasedContent<
  T extends { id?: number; contentId?: number; ppvTag?: string | null },
>(
  items: T[],
  purchasedContentIds: Set<number>,
  purchasedPpvTags: Set<string>,
): T[] {
  return items.filter((item) => {
    const itemContentId = item.contentId || item.id;

    // Check if contentId matches any purchased contentId
    if (itemContentId && purchasedContentIds.has(itemContentId)) {
      return false;
    }

    // Check if ppvTag matches any purchased ppvTag
    if (item.ppvTag && purchasedPpvTags.has(item.ppvTag)) {
      return false;
    }

    return true;
  });
}

/**
 * Get router URL for product purchase based on content type
 */
function getContentUrl(
  content: CommentaryDto | TalkDto | PilgrimageDto,
): string {
  const contentId = content.contentId;
  const contentTypeId = content.contentTypeId;

  if (!contentId) {
    return "#";
  }

  // Map ContentTypeId to content_type parameter
  // ContentTypeId: 1=satsang, 2=commentary, 3=pilgrimage, 5=live, 6=talk
  let contentType: string;
  if (contentTypeId === 6) {
    contentType = "talks";
  } else if (contentTypeId === 2) {
    contentType = "commentaries";
  } else if (contentTypeId === 3) {
    contentType = "pilgrimages";
  } else {
    // Unknown content type (1=satsang, 5=live are not purchasable products)
    return "#";
  }

  const params = new URLSearchParams();
  params.set("intent", "product");
  params.set("content_type", contentType);
  params.set("content_id", String(contentId));

  return `/router?${params.toString()}`;
}

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { customerAccount, env, regionId } = context;

  // Get user profile, API, and locale from middleware context
  const userProfile = context.get(userProfileContext);
  const userScopedApi = context.get(userScopedMediaApiContext);
  const user = context.get(userContext);
  const { countryCode } = context.get(localeContext);

  // Check if user is logged in:
  // 1. First check middleware context (respects LOADTEST_USER_EMAIL and debug overrides)
  // 2. Fall back to Customer Account API check
  const isLoggedIn = user !== null || (await customerAccount.isLoggedIn());

  if (!isLoggedIn) {
    const url = new URL(request.url);
    // Use the actual pathname from the request, preserving locale if present
    const returnTo = url.pathname + url.search;
    const pathPrefix = getUrlPrefix(countryCode);
    const loginUrl = `${pathPrefix}/account/login?return_to=${encodeURIComponent(
      returnTo,
    )}`;
    return redirect(loginUrl);
  }

  try {
    // Use user data from middleware context (handles LOADTEST_USER_EMAIL, debug overrides, and real auth)
    // The middleware always populates userContext for authenticated users
    if (!user || !user.email) {
      console.error("No user found in middleware context");
      const pathPrefix = getUrlPrefix(countryCode);
      const loginUrl = `${pathPrefix}/account/login?return_to=${encodeURIComponent(
        new URL(request.url).pathname,
      )}`;
      return redirect(loginUrl);
    }

    // Build customer object from userContext for backward compatibility with component
    const customer = {
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: { emailAddress: user.email },
      defaultAddress: null, // Address not available from userContext - shows "no address" in UI
      orders: null,
    };
    const customerEmail = user.email;

    // Get server-only store context (contains correct customer ID and API key)
    const serverContext = getServerStoreContext(userProfile, env, countryCode);

    console.debug("🔵 [MANAGE-MEMBERSHIP] Store context:", {
      storeType: serverContext.storeType,
      hasBillingCustomerId: !!serverContext.billingCustomerId,
      hasApiKey: !!serverContext.appstleApiKey,
    });

    // Always fetch membership plans from Media Platform API - needed for the Choose Plan modal
    // Using user-scoped API to get pricing based on user's billing region, not URL/GeoIP
    let memberships: MembershipListResponseDto | null = null;
    try {
      memberships = await userScopedApi.memberships.getMemberships();
      console.debug(
        "🔵 [MANAGE-MEMBERSHIP] Fetched memberships:",
        memberships?.memberships?.length || 0,
        "plans, regionId:",
        userProfile?.stampedRegionId ?? regionId,
      );
    } catch (error) {
      console.error(
        "🔴 [MANAGE-MEMBERSHIP] Error fetching memberships:",
        error,
      );
    }

    // Fetch purchases (always fetch, doesn't depend on billing customer ID)
    let purchases: PurchasesResponseDto | null = null;
    try {
      purchases = await userScopedApi.user.getPurchases({
        email: customerEmail,
      });
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }

    // Fetch catalog data (always fetch)
    const catalogCurrencyCode =
      userProfile?.stampedRegionId === 2 ? "USD" : "EUR";

    // Build sets of purchased contentIds and ppvTags for efficient lookup
    const purchasedContentIds = new Set<number>();
    const purchasedPpvTags = new Set<string>();

    // Add from user profile ppv array (ppvTags)
    if (userProfile?.ppv && Array.isArray(userProfile?.ppv)) {
      userProfile.ppv.forEach((ppvTag: unknown) => {
        if (typeof ppvTag === "string" && ppvTag.length > 0) {
          purchasedPpvTags.add(ppvTag);
        }
      });
    }

    // Fetch content types sequentially
    let commentaries: CommentaryDto[] = [];
    let talks: TalkDto[] = [];
    let pilgrimages: PilgrimageDto[] = [];

    try {
      const result = await userScopedApi.commentaries.getList();
      commentaries = Array.isArray(result?.commentaries)
        ? result.commentaries
        : [];
    } catch (err) {
      console.error("Error fetching commentaries:", err);
    }

    try {
      const result = await userScopedApi.talks.getList();
      talks = Array.isArray(result?.talks) ? result.talks : [];
    } catch (err) {
      console.error("Error fetching talks:", err);
    }

    try {
      const result = await userScopedApi.pilgrimages.getList();
      pilgrimages = Array.isArray(result?.pilgrimages)
        ? result.pilgrimages
        : [];
    } catch (err) {
      console.error("Error fetching pilgrimages:", err);
    }

    // Filter out content where user's subscriptionTier matches content's subscriptionTiers
    const filteredByTierCommentaries = filterBySubscriptionTier(
      commentaries,
      userProfile?.subscriptionTier,
    );
    const filteredByTierTalks = filterBySubscriptionTier(
      talks,
      userProfile?.subscriptionTier,
    );
    const filteredByTierPilgrimages = filterBySubscriptionTier(
      pilgrimages,
      userProfile?.subscriptionTier,
    );

    // Filter out purchased content
    const filteredCommentaries = filterPurchasedContent(
      filteredByTierCommentaries,
      purchasedContentIds,
      purchasedPpvTags,
    );
    const filteredTalks = filterPurchasedContent(
      filteredByTierTalks,
      purchasedContentIds,
      purchasedPpvTags,
    );
    const filteredPilgrimages = filterPurchasedContent(
      filteredByTierPilgrimages,
      purchasedContentIds,
      purchasedPpvTags,
    );

    // Handle case where user has no billing customer ID (never subscribed) or no API key
    if (!serverContext.billingCustomerId || !serverContext.appstleApiKey) {
      return {
        customer,
        customerData: null,
        activeContract: null,
        latestCancelledContract: null,
        pendingDowngrade: null,
        subscriptionTier: "unsubscribed" as SubscriptionTier,
        customerAccountUrl: env.PUBLIC_CUSTOMER_ACCOUNT_API_URL,
        userProfileData: userProfile,
        memberships,
        purchases,
        catalogCommentaries: filteredCommentaries,
        catalogTalks: filteredTalks,
        catalogPilgrimages: filteredPilgrimages,
        catalogCurrencyCode,
        orders: Promise.resolve([]),
        error: !serverContext.appstleApiKey
          ? "Appstle API key not configured"
          : undefined,
      };
    }

    // Fetch customer subscriptions from Appstle using BILLING customer ID (from Media API)
    const customerData = await getCustomerSubscriptions(
      serverContext.billingCustomerId,
      serverContext.appstleApiKey,
    );

    console.debug(
      "🔵 [MANAGE-MEMBERSHIP] Customer subscription status:",
      customerData?.productSubscriberStatus,
    );
    console.debug(
      "🔵 [MANAGE-MEMBERSHIP] Total contracts:",
      customerData?.subscriptionContracts?.nodes?.length || 0,
    );

    // Fetch orders from the correct Shopify store using Admin API (deferred - not critical)
    const ordersPromise: Promise<CustomerOrder[]> =
      serverContext.adminApiToken && serverContext.storeDomain
        ? fetchCustomerOrders(
            serverContext.billingCustomerId,
            serverContext.storeDomain,
            serverContext.adminApiToken,
          )
            .then((orders) => {
              console.debug(
                "🔵 [MANAGE-MEMBERSHIP] Fetched",
                orders.length,
                "orders from",
                serverContext.storeType,
                "store",
              );
              return orders;
            })
            .catch((error) => {
              console.error(
                "🔴 [MANAGE-MEMBERSHIP] Error fetching orders:",
                error,
              );
              return [] as CustomerOrder[];
            })
        : Promise.resolve([] as CustomerOrder[]);

    // Extract contracts from GraphQL structure
    const contracts = customerData?.subscriptionContracts?.nodes || [];

    // Find active contract
    const activeContract =
      contracts.find(
        (c: AppstleSubscriptionContract) => c.status === "ACTIVE",
      ) || null;

    console.debug(
      "🔵 [MANAGE-MEMBERSHIP] Active contract found:",
      !!activeContract,
    );

    // Fetch pending downgrade if there's an active contract
    let pendingDowngrade: PendingDowngrade | null = null;
    if (activeContract) {
      console.debug(
        "🔵 [MANAGE-MEMBERSHIP] Active contract ID:",
        activeContract.id,
      );
      console.debug(
        "🔵 [MANAGE-MEMBERSHIP] Next billing date:",
        activeContract.nextBillingDate,
      );

      // Extract numeric contract ID for the pending downgrade API
      const numericContractId = activeContract.id.split("/").pop();
      if (numericContractId) {
        pendingDowngrade = await getPendingDowngrade(
          numericContractId,
          serverContext.appstleApiKey,
        );
        console.debug(
          "🔵 [MANAGE-MEMBERSHIP] Pending downgrade:",
          pendingDowngrade ? "Found" : "None",
        );
      }
    }

    // Find most recent paused or cancelled contract for reactivation
    const reactivatableContracts = contracts
      .filter(
        (c: AppstleSubscriptionContract) =>
          c.status === "PAUSED" || c.status === "CANCELLED",
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    const latestCancelledContract = reactivatableContracts[0] || null;

    console.debug(
      "🔵 [MANAGE-MEMBERSHIP] Latest paused/cancelled contract:",
      latestCancelledContract?.id,
      latestCancelledContract?.status,
    );

    // Derive subscription tier from active contract variant title
    let subscriptionTier: SubscriptionTier = "unsubscribed";
    if (activeContract) {
      const firstLine = activeContract.lines?.nodes?.[0];
      const variantTitle = firstLine?.variantTitle || "";
      subscriptionTier = deriveSubscriptionTierFromVariantTitle(variantTitle);
    }

    console.debug(
      "🔵 [MANAGE-MEMBERSHIP] Subscription tier:",
      subscriptionTier,
    );

    return {
      customer,
      customerData,
      activeContract,
      latestCancelledContract,
      pendingDowngrade,
      subscriptionTier,
      customerAccountUrl: env.PUBLIC_CUSTOMER_ACCOUNT_API_URL,
      userProfileData: userProfile,
      memberships,
      purchases,
      catalogCommentaries: filteredCommentaries,
      catalogTalks: filteredTalks,
      catalogPilgrimages: filteredPilgrimages,
      catalogCurrencyCode,
      orders: ordersPromise,
      debugInfo: {
        apiRequestParams: {
          customerId: serverContext.billingCustomerId,
          customerIdType: typeof serverContext.billingCustomerId,
          customerEmail: customerEmail || "",
          storeType: serverContext.storeType,
        },
        rawApiResponse: customerData,
      },
    };
  } catch (error) {
    console.error("Error loading manage-membership data:", error);

    // Don't redirect to login for non-auth errors - the user is already authenticated
    // Just return an error state that the UI can handle gracefully
    const customer = { firstName: null, lastName: null, emailAddress: null };
    return {
      customer,
      customerData: null,
      activeContract: null,
      latestCancelledContract: null,
      pendingDowngrade: null,
      subscriptionTier: "unsubscribed" as SubscriptionTier,
      customerAccountUrl: env.PUBLIC_CUSTOMER_ACCOUNT_API_URL,
      userProfileData: userProfile,
      memberships: null,
      purchases: null,
      catalogCommentaries: [],
      catalogTalks: [],
      catalogPilgrimages: [],
      catalogCurrencyCode: "EUR",
      orders: Promise.resolve([]),
      error:
        error instanceof Error ? error.message : "Failed to load account data",
    };
  }
}

// Helper function to derive tier from variant title
// Variant titles are like "Live", "Core", "Premium", "Supporter"
function deriveSubscriptionTierFromVariantTitle(
  variantTitle: string,
): SubscriptionTier {
  const normalized = variantTitle.toLowerCase().trim();

  if (normalized.includes("supporter")) return "supporter";
  if (normalized.includes("premium")) return "premium";
  if (normalized.includes("live")) return "live";

  return "unsubscribed";
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { env, customerAccount } = context;

  // Get user profile and locale from middleware context
  const userProfile = context.get(userProfileContext);
  const { countryCode } = context.get(localeContext);

  const formData = await request.formData();
  const intent = formData.get("intent");

  console.debug("🔵 [ACTION] Received action request");
  console.debug("🔵 [ACTION] Intent:", intent);
  console.debug(
    "🔵 [ACTION] FormData entries:",
    Array.from(formData.entries()),
  );

  try {
    // Get customer email from Customer Account API
    const { data, errors } = await customerAccount.query(
      CUSTOMER_ACCOUNT_QUERY,
    );

    if (errors?.length || !data?.customer) {
      return Response.json(
        { success: false, error: "Failed to fetch customer data" },
        { status: 500 },
      );
    }

    const customerEmail = data.customer.emailAddress?.emailAddress;
    if (!customerEmail) {
      return Response.json(
        { success: false, error: "No email found" },
        { status: 400 },
      );
    }

    // Get server store context using userProfile from middleware
    const serverContext = getServerStoreContext(userProfile, env, countryCode);

    console.debug("🔵 [ACTION] Store context:", {
      storeType: serverContext.storeType,
      hasBillingCustomerId: !!serverContext.billingCustomerId,
      hasApiKey: !!serverContext.appstleApiKey,
    });

    if (!serverContext.billingCustomerId || !serverContext.appstleApiKey) {
      return Response.json(
        { success: false, error: "No billing information found" },
        { status: 400 },
      );
    }

    if (intent === "changePlan") {
      const contractId = formData.get("contractId") as string;
      const newVariantId = formData.get("newVariantId") as string;

      console.debug("🔵 [ACTION] changePlan - contractId:", contractId);
      console.debug("🔵 [ACTION] changePlan - newVariantId:", newVariantId);

      // Fetch fresh customer subscriptions using BILLING customer ID
      const customerData = await getCustomerSubscriptions(
        serverContext.billingCustomerId,
        serverContext.appstleApiKey,
      );

      // Find the contract by matching the numeric ID
      const contract = customerData?.subscriptionContracts?.nodes?.find(
        (c) => c.id.split("/").pop() === contractId,
      );

      if (!contract) {
        console.error("🔴 [ACTION] changePlan - Contract not found");
        return Response.json(
          { success: false, error: "Subscription not found" },
          { status: 404 },
        );
      }

      console.debug(
        "🔵 [ACTION] changePlan - contract retrieved:",
        contract.id,
      );

      const currentLine = contract.lines?.nodes?.[0];

      if (!currentLine) {
        console.error("🔴 [ACTION] changePlan - No subscription line found");
        return Response.json(
          { success: false, error: "No subscription line found" },
          { status: 400 },
        );
      }

      console.debug(
        "🔵 [ACTION] changePlan - currentLine:",
        currentLine.id,
        currentLine.variantId,
      );

      // Extract just the numeric ID from the GID format for the API call
      const numericLineId = currentLine.id.split("/").pop() || currentLine.id;
      const numericVariantId =
        currentLine.variantId.split("/").pop() || currentLine.variantId;
      const newNumericVariantId = newVariantId.split("/").pop() || newVariantId;

      const result = await updateSubscriptionVariant(
        contractId,
        numericLineId,
        numericVariantId,
        newNumericVariantId,
        serverContext.appstleApiKey,
      );

      console.debug("🔵 [ACTION] changePlan - result:", result);
      return result;
    }

    if (intent === "cancelSubscription") {
      const contractId = formData.get("contractId") as string;
      console.debug("🔵 [ACTION] cancelSubscription - contractId:", contractId);

      const result = await cancelSubscription(
        contractId,
        serverContext.appstleApiKey,
      );
      console.debug("🔵 [ACTION] cancelSubscription - result:", result);

      return result;
    }

    if (intent === "reactivateSubscription") {
      const contractId = formData.get("contractId") as string;
      const contractStatus = formData.get("contractStatus") as string;

      console.debug(
        "🔵 [ACTION] reactivateSubscription - contractId:",
        contractId,
      );
      console.debug(
        "🔵 [ACTION] reactivateSubscription - contractStatus:",
        contractStatus,
      );

      // Only paused subscriptions can be reactivated via API
      if (contractStatus?.toLowerCase() === "paused") {
        const result = await reactivateSubscription(
          contractId,
          serverContext.appstleApiKey,
        );
        console.debug("🔵 [ACTION] reactivateSubscription - result:", result);
        return result;
      }

      // Cancelled subscriptions cannot be reactivated - must go through checkout
      if (contractStatus?.toLowerCase() === "cancelled") {
        console.debug(
          "🔵 [ACTION] reactivateSubscription - Cannot reactivate cancelled subscription",
        );
        return Response.json(
          {
            success: false,
            error:
              "Cancelled subscriptions cannot be reactivated. Please use the checkout link to subscribe again.",
          },
          { status: 400 },
        );
      }

      return Response.json(
        { success: false, error: "Invalid contract status" },
        { status: 400 },
      );
    }

    if (intent === "cancelPendingDowngrade") {
      const contractId = formData.get("contractId") as string;

      console.debug(
        "🔵 [ACTION] cancelPendingDowngrade - contractId:",
        contractId,
      );

      if (!contractId) {
        return Response.json(
          { success: false, error: "Contract ID is required" },
          { status: 400 },
        );
      }

      const result = await cancelPendingDowngrade(
        contractId,
        serverContext.appstleApiKey,
      );
      console.debug("🔵 [ACTION] cancelPendingDowngrade - result:", result);

      if (result.success) {
        return Response.json(result);
      }
      return Response.json(result, { status: 400 });
    }

    if (intent === "scheduleDowngrade") {
      const contractId = formData.get("contractId") as string;
      const newVariantId = formData.get("newVariantId") as string;

      console.debug("🔵 [ACTION] scheduleDowngrade - contractId:", contractId);
      console.debug(
        "🔵 [ACTION] scheduleDowngrade - newVariantId:",
        newVariantId,
      );

      // Fetch fresh customer subscriptions using BILLING customer ID
      const customerData = await getCustomerSubscriptions(
        serverContext.billingCustomerId,
        serverContext.appstleApiKey,
      );

      // Find the contract by matching the numeric ID
      const contract = customerData?.subscriptionContracts?.nodes?.find(
        (c) => c.id.split("/").pop() === contractId,
      );

      if (!contract) {
        console.error("🔴 [ACTION] scheduleDowngrade - Contract not found");
        return Response.json(
          { success: false, error: "Subscription not found" },
          { status: 404 },
        );
      }

      const currentLine = contract.lines?.nodes?.[0];

      if (!currentLine) {
        console.error(
          "🔴 [ACTION] scheduleDowngrade - No subscription line found",
        );
        return Response.json(
          { success: false, error: "No subscription line found" },
          { status: 400 },
        );
      }

      // Extract just the numeric ID from the GID format for the API call
      const numericLineId = currentLine.id.split("/").pop() || currentLine.id;
      const numericVariantId =
        currentLine.variantId.split("/").pop() || currentLine.variantId;
      const newNumericVariantId = newVariantId.split("/").pop() || newVariantId;

      const result = await scheduleSubscriptionDowngrade(
        contractId,
        numericLineId,
        numericVariantId,
        newNumericVariantId,
        serverContext.appstleApiKey,
      );

      console.debug("🔵 [ACTION] scheduleDowngrade - result:", result);

      if (result.success) {
        return Response.json(result);
      }
      return Response.json(result, { status: 400 });
    }

    console.error("🔴 [ACTION] No matching intent found:", intent);
    return Response.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("🔴 [ACTION] Error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Action failed",
      },
      { status: 500 },
    );
  }
}

/**
 * Skeleton loader for invoice table while orders are being fetched
 */
function InvoiceTableSkeleton() {
  return (
    <div className="bg-brand-dark p-16 desktop:p-24 rounded-lg mb-16 desktop:mb-24 animate-pulse">
      <div className="h-6 bg-grey-dark/50 rounded w-40 mb-12 desktop:mb-16" />
      <div className="space-y-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-grey-dark/30 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function ManageMembership() {
  const {
    customer,
    customerData,
    activeContract,
    latestCancelledContract,
    pendingDowngrade,
    subscriptionTier,
    customerAccountUrl,
    userProfileData,
    memberships,
    purchases,
    catalogCommentaries,
    catalogTalks,
    catalogPilgrimages,
    catalogCurrencyCode,
    orders,
    error,
    debugInfo,
  } = useLoaderData<LoaderData>();
  // Initialize pricePeriod based on user's current or cancelled billing period
  const getInitialPricePeriod = (): "monthly" | "yearly" => {
    if (activeContract?.lines?.nodes?.[0]?.variantTitle) {
      const variantTitle =
        activeContract.lines.nodes[0].variantTitle.toLowerCase();
      if (variantTitle.includes("yearly") || variantTitle.includes("annual")) {
        return "yearly";
      }
    }
    if (latestCancelledContract?.lines?.nodes?.[0]?.variantTitle) {
      const variantTitle =
        latestCancelledContract.lines.nodes[0].variantTitle.toLowerCase();
      if (variantTitle.includes("yearly") || variantTitle.includes("annual")) {
        return "yearly";
      }
    }
    return "monthly";
  };

  const [pricePeriod, setPricePeriod] = useState<"monthly" | "yearly">(
    getInitialPricePeriod(),
  );
  const { strings } = useTranslations();

  // User info for display
  const greeting = customer?.firstName
    ? [customer.firstName, customer.lastName ?? ""].join(" ").trim()
    : customer?.emailAddress?.emailAddress ?? "My Account";
  const email = customer?.emailAddress?.emailAddress;

  const customerName = customer
    ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
    : undefined;

  // Extract payment method from active contract
  const paymentMethod = activeContract?.customerPaymentMethod?.instrument
    ? {
        brand: activeContract.customerPaymentMethod.instrument.brand,
        last4: activeContract.customerPaymentMethod.instrument.lastDigits,
      }
    : null;

  // Transform memberships to tier format for display
  const tiersArray = memberships?.memberships
    ? memberships.memberships.map(transformMembershipToTier)
    : [];
  const currencySymbol = memberships?.currencyCode
    ? getCurrencySymbol(memberships.currencyCode)
    : "€";

  // Build variantIds mapping from memberships
  const variantIds: VariantIds | undefined = memberships?.memberships
    ? memberships.memberships.reduce((acc, membership) => {
        const tierId = membership.id as "live" | "premium" | "supporter";
        if (
          tierId === "live" ||
          tierId === "premium" ||
          tierId === "supporter"
        ) {
          acc[tierId] = {
            monthly: String(membership.shopifyVariantIdMonthly),
            yearly: String(membership.shopifyVariantIdYearly),
          };
        }
        return acc;
      }, {} as VariantIds)
    : undefined;

  // Determine current billing period from active contract variant title
  const currentBilling: Billing | null = activeContract?.lines?.nodes?.[0]
    ?.variantTitle
    ? activeContract.lines.nodes[0].variantTitle
        .toLowerCase()
        .includes("yearly") ||
      activeContract.lines.nodes[0].variantTitle
        .toLowerCase()
        .includes("annual")
      ? "yearly"
      : "monthly"
    : null;

  // Determine cancelled billing period from latest cancelled contract
  const cancelledBilling: Billing | null = latestCancelledContract?.lines
    ?.nodes?.[0]?.variantTitle
    ? latestCancelledContract.lines.nodes[0].variantTitle
        .toLowerCase()
        .includes("yearly") ||
      latestCancelledContract.lines.nodes[0].variantTitle
        .toLowerCase()
        .includes("annual")
      ? "yearly"
      : "monthly"
    : null;

  // Derive cancelled tier from latest cancelled contract
  const cancelledTier: SubscriptionTier | null = latestCancelledContract?.lines
    ?.nodes?.[0]?.variantTitle
    ? (() => {
        const variantTitle =
          latestCancelledContract.lines.nodes[0].variantTitle.toLowerCase();
        if (variantTitle.includes("supporter")) return "supporter";
        if (variantTitle.includes("premium")) return "premium";
        if (variantTitle.includes("live")) return "live";
        return null;
      })()
    : null;

  // Get subscription status and ID
  const subscriptionStatus = activeContract?.status as
    | "ACTIVE"
    | "PAUSED"
    | "CANCELLED"
    | undefined;
  const subscriptionId = activeContract?.id
    ? activeContract.id.split("/").pop() || null
    : null;

  // Determine if membership is cancelled (no active contract but has cancelled contract)
  const isCancelled =
    !activeContract && latestCancelledContract?.status === "CANCELLED";

  return (
    <div>
      <Container>
        <h2 className="text-24 desktop:text-32 font-700 mb-20 desktop:mb-32 text-white">
          My Bhakti Plus
        </h2>
      </Container>

      <Container>
        {error && (
          <div className="bg-red-500/20 text-red-400 p-16 rounded-md mb-24 border border-red-500/30">
            {error}
          </div>
        )}
      </Container>

      <Container>
        {/* Debug info - Hidden */}
        {process.env.NODE_ENV === "development" && (
          <details className="bg-yellow-500/20 text-yellow-200 p-16 rounded-md mb-24 border border-yellow-500/30">
            <summary className="cursor-pointer font-600">
              Debug Info (Dev Only)
            </summary>
            <div className="mt-12">
              <div className="mb-16">
                <h4 className="font-600 text-14 mb-8">
                  Logged In Customer (Shopify)
                </h4>
                <pre className="text-12 overflow-auto bg-black/30 p-12 rounded">
                  {JSON.stringify(
                    {
                      name: `${customer?.firstName || ""} ${
                        customer?.lastName || ""
                      }`.trim(),
                      email: customer?.emailAddress?.emailAddress,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>

              <div className="mb-16">
                <h4 className="font-600 text-14 mb-8">
                  User Profile (/user/profile endpoint)
                </h4>
                <pre className="text-12 overflow-auto bg-black/30 p-12 rounded">
                  {JSON.stringify(userProfileData, null, 2)}
                </pre>
              </div>

              <div className="mb-16">
                <h4 className="font-600 text-14 mb-8">Appstle API Request</h4>
                <pre className="text-12 overflow-auto bg-black/30 p-12 rounded">
                  {JSON.stringify(debugInfo?.apiRequestParams, null, 2)}
                </pre>
              </div>

              <div className="mb-16">
                <h4 className="font-600 text-14 mb-8">
                  Appstle Customer Data (Raw Response)
                </h4>
                <pre className="text-12 overflow-auto bg-black/30 p-12 rounded max-h-400">
                  {JSON.stringify(customerData || null, null, 2)}
                </pre>
              </div>

              <div className="mb-16">
                <h4 className="font-600 text-14 mb-8">
                  Appstle Response Structure Analysis
                </h4>
                <pre className="text-12 overflow-auto bg-black/30 p-12 rounded">
                  {JSON.stringify(
                    {
                      hasCustomerData: !!customerData,
                      customerDataType: customerData
                        ? typeof customerData
                        : "null",
                      customerDataKeys: customerData
                        ? Object.keys(customerData)
                        : [],
                      hasSubscriptionContracts: customerData
                        ? "subscriptionContracts" in customerData
                        : false,
                      subscriptionContractsType:
                        customerData?.subscriptionContracts
                          ? typeof customerData.subscriptionContracts
                          : "undefined",
                      subscriptionContractsKeys:
                        customerData?.subscriptionContracts
                          ? Object.keys(customerData.subscriptionContracts)
                          : [],
                      hasNodes: customerData?.subscriptionContracts
                        ? "nodes" in customerData.subscriptionContracts
                        : false,
                      nodesType: customerData?.subscriptionContracts?.nodes
                        ? typeof customerData.subscriptionContracts.nodes
                        : "undefined",
                      nodesIsArray: Array.isArray(
                        customerData?.subscriptionContracts?.nodes,
                      ),
                      nodesLength:
                        customerData?.subscriptionContracts?.nodes?.length ??
                        "N/A",
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>

              <div className="mb-16">
                <h4 className="font-600 text-14 mb-8">
                  Subscription Contracts (
                  {customerData?.subscriptionContracts?.nodes?.length || 0}{" "}
                  total)
                </h4>
                <pre className="text-12 overflow-auto bg-black/30 p-12 rounded max-h-400">
                  {JSON.stringify(
                    customerData?.subscriptionContracts?.nodes?.map(
                      (contract) => ({
                        id: contract.id,
                        status: contract.status,
                        nextBillingDate: contract.nextBillingDate,
                        price: contract.lines?.nodes?.[0]?.currentPrice,
                        variantTitle: contract.lines?.nodes?.[0]?.variantTitle,
                      }),
                    ) || [],
                    null,
                    2,
                  )}
                </pre>
              </div>

              <div className="mb-16">
                <h4 className="font-600 text-14 mb-8">
                  Subscription Tier Comparison
                </h4>
                <pre className="text-12 overflow-auto bg-black/30 p-12 rounded">
                  {JSON.stringify(
                    {
                      frontendTier: {
                        source:
                          "Derived from Appstle contract variantTitle (manage-membership page only)",
                        tier: subscriptionTier,
                        derivedFrom: activeContract
                          ? activeContract.lines?.nodes?.[0]?.variantTitle
                          : "No active contract",
                        note: "This is for display purposes only on this page",
                      },
                      backendTier: {
                        source:
                          "/user/profile endpoint (used for access gating throughout app)",
                        tier:
                          userProfileData?.subscriptionTier || "unsubscribed",
                        note: "THIS IS THE SOURCE OF TRUTH for user access control",
                      },
                      mismatch:
                        subscriptionTier !==
                        (userProfileData?.subscriptionTier || "unsubscribed"),
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>

              <div className="mb-16">
                <h4 className="font-600 text-14 mb-8">
                  Current Subscription State
                </h4>
                <pre className="text-12 overflow-auto bg-black/30 p-12 rounded">
                  {JSON.stringify(
                    {
                      hasActiveContract: !!activeContract,
                      activeContract: activeContract
                        ? {
                            id: activeContract.id,
                            status: activeContract.status,
                            nextBillingDate: activeContract.nextBillingDate,
                            price:
                              activeContract.lines?.nodes?.[0]?.currentPrice
                                ?.amount,
                            currencyCode:
                              activeContract.lines?.nodes?.[0]?.currentPrice
                                ?.currencyCode,
                            variantTitle:
                              activeContract.lines?.nodes?.[0]?.variantTitle,
                          }
                        : null,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>

              <div className="mb-16">
                <h4 className="font-600 text-14 mb-8">
                  Pending Downgrade (Appstle)
                </h4>
                <pre className="text-12 overflow-auto bg-black/30 p-12 rounded">
                  {JSON.stringify(
                    {
                      hasPendingDowngrade: !!pendingDowngrade,
                      pendingDowngrade: pendingDowngrade || null,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          </details>
        )}
      </Container>
      <Container>
        {/* User Info and Current Subscription - Desktop: 2 columns, Mobile: 2 rows */}
        <div className="mb-24 desktop:mb-32 grid grid-cols-1 desktop:grid-cols-2 gap-24 desktop:gap-32">
          {/* Left Column - User Info (Mobile: second row) */}
          <div className="order-2 desktop:order-1 bg-brand-dark rounded-lg">
            <h1 className="text-20 desktop:text-24 font-700 text-white">
              {greeting}
            </h1>
            {email && <p className="text-grey-light text-14 mt-4">{email}</p>}
          </div>

          {/* Right Column - Current Subscription (Mobile: first row) */}
          <div className="order-1 desktop:order-2">
            <MembershipCard
              activeContract={activeContract}
              latestCancelledContract={latestCancelledContract}
              subscriptionTier={subscriptionTier}
              userProfileData={userProfileData}
              pendingDowngrade={pendingDowngrade}
            />
          </div>
        </div>
      </Container>
      <Container>
        {/* Subscription Tiers Section */}
        {memberships?.memberships?.length && (
          <div className="mb-32 desktop:mb-48">
            <div className="flex flex-col items-center mb-24">
              <Tabs.Root
                value={pricePeriod}
                onValueChange={(value) =>
                  setPricePeriod(value as "monthly" | "yearly")
                }
              >
                <Tabs.List className="tabs__header flex justify-center pt-sp-1 z-10">
                  <Tabs.Trigger value="monthly">
                    <TabButton isActive={pricePeriod === "monthly"}>
                      {strings.subscription_monthly || "Monthly"}
                    </TabButton>
                  </Tabs.Trigger>
                  <Tabs.Trigger value="yearly">
                    <TabButton isActive={pricePeriod === "yearly"}>
                      {strings.subscription_yearly || "Yearly"}
                    </TabButton>
                  </Tabs.Trigger>
                </Tabs.List>
              </Tabs.Root>

              {/* Save with annual billing message - only shown when yearly is selected */}
              {pricePeriod === "yearly" && (
                <div className="flex gap-[8px] items-center justify-center px-0 py-[4px] mt-8">
                  <p className="font-medium leading-[20px] text-[#4bde80] text-[16px] text-center whitespace-nowrap tracking-[0.16px]">
                    {strings.subscription_save_annual}
                  </p>
                </div>
              )}
            </div>

            {/* Mobile: Swipeable slideshow */}
            <div className="tablet:hidden">
              <MobileSlideshow gap={8}>
                {/* AllPlansBenefits as first slide on mobile */}
                <MobileSlideshow.Slide key="all-plans-benefits">
                  <AllPlansBenefits />
                </MobileSlideshow.Slide>
                {tiersArray.map((plan) => (
                  <MobileSlideshow.Slide key={plan.id}>
                    <SubscriptionTierLanding
                      tier={plan}
                      pricePeriod={pricePeriod}
                      currencySymbol={currencySymbol}
                      highlight={plan.id === "supporter"}
                      buttonText={
                        plan.id === "supporter"
                          ? strings.subscription_support_us
                          : strings.subscription_select_plan
                      }
                      subscriptionTier={subscriptionTier}
                      currentBilling={currentBilling}
                      status={subscriptionStatus}
                      subscriptionId={subscriptionId}
                      variantIds={variantIds}
                      showToggle={true}
                      latestCancelledContract={latestCancelledContract}
                      cancelledTier={cancelledTier}
                      cancelledBilling={cancelledBilling}
                      isCancelled={isCancelled}
                      pendingDowngrade={pendingDowngrade}
                    />
                  </MobileSlideshow.Slide>
                ))}
              </MobileSlideshow>
            </div>

            {/* Tablet+: Grid with tier cards */}
            <div
              className="hidden tablet:grid grid-cols-2 desktop:grid-cols-[auto_1fr_1fr_1fr] items-stretch justify-items-center desktop:justify-items-start mx-auto"
              style={{
                width: "fit-content",
                gap: "8px",
              }}
            >
              {/* All Plans Benefits - shown in grid on both tablet (2x2) and desktop (first column) */}
              <AllPlansBenefits />
              {tiersArray.map((plan) => (
                <SubscriptionTierLanding
                  key={plan.id}
                  tier={plan}
                  pricePeriod={pricePeriod}
                  currencySymbol={currencySymbol}
                  highlight={plan.id === "supporter"}
                  buttonText={
                    plan.id === "supporter"
                      ? strings.subscription_support_us
                      : strings.subscription_select_plan
                  }
                  subscriptionTier={subscriptionTier}
                  currentBilling={currentBilling}
                  status={subscriptionStatus}
                  subscriptionId={subscriptionId}
                  variantIds={variantIds}
                  showToggle={true}
                  latestCancelledContract={latestCancelledContract}
                  cancelledTier={cancelledTier}
                  cancelledBilling={cancelledBilling}
                  isCancelled={isCancelled}
                  pendingDowngrade={pendingDowngrade}
                />
              ))}
            </div>
          </div>
        )}
      </Container>

      <Container bleedRight>
        {/* My Purchases Section */}
        <div className="mb-32 desktop:mb-48">
          <h3 className="text-20 desktop:text-24 font-700 mb-16 desktop:mb-24 text-white">
            {strings.account_my_purchases}
          </h3>
          {purchases?.purchases && purchases.purchases.length > 0 ? (
            <Carousel hideNavigation>
              {purchases.purchases.map((purchase) => {
                const getContentUrl = (
                  purchase: (typeof purchases.purchases)[0],
                ) => {
                  if (purchase.videoId) {
                    const encodedVideoId = encodeVideoId(purchase.videoId);
                    return `/video?videoId=${encodedVideoId}`;
                  }
                  return "#";
                };
                return (
                  <Carousel.Slide
                    key={purchase.id}
                    className="flex-shrink-0 flex flex-col"
                  >
                    <Link to={getContentUrl(purchase)}>
                      <ContentCard
                        size="md"
                        aspectRatio="portrait"
                        title={purchase.title}
                        image={
                          purchase.thumbnailUrlVertical ||
                          purchase.thumbnailUrl ||
                          ""
                        }
                        className={purchase.isExpired ? "opacity-60" : ""}
                      />
                    </Link>
                  </Carousel.Slide>
                );
              })}
            </Carousel>
          ) : (
            <div className="text-grey-light">
              <p>{strings.account_no_purchases}</p>
            </div>
          )}
        </div>
      </Container>

      {/* More on Bhakti+ Section Divider */}
      <Container>
        <MoreBhaktiEyebrow
          text={strings.account_bhakti_plus_catalog}
          className="mt-32 mb-32 desktop:mt-48 desktop:mb-48"
        />
      </Container>

      {/* Bhakti+ Catalog Section - Hidden for supporter tier */}
      {userProfileData?.subscriptionTier !== "supporter" && (
        <div className="mb-32 desktop:mb-48">
          <Container bleedRight>
            {/* Commentaries Section */}
            {catalogCommentaries.length > 0 && (
              <div className="mb-32 desktop:mb-48">
                <h4 className="text-18 desktop:text-20 font-700 mb-12 desktop:mb-16 text-white">
                  {strings.commentaries}
                </h4>
                <Carousel hideNavigation>
                  {catalogCommentaries.map((commentary) => {
                    return (
                      <Carousel.Slide key={commentary.contentId}>
                        <CatalogCard
                          content={commentary}
                          size="md"
                          aspectRatio="landscape"
                          eyebrow={commentary.subtitle}
                          description={commentary.summary200}
                          durationSeconds={commentary.totalVideoDurationSeconds}
                        />
                      </Carousel.Slide>
                    );
                  })}
                </Carousel>
              </div>
            )}
          </Container>
          <Container bleedRight>
            {/* Virtual Pilgrimages Section */}
            {catalogPilgrimages.length > 0 && (
              <div className="mb-32 desktop:mb-48">
                <h4 className="text-18 desktop:text-20 font-700 mb-12 desktop:mb-16 text-white">
                  {strings.virtual_pilgrimages}
                </h4>
                <Carousel hideNavigation>
                  {catalogPilgrimages.map((pilgrimage) => {
                    return (
                      <Carousel.Slide key={pilgrimage.contentId}>
                        <CatalogCard
                          content={pilgrimage}
                          size="md"
                          aspectRatio="landscape"
                          eyebrow={pilgrimage.subtitle}
                          description={pilgrimage.summary200}
                          durationSeconds={pilgrimage.totalVideoDurationSeconds}
                        />
                      </Carousel.Slide>
                    );
                  })}
                </Carousel>
              </div>
            )}
          </Container>

          <Container bleedRight>
            {/* Talks Section */}
            {catalogTalks.length > 0 && (
              <div className="mb-32 desktop:mb-48">
                <h4 className="text-18 desktop:text-20 font-700 mb-12 desktop:mb-16 text-white">
                  {strings.homepage_talks_title}
                </h4>
                <Carousel hideNavigation>
                  {catalogTalks.map((talk) => {
                    return (
                      <Carousel.Slide key={talk.contentId}>
                        <CatalogCard
                          content={talk}
                          size="md"
                          aspectRatio="landscape"
                          eyebrow={talk.subtitle}
                          description={talk.summary200}
                          durationSeconds={talk.video?.durationSeconds}
                        />
                      </Carousel.Slide>
                    );
                  })}
                </Carousel>
              </div>
            )}
          </Container>

          <Container>
            {/* Empty State */}
            {catalogCommentaries.length === 0 &&
              catalogTalks.length === 0 &&
              catalogPilgrimages.length === 0 && (
                <div className="text-grey-light">
                  <p>{strings.catalog_empty_state}</p>
                </div>
              )}
          </Container>
        </div>
      )}

      {/* Billing Address and Payment Method - Desktop: 2 columns, Mobile: 2 rows */}
      <Container>
        <div className="mb-24 desktop:mb-32 grid grid-cols-1 desktop:grid-cols-2 gap-24 desktop:gap-32">
          {/* Left Column - Billing Address (Mobile: first row) */}
          <div className="order-1 desktop:order-1">
            <BillingAddressCard
              customerName={customerName}
              address={customer?.defaultAddress}
              customerAccountUrl={customerAccountUrl}
              regionId={userProfileData?.stampedRegionId}
            />
          </div>

          {/* Right Column - Payment Method (Mobile: second row) */}
          <div className="order-2 desktop:order-2">
            <PaymentMethodCard
              paymentMethod={paymentMethod}
              customerAccountUrl={customerAccountUrl}
              regionId={userProfileData?.stampedRegionId}
            />
          </div>
        </div>
      </Container>

      {/* Invoice History (deferred) */}
      <Container>
        <Suspense fallback={<InvoiceTableSkeleton />}>
          <Await resolve={orders}>
            {(resolvedOrders) => {
              const invoices = resolvedOrders.map((order) => ({
                id: order.id,
                date: order.date,
                amount: order.amount,
                currencyCode: order.currencyCode,
                status: order.status,
                planName: order.planName,
                refundedAmount: order.refundedAmount,
                orderNumber: order.orderNumber,
                orderName: order.name,
              }));
              return (
                <InvoiceTable
                  invoices={invoices}
                  regionId={userProfileData?.stampedRegionId}
                />
              );
            }}
          </Await>
        </Suspense>
      </Container>

      {/* Sign Out Button */}
      <Container>
        <div className="mt-32 desktop:mt-48 pt-24 desktop:pt-32 border-t border-grey-dark">
          <Form method="post" action="/account/logout">
            <button
              type="submit"
              className="text-grey-light hover:text-white transition-colors text-14 underline"
            >
              {strings.account_sign_out}
            </button>
          </Form>
        </div>
      </Container>
    </div>
  );
}
