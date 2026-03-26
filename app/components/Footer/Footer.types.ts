import type { TranslationKey } from "~/lib/translations/keys";

export interface FooterMenuLink {
  /** Translation key for the link name (use this for translatable links) */
  nameKey?: TranslationKey;
  /** Raw text for the link name (use this for non-translatable links like external brand names) */
  name?: string;
  link: string;
  /** Whether this is an external link (opens in new tab) */
  external?: boolean;
  /** Whether the link is disabled (not clickable) */
  disabled?: boolean;
  /** Whether the link should be disabled only during prelaunch mode */
  disabledDuringPrelaunch?: boolean;
}

export interface FooterMenu {
  /** Translation key for the section title */
  nameKey?: TranslationKey;
  /** Raw text for the section title (for non-translatable sections) */
  name?: string;
  links: FooterMenuLink[];
}
