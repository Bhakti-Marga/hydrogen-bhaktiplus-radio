import { type ReactNode, useEffect } from 'react';
import { IconClose } from '~/components/Icons';

interface HeroOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
}

/**
 * Hero overlay component that displays content in an overlay within the hero area.
 * Uses opacity transitions instead of mounting/unmounting for better performance.
 * Always rendered in the DOM with pointer-events-none when not visible.
 * Supports closing with the ESC key when visible.
 * Includes proper ARIA attributes for accessibility.
 */
export function HeroOverlay({ isVisible, onClose, children, ariaLabel = "Overlay dialog" }: HeroOverlayProps) {
  // Handle ESC key to close overlay
  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-hidden={!isVisible}
      className={`absolute inset-0 bg-brand-dark/90 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="relative w-full h-full">
        <button
          className="absolute w-16 text-white right-32 z-30 top-[calc(var(--header-height)+44px)] transition-transform duration-300 hover:scale-110"
          onClick={onClose}
          aria-label="Close overlay"
        >
          <IconClose />
        </button>
        <div className="flex items-center justify-center h-full pt-32">
          <div
            className={`mt-[var(--header-height)] transition-all duration-300 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
