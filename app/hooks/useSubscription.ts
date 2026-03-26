import { useUserContext } from "~/contexts";

export function useSubscription() {
  const { state: userState } = useUserContext();
  const { subscriptionTier } = userState;

  const isUnsubscribed =
    !subscriptionTier || subscriptionTier === "unsubscribed";
  const isLive = subscriptionTier === "live";
  const isPremium = subscriptionTier === "premium";
  const isSupporter = subscriptionTier === "supporter";

  return {
    isUnsubscribed,
    subscriptionTier,
    isLive,
    isPremium,
    isSupporter,
  };
}
