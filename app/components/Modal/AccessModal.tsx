import { GeneralModal } from "./GeneralModal";
import { useGlobal, useSubscription } from "~/hooks";
import { useTranslations } from "~/contexts/TranslationsProvider";

export function AccessModal() {
  const { closeModal } = useGlobal();
  const { strings } = useTranslations();
  const { subscriptionTier } = useSubscription();

  // Determine the appropriate modal content based on subscription tier
  let restriction = "";
  let title = "";
  let description = "";
  let upgradeMessage = "";

  if (subscriptionTier === "live") {
    title = strings.blocked_modal_live_title;
    description = strings.blocked_modal_live_description_top;
    upgradeMessage = strings.blocked_modal_live_description_bottom;

  } else {
    // Fallback for other subscription tiers
    title = strings.blocked_modal_fallback_title;
    description = strings.blocked_modal_fallback_description;
  }

  return (
    <GeneralModal
      restriction={restriction || undefined}
      title={title}
      description={description}
      cta={{
        text: strings.modal_access_upgrade_button,
        onClick: () => {
          closeModal();
          const subscriptionTiers = document.getElementById("subscription-tiers");
          if (subscriptionTiers) {
            subscriptionTiers.scrollIntoView({ behavior: "smooth" });
          }
        },
      }}
    >
      {upgradeMessage && (
        <>
          {/* TODO-TYPOGRAPHY: Could use body-b2 class */}
          <p className="font-figtree text-16 font-400 text-brand">
            {upgradeMessage}
          </p>
        </>
      )}
    </GeneralModal>
  );
}
