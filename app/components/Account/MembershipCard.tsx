import type {
  AppstleSubscriptionContract,
  PendingDowngrade,
} from "~/lib/api/services/appstle";
import type { SubscriptionTier } from "~/lib/types";
import type { SubscriptionInfo } from "~/lib/api/types";
import { formatRenewalDate } from "~/lib/utils/subscription";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { STORE_SUBSCRIPTION_CONFIG } from "~/lib/constants";

interface MembershipCardProps {
  activeContract: AppstleSubscriptionContract | null;
  latestCancelledContract: AppstleSubscriptionContract | null;
  subscriptionTier: SubscriptionTier;
  userProfileData: SubscriptionInfo | null;
  pendingDowngrade?: PendingDowngrade | null;
}

/**
 * Get the tier name from a variant ID by checking against known variant IDs
 */
function getTierFromVariantId(variantId: string): SubscriptionTier | null {
  const euConfig = STORE_SUBSCRIPTION_CONFIG.eu.variantIds;
  const rowConfig = STORE_SUBSCRIPTION_CONFIG.row.variantIds;

  // Check EU variants
  if (variantId === euConfig.liveMonthly || variantId === euConfig.liveYearly) {
    return "live";
  }
  if (
    variantId === euConfig.premiumMonthly ||
    variantId === euConfig.premiumYearly
  ) {
    return "premium";
  }
  if (
    variantId === euConfig.supporterMonthly ||
    variantId === euConfig.supporterYearly
  ) {
    return "supporter";
  }

  // Check ROW variants
  if (
    variantId === rowConfig.liveMonthly ||
    variantId === rowConfig.liveYearly
  ) {
    return "live";
  }
  if (
    variantId === rowConfig.premiumMonthly ||
    variantId === rowConfig.premiumYearly
  ) {
    return "premium";
  }
  if (
    variantId === rowConfig.supporterMonthly ||
    variantId === rowConfig.supporterYearly
  ) {
    return "supporter";
  }

  return null;
}

export default function MembershipCard({
  activeContract,
  latestCancelledContract,
  subscriptionTier,
  userProfileData,
  pendingDowngrade,
}: MembershipCardProps) {
  const { strings } = useTranslations();

  // Determine subscription status based on /user/profile API data
  const getSubscriptionStatus = (): {
    status: "active" | "no_subscription" | "paused" | "cancelled";
    message: string;
  } => {
    try {
      // Use userProfileData from /user/profile API - this is the source of truth
      const profileTier = userProfileData?.subscriptionTier;

      // If there's an active contract, subscription is active
      if (activeContract) {
        return {
          status: "active",
          message: "Current subscription",
        };
      }

      // If no active contract but there's a cancelled/paused contract, check its status
      if (latestCancelledContract?.status) {
        if (latestCancelledContract.status === "PAUSED") {
          return {
            status: "paused",
            message: "Subscription paused",
          };
        }
        if (latestCancelledContract.status === "CANCELLED") {
          return {
            status: "cancelled",
            message: "Subscription cancelled",
          };
        }
      }

      // Check profile tier from /user/profile API
      // If user has a valid subscription tier (not null, not "unsubscribed", not "core"), they have a subscription
      if (
        profileTier &&
        profileTier !== "unsubscribed" &&
        profileTier !== "core"
      ) {
        // User has a subscription according to /user/profile API
        return {
          status: "active",
          message: "Current subscription",
        };
      }

      // No subscription if tier is null or "unsubscribed" or "core"
      return {
        status: "no_subscription",
        message: "No subscription yet",
      };
    } catch (error) {
      console.error("Error determining subscription status:", error);
      // Safe fallback
      return {
        status: "no_subscription",
        message: "No subscription yet",
      };
    }
  };

  if (!activeContract) {
    // Show reactivation option if there's a paused or cancelled subscription
    if (latestCancelledContract) {
      // Extract data from GraphQL structure
      const firstLine = latestCancelledContract.lines?.nodes?.[0];
      const priceAmount = parseFloat(firstLine?.currentPrice?.amount || "0");
      const currencyCode = firstLine?.currentPrice?.currencyCode || "EUR";
      const variantTitle = firstLine?.variantTitle || "";

      // Derive tier from variant title
      const normalized = variantTitle.toLowerCase().trim();
      const contractTier: SubscriptionTier = normalized.includes("supporter")
        ? "supporter"
        : normalized.includes("premium")
        ? "premium"
        : normalized.includes("live")
        ? "live"
        : "unsubscribed";

      const planName =
        contractTier.charAt(0).toUpperCase() + contractTier.slice(1);
      const amount = priceAmount.toFixed(2);
      const currencySymbol = currencyCode === "EUR" ? "€" : "$";
      const interval =
        latestCancelledContract.billingPolicy.interval.toLowerCase();
      const isPaused = latestCancelledContract.status === "PAUSED";
      const isCancelled = latestCancelledContract.status === "CANCELLED";

      // Extract contract ID from GID
      const contractId = latestCancelledContract.id.split("/").pop() || "";
      const subscriptionStatus = getSubscriptionStatus();

      // Get status text for badge
      const statusText = isPaused
        ? "PAUSED"
        : isCancelled
        ? "CANCELLED"
        : "ACTIVE";

      return (
        <div className="bg-brand-dark rounded-lg">
          <h1 className="text-20 desktop:text-24 font-700 text-white mb-12 desktop:mb-16">
            {strings.account_current_subscription}
          </h1>

          <div className="mb-12 desktop:mb-16">
            <div className="flex items-center justify-start gap-10 mb-4">
              <p className="text-white text-16 desktop:text-18 font-600">
                {planName} {strings.plan}
              </p>
              <p className="px-[10px] py-[5px] rounded-[0.75rem] bg-gradient-to-r from-[#5745FF] to-[#231F92] text-white text-12 font-600 uppercase tracking-wide whitespace-nowrap">
                {statusText}
              </p>
            </div>
            <p className="text-grey-light text-14">
              {isPaused &&
                strings.account_subscription_paused.replace(
                  "{planName}",
                  planName,
                )}
              {isCancelled &&
                strings.account_subscription_cancelled.replace(
                  "{planName}",
                  planName,
                )}
            </p>
            {isCancelled &&
              latestCancelledContract.nextBillingDate &&
              new Date(latestCancelledContract.nextBillingDate) >
                new Date() && (
                <p className="text-grey-light text-14 mt-4">
                  {strings.account_access_until.replace(
                    "{date}",
                    formatRenewalDate(latestCancelledContract.nextBillingDate),
                  )}
                </p>
              )}
          </div>
        </div>
      );
    }

    const subscriptionStatus = getSubscriptionStatus();
    const profileTier = userProfileData?.subscriptionTier;

    // Only show subscribe message if user truly has no subscription
    const hasSubscription =
      subscriptionStatus.status === "active" ||
      (profileTier && profileTier !== "unsubscribed" && profileTier !== "core");

    return (
      <>
        <div className="bg-brand-dark rounded-lg">
          <h1 className="text-20 desktop:text-24 font-700 text-white">
            {strings.account_current_subscription}
          </h1>

          {/* Show subscription tier if user has one */}
          {hasSubscription && profileTier && (
            <p className="text-white text-16 font-600 mt-8 mb-16">
              {profileTier.charAt(0).toUpperCase() + profileTier.slice(1)}{" "}
              {strings.plan}
            </p>
          )}

          {/* Only show subscribe message if no subscription */}
          {!hasSubscription && (
            <p className="text-grey-light text-14 mt-8 mb-16 desktop:mb-24">
              {strings.account_subscribe_cta}
            </p>
          )}
        </div>
      </>
    );
  }

  // Extract data from GraphQL structure
  const firstLine = activeContract.lines?.nodes?.[0];
  const priceAmount = parseFloat(firstLine?.currentPrice?.amount || "0");
  const currencyCode = firstLine?.currentPrice?.currencyCode || "EUR";
  const contractId = activeContract.id.split("/").pop() || "";

  const planName =
    subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1);
  const amount = priceAmount.toFixed(2);
  const currencySymbol = currencyCode === "EUR" ? "€" : "$";
  const interval = activeContract.billingPolicy.interval.toLowerCase();

  // Get subscription tier from profile API if available, otherwise use subscriptionTier from contract
  const profileTier = userProfileData?.subscriptionTier;
  const displayTier = profileTier || subscriptionTier;
  const displayTierName =
    displayTier.charAt(0).toUpperCase() + displayTier.slice(1);

  // Get subscription status
  const subscriptionStatus = getSubscriptionStatus();

  // Get status text for badge
  const statusText =
    activeContract.status === "PAUSED"
      ? "PAUSED"
      : activeContract.status === "CANCELLED"
      ? "CANCELLED"
      : "ACTIVE";

  return (
    <>
      <div className="bg-brand-dark rounded-lg">
        <h1 className="text-20 desktop:text-24 font-700 text-white mb-12 desktop:mb-16">
          {strings.account_current_subscription}
        </h1>

        {/* Current Plan Info */}
        <div className="mb-12 desktop:mb-16">
          <div className="flex items-center justify-start gap-10 mb-4">
            <p className="text-white text-16 desktop:text-18 font-600">
              {displayTierName} {strings.plan}
            </p>
            <p className="px-[10px] py-[5px] rounded-[0.75rem] bg-gradient-to-r from-[#5745FF] to-[#231F92] text-white text-12 font-600 uppercase tracking-wide whitespace-nowrap">
              {statusText}
            </p>
          </div>

          {/* Pending Downgrade Info */}
          {pendingDowngrade && pendingDowngrade.waitTillTimestamp && (
            <div className="mt-8 p-12 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
              <p className="text-[#f59e0b] text-14 font-500">
                {(() => {
                  const targetTier = getTierFromVariantId(
                    pendingDowngrade.newVariantId,
                  );
                  const scheduledDate = formatRenewalDate(
                    pendingDowngrade.waitTillTimestamp,
                  );

                  if (targetTier === "live") {
                    return strings.account_downgrade_scheduled_to_live.replace(
                      "{date}",
                      scheduledDate,
                    );
                  }
                  if (targetTier === "premium") {
                    return strings.account_downgrade_scheduled_to_premium.replace(
                      "{date}",
                      scheduledDate,
                    );
                  }
                  // Fallback for unknown tier
                  return `Your subscription will change on ${scheduledDate}`;
                })()}
              </p>
            </div>
          )}

          {/* Next Payment Date and Amount */}
          {activeContract.nextBillingDate && (
            <div className="mt-8 space-y-4">
              <p className="text-grey-light text-14">
                {strings.account_next_payment}:{" "}
                {formatRenewalDate(activeContract.nextBillingDate)}
              </p>
              <p className="text-grey-light text-14">
                {strings.account_amount}: {currencySymbol}
                {amount}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
