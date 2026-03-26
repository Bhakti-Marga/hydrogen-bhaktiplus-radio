import { ModalPortal } from "~/components/Portal";
import { Button } from "~/components/Button/Button";
import { usePrelaunch } from "~/contexts/PrelaunchProvider";
import { useTranslations } from "~/contexts/TranslationsProvider";

interface ComingSoonModalProps {
  onClose: () => void;
  contentType?: string;
}

/**
 * Modal shown during prelaunch when users try to access non-Lives content
 */
export function ComingSoonModal({ onClose, contentType }: ComingSoonModalProps) {
  const { prelaunchEndDateFormatted } = usePrelaunch();
  const { strings } = useTranslations();

  const contentTypeDisplay = contentType
    ? contentType.charAt(0).toUpperCase() + contentType.slice(1) + "s"
    : "This content";

  return (
    <ModalPortal onClose={onClose} backdrop="dark">
      <div className="bg-brand-dark rounded-lg max-w-[500px] w-full p-32 relative">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-16 right-16 text-grey-light hover:text-white transition-colors text-24 leading-none p-8"
          aria-label={strings.aria_close}
        >
          ×
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-24">
          <div className="w-80 h-80 rounded-full bg-brand/20 flex items-center justify-center">
            <svg
              className="w-40 h-40 text-brand-light"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-28 font-700 text-white mb-12">{strings.modal_coming_soon_title}</h2>
          <p className="text-grey-light text-16 mb-24">
            {strings.modal_coming_soon_description.replace('{contentTypeDisplay}', contentTypeDisplay)}
            {prelaunchEndDateFormatted && (
              <> {strings.modal_coming_soon_plans_info}</>
            )}
          </p>
          <p className="text-brand-light text-14 mb-24">
            {strings.modal_coming_soon_free_content}
          </p>
          <Button variant="primary" onClick={onClose}>
            {strings.modal_coming_soon_button}
          </Button>
        </div>
      </div>
    </ModalPortal>
  );
}
