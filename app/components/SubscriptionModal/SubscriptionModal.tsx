import { useState } from "react";
import type { Content, SubscriptionTier } from "~/lib/types";
import type { MembershipListResponseDto } from "~/lib/api/types";
import { ModalPortal } from "~/components/Portal";
import {
  SubscriptionTierUpgrade,
  transformMembershipToTier,
  getCurrencySymbol,
} from "~/components/SubscriptionTier";
import { Button } from "~/components/Button/Button";
import { PurchaseSeparateButton } from "~/components/ContentButtons/PurchaseSeparateButton";
import {
  STATIC_PLANS,
  type SubscriptionTierSchema,
} from "~/lib/utils/subscription";
import { getChangeType } from "~/lib/utils/content";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { resolveModalState } from "./resolveModalState";
import { PpvModal } from "./PpvModal";
import type { ModalState } from "./resolveModalState";

interface SubscriptionModalProps {
  /**
   * The content the user is trying to access.
   * Used by resolveModalState to determine PPV vs subscription display.
   */
  content: Content;
  contentTitle?: string;
  contentType?:
    | "satsang"
    | "livestream"
    | "live"
    | "commentary"
    | "pilgrimage"
    | "video"
    | "talk";
  /**
   * User's current subscription tier
   */
  userCurrentPlan?: SubscriptionTier;
  /**
   * @deprecated Use `content` instead. The modal now derives required plans
   * from content via resolveModalState. Kept for backward compatibility
   * during migration - if provided without content, falls back to legacy behavior.
   */
  requiredPlans?: SubscriptionTier[];
  /**
   * @deprecated Use `content` instead.
   */
  contentSubscriptionTiers?: string[] | null;
  /**
   * @deprecated Use `content` instead.
   */
  contentTypeId?: number;
  /**
   * Membership plans from Media Platform API
   */
  memberships?: MembershipListResponseDto | null;
  /**
   * Billing period to display prices for and use in checkout URLs.
   * Defaults to "monthly".
   */
  billingPeriod?: "monthly" | "yearly";
  /**
   * The user's current billing period (from their active subscription).
   * When provided, the current plan card shows this period instead of billingPeriod.
   */
  userCurrentBillingPeriod?: "monthly" | "yearly" | null;
  onClose: () => void;
}

/**
 * SubscriptionModal - Modal for content access options
 *
 * Uses resolveModalState() to determine what to display:
 * - plans-only: Subscription tier cards (no PPV)
 * - plans-and-ppv: Subscription tier cards + PPV purchase button below
 * - ppv-only: PPV purchase button only (no plan cards)
 * - no-options: Fallback for broken content configuration
 *
 * Features:
 * - PPV-aware: correctly handles PPV-only content instead of showing plan cards
 * - Visual hierarchy: highlights plans that unlock content
 * - User's current plan clearly marked
 * - Direct checkout from each plan button
 * - Contextual header messaging
 */
export default function SubscriptionModal({
  content,
  contentTitle,
  contentType = "video",
  userCurrentPlan,
  requiredPlans = [],
  contentSubscriptionTiers,
  contentTypeId,
  memberships,
  billingPeriod = "monthly",
  userCurrentBillingPeriod,
  onClose,
}: SubscriptionModalProps) {
  const [pendingTier, setPendingTier] = useState<SubscriptionTier | null>(null);
  const { strings } = useTranslations();

  // Resolve modal state using the pure decision function
  const modalState: ModalState = resolveModalState({
    content,
    userCurrentPlan: userCurrentPlan || "unsubscribed",
  });

  // PPV-only: delegate to the compact PpvModal
  if (modalState.type === "ppv-only") {
    return (
      <PpvModal
        contentTitle={contentTitle || content?.title}
        ppv={modalState.ppv}
        isOngoingSeries={content?.isOngoingSeries}
        onClose={onClose}
      />
    );
  }

  const showPlanCards =
    modalState.type === "plans-only" || modalState.type === "plans-and-ppv";
  const ppvInfo =
    modalState.type === "plans-and-ppv" ? modalState.ppv : null;

  // Transform memberships to tier schema if available, otherwise use static data
  const basePlans: SubscriptionTierSchema[] = memberships?.memberships?.length
    ? memberships.memberships.map(transformMembershipToTier)
    : STATIC_PLANS;

  // Append billing period to plan titles (e.g. "Premium" -> "Premium Yearly")
  const billingLabel = billingPeriod === "yearly" ? "Yearly" : "Monthly";
  const currentPlanBillingLabel =
    userCurrentBillingPeriod === "yearly" ? "Yearly" : "Monthly";
  const plans: SubscriptionTierSchema[] = basePlans.map((plan) => {
    const isCurrentPlan = userCurrentPlan === plan.id;
    const label = isCurrentPlan ? currentPlanBillingLabel : billingLabel;
    return { ...plan, title: `${plan.title} ${label}` };
  });

  // Get currency symbol
  const currencySymbol = memberships?.currencyCode
    ? getCurrencySymbol(memberships.currencyCode)
    : "€";

  const handleCheckout = (tier: SubscriptionTier) => {
    if (!tier || tier === "unsubscribed") return;

    if (!userCurrentPlan || userCurrentPlan === "unsubscribed") {
      window.location.href = `/router?intent=subscribe&membership_id=${tier}&billing_period=${billingPeriod}`;
      return;
    }

    setPendingTier(tier);
  };

  const confirmPlanChange = () => {
    if (!pendingTier) return;
    window.location.href = `/router?intent=membership&op=update&tier=${pendingTier}&billing=${billingPeriod}&return_to=/account/my`;
  };

  const cancelPlanChange = () => {
    setPendingTier(null);
  };

  // Header messaging based on modal state
  const getModalTitle = (): string => {
    if (!userCurrentPlan || userCurrentPlan === "unsubscribed") {
      return strings.modal_choose_plan_title;
    }
    return strings.modal_change_plan_title;
  };

  const getHeaderMessage = (): string => {
    if (modalState.type === "plans-and-ppv") {
      return (
        strings.modal_plans_and_ppv_description ||
        getSubscriptionHeaderMessage()
      );
    }
    return getSubscriptionHeaderMessage();
  };

  const getSubscriptionHeaderMessage = (): string => {
    if (!userCurrentPlan || userCurrentPlan === "unsubscribed") {
      return strings.modal_account_subscription_choose;
    }
    return getTierCurrentPlanMessage(userCurrentPlan);
  };

  const getTierCurrentPlanMessage = (tier: SubscriptionTier): string => {
    const tierMessageMap: Record<SubscriptionTier, string> = {
      live: strings.modal_account_subscription_current_live,
      premium: strings.modal_account_subscription_current_premium,
      supporter: strings.modal_account_subscription_current_supporter,
      unsubscribed: strings.modal_account_subscription_choose,
    };
    return tierMessageMap[tier] || strings.modal_account_subscription_choose;
  };

  // Get plan access info from modal state
  const getPlanGrantsAccess = (planId: SubscriptionTier): boolean => {
    if (!showPlanCards) return false;
    const state = modalState as Extract<
      ModalState,
      { type: "plans-only" | "plans-and-ppv" }
    >;
    const planInfo = state.planAccess.find((p) => p.planId === planId);
    return planInfo?.grantsAccess ?? false;
  };

  return (
    <ModalPortal onClose={onClose} backdrop="dark">
      <div
        className="bg-brand-dark rounded-lg max-w-[1400px] w-full max-h-[90vh] overflow-y-auto relative"
        data-testid="subscription-modal"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-24 right-24 text-grey-light hover:text-white transition-colors text-24 leading-none p-8 z-10"
          aria-label={strings.aria_close}
          data-testid="modal-close"
        >
          &times;
        </button>

        <div className="p-32">
          {/* Header */}
          <div className="text-center mb-32">
            <h2 className="text-32 font-avenir-next font-600 text-white mb-8">
              {getModalTitle()}
            </h2>
            <p
              className="text-white text-16 opacity-80"
              dangerouslySetInnerHTML={{ __html: getHeaderMessage() }}
            />
          </div>

          {/* Confirmation dialog overlay */}
          {pendingTier && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-20 p-24">
              <div className="bg-brand-dark border border-white/10 rounded-lg p-32 max-w-[500px] w-full">
                <h3 className="text-24 font-700 text-white mb-16">
                  {strings.modal_plan_change_confirm_title}
                </h3>
                <p className="text-white text-16 mb-24 opacity-80">
                  {getChangeType(
                    userCurrentPlan || "unsubscribed",
                    pendingTier,
                  ) === "downgrade"
                    ? strings.modal_plan_change_confirm_description_downgrade
                    : (strings.modal_plan_change_confirm_description || "")
                        .replace(
                          "{action}",
                          getChangeType(
                            userCurrentPlan || "unsubscribed",
                            pendingTier,
                          ),
                        )
                        .replace(
                          "{tier}",
                          plans.find((p) => p.id === pendingTier)?.title ||
                            pendingTier,
                        )}
                </p>
                <div className="flex gap-12">
                  <Button
                    variant="blue"
                    shape="rectangle"
                    onClick={cancelPlanChange}
                    className="flex-1"
                  >
                    {strings.action_cancel}
                  </Button>
                  <Button
                    variant="ghost"
                    shape="rectangle"
                    onClick={confirmPlanChange}
                    className="flex-1"
                  >
                    {strings.confirm}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Subscription tier cards grid */}
          {showPlanCards && (
            <div
              className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-16 items-start"
              data-testid="modal-plan-cards"
            >
              {plans.map((plan) => {
                const grantsAccess = getPlanGrantsAccess(plan.id);
                const isCurrentPlan = userCurrentPlan === plan.id;
                const effectivePricePeriod =
                  isCurrentPlan && userCurrentBillingPeriod
                    ? userCurrentBillingPeriod
                    : billingPeriod;

                return (
                  <div key={plan.id} className="h-full">
                    <SubscriptionTierUpgrade
                      tier={plan}
                      pricePeriod={effectivePricePeriod}
                      currencySymbol={currencySymbol}
                      highlight={plan.id === "supporter"}
                      userCurrentPlan={userCurrentPlan}
                      grantsAccess={grantsAccess}
                      onCheckout={() => handleCheckout(plan.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* PPV button below plan cards (plans-and-ppv state) */}
          {modalState.type === "plans-and-ppv" && ppvInfo && (
            <div
              className="mt-24 flex flex-col items-center gap-8"
              data-testid="modal-ppv-section"
            >
              <p className="text-white text-14 opacity-60">
                {strings.modal_or_purchase_separately ||
                  "Or purchase this content individually:"}
              </p>
              <PurchaseSeparateButton
                link={ppvInfo.link}
                price={ppvInfo.price}
                btnVariant="secondary"
                isOngoingSeries={content?.isOngoingSeries}
              />
            </div>
          )}

          {/* No-options fallback */}
          {modalState.type === "no-options" && (
            <div
              className="text-center py-32"
              data-testid="modal-no-options"
            >
              <p className="text-white text-16 opacity-60">
                {strings.modal_no_access_options ||
                  "No purchase options are currently available for this content."}
              </p>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
