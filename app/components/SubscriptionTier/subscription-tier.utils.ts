import type { SubscriptionTier } from '~/lib/types';
import type { MembershipDto } from '~/lib/api/types';
import type { SubscriptionTierSchema } from '~/lib/utils/subscription';

/**
 * Transform MembershipDto from API to SubscriptionTierSchema for UI components.
 * Merges API data (pricing, checkout URLs).
 *
 * Note: features are left empty - populate via getTierFeatures() at render time
 * with access to translation strings.
 *
 * This is the SINGLE source of truth for this transformation.
 */
export function transformMembershipToTier(membership: MembershipDto): SubscriptionTierSchema {
  return {
    id: membership.id as SubscriptionTier,
    title: membership.title,
    price: {
      monthly: membership.priceMonthly.toFixed(2),
      yearly: membership.priceYearly.toFixed(2),
    },
    features: [],
    checkoutUrl: membership.shopifyCheckoutLinkMonthly,
  };
}

/**
 * Get currency symbol from currency code.
 * Throws if unknown currency to prevent showing wrong prices.
 */
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
  };

  const symbol = symbols[currencyCode];
  if (!symbol) {
    throw new Error(`Unknown currency code: ${currencyCode}. Add it to getCurrencySymbol() to display prices.`);
  }

  return symbol;
}
