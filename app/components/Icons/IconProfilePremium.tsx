import premiumBadge from "~/assets/images/account-premium.svg";

interface IconProfilePremiumProps {
  className?: string;
}

export function IconProfilePremium({
  className = "",
}: IconProfilePremiumProps) {
  return (
    <img src={premiumBadge} alt="Premium" className={className || "h-40"} />
  );
}
