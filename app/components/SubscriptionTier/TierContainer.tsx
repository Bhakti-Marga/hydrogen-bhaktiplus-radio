import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

interface TierContainerProps {
  highlight?: boolean;
  isCurrentPlan?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  /** @deprecated No longer used - grid handles equal height cards */
  removeMinHeight?: boolean;
  /** Optional banner to show at the top of the card */
  topBanner?: ReactNode;
}

/**
 * Gradient card container for tier cards.
 * Handles highlight variants and selection states.
 */
export function TierContainer({
  highlight = false,
  isCurrentPlan = false,
  isSelected = false,
  onClick,
  children,
  className = '',
  topBanner,
}: TierContainerProps) {
  const wrapperClasses = cn(
    'subscription-tier rounded-lg bg-gradient-to-b transition-all max-w-[284px] overflow-hidden',
    highlight
      ? 'from-[#5745FF] to-[#231F92]'
      : 'from-[#242099] to-[#0C0B33]',
    isSelected && 'ring-4 ring-brand-light',
    isCurrentPlan && 'ring-4 ring-brand',
    onClick && 'cursor-pointer hover:via-[#061566] hover:to-[#0029B0]',
    className
  );

  // Flex column to allow children to use flex-1 and mt-auto for button alignment
  const contentClasses = 'text-white px-24 py-32 flex-1 flex flex-col';

  const content = (
    <>
      {topBanner}
      <div className={contentClasses}>
        {children}
      </div>
    </>
  );

  if (onClick) {
    return (
      <div
        className={wrapperClasses}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
      >
        {content}
      </div>
    );
  }

  return <div className={wrapperClasses}>{content}</div>;
}
