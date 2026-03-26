import { IconLineWithOrnaments } from '~/components/Icons/IconLineWithOrnaments';

interface MoreBhaktiEyebrowProps {
  /** The text to display above the decorative line */
  text: string;
  className?: string;
}

/**
 * Section divider with text centered above a decorative ornament line
 * that stretches full width. Used to separate content sections.
 */
export function MoreBhaktiEyebrow({ text, className = '' }: MoreBhaktiEyebrowProps) {
  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      <p className="text-20 desktop:text-24 font-bold leading-normal mb-12 text-grey-light/80">
        {text}
      </p>
      <IconLineWithOrnaments className="w-full h-auto text-gold" />
    </div>
  );
}
