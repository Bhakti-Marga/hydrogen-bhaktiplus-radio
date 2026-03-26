import {
  IconFlagBR,
  IconFlagCA,
  IconFlagCN,
  IconFlagCZ,
  IconFlagDE,
  IconFlagES,
  IconFlagFR,
  IconFlagGB,
  IconFlagGR,
  IconFlagIN,
  IconFlagIT,
  IconFlagJP,
  IconFlagPL,
  IconFlagPT,
  IconFlagRO,
  IconFlagRU,
  IconFlagUS,
} from "./flags";

type CountryCode =
  | "BR"
  | "CA"
  | "CN"
  | "CZ"
  | "DE"
  | "ES"
  | "FR"
  | "GB"
  | "GR"
  | "IN"
  | "IT"
  | "JP"
  | "PL"
  | "PT"
  | "RO"
  | "RU"
  | "US";

const FLAG_COMPONENTS: Record<CountryCode, React.ComponentType<{ className?: string }>> = {
  BR: IconFlagBR,
  CA: IconFlagCA,
  CN: IconFlagCN,
  CZ: IconFlagCZ,
  DE: IconFlagDE,
  ES: IconFlagES,
  FR: IconFlagFR,
  GB: IconFlagGB,
  GR: IconFlagGR,
  IN: IconFlagIN,
  IT: IconFlagIT,
  JP: IconFlagJP,
  PL: IconFlagPL,
  PT: IconFlagPT,
  RO: IconFlagRO,
  RU: IconFlagRU,
  US: IconFlagUS,
};

interface IconCountryProps {
  code: CountryCode;
  className?: string;
}

export function IconCountry({ code, className }: IconCountryProps) {
  const FlagComponent = FLAG_COMPONENTS[code.toUpperCase() as CountryCode];

  if (!FlagComponent) {
    return null;
  }

  return <FlagComponent className={className} />;
}

export type { CountryCode };
