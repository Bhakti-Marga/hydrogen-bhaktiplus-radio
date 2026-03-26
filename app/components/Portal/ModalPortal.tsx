import { createPortal } from 'react-dom';
import { cn } from '~/lib/utils';
import { Z_INDEX } from '~/lib/constants';

interface ModalPortalProps {
  children: React.ReactNode;
  onClose?: () => void;
  /**
   * Z-index layer for the modal.
   * @default 'modal'
   *
   * All layers defined in ~/lib/constants.ts (Z_INDEX).
   * - 'modal': Standard modals — above all page UI including header
   * - 'critical': Critical/confirmation modals — above standard modals
   * - 'debug': Debug/dev tools only
   */
  layer?: 'modal' | 'critical' | 'debug';
  /**
   * Background overlay opacity and blur
   * @default 'dark'
   */
  backdrop?: 'dark' | 'light' | 'none';
  /**
   * Additional className for the backdrop wrapper
   */
  className?: string;
}

const LAYER_STYLES = {
  modal: Z_INDEX.modal,
  critical: Z_INDEX.critical,
  debug: Z_INDEX.debug,
} as const;

const BACKDROP_STYLES = {
  dark: 'bg-black/80 backdrop-blur-sm',
  light: 'bg-black/40 backdrop-blur-sm',
  none: 'bg-transparent',
} as const;

/**
 * ModalPortal - Enforces consistent modal stacking contexts
 *
 * This component ensures all modals are rendered at document.body level
 * using React portals, preventing z-index stacking context conflicts.
 *
 * @example
 * ```tsx
 * <ModalPortal onClose={handleClose}>
 *   <div className="bg-white p-24 rounded-lg">
 *     Modal content
 *   </div>
 * </ModalPortal>
 * ```
 *
 * @example Critical modal
 * ```tsx
 * <ModalPortal layer="critical" backdrop="light" onClose={handleClose}>
 *   <ConfirmationDialog />
 * </ModalPortal>
 * ```
 */
export function ModalPortal({
  children,
  onClose,
  layer = 'modal',
  backdrop = 'dark',
  className = '',
}: ModalPortalProps) {
  const modalContent = (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center p-16',
        LAYER_STYLES[layer],
        BACKDROP_STYLES[backdrop],
        className,
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  // SSR-safe portal rendering
  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
