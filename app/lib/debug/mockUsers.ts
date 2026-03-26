import type { User, SubscriptionTier } from "~/lib/types";

export type UserTierOverride =
  | "not-logged-in"
  | "logged-in-unsubscribed"
  | "logged-in-live"
  | "logged-in-premium"
  | "logged-in-supporter"
  | "real-user";

export interface MockUserState {
  user: User | null;
  subscriptionTier: SubscriptionTier | null;
}

const MOCK_BASE_USER: User = {
  shopifyCustomerId: "12345678",
  firstName: "Debug",
  lastName: "User",
  email: "debug@test.com",
  ppv: [],
  // Region fields
  stampedRegionId: null,
  userSelectCountryCode: null,
  resolvedRegionId: 1, // Default to EU
};

export const MOCK_USER_STATES: Record<UserTierOverride, MockUserState> = {
  "not-logged-in": {
    user: null,
    subscriptionTier: null,
  },
  "logged-in-unsubscribed": {
    user: MOCK_BASE_USER,
    subscriptionTier: "unsubscribed",
  },
  "logged-in-live": {
    user: MOCK_BASE_USER,
    subscriptionTier: "live",
  },
  "logged-in-premium": {
    user: MOCK_BASE_USER,
    subscriptionTier: "premium",
  },
  "logged-in-supporter": {
    user: MOCK_BASE_USER,
    subscriptionTier: "supporter",
  },
  "real-user": {
    user: null, // Will be overridden by actual user
    subscriptionTier: null, // Will be overridden by actual tier
  },
};

export const USER_TIER_OPTIONS: Array<{ value: UserTierOverride; label: string }> = [
  { value: "real-user", label: "🔐 Real User" },
  { value: "not-logged-in", label: "🚫 Not Logged In" },
  { value: "logged-in-unsubscribed", label: "👤 Logged In - Unsubscribed" },
  { value: "logged-in-live", label: "🎥 Logged In - Live" },
  { value: "logged-in-premium", label: "💎 Logged In - Premium" },
  { value: "logged-in-supporter", label: "❤️ Logged In - Supporter" },
];
