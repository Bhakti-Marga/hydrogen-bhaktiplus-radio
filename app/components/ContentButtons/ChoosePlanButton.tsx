import { Button } from "~/components/Button/Button";
import { useTranslations } from "~/contexts/TranslationsProvider";

interface ChoosePlanButtonProps {
  plans: string[];
  className?: string;
  onClick?: () => void;
  /** Variant controls size: hero (default) or catalog (small) */
  variant?: "hero" | "catalog";
}

/**
 * Capitalize first letter of a plan name (e.g., "premium" -> "Premium")
 */
function formatPlanName(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
}

/**
 * Button for users without a subscription to choose a plan.
 * Opens subscription modal when clicked (or scrolls to subscription tiers if configured).
 */
export function ChoosePlanButton({ 
  plans, 
  className = "", 
  onClick,
  variant = "hero",
}: ChoosePlanButtonProps) {
  const { strings } = useTranslations();

  // Get the first (lowest) required plan for display
  const displayPlan = plans.length > 0 ? formatPlanName(plans[0]) : "a plan";

  const isCatalog = variant === "catalog";
  const buttonSize = isCatalog ? "small" : "default";
  const textSizeClass = isCatalog ? "text-14" : "";

  return (
    <Button
      variant="primary"
      size={buttonSize}
      className={`${className} ${textSizeClass}`.trim()}
      onClick={onClick}
      data-testid="cta-choose-plan"
    >
      {strings.content_choose_plan}
    </Button>
  );
}
