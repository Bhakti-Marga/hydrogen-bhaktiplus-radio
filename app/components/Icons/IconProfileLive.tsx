import liveBadge from "~/assets/images/account-live.svg";

interface IconProfileLiveProps {
  className?: string;
}

export function IconProfileLive({ className = "" }: IconProfileLiveProps) {
  return <img src={liveBadge} alt="Live" className={className || "h-40"} />;
}
