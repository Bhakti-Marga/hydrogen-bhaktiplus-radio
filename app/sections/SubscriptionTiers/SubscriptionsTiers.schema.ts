import { SubscriptionTier as SubscriptionTierName } from "~/lib/types";

export interface SubscriptionTiersSchema {
  title: string;
  description: string;
  tiers: SubscriptionTier[];
}

export interface SubscriptionTier {
  id: SubscriptionTierName;
  title: string;
  price: {
    monthly: string;
    yearly: string;
  };
  features: string[];
  checkoutUrl: string;
}
