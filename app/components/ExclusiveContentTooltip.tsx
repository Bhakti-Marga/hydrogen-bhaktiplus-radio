import { IconInfo } from "~/components/Icons/IconInfo";
import { Tooltip } from "~/components/Tooltip";
import { Content } from "~/lib/types";
import {
  isPPVContent,
  getSubscriptionTiersFromContent,
} from "~/lib/utils/content";
import { useTranslations } from "~/contexts/TranslationsProvider";

interface ExclusiveContentTooltipProps {
  content: Content;
  hasAccess: boolean;
}

export function ExclusiveContentTooltip({
  content,
  hasAccess,
}: ExclusiveContentTooltipProps) {
  const { strings } = useTranslations();
  const isContentPPV = isPPVContent(content);
  // Filter out legacy "core" tier since it's been deprecated
  const subscriptionTiers = getSubscriptionTiersFromContent(content).filter(
    (tier) => tier.toLowerCase() !== "core",
  );
  const hasSubscriptionTiers =
    subscriptionTiers && subscriptionTiers.length > 0;

  // Don't render if content has neither PPV nor subscription tiers
  if (!isContentPPV && !hasSubscriptionTiers) {
    return null;
  }

  // Build the text and description based on the content's access model
  let headerText = "";
  let descriptionText = "";

  if (hasSubscriptionTiers) {
    // If content has subscription tiers, always show plan info (ignore PPV)
    const formattedTiers = formatTierNames(subscriptionTiers, strings);
    headerText = strings.exclusive_content_plans_only.replace(
      "{{PLANS}}",
      formattedTiers,
    );
    if (formattedTiers === "") {
      headerText = "";
    }

    // Show different description based on user's access
    descriptionText = hasAccess
      ? strings.exclusive_content_tooltip_plan_details
      : strings.exclusive_content_tooltip_plan_details_no_access;
  } else if (isContentPPV) {
    // PPV only (no subscription tiers)
    headerText = strings.exclusive_content_ppv_only;
    descriptionText = strings.exclusive_content_tooltip_ppv_details;
  }

  return (
    <Tooltip header={headerText} description={descriptionText}>
      <div className="flex items-center gap-8 text-white body-b4">
        <IconInfo className="w-16 h-16 tooltip-trigger flex-shrink-0" />
        <span className="tooltip-trigger">{headerText}</span>
      </div>
    </Tooltip>
  );
}

/**
 * Formats tier names into a readable string
 * Example: ["premium", "live"] -> "Premium & Live"
 * Note: Plan names are NOT translated as they are product identifiers
 * Only includes premium and live tiers (supporter is filtered out)
 */
function formatTierNames(
  tiers: string[],
  strings: Record<string, string>,
): string {
  // Plan names are product identifiers and should not be translated
  // Only include premium and live tiers
  const tierNameMap: Record<string, string> = {
    premium: "Premium",
    live: "Live",
  };

  const formattedTiers = tiers
    .map((tier) => tier.toLowerCase())
    .filter(
      (tier) =>
        tier === "premium" ||
        tier === "live" ||
        tier === "Premium" ||
        tier === "Live",
    )
    .map((tier) => tierNameMap[tier]);

  if (formattedTiers.length === 0) return "";
  if (formattedTiers.length === 1) return formattedTiers[0];
  if (formattedTiers.length === 2) {
    // Two items: "Core & Premium"
    const conjunction = strings.tier_conjunction_and;
    return formattedTiers.join(` ${conjunction} `);
  }

  // Three or more items: "Core, Premium & Supporter"
  const conjunction = strings.tier_conjunction_and;
  const allButLast = formattedTiers.slice(0, -1).join(", ");
  const last = formattedTiers[formattedTiers.length - 1];
  return `${allButLast} ${conjunction} ${last}`;
}
