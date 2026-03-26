import { useState } from "react";
import { useRootLoaderData } from "~/hooks";
import {
  isPPVContent,
  buildPPVRouterUrl,
  getSubscriptionTiersFromContent,
} from "~/lib/utils/content";
import { isContentFreeInPrelaunch } from "~/lib/utils/prelaunch";
import type { Content, ContentType } from "~/lib/types";
import { Button } from "~/components/Button/Button";
import { ChoosePlanButton } from "./ChoosePlanButton";
import { UpgradePlanButton } from "./UpgradePlanButton";
import { PurchaseSeparateButton } from "./PurchaseSeparateButton";
import SubscriptionModal from "~/components/SubscriptionModal";
import { ComingSoonModal } from "~/components/Modal/ComingSoonModal";
import { usePrelaunch } from "~/contexts/PrelaunchProvider";
import { useTranslations } from "~/contexts/TranslationsProvider";

interface CTAButtonsProps {
  content: Content;
  contentType: ContentType;
  userHasAnyPlan: boolean;
  /**
   * Optional anchor ID - when provided, CTA buttons scroll to this element
   * instead of opening the subscription modal.
   */
  scrollToId?: string;
  /**
   * Variant controls button size and text format.
   * - hero: Default size, "Purchase separately for €225"
   * - catalog: Small size, "Buy for €225"
   */
  variant?: "hero" | "catalog";
}

/**
 * Renders appropriate CTA buttons based on content access requirements.
 * Shows plan buttons and/or PPV purchase button depending on content configuration.
 */
export function CTAButtons({
  content,
  contentType,
  userHasAnyPlan,
  scrollToId,
  variant = "hero",
}: CTAButtonsProps) {
  const { subscriptionTier, memberships } = useRootLoaderData();
  const { isPrelaunchActive } = usePrelaunch();
  const { strings } = useTranslations();
  const [showModal, setShowModal] = useState(false);

  // Handle CTA button click - either scroll to anchor or open modal
  const handlePlanButtonClick = () => {
    if (scrollToId) {
      const element = document.getElementById(scrollToId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      setShowModal(true);
    }
  };

  // Determine if this content is free in prelaunch mode
  const isFreeInPrelaunch =
    isPrelaunchActive && isContentFreeInPrelaunch(contentType);

  // Extract content requirements and normalize to lowercase
  // Note: getSubscriptionTiersFromContent already filters out disabled tiers
  // No baseline tier fallback - content must be properly tagged in the backend
  const contentPlans = getSubscriptionTiersFromContent(content, true); // Use lowercase

  const hasContentPlans = contentPlans && contentPlans.length > 0;
  const isContentPPV = isPPVContent(content);

  // Prepare PPV data if applicable
  // Pricing comes directly from the Media API (already region-aware)
  let ppvLink = "";
  let ppvPrice: string | null = null;

  if (isContentPPV) {
    // Use router for multi-store support
    ppvLink = buildPPVRouterUrl(content) || "";

    // Use price from API (already includes correct regional pricing)
    if (content.shopifyPrice != null) {
      const currencyCode = content.shopifyCurrencyCode || "EUR";
      ppvPrice = `${currencyCode} ${content.shopifyPrice.toFixed(2)}`;
    }
  }

  // Catalog variant: buttons are full width and stacked
  const isCatalog = variant === "catalog";
  const buttonClassName = isCatalog ? "w-full" : "";

  // Helper to render the plan button (Upgrade or Choose)
  const renderPlanButton = () =>
    userHasAnyPlan ? (
      <UpgradePlanButton
        plans={contentPlans}
        onClick={handlePlanButtonClick}
        variant={variant}
        className={buttonClassName}
      />
    ) : (
      <ChoosePlanButton
        plans={contentPlans}
        onClick={handlePlanButtonClick}
        variant={variant}
        className={buttonClassName}
      />
    );

  // Helper to render the PPV button
  const renderPPVButton = () => (
    <PurchaseSeparateButton
      link={ppvLink}
      price={ppvPrice}
      variant={variant}
      className={buttonClassName}
      isOngoingSeries={content.isOngoingSeries}
    />
  );

  // Helper to render modals
  const renderModals = () => (
    <>
      {showModal && !scrollToId && isPrelaunchActive && !isFreeInPrelaunch && (
        <ComingSoonModal
          onClose={() => setShowModal(false)}
          contentType={contentType}
        />
      )}
      {showModal &&
        !scrollToId &&
        (!isPrelaunchActive || isFreeInPrelaunch) && (
          <SubscriptionModal
            content={content}
            contentTitle={content.title}
            contentType={contentType}
            userCurrentPlan={subscriptionTier}
            memberships={memberships}
            onClose={() => setShowModal(false)}
          />
        )}
    </>
  );

  // Render buttons based on business logic
  if (hasContentPlans && isContentPPV) {
    // Both subscription plans and PPV available
    // Catalog: PPV first, then plan button
    // Hero: Plan button first, then PPV
    return (
      <>
        {isCatalog ? (
          <>
            {renderPPVButton()}
            {renderPlanButton()}
          </>
        ) : (
          <>
            {renderPlanButton()}
            {renderPPVButton()}
          </>
        )}
        {renderModals()}
      </>
    );
  } else if (hasContentPlans) {
    // Subscription plans only
    return (
      <>
        {renderPlanButton()}
        {renderModals()}
      </>
    );
  } else if (isContentPPV) {
    // PPV only - for catalog variant, show "Not available in any Plan" placeholder
    // Keep same button color (secondary) as when there are two buttons
    if (isCatalog) {
      const textSizeClass = "text-14";
      return (
        <>
          <PurchaseSeparateButton
            link={ppvLink}
            price={ppvPrice}
            variant={variant}
            className={buttonClassName}
            isOngoingSeries={content.isOngoingSeries}
            isPpvOnly
          />
          <Button
            variant="ghost"
            size="small"
            className={`${buttonClassName} ${textSizeClass} cursor-not-allowed opacity-60`}
            disabled
            data-testid="cta-not-available-in-plan"
          >
            {strings.content_not_available_in_plan ||
              "Not available in any Plan"}
          </Button>
        </>
      );
    }
    // Hero variant with PPV only: use primary button
    return (
      <PurchaseSeparateButton
        link={ppvLink}
        price={ppvPrice}
        btnVariant="primary"
        variant={variant}
        className={buttonClassName}
        isOngoingSeries={content.isOngoingSeries}
        isPpvOnly
      />
    );
  }

  // No access requirements (free content without access)
  return null;
}
