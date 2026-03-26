import { Button } from "~/components/Button/Button";
import { useTranslations } from "~/contexts/TranslationsProvider";

interface UpgradePlanButtonProps {
  plans: string[];
  className?: string;
  onClick?: () => void;
  /** Variant controls size: hero (default) or catalog (small) */
  variant?: "hero" | "catalog";
}

/**
 * Button for users with a subscription to upgrade their plan.
 * Opens subscription modal when clicked.
 */
export function UpgradePlanButton({ 
  plans, 
  className = "", 
  onClick,
  variant = "hero",
}: UpgradePlanButtonProps) {
  const { strings } = useTranslations();

  const isCatalog = variant === "catalog";
  const buttonSize = isCatalog ? "small" : "default";
  const textSizeClass = isCatalog ? "text-14" : "";

  return (
    <Button
      variant="primary"
      size={buttonSize}
      className={`${className} ${textSizeClass}`.trim()}
      onClick={onClick}
      data-testid="cta-upgrade-plan"
    >
      {strings.content_upgrade_plan || "Upgrade Plan"}
    </Button>
  );
}
