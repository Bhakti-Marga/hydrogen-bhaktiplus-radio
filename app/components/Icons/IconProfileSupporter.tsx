import supporterBadge from "~/assets/images/account-supporter.svg";

interface IconProfileSupporterProps {
  className?: string;
}

export function IconProfileSupporter({
  className = "",
}: IconProfileSupporterProps) {
  return (
    <img src={supporterBadge} alt="Supporter" className={className || "h-40"} />
  );
}
