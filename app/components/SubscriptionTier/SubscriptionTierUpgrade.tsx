import type { SubscriptionTier } from '~/lib/types';
import type { SubscriptionTierSchema } from '~/lib/utils/subscription';
import { getTierFeaturesWithTooltips } from '~/lib/utils/subscription';
import { cn } from '~/lib/utils';
import { TierContainer } from './TierContainer';
import { TierPrice } from './TierPrice';
import { TierFeaturesList } from './TierFeaturesList';
import { useTranslations } from '~/contexts/TranslationsProvider';
import { usePrelaunch } from '~/contexts/PrelaunchProvider';

interface SubscriptionTierUpgradeProps {
  tier: SubscriptionTierSchema;
  pricePeriod?: 'monthly' | 'yearly';
  /** Required - no default to prevent showing wrong currency */
  currencySymbol: string;
  highlight?: boolean;
  userCurrentPlan?: SubscriptionTier;
  grantsAccess?: boolean;
  blocksContent?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onCheckout?: () => void;
  buttonText?: string;
}

/**
 * Subscription tier card for upgrade/checkout flows (modals).
 * Has full user context awareness - shows current plan, grants access badges, etc.
 */
export function SubscriptionTierUpgrade({
  tier,
  pricePeriod = 'monthly',
  currencySymbol,
  highlight = false,
  userCurrentPlan,
  grantsAccess = false,
  blocksContent = true,
  isSelected = false,
  onClick,
  onCheckout,
  buttonText,
}: SubscriptionTierUpgradeProps) {
  const { strings } = useTranslations();
  const { isPrelaunchActive } = usePrelaunch();
  const isCurrentPlan = userCurrentPlan === tier.id;

  // Check if tier should be disabled (supporter only - live and premium are now enabled)
  const isTierDisabled = tier.id === 'supporter';
  
  // Check if tier should show "Coming soon" button
  // Supporter tier: always show "Coming soon" regardless of prelaunch mode
  // Live and Premium tiers: show "Coming soon" only during prelaunch mode
  const shouldShowComingSoon = tier.id === 'supporter' || (isPrelaunchActive && (tier.id === 'live' || tier.id === 'premium'));

  // Get translated features with tooltips for this tier
  const features = getTierFeaturesWithTooltips(tier.id, strings);

  const getButtonText = () => {
    if (buttonText) return buttonText;
    if (isCurrentPlan) return strings.tier_your_current_plan;
    if (grantsAccess) return strings.tier_upgrade;
    if (grantsAccess === false) return strings.tier_not_included;
    if (highlight) return strings.subscription_support_us;
    return strings.subscription_select_plan;
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCheckout && !isCurrentPlan) {
      onCheckout();
    }
  };

  return (
    <div className="relative h-full">
      {/* "Hat" badge for current plan */}
      {isCurrentPlan && (
        <div className="absolute -top-12 -left-4 -right-4 z-10">
          <div className="bg-brand text-white text-12 font-600 uppercase tracking-wide py-8 px-16 rounded-t-lg text-center">
            {strings.tier_your_current_plan}
          </div>
        </div>
      )}

      <TierContainer
        highlight={highlight}
        isCurrentPlan={isCurrentPlan}
        isSelected={isSelected}
        onClick={shouldShowComingSoon ? undefined : onClick}
        className={cn(
          'h-full flex flex-col',
          grantsAccess && !isCurrentPlan && 'ring-2 ring-brand-light/40',
          !grantsAccess && 'opacity-60'
        )}
      >
        {/* Badges */}
        <div className="flex gap-8 mb-16 min-h-[24px]">
          {grantsAccess && !isCurrentPlan && blocksContent && (
            <span className="px-8 py-4 bg-brand-light text-white text-10 font-600 rounded-full">
              {strings.tier_unlocks_content_more}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <h3 className="h1-sm font-700 mb-8 text-white">
            {tier.title}
          </h3>

          <TierPrice 
            price={tier.price} 
            period={pricePeriod} 
            currencySymbol={currencySymbol} 
            className="mb-8" 
            blurPrice={isTierDisabled}
            tierId={tier.id}
            originalMonthlyPrice={tier.price.monthly ? String(Math.round(parseFloat(tier.price.monthly) * 12)) : undefined}
          />

          {shouldShowComingSoon ? (
            <div className="flex items-center justify-center w-full mb-24">
              <div 
                className="bg-[rgba(255,255,255,0.1)] flex items-center justify-center w-full max-w-none px-[24px] py-[12px] rounded-[62px] pointer-events-none"
              >
                <p className="text-white text-[14px] font-semibold leading-[24px] opacity-70 tracking-[0.28px]">
                  {strings.coming_soon}
                </p>
              </div>
            </div>
          ) : isCurrentPlan ? (
            <div className="w-full px-24 py-12 rounded-md font-600 text-16 mb-24 bg-brand/30 text-grey-light text-center border border-brand/50">
              {getButtonText()}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleButtonClick}
              className={cn(
                'w-full px-24 py-12 rounded-md font-600 text-16 mb-24 transition-colors',
                grantsAccess
                  ? 'bg-white text-brand hover:bg-white/80'
                  : 'bg-brand/60 text-white/80 hover:bg-brand/80'
              )}
            >
              {getButtonText()}
            </button>
          )}

          <div style={isTierDisabled ? { filter: 'blur(12px)' } : undefined}>
            <TierFeaturesList features={features} />
          </div>
        </div>
      </TierContainer>
    </div>
  );
}
