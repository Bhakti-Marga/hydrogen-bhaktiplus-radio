export type SubscriptionTier =
  | "unsubscribed"
  | "live"
  | "premium"
  | "supporter"; // displayed as "All-Inclusive"

const SUBSCRIPTION_TIERS: SubscriptionTier[] = ["unsubscribed", "live", "premium", "supporter"];

/** Type guard for SubscriptionTier */
export function isSubscriptionTier(value: string): value is SubscriptionTier {
  return SUBSCRIPTION_TIERS.includes(value as SubscriptionTier);
}

/** Filter string array to valid SubscriptionTiers */
export function toSubscriptionTiers(values: string[] | null | undefined): SubscriptionTier[] {
  if (!values) return [];
  return values.filter(isSubscriptionTier);
}

export interface PlanData {
  id: string;
  title: string;
  checkoutUrl: string;
  price: {
    monthly: string;
    yearly: string;
  };
  features: string[];
}

export interface PlansData {
  live: PlanData | null;
  premium: PlanData | null;
  supporter: PlanData | null;
}

