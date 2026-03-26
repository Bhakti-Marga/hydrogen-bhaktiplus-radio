import * as HeadlessUI from "@headlessui/react";
import { useGlobal } from "~/hooks";

export const Modal = () => {
  const { modal, closeModal } = useGlobal();

  const handleClose = () => {
    modal?.props?.onClose?.();
    closeModal();
  };

  return (
    modal?.children && (
      <HeadlessUI.Dialog
        open={Boolean(modal?.children)}
        onClose={handleClose}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-brand-dark/30"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4 backdrop-blur-sm">
          <HeadlessUI.DialogPanel className="bg-grey rounded-lg max-w-2xl">
            {modal?.children}
          </HeadlessUI.DialogPanel>
        </div>
      </HeadlessUI.Dialog>
    )
  );
};
