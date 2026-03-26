import { cn } from '~/lib/utils';
import { useTranslations } from '~/contexts/TranslationsProvider';

interface TierPriceProps {
  price: {
    monthly: string;
    yearly?: string;
  };
  period: 'monthly' | 'yearly';
  /** Required - no default to prevent showing wrong currency */
  currencySymbol: string;
  className?: string;
  /** Apply blur to price (for supporter tier on homepage) */
  blurPrice?: boolean;
  /** Tier ID for showing strikethrough on yearly Live/Premium */
  tierId?: string;
  /** Original monthly price to show as strikethrough for yearly billing */
  originalMonthlyPrice?: string;
}

/**
 * Renders tier price display consistently.
 * Splits price into whole and decimal parts for styling.
 * For yearly Live/Premium, shows strikethrough original monthly price.
 */
export function TierPrice({
  price,
  period,
  currencySymbol,
  className = '',
  blurPrice = false,
  tierId,
  originalMonthlyPrice,
}: TierPriceProps) {
  const { strings } = useTranslations();
  
  if (!price || !price.monthly) {
    return null;
  }
  
  const displayPrice = period === 'yearly' && price.yearly ? price.yearly : price.monthly;
  const [whole, decimal = '00'] = String(displayPrice).split('.');
  
  // TEMPORARY: Hide supporter price - REMOVE THIS BLOCK TO SHOW REAL PRICE
  // START TEMPORARY SUPPORTER PRICE OVERRIDE
  const displayWhole = blurPrice ? 'xxx' : whole;
  // END TEMPORARY SUPPORTER PRICE OVERRIDE
  
  // For yearly Live/Premium, show strikethrough original monthly price and "/ month"
  const showYearlyStrikethrough = period === 'yearly' && (tierId === 'live' || tierId === 'premium') && originalMonthlyPrice;
  const intervalLabel = showYearlyStrikethrough ? strings.tier_interval_year : (period === 'yearly' ? strings.tier_interval_year : strings.tier_interval_month);

  return (
    <div className={cn('flex gap-[4px] items-center text-white', className)}>
      <span 
        className="text-[24px] font-semibold leading-[32px]"
        style={{
          ...(blurPrice ? { filter: 'blur(3.5px)' } : {})
        }}
      >
        {displayWhole}
      </span>
      <span 
        className="text-[12px] font-medium leading-[20px] tracking-[0.12px]"
        style={{
          color: 'rgba(255,255,255,0.7)',
          ...(blurPrice ? { filter: 'blur(5px)' } : {})
        }}
      >
        {showYearlyStrikethrough && (
          <>
            <span className="line-through">{originalMonthlyPrice}</span>
          </>
        )}
        {currencySymbol} / {intervalLabel}
      </span>
    </div>
  );
}
