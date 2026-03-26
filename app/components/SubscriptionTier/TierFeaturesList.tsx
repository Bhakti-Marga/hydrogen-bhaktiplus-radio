import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '~/lib/utils';
import { IconInfoCircle } from '~/components/Icons';
import type { TierFeature } from '~/lib/utils/subscription';

interface TierFeaturesListProps {
  features: TierFeature[];
  className?: string;
}

/**
 * Tooltip component that appears on hover
 */
function FeatureTooltip({ 
  text, 
  targetRef, 
  isVisible 
}: { 
  text: string; 
  targetRef: React.RefObject<HTMLElement | null>; 
  isVisible: boolean;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      const tooltipWidth = 220; // Approximate width
      
      // Position tooltip to the right of the icon, or left if not enough space
      let left = rect.right + 8;
      if (left + tooltipWidth > window.innerWidth) {
        left = rect.left - tooltipWidth - 8;
      }
      
      // Center vertically relative to the icon
      const top = rect.top + rect.height / 2;
      
      setPosition({ top, left });
    }
  }, [isVisible, targetRef]);

  if (!isVisible || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-brand rounded-[12px] p-16 shadow-[0px_4px_14px_0px_rgba(12,22,47,0.3)] max-w-[220px] pointer-events-none"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateY(-50%)',
      }}
    >
      <p className="text-[12px] font-normal leading-[18px] text-white/80 tracking-[0.12px]">
        {text}
      </p>
    </div>,
    document.body
  );
}

/**
 * Single feature item with optional tooltip
 */
function FeatureItem({ feature }: { feature: TierFeature }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);

  return (
    <li className="text-[14px] font-normal leading-20 tracking-wide py-16 text-white border-t border-white/10 first:border-t-0 flex items-center justify-between gap-8">
      <span>{feature.text}</span>
      {feature.tooltip && (
        <>
          <span
            ref={iconRef}
            className="flex-shrink-0 cursor-pointer text-white/60 hover:text-white transition-colors"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <IconInfoCircle className="w-16 h-16" />
          </span>
          <FeatureTooltip
            text={feature.tooltip}
            targetRef={iconRef}
            isVisible={showTooltip}
          />
        </>
      )}
    </li>
  );
}

/**
 * Renders a list of tier features consistently across all contexts.
 * Simple list without icons - matches the approved style.
 * Features should be pre-translated via getTierFeaturesWithTooltips().
 */
export function TierFeaturesList({ features, className = '' }: TierFeaturesListProps) {
  return (
    <ul className={cn('flex flex-col', className)}>
      {features.map((feature, i) => (
        <FeatureItem key={i} feature={feature} />
      ))}
    </ul>
  );
}
