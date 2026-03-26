import { Button } from "~/components/Button/Button";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { usePrelaunch } from "~/contexts/PrelaunchProvider";

interface PurchaseSeparateButtonProps {
  link: string;
  /** Price in format "EUR 225.00" or similar */
  price: string | null;
  className?: string;
  btnVariant?: "primary" | "secondary";
  /** Variant controls text format and size: hero (default) or catalog */
  variant?: "hero" | "catalog";
  /**
   * Whether this content is an ongoing series (e.g., weekly live series).
   * Uses "Join online for" instead of "Purchase separately for".
   */
  isOngoingSeries?: boolean;
  /**
   * Whether this content is PPV-only (no subscription tiers).
   * Uses "Join online for" instead of "Purchase separately for",
   * since "Purchase separately" implies an alternative subscription path.
   */
  isPpvOnly?: boolean;
}

/**
 * Convert currency code to symbol.
 * e.g., "EUR" -> "€", "USD" -> "$", "GBP" -> "£"
 */
function getCurrencySymbol(currencyCode: string): string {
  switch (currencyCode.toUpperCase()) {
    case "EUR":
      return "€";
    case "USD":
      return "$";
    case "GBP":
      return "£";
    default:
      return currencyCode;
  }
}

/**
 * Format price string from "EUR 225.00" to "€225" (symbol, no decimals)
 */
function formatPrice(priceString: string): string {
  // Expected format: "EUR 225.00" or "USD 100.00"
  const parts = priceString.trim().split(" ");
  if (parts.length !== 2) {
    return priceString; // Return as-is if unexpected format
  }

  const [currencyCode, amount] = parts;
  const symbol = getCurrencySymbol(currencyCode);

  // Parse amount and remove decimals
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) {
    return priceString; // Return as-is if parsing fails
  }

  return `${symbol}${Math.round(numericAmount)}`;
}

/**
 * Button to purchase content separately (PPV).
 * Shows price if available, or fallback text if price is not yet available.
 * During prelaunch mode, shows a disabled button with "Coming Soon" messaging.
 *
 * Variants:
 * - hero: "Purchase separately for €225" (default size)
 * - catalog: "Buy for €225" (small size)
 */
export function PurchaseSeparateButton({
  link,
  price,
  className = "",
  btnVariant = "secondary",
  variant = "hero",
  isOngoingSeries = false,
  isPpvOnly = false,
}: PurchaseSeparateButtonProps) {
  const { strings } = useTranslations();
  const { isPrelaunchActive } = usePrelaunch();

  const isCatalog = variant === "catalog";
  const buttonSize = isCatalog ? "small" : "default";
  const textSizeClass = isCatalog ? "text-14" : "";

  // During prelaunch, show disabled button with prelaunch text
  if (isPrelaunchActive) {
    return (
      <Button
        as="button"
        variant={btnVariant}
        size={buttonSize}
        className={`${className} ${textSizeClass} cursor-not-allowed opacity-60`.trim()}
        disabled
        data-testid="cta-ppv-prelaunch"
      >
        {strings.content_purchase_separately_prelaunch}
      </Button>
    );
  }

  // Format price with symbol and no decimals
  const formattedPrice = price ? formatPrice(price) : null;

  // Use "Join online" language when content is PPV-only (no subscription path)
  // or an ongoing series. "Purchase separately" implies an alternative exists.
  const useJoinLanguage = isOngoingSeries || isPpvOnly;

  // Build button text based on variant and content type
  let buttonText: string;
  if (formattedPrice) {
    if (isCatalog) {
      // Catalog variant: "Buy for €225"
      buttonText = `${strings.content_buy_for || "Buy for"} ${formattedPrice}`;
    } else if (useJoinLanguage) {
      // PPV-only or ongoing series: "Join online for €225"
      buttonText = `${
        strings.content_join_online_for || "Join online for"
      } ${formattedPrice}`;
    } else {
      // Hero variant with subscription + PPV: "Purchase separately for €225"
      buttonText = `${strings.content_purchase_separately_for} ${formattedPrice}`;
    }
  } else {
    buttonText = useJoinLanguage
      ? strings.content_join_online || "Join online"
      : strings.content_purchase_separately;
  }

  return (
    <Button
      as="link"
      href={link}
      absolute
      variant={btnVariant}
      size={buttonSize}
      className={`${className} ${textSizeClass}`.trim()}
      data-testid="cta-ppv"
    >
      {buttonText}
    </Button>
  );
}
