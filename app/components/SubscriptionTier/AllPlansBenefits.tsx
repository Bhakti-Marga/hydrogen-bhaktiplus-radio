import { useTranslations } from '~/contexts/TranslationsProvider';
import {
  IconGlobeFilled,
  IconDevices,
  IconDownload,
  IconNewContent,
  IconAirPlay,
  IconBackgroundPlay,
} from '~/components/Icons';

/**
 * "All plans include benefits of Bhakti+" column
 * Displays shared benefits across all subscription tiers
 */
export function AllPlansBenefits({ className = "" }: { className?: string }) {
  const { strings } = useTranslations();

  return (
    <div className={`bg-[#f5f6f7] flex flex-col gap-16 items-center px-12 py-24 rounded-lg w-full max-w-[284px] h-full ${className}`}>
      {/* Header - styled to match tier titles */}
      <div className="w-full">
        <h3 
          className="text-[#16254c] mb-0"
          style={{
            fontSize: '24px',
            fontWeight: 600
          }}
        >
          {strings.tier_benefits_title}
        </h3>
      </div>

      {/* Benefits Content */}
      <div className="flex flex-col gap-8 items-center justify-center w-full">
        {/* Featured Benefits (with gradient background) */}
        <FeaturedBenefit
          icon={<IconGlobeFilled className="w-24 h-24 text-[#584BF6]" />}
          text={strings.tier_benefits_live_interpretation}
        />
        <FeaturedBenefit
          icon={<IconGlobeFilled className="w-24 h-24 text-[#584BF6]" />}
          text={
            <>
              {strings.tier_benefits_ai_audio}
              <br />
              {strings.tier_benefits_ai_audio_test}
            </>
          }
        />

        {/* Benefit Cards Grid */}
        <div className="flex flex-wrap gap-8 items-center justify-center w-full">
          <BenefitCard
            icon={<IconDevices className="w-24 h-24 text-[#584BF6]" />}
            text={strings.tier_benefits_ios_android}
          />
          <BenefitCard
            icon={<IconDownload className="w-24 h-24 text-[#584BF6]" />}
            text={strings.tier_benefits_offline_viewing}
          />
          <BenefitCard
            icon={<IconNewContent className="w-24 h-24 text-[#584BF6]" />}
            text={strings.tier_benefits_new_monthly_content}
          />
          <BenefitCard
            icon={<IconAirPlay className="w-24 h-24 text-[#584BF6]" />}
            text={strings.tier_benefits_airplay_support}
          />
          <BenefitCard
            icon={<IconBackgroundPlay className="w-24 h-24 text-[#584BF6]" />}
            text={strings.tier_benefits_background_play}
          />
        </div>
      </div>
    </div>
  );
}

interface FeaturedBenefitProps {
  icon: React.ReactNode;
  text: React.ReactNode;
}

/**
 * Featured benefit with gradient background border
 */
function FeaturedBenefit({ icon, text }: FeaturedBenefitProps) {
  return (
    <div className="relative h-[70px] w-full rounded-lg border border-[#e5e7eb] bg-gradient-to-r from-[#f3f4f6] to-[#f9fafb]">
      <div className="absolute left-[14px] top-1/2 -translate-y-1/2 flex items-center justify-center w-24 h-24 -scale-y-100">
        {icon}
      </div>
      <div className="absolute left-[54px] top-1/2 -translate-y-1/2 font-bold text-[14px] leading-[20px] text-[#041236]">
        {text}
      </div>
    </div>
  );
}

interface BenefitCardProps {
  icon: React.ReactNode;
  text: string;
}

/**
 * Benefit card with centered icon and text
 */
function BenefitCard({ icon, text }: BenefitCardProps) {
  return (
    <div className="relative h-[80px] w-full rounded-lg bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="absolute left-1/2 -translate-x-1/2 top-[16px] flex items-center justify-center w-24 h-24 -scale-y-100">
        {icon}
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 top-[56px] -translate-y-1/2 font-medium text-[12px] leading-[16px] text-[#727a92] text-center whitespace-nowrap">
        {text}
      </div>
    </div>
  );
}

