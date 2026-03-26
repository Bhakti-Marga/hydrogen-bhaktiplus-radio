import React, { useState } from "react";
import { SizeOptions } from "~/lib/types/general.types";
import { CardSkeletonList, Container, MobileSlideshow } from "~/components";
import { AllPlansBenefits, SubscriptionTierLanding, transformMembershipToTier, getCurrencySymbol } from "~/components/SubscriptionTier";
import { useTranslations } from "~/contexts/TranslationsProvider";
import type { MembershipListResponseDto } from "~/lib/api/types";

interface SubscriptionTiersProps {
  topPadding?: SizeOptions;
  bottomPadding?: SizeOptions;
  topMargin?: SizeOptions;
  bottomMargin?: SizeOptions;
  memberships?: MembershipListResponseDto;
  showToggle?: boolean;
}

export function SubscriptionTiers({ topPadding, bottomPadding, topMargin, bottomMargin, memberships, showToggle = true }: SubscriptionTiersProps) {
  const [pricePeriod, setPricePeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { strings } = useTranslations();

  if (!memberships?.memberships?.length) {
    return (
      <Container topPadding={topPadding} bottomPadding={bottomPadding} topMargin={topMargin} bottomMargin={bottomMargin}>
        <CardSkeletonList count={4} />
      </Container>
    );
  }

  // Transform memberships to tier format, maintaining order from API
  // API returns them in order: live, core, premium, supporter
  const tiersArray = memberships.memberships.map(transformMembershipToTier);
  const currencySymbol = getCurrencySymbol(memberships.currencyCode);

  return (
    <section
      id="subscription-tiers"
      className="subscription-tiers py-16 px-4 tablet:px-8 desktop:px-16 bg-brand-dark"
    >
      <Container topPadding={topPadding} bottomPadding={bottomPadding} topMargin={topMargin} bottomMargin={bottomMargin}>
        <div className="subscription-tiers__header flex text-white flex-col items-center gap-2 mb-32">
          <h2 className="subscription-tiers__title h2-md">
            {strings.subscription_tiers_title}
          </h2>
          
          {/* Monthly/Yearly Toggle Switcher */}
          <div className="backdrop-blur-[5.5px] bg-[#16254c] flex gap-[4px] h-[40px] items-center overflow-hidden p-[4px] rounded-[58px] w-[200px]">
            <button
              type="button"
              onClick={() => setPricePeriod('yearly')}
              className={`flex flex-col items-center justify-center px-[24px] py-[8px] shrink-0 transition-all ${
                pricePeriod === 'yearly'
                  ? 'bg-[#5644fd] rounded-[58px]'
                  : 'bg-transparent rounded-[8px]'
              }`}
            >
              <p className="text-white text-[14px] font-semibold leading-[24px] tracking-[0.28px] whitespace-nowrap">
                {strings.subscription_yearly || 'Yearly'}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setPricePeriod('monthly')}
              className={`flex flex-col items-center justify-center h-[40px] px-[24px] py-[8px] shrink-0 transition-all ${
                pricePeriod === 'monthly'
                  ? 'bg-[#5644fd] rounded-[58px]'
                  : 'bg-transparent rounded-[8px]'
              }`}
            >
              <p className="text-white text-[14px] font-semibold leading-[24px] tracking-[0.28px] whitespace-nowrap">
                {strings.subscription_monthly || 'Monthly'}
          </p>
            </button>
          </div>

          {/* Save with annual billing message - only shown when yearly is selected */}
          {pricePeriod === 'yearly' && (
            <div className="flex gap-[8px] items-center justify-center px-0 py-[4px] mt-2">
              <p className="font-medium leading-[20px] text-[#4bde80] text-[16px] text-center whitespace-nowrap tracking-[0.16px]">
                {strings.subscription_save_annual}
              </p>
            </div>
          )}
        </div>

        {/* Mobile: Slideshow (tier cards only) + Benefits below */}
        <div className="tablet:hidden">
          <MobileSlideshow gap={8}>
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
                  showToggle={showToggle}
                />
              </MobileSlideshow.Slide>
            ))}
          </MobileSlideshow>
          <div className="mt-24">
            <AllPlansBenefits className="max-w-none" />
          </div>
        </div>

        {/* Tablet+: Grid with tier cards - items-stretch for equal height, individual cards can use self-end when collapsed */}
        <div 
          className="hidden tablet:grid grid-cols-2 desktop:grid-cols-[auto_1fr_1fr_1fr] items-stretch justify-items-center desktop:justify-items-start mx-auto"
          style={{ 
            width: 'fit-content',
            gap: '8px'
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
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default SubscriptionTiers;
