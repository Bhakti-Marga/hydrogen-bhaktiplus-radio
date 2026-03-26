import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { ModalPortal } from "~/components/Portal";
import type { SubscriptionTier as SubscriptionTierName } from "~/lib/types";
import type { SubscriptionTierSchema } from "~/lib/utils/subscription";
import {
  getMembershipLink,
  getTierFeaturesWithTooltips,
  type VariantIds,
  type Billing,
} from "~/lib/utils/subscription";
import { Button } from "~/components/Button/Button";
import { TierContainer } from "./TierContainer";
import { TierPrice } from "./TierPrice";
import { TierFeaturesList } from "./TierFeaturesList";
import {
  IconChevron,
  IconTierLive,
  IconTierPremium,
  IconTierSupporter,
} from "~/components/Icons";
import { cn } from "~/lib/utils";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { usePrelaunch } from "~/contexts/PrelaunchProvider";
import type {
  AppstleSubscriptionContract,
  PendingDowngrade,
} from "~/lib/api/services/appstle";
import giftIcon from "~/assets/images/Gift.png";

interface SubscriptionTierLandingProps {
  tier: SubscriptionTierSchema;
  pricePeriod: "monthly" | "yearly";
  /** Required - no default to prevent showing wrong currency */
  currencySymbol: string;
  highlight?: boolean;
  buttonText?: string;
  // Optional: current subscription info for determining action
  subscriptionTier?: SubscriptionTierName;
  currentBilling?: Billing | null;
  status?: "ACTIVE" | "PAUSED" | "CANCELLED";
  subscriptionId?: string | null;
  variantIds?: VariantIds;
  contactEmail?: string;
  /** Show toggle button to expand/collapse features. Defaults to false (homepage). Set to true for /my page. */
  showToggle?: boolean;
  // Cancelled subscription info
  latestCancelledContract?: AppstleSubscriptionContract | null;
  cancelledTier?: SubscriptionTierName | null;
  cancelledBilling?: Billing | null;
  isCancelled?: boolean;
  // Pending downgrade info
  pendingDowngrade?: PendingDowngrade | null;
}

/**
 * Subscription tier card for landing page and /my page.
 * Links to /subscribe or uses getMembershipLink to determine the correct action based on subscription info.
 */
export function SubscriptionTierLanding({
  tier,
  pricePeriod,
  currencySymbol,
  highlight = false,
  buttonText,
  subscriptionTier,
  currentBilling,
  status,
  subscriptionId,
  variantIds,
  contactEmail,
  showToggle = false,
  latestCancelledContract,
  cancelledTier,
  cancelledBilling,
  isCancelled = false,
  pendingDowngrade,
}: SubscriptionTierLandingProps) {
  const { strings } = useTranslations();
  const { isPrelaunchActive } = usePrelaunch();

  // Safety check
  if (!tier || !tier.price) {
    return null;
  }

  // Each tier card has its own independent expanded state
  // Default to expanded so features are visible by default on /my page
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Confirmation dialog state for mutation actions (upgrade, downgrade, cancel, change frequency)
  const [pendingAction, setPendingAction] = useState<{
    href: string;
    actionText: string;
    isDowngrade?: boolean;
  } | null>(null);
  const navigate = useNavigate();

  // Tooltip state for the "1 month free" banner
  const [showBannerTooltip, setShowBannerTooltip] = useState<boolean>(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
    showAbove: boolean;
  } | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Get translated features with tooltips for this tier
  const features = getTierFeaturesWithTooltips(tier.id, strings);

  // Handler for toggle
  const handleToggleClick = useCallback(() => {
    setIsExpanded((prev: boolean) => !prev);
  }, []);

  // Check if cancelled contract can still be reactivated
  // Reactivation is only possible if nextBillingDate is in the future (grace period)
  const canReactivateCancelledContract =
    latestCancelledContract?.status === "CANCELLED" &&
    latestCancelledContract?.nextBillingDate &&
    new Date(latestCancelledContract.nextBillingDate) > new Date();

  // Handle cancelled membership: show reactivate for cancelled plan (if reactivatable), disable others
  // If cancelled but past nextBillingDate, treat as unsubscribed (show "Choose plan")
  const isCancelledPlan =
    isCancelled &&
    cancelledTier === tier.id &&
    cancelledBilling === pricePeriod;

  // Can only show reactivate if the contract is still within the grace period
  const canShowReactivate = isCancelledPlan && canReactivateCancelledContract;

  // Check if this tier is the target of a pending downgrade
  // We need to match the variantId from pendingDowngrade.newVariantId with the tier's variant
  // Note: pendingDowngrade.newVariantId is a Shopify GID (gid://shopify/ProductVariant/123)
  // but variantIds contains numeric strings, so we extract the numeric part
  const pendingDowngradeVariantId = pendingDowngrade?.newVariantId
    ?.split("/")
    .pop();
  const isPendingDowngradeTarget = Boolean(
    pendingDowngrade &&
      pendingDowngradeVariantId &&
      variantIds &&
      variantIds[tier.id as keyof typeof variantIds] &&
      (variantIds[tier.id as keyof typeof variantIds]?.monthly ===
        pendingDowngradeVariantId ||
        variantIds[tier.id as keyof typeof variantIds]?.yearly ===
          pendingDowngradeVariantId),
  );

  // If cancelled but can't reactivate, don't disable buttons - show normal "Choose plan" flow
  // Also disable buttons if there's a pending downgrade (except for the target tier which shows "Cancel")
  const shouldDisableButton =
    (isCancelled && canReactivateCancelledContract && !isCancelledPlan) ||
    (pendingDowngrade && !isPendingDowngradeTarget);

  // Determine action if subscription info is provided
  // Only calculate action if we have all required data and tier is not unsubscribed/core
  // Skip action calculation if this button should be disabled (cancelled membership, not the cancelled plan)
  const canCalculateAction =
    !shouldDisableButton &&
    subscriptionTier &&
    subscriptionTier !== "unsubscribed" &&
    variantIds &&
    Object.keys(variantIds).length > 0 &&
    tier.id !== "unsubscribed";

  // For cancelled plan within grace period, use reactivate link
  const reactivateLink = canShowReactivate
    ? "/router?intent=membership&op=reactivate&return_to=/"
    : null;

  const action = canShowReactivate
    ? { text: "reactivate", method: "GET" as const, link: reactivateLink! }
    : canCalculateAction
    ? getMembershipLink({
        subscriptionTier,
        currentBilling: currentBilling || null,
        status: status || "ACTIVE",
        subscriptionId: subscriptionId || null,
        targetTier: tier.id as Exclude<
          SubscriptionTierName,
          "unsubscribed"
        >,
        targetBilling: pricePeriod,
        variantIds,
        contactEmail,
      })
    : null;

  // Helper function to format button text
  const formatButtonText = (text: string): string => {
    // Capitalize first letter
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  // Check if tier should be disabled (supporter only - live and premium are now enabled)
  const isTierDisabled = tier.id === "supporter";

  // Check if tier should show "Coming soon" button
  // Supporter tier: always show "Coming soon" regardless of prelaunch mode
  // Live and Premium tiers: show "Coming soon" only during prelaunch mode
  const shouldShowComingSoon =
    tier.id === "supporter" ||
    (isPrelaunchActive && (tier.id === "live" || tier.id === "premium"));

  // Show "1 month free" banner for Live and Premium tiers when yearly is selected
  const shouldShowFreeBanner =
    (tier.id === "live" || tier.id === "premium") && pricePeriod === "yearly";

  // Handle banner hover for tooltip positioning
  const handleBannerMouseEnter = useCallback(() => {
    if (bannerRef.current) {
      const rect = bannerRef.current.getBoundingClientRect();
      const tooltipHeight = 140; // Approximate tooltip height
      const spaceAbove = rect.top;
      const showAbove = spaceAbove >= tooltipHeight + 16; // 16px buffer

      setTooltipPosition({
        top: showAbove ? rect.top - 8 : rect.bottom + 8, // 8px gap
        left: rect.left,
        showAbove,
      });
    }
    setShowBannerTooltip(true);
  }, []);

  const handleBannerMouseLeave = useCallback(() => {
    setShowBannerTooltip(false);
    setTooltipPosition(null);
  }, []);

  // Free month banner component with tooltip
  const freeMonthBanner = shouldShowFreeBanner ? (
    <div
      ref={bannerRef}
      className="bg-[#5644fd] flex gap-[10px] items-center justify-center px-[24px] py-[8px] w-full cursor-pointer"
      onMouseEnter={handleBannerMouseEnter}
      onMouseLeave={handleBannerMouseLeave}
    >
      <img src={giftIcon} alt="" width="24" height="24" />
      <p className="font-bold leading-[24px] text-[12px] text-white uppercase">
        {strings.subscription_one_month_free || "1 MONTH FREE"}
      </p>
    </div>
  ) : null;

  // Tooltip portal component - rendered at document body level
  const tooltipPortal =
    showBannerTooltip && tooltipPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed z-[200] bg-[#16254c] flex flex-col gap-[4px] items-start justify-center p-[16px] rounded-[12px] shadow-[0px_4px_14px_0px_rgba(12,22,47,0.3)] text-white w-[335px]"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              transform: tooltipPosition.showAbove
                ? "translateY(-100%)"
                : "translateY(0)",
              pointerEvents: "none",
            }}
          >
            <div className="font-semibold leading-[24px] text-[14px] tracking-[0.28px] w-full">
              <p className="mb-0">
                {strings.subscription_one_month_free_tooltip_title ||
                  "Annual Commitment."}
              </p>
              <p className="mb-0">
                {strings.subscription_one_month_free_tooltip_subtitle ||
                  "12 months access. 1 month free."}
              </p>
            </div>
            <p className="font-medium leading-[20px] opacity-80 text-[12px] tracking-[0.12px] w-full">
              {strings.subscription_one_month_free_tooltip_description ||
                "If you upgrade to one of the following plans, you'll receive full access to this content without needing to purchase it separately."}
            </p>
          </div>,
          document.body,
        )
      : null;

  // Determine button text - use action.text if available, otherwise fallback to buttonText prop
  let displayButtonText: string;
  if (shouldShowComingSoon) {
    // Tier is temporarily disabled - show "Coming soon"
    displayButtonText = strings.coming_soon;
  } else if (isPendingDowngradeTarget) {
    // This tier is the target of a pending downgrade - show "Cancel downgrade"
    displayButtonText =
      strings.tier_cancel_pending_downgrade || "Cancel downgrade";
  } else if (canShowReactivate) {
    // Cancelled plan within grace period - show "Reactivate"
    displayButtonText = strings.tier_reactivate;
  } else if (action?.text) {
    // Check if this is a "Change frequency" case (same tier, different billing period)
    const isSameTier = subscriptionTier === tier.id;
    const isDifferentBilling = currentBilling && currentBilling !== pricePeriod;
    const isActive = status === "ACTIVE";

    if (isSameTier && isDifferentBilling && isActive) {
      displayButtonText = strings.tier_change_frequency;
    } else if (action.text === "contact") {
      displayButtonText = strings.tier_contact_us;
    } else if (action.text === "pause" && status === "PAUSED") {
      displayButtonText = strings.tier_reactivate;
    } else if (action.text === "subscribe" && tier.id === "supporter") {
      // Special case: "Support us" for supporter tier subscribe action
      displayButtonText = buttonText || strings.subscription_support_us;
    } else {
      displayButtonText = formatButtonText(action.text);
    }
  } else {
    // Fallback to static buttonText prop (for unsubscribed users or when action is null)
    displayButtonText = buttonText || strings.subscription_select_plan;
  }

  let buttonElement: React.ReactNode;

  if (shouldShowComingSoon) {
    // Tier is temporarily disabled - hide button, show "Coming soon" text instead
    buttonElement = null;
  } else if (isPendingDowngradeTarget) {
    // This tier is the target of a pending downgrade - show "Cancel downgrade" button
    // Show confirmation dialog before navigating
    const cancelDowngradeLink =
      "/router?intent=membership&op=cancel_downgrade&return_to=/my";

    buttonElement = (
      <Button
        as="button"
        variant="gold"
        size="large"
        className="w-full max-w-none mb-8 text-center h-[40px] flex justify-center"
        onClick={() =>
          setPendingAction({
            href: cancelDowngradeLink,
            actionText: displayButtonText,
          })
        }
      >
        {displayButtonText}
      </Button>
    );
  } else if (shouldDisableButton) {
    // Cancelled membership or pending downgrade exists - gray out and disable buttons
    buttonElement = (
      <Button
        as="button"
        variant="gold"
        size="large"
        className={cn(
          "w-full max-w-none mb-8 text-center opacity-50 cursor-not-allowed h-[40px] flex justify-center",
        )}
        disabled
        onClick={(e: React.MouseEvent) => e.preventDefault()}
      >
        {displayButtonText}
      </Button>
    );
  } else if (action?.text === "contact") {
    // Forbidden downgrade - show "Contact us" and open email client
    buttonElement = (
      <Button
        as="link"
        href={action.link}
        variant="gold"
        size="large"
        className={cn(
          "w-full max-w-none mb-8 text-center h-[40px] flex justify-center",
        )}
      >
        {displayButtonText}
      </Button>
    );
  } else {
    // Router links should be absolute (no locale prefix)
    const href =
      action?.link ||
      `/router?intent=subscribe&membership_id=${tier.id}&billing_period=${pricePeriod}`;

    // Check if this is a downgrade or cancel action (only on /my page)
    const isDowngradeOrCancel =
      subscriptionTier &&
      (action?.text === "downgrade" || action?.text === "cancel");
    const buttonClassName = isDowngradeOrCancel
      ? "w-full max-w-none mb-8 text-center bg-[#2F3C5FCC] text-white"
      : "w-full max-w-none mb-8 text-center";

    // Mutation actions (upgrade, downgrade, cancel, change frequency)
    // require a confirmation dialog before navigating
    const isMutationAction =
      action?.text === "upgrade" ||
      action?.text === "downgrade" ||
      action?.text === "cancel" ||
      action?.text === "change frequency" ||
      action?.text === "pause";

    if (isMutationAction) {
      buttonElement = (
        <Button
          as="button"
          variant="gold"
          size="large"
          className={cn(buttonClassName, "h-[40px] flex justify-center")}
          onClick={() =>
            setPendingAction({
              href,
              actionText: displayButtonText,
              isDowngrade: action?.text === "downgrade",
            })
          }
        >
          {displayButtonText}
        </Button>
      );
    } else {
      // Non-mutation actions (subscribe for unsubscribed users) remain direct links
      buttonElement = (
        <Button
          as="link"
          href={href}
          absolute
          variant="gold"
          size="large"
          className={cn(buttonClassName, "h-[40px] flex justify-center")}
        >
          {displayButtonText}
        </Button>
      );
    }
  }

  // Check if this is the user's current active plan (must match both tier AND billing period)
  const isCurrentPlan = Boolean(
    subscriptionTier &&
      subscriptionTier === tier.id &&
      status === "ACTIVE" &&
      currentBilling === pricePeriod,
  );

  // Check if user has an active membership
  // User has active membership if subscriptionTier exists, is not 'unsubscribed', and status is 'ACTIVE'
  const hasActiveMembership = Boolean(
    subscriptionTier &&
      subscriptionTier !== "unsubscribed" &&
      status === "ACTIVE",
  );

  // Check if this is an upgrade action
  const isUpgradeAction = action?.text === "upgrade";

  // Upgrade buttons should be shown outside toggle (under price) when user has active membership
  // Other buttons (cancel, change frequency, downgrade) stay inside toggle
  const shouldShowButtonOutsideToggle = !hasActiveMembership || isUpgradeAction;
  const shouldShowButtonInsideToggle = hasActiveMembership && !isUpgradeAction;

  return (
    <TierContainer
      highlight={highlight}
      className={cn(
        // Flex column to push buttons to bottom
        "flex flex-col",
        !shouldShowComingSoon && "hover:via-[#061566] hover:to-[#0029B0]",
        shouldDisableButton && "opacity-60",
        // On /my page desktop, ensure all cards have consistent width
        showToggle && "desktop:min-w-[284px]",
        // When collapsed, use self-start to allow card to shrink while staying aligned at top
        showToggle && !isExpanded && "self-start",
      )}
      removeMinHeight={!showToggle}
      topBanner={freeMonthBanner}
    >
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-8">
            {tier.id === "live" && (
              <IconTierLive className="w-22 h-22 text-white" />
            )}
            {tier.id === "premium" && (
              <IconTierPremium className="w-22 h-17 text-white" />
            )}
            {tier.id === "supporter" && (
              <IconTierSupporter className="w-18 h-16 text-white" />
            )}
            <h3
              className="text-white"
              style={{
                fontSize: "24px",
                fontWeight: 600,
              }}
            >
              {tier.title}
            </h3>
          </div>
          {isCurrentPlan && (
            <p className="px-[10px] py-[12px] rounded-[0.75rem] bg-[#1139ff] text-white text-12 font-600 uppercase tracking-wide whitespace-nowrap mt-0 -mr-[5px]">
              {strings.tier_my_plan}
            </p>
          )}
          {isPendingDowngradeTarget && (
            <p className="px-[10px] py-[12px] rounded-[0.75rem] bg-[#f59e0b] text-white text-12 font-600 uppercase tracking-wide whitespace-nowrap mt-0 -mr-[5px]">
              {strings.tier_scheduled_downgrade}
            </p>
          )}
        </div>

        {/* Apply blur to price for disabled tiers */}
        <div>
          <TierPrice
            price={tier.price}
            period={pricePeriod}
            currencySymbol={currencySymbol}
            className="mb-8"
            blurPrice={isTierDisabled}
            tierId={tier.id}
            originalMonthlyPrice={
              tier.price.monthly
                ? String(Math.round(parseFloat(tier.price.monthly) * 12))
                : undefined
            }
          />
        </div>

        {/* Show "Coming soon" button for disabled tiers (both homepage and /my page) */}
        {shouldShowComingSoon && (
          <div className="flex items-center justify-center w-full mb-8">
            <div className="bg-[rgba(255,255,255,0.1)] flex items-center justify-center w-full max-w-none px-[24px] py-[12px] rounded-[62px]">
              <p className="text-white text-[14px] font-semibold leading-[24px] opacity-70 tracking-[0.28px]">
                {strings.coming_soon}
              </p>
            </div>
          </div>
        )}

        {/* Show button above the chevron toggle - all action buttons (upgrade, downgrade, cancel, etc.) */}
        {buttonElement}

        {/* Chevron toggle button - only show when showToggle is true (on /my page), except for supporter tier */}
        {showToggle && tier.id !== "supporter" && (
          <button
            type="button"
            onClick={handleToggleClick}
            id={`toggle-${tier.id}`}
            data-tier-id={tier.id}
            aria-controls={`content-${tier.id}`}
            className="flex items-center justify-center w-full py-12 transition-transform duration-300"
            style={{ cursor: "pointer" }}
            aria-label={
              isExpanded
                ? strings.aria_collapse_features
                : strings.aria_expand_features
            }
            aria-expanded={isExpanded}
          >
            <IconChevron
              className={`w-16 h-16 text-white transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        )}

        {/* Features list - always visible on homepage, collapsible on /my page
            Supporter tier on /my page: hide features entirely (only show title, price, coming soon button) */}
        {features.length > 0 &&
          !(showToggle && tier.id === "supporter") &&
          (showToggle ? (
            <div
              id={`content-${tier.id}`}
              data-tier-id={tier.id}
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: isExpanded ? "1000px" : "0px",
                opacity: isExpanded ? 1 : 0,
              }}
            >
              <div
                className="mt-8"
                style={isTierDisabled ? { filter: "blur(12px)" } : undefined}
              >
                <TierFeaturesList features={features} />
              </div>
            </div>
          ) : (
            <div
              id={`content-${tier.id}`}
              data-tier-id={tier.id}
              className="flex-1 flex flex-col"
              style={isTierDisabled ? { filter: "blur(12px)" } : undefined}
            >
              <div className="mt-8 flex-1">
                <TierFeaturesList features={features} />
              </div>
            </div>
          ))}
      </div>
      {tooltipPortal}
      {/* Confirmation dialog for mutation actions */}
      {pendingAction && (
        <ModalPortal
          onClose={() => setPendingAction(null)}
          backdrop="dark"
          layer="critical"
        >
          <div className="bg-brand-dark border border-white/10 rounded-lg p-32 max-w-[500px] w-full">
            <h3 className="text-24 font-700 text-white mb-16">
              {strings.modal_plan_change_confirm_title}
            </h3>
            <p className="text-white text-16 mb-24 opacity-80">
              {pendingAction.isDowngrade
                ? strings.modal_plan_change_confirm_description_downgrade
                : (strings.modal_plan_change_confirm_description || "")
                    .replace(
                      "{action}",
                      pendingAction.actionText.toLowerCase(),
                    )
                    .replace("{tier}", tier.title)}
            </p>
            <div className="flex gap-12">
              <Button
                as="button"
                variant="blue"
                shape="rectangle"
                onClick={() => setPendingAction(null)}
                className="flex-1"
              >
                {strings.action_cancel}
              </Button>
              <Button
                as="button"
                variant="ghost"
                shape="rectangle"
                onClick={() => {
                  const href = pendingAction.href;
                  setPendingAction(null);
                  navigate(href);
                }}
                className="flex-1"
              >
                {strings.confirm}
              </Button>
            </div>
          </div>
        </ModalPortal>
      )}
    </TierContainer>
  );
}
