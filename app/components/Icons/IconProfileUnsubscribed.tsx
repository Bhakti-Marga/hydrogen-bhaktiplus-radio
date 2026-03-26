import { IconProfileLotus } from "./IconProfileLotus";

interface IconProfileUnsubscribedProps {
  className?: string;
}

export function IconProfileUnsubscribed({ className = "" }: IconProfileUnsubscribedProps) {
  return (
    <IconProfileLotus
      className={className}
      lotusColor="white"
      bgColor="rgb(var(--brand-dark))"
    />
  );
}
