import { useLocation } from "react-router";
import { Link } from "~/components/Link/Link";
import { IconChevron } from "~/components/Icons";
import { useTranslations } from "~/contexts/TranslationsProvider";

/**
 * PromoBanner - A static promotional banner displayed at the top of the page.
 *
 * Last configured for Holi Pilgrimage 2026 promotion.
 * To update the banner, modify the link and translation key below.
 */
export function PromoBanner() {
  const { pathname } = useLocation();
  const { strings } = useTranslations();

  // Static configuration - update these values to change the banner
  const PROMO_LINK = "/pilgrimages/holi-2026";
  const PROMO_TEXT = strings.promo_banner_holi_2026;

  // Hide banner on the destination page itself
  if (pathname.endsWith("/pilgrimages/holi-2026")) {
    return null;
  }

  return (<></>);

  // return (
  //   <div className="relative z-20 bg-purple-dark w-full h-[44px] flex items-center justify-center">
  //     <Link
  //       to={PROMO_LINK}
  //       className="flex items-center justify-center gap-2 px-4 text-white text-sm font-medium hover:opacity-90 transition-opacity"
  //     >
  //       <span>{PROMO_TEXT}</span>
  //       <div className="w-16 -rotate-90">
  //         <IconChevron />
  //       </div>
  //     </Link>
  //   </div>
  // );
}
