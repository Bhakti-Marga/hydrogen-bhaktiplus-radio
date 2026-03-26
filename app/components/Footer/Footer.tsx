import { Container } from "../Container/Container";
import { Link } from "~/components/Link/Link";
import { getFooterLegalNav, footerMenus } from "./Footer.data";
import { LanguageSelector } from "~/components";
import { useRootLoaderData } from "~/hooks";
import { getRegionDisplayName, getStoreForCountry } from "~/lib/store-routing";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { usePrelaunch } from "~/contexts/PrelaunchProvider";

export function Footer() {
  const { countryCode, storeContext, user } = useRootLoaderData();
  const { strings } = useTranslations();
  const { isPrelaunchActive } = usePrelaunch();

  // Links with disabledDuringPrelaunch are only enabled when:
  // 1. Prelaunch is NOT active, AND
  // 2. User is logged in
  const isLoggedIn = !!user;
  // Use URL countryCode if present, otherwise fall back to storeContext (billing/geoip-based)
  const storeType = countryCode ? getStoreForCountry(countryCode) : storeContext?.storeType;
  // Get region-specific legal navigation links
  const legalNav = getFooterLegalNav(storeType);
  const storeRegionName = storeType ? getRegionDisplayName(storeType) : null;

  return (
    <footer className="site-footer bg-[#041236] text-white py-32 tablet:py-[60px] mt-sp-6">
      <Container>
        <div className="site-footer__main flex flex-col tablet:flex-row gap-32 tablet:gap-0 mb-48 tablet:mb-[100px]">
          {footerMenus.map((menu, menuIndex) => {
            // Get section title - either translated or raw text
            const sectionTitle = menu.nameKey ? strings[menu.nameKey] : menu.name;
            
            return (
              <nav
                key={menuIndex}
                className="site-footer__main-menu tablet:min-w-[300px]"
              >
                {sectionTitle && (
                  <h3 className="site-footer__main-menu-title sr-only">
                    {sectionTitle}
                  </h3>
                )}
                <ul className="site-footer__main-menu-list">
                  {menu.links.map((link, linkIndex) => {
                    // Get link name - either translated or raw text
                    const linkName = link.nameKey ? strings[link.nameKey] : link.name;
                    
                    // Compute disabled state:
                    // - Always disabled if link.disabled is true
                    // - Disabled if disabledDuringPrelaunch AND (prelaunch active OR user not logged in)
                    const isDisabled = link.disabled || 
                      (link.disabledDuringPrelaunch && (isPrelaunchActive || !isLoggedIn));
                    
                    return (
                      <li key={linkIndex} className="site-footer__main-menu-item">
                        {isDisabled ? (
                          <span
                            className="site-footer__main-menu-link block mb-16 tablet:mb-24 font-avenir-next text-14 tablet:text-16 text-white/50 cursor-not-allowed"
                          >
                            {linkName}
                          </span>
                        ) : link.external ? (
                          <a
                            href={link.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="site-footer__main-menu-link block mb-16 tablet:mb-24 font-avenir-next text-14 tablet:text-16"
                          >
                            {linkName}
                          </a>
                        ) : (
                          <Link
                            to={link.link}
                            className="site-footer__main-menu-link block mb-16 tablet:mb-24 font-avenir-next text-14 tablet:text-16"
                          >
                            {linkName}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            );
          })}
        </div>

        {/* Language Row */}
        <div className="site-footer__locale flex flex-col tablet:flex-row items-start tablet:items-center gap-16 mb-32 pb-32 border-b border-white/10">
          {storeRegionName && (
            <span className="text-white/60 text-14">
              Bhakti Marga {storeRegionName}
            </span>
          )}
          <LanguageSelector menuPosition="above" />
        </div>

        <div className="site-footer__bottom flex flex-col tablet:flex-row items-center justify-between gap-16">
          <div className="site-footer__bottom-left hidden tablet:block"></div>
          <div className="site-footer__bottom-center">
            <nav className="site-footer__legal-nav">
              <ul className="site-footer__legal-nav-list flex flex-col tablet:flex-row items-center gap-8 tablet:gap-0">
                {legalNav.map((link, index) => {
                  const linkName = link.nameKey ? strings[link.nameKey] : link.name;
                  return (
                    <li key={index} className="site-footer__legal-nav-item">
                      <Link
                        to={link.link}
                        className="site-footer__legal-nav-link text-[#9B9B9B] tablet:mr-32 text-12"
                      >
                        {linkName}
                      </Link>
                    </li>
                  );
                })}
                <li key="copyright" className="site-footer__legal-nav-item">
                  <p className="site-footer__legal-nav-link text-[#9B9B9B] text-12">
                    &copy; {new Date().getFullYear()} All Rights Reserved
                  </p>
                </li>
              </ul>
            </nav>
          </div>
          <div className="site-footer__bottom-right hidden tablet:block">&nbsp;</div>
        </div>
      </Container>
    </footer>
  );
}
