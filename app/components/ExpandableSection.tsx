import { createContext, useContext, useRef, useEffect, type ReactNode, type RefObject } from 'react';
import { IconClose } from './Icons';
import { useClickOutside } from '~/hooks';

interface ExpandableSectionContextValue {
  isExpanded: boolean;
}

const ExpandableSectionContext = createContext<ExpandableSectionContextValue | null>(null);

function useExpandableSectionContext() {
  const context = useContext(ExpandableSectionContext);
  if (!context) {
    throw new Error('ExpandableSection compound components must be used within ExpandableSection');
  }
  return context;
}

interface ExpandableSectionProps {
  isExpanded: boolean;
  onClose?: () => void;
  children: ReactNode;
}

function ExpandableSectionRoot({ isExpanded, onClose, children }: ExpandableSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(
    ref,
    () => {
      if (onClose) {
        onClose();
      }
    },
    isExpanded,
  );

  return (
    <ExpandableSectionContext.Provider value={{ isExpanded }}>
      <div ref={ref}>
        {children}
      </div>
    </ExpandableSectionContext.Provider>
  );
}

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
}

function CloseButton({ onClick, className = '' }: CloseButtonProps) {
  const { isExpanded } = useExpandableSectionContext();

  if (!isExpanded) return null;

  return (
    <button
      onClick={onClick}
      className={`absolute top-16 right-16 size-24 text-white bg-transparent border-none cursor-pointer p-2 rounded-full z-20 hover:bg-gray-700 focus:outline-none transition-transform duration-300 hover:scale-110 animate-[crossFade_700ms_ease-out_forwards] ${className}`}
      aria-label="Close expanded content"
    >
      <IconClose />
    </button>
  );
}

interface ContentProps {
  children: ReactNode;
  className?: string;
  /**
   * Optional ref to an element to scroll to when expanded.
   * When provided, scrolls this element to the top of the screen.
   * When not provided, scrolls the content into view (default behavior).
   */
  scrollToRef?: RefObject<HTMLElement | null>;
}

function Content({ children, className = '', scrollToRef }: ContentProps) {
  const { isExpanded } = useExpandableSectionContext();
  const contentRef = useRef<HTMLDivElement>(null);
  const prevExpandedRef = useRef<boolean>(false);

  useEffect(() => {
    // Only scroll when transitioning from collapsed (false) to expanded (true)
    // Skip on initial mount and when collapsing
    if (isExpanded && !prevExpandedRef.current) {
      // Small delay to allow the expansion animation to start
      setTimeout(() => {
        if (scrollToRef?.current) {
          // Scroll the provided element to the top of the screen
          scrollToRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (contentRef.current) {
          // Default behavior: scroll content into view
          contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }

    // Update the previous value
    prevExpandedRef.current = isExpanded;
  }, [isExpanded, scrollToRef]);

  return (
    <div
      ref={contentRef}
      className={`relative transition-opacity transition-height duration-700 ease-in-out ${
        isExpanded
          ? 'max-h-[1000px] opacity-100 overflow-hidden'
          : 'max-h-0 opacity-0 overflow-hidden'
      } ${className}`}
    >
      {isExpanded && (
        <div className="relative z-10 animate-[crossFade_700ms_ease-out_forwards]">
          {children}
        </div>
      )}
    </div>
  );
}

export const ExpandableSection = Object.assign(ExpandableSectionRoot, {
  CloseButton,
  Content,
});
