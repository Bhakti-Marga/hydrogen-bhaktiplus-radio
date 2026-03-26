import { ModalPortal } from "~/components/Portal";
import { PurchaseSeparateButton } from "~/components/ContentButtons/PurchaseSeparateButton";
import { useTranslations } from "~/contexts/TranslationsProvider";
import type { PpvInfo } from "./resolveModalState";

interface PpvModalProps {
  /** Content title for the "Purchase separately to get access to {title}" message */
  contentTitle?: string;
  /** PPV purchase info (link + price) */
  ppv: PpvInfo;
  /** Whether this content is an ongoing series */
  isOngoingSeries?: boolean;
  onClose: () => void;
}

/**
 * Compact modal for PPV-only content.
 *
 * Shown when content has no subscription path (subscriptionTiers is empty)
 * but is available for individual purchase via PPV.
 *
 * Displays:
 * - "This content is unavailable on your plan"
 * - "Purchase separately to get access to {contentTitle}"
 * - PPV purchase button (e.g. "Join online for €396")
 */
export function PpvModal({
  contentTitle,
  ppv,
  isOngoingSeries,
  onClose,
}: PpvModalProps) {
  const { strings } = useTranslations();

  // Build the subtitle with content title
  const subtitle = contentTitle
    ? (strings.modal_ppv_purchase_description || "Purchase separately to get access to {contentTitle}").replace(
        "{contentTitle}",
        contentTitle,
      )
    : strings.modal_ppv_purchase_description_no_title ||
      "Purchase separately to get access.";

  return (
    <ModalPortal onClose={onClose} backdrop="dark">
      <div
        className="bg-brand-dark rounded-2xl max-w-[480px] w-full relative"
        data-testid="ppv-modal"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-20 right-20 text-grey-light hover:text-white transition-colors text-20 leading-none p-4 z-10"
          aria-label={strings.aria_close}
          data-testid="modal-close"
        >
          &times;
        </button>

        <div className="px-32 pt-40 pb-40">
          {/* Header */}
          <div className="text-center mb-32">
            <h2 className="text-24 font-avenir-next font-700 text-white mb-12">
              {strings.modal_ppv_unavailable_on_plan ||
                "This content is unavailable on your plan"}
            </h2>
            <p className="text-white text-16 opacity-70 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Purchase button */}
          <div
            className="flex justify-center"
            data-testid="modal-ppv-only"
          >
            <PurchaseSeparateButton
              link={ppv.link}
              price={ppv.price}
              btnVariant="primary"
              isPpvOnly
              isOngoingSeries={isOngoingSeries}
            />
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
