import { useEffect } from "react";
import * as HeadlessUI from "@headlessui/react";
import { IconClose } from "~/components/Icons";
import { Z_INDEX } from "~/lib/constants";

interface FullscreenVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  iframeUrl: string;
  title?: string;
}

/**
 * Fullscreen video modal for playing videos in an immersive overlay.
 * Features:
 * - Dark backdrop with blur
 * - Close button in top-right corner
 * - ESC key to close
 * - Click outside to close
 * - Responsive 16:9 video player
 */
export function FullscreenVideoModal({
  isOpen,
  onClose,
  iframeUrl,
  title = "Video",
}: FullscreenVideoModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <HeadlessUI.Dialog
      open={isOpen}
      onClose={onClose}
      className={`relative ${Z_INDEX.modal}`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md"
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center p-16 tablet:p-32">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-16 right-16 tablet:top-32 tablet:right-32 z-10 w-48 h-48 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="Close video"
        >
          <IconClose className="w-24 h-24 text-white" />
        </button>

        <HeadlessUI.DialogPanel className="w-full max-w-[1400px]">
          <HeadlessUI.DialogTitle className="sr-only">
            {title}
          </HeadlessUI.DialogTitle>

          {/* Video container with 16:9 aspect ratio */}
          <div
            className="relative w-full rounded-lg overflow-hidden shadow-2xl"
            style={{ aspectRatio: "16/9" }}
          >
            <iframe
              src={iframeUrl}
              className="absolute inset-0 w-full h-full border-none"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={title}
            />
          </div>
        </HeadlessUI.DialogPanel>
      </div>
    </HeadlessUI.Dialog>
  );
}

