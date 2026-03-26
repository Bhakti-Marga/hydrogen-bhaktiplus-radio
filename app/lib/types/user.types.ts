import { SubscriptionTier } from "./subscription.types";

export interface UserState {
  isLoggedIn: boolean;
  user: User | null;
  subscriptionTier: SubscriptionTier;
}

export interface User {
  shopifyCustomerId: string | null; // Keep as string to avoid bigint truncation
  firstName: string | null;
  lastName: string | null;
  ppv: string[] | null;
  email: string | null;
  // Region fields
  stampedRegionId: number | null;        // 1=EU, 2=ROW
  userSelectCountryCode: string | null;  // User-selected country for manual region override
  resolvedRegionId: number;              // Final region ID to use (stampedRegionId or default)
}

export interface UserActions {
  setLoggedIn: () => void;
  setLoggedOut: () => void;
  setSubscriptionTier: (subscriptionTier: SubscriptionTier) => void;
  setUser: (user: User) => void;
}

export interface UserContext {
  state: UserState;
  actions: UserActions;
}
