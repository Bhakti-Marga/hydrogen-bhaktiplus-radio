import type { FooterMenu, FooterMenuLink } from "./Footer.types";
import type { StoreType } from "~/lib/store-routing/config";

// EU legal links - use Shopify policies
const footerLegalNavEU: FooterMenuLink[] = [
  {
    nameKey: "footer_privacy",
    link: "/policies/privacy-policy",
  },
  {
    nameKey: "footer_terms",
    link: "/policies/terms-of-service",
  },
  {
    nameKey: "footer_imprint",
    link: "/imprint",
  },
  {
    nameKey: "footer_right_of_withdrawal",
    link: "/policies/subscription-policy",
  },
];

// International legal links - use static pages with US content
const footerLegalNavInternational: FooterMenuLink[] = [
  {
    nameKey: "footer_privacy",
    link: "/policies/privacy-policy",
  },
  {
    nameKey: "footer_terms",
    link: "/terms-of-service",
  },
  {
    nameKey: "footer_imprint",
    link: "/imprint",
  },
  {
    nameKey: "footer_right_of_withdrawal",
    link: "/policies/subscription-policy",
  },
];

/**
 * Get footer legal navigation links based on store type
 * EU: Uses Shopify policies
 * International (ROW): Uses static pages with US content
 */
export function getFooterLegalNav(storeType: StoreType | null | undefined): FooterMenuLink[] {
  return storeType === 'eu' ? footerLegalNavEU : footerLegalNavInternational;
}

// Keep for backwards compatibility
export const footerLegalNav = footerLegalNavEU;

/**
 * Footer menus - 3 columns
 * Column 1: Content links (translated using nav_ keys)
 * Column 2: Account & Support links (translated using footer_ keys)
 * Column 3: External links (not translated - brand names)
 */
export const footerMenus: FooterMenu[] = [
  {
    // Column 1: Content - uses existing nav translation keys
    // These links require user to be logged in and prelaunch to be inactive
    links: [
      { nameKey: "nav_livestreams", link: "/livestreams", disabledDuringPrelaunch: true },
      { nameKey: "nav_satsangs", link: "/satsangs", disabledDuringPrelaunch: true },
      { nameKey: "nav_virtual_pilgrimages", link: "/pilgrimages", disabledDuringPrelaunch: true },
      { nameKey: "nav_commentaries", link: "/commentaries", disabledDuringPrelaunch: true },
      { nameKey: "nav_talks", link: "/talks", disabledDuringPrelaunch: true },
    ],
  },
  {
    // Column 2: Account & Support - translated
    // These links require user to be logged in and prelaunch to be inactive
    links: [
      { nameKey: "footer_link_my_profile", link: "/my", disabledDuringPrelaunch: true },
      { nameKey: "footer_link_my_purchases", link: "/my", disabledDuringPrelaunch: true },
      { nameKey: "footer_link_help_center", link: "/support" },
    ],
  },
  {
    // Column 3: External links - not translated (brand names)
    links: [
      {
        name: "Paramahamsa Vishwananda",
        link: "https://paramahamsavishwananda.com/",
        external: true,
      },
      {
        name: "Just Love Festival",
        link: "https://justlovefestival.org/",
        external: true,
      },
      {
        name: "The Ashram - Shree Peetha Nilaya",
        link: "https://shreepeethanilaya.org/",
        external: true,
      },
    ],
  },
];
