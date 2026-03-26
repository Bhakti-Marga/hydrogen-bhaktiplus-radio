import { useState } from "react";
import { Link } from "react-router";
import { IconMenu } from "~/components/Icons";
import { LanguageSelector } from "~/components";
import { useLocale } from "~/hooks";
import { MobileNav } from "./MobileNav";
import { HeaderNav, HeaderSubmenuData, type HeaderProps } from "./Header.types";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { useHeaderVisibility } from "~/contexts/HeaderVisibilityProvider";

import imageLogo from "~/assets/logo.png";

interface MobileHeaderProps {
  nav: HeaderNav;
  // Submenu data is accepted but not used by MobileHeader (no mega-menu on mobile)
  submenuData?: Promise<HeaderSubmenuData | null> | null;
  // Content new status is accepted but not used by MobileHeader
  contentNewStatus?: HeaderProps["contentNewStatus"];
}

export function MobileHeader({ nav }: MobileHeaderProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { pathPrefix } = useLocale();
  const { strings } = useTranslations();
  const { isHeaderHidden } = useHeaderVisibility();

  const handleOpenNav = () => setIsNavOpen(true);
  const handleCloseNav = () => setIsNavOpen(false);

  return (
    <>
      <header
        className={`mobile-header tablet:hidden sticky top-0 left-0 right-0 z-40 mt-0 relative bg-transparent transition-transform duration-300 ${
          isHeaderHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Gradient overlay for readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgb(var(--brand-dark)) 0%, rgb(var(--brand-dark) / 0) 100%)",
          }}
        />
        <div className="flex items-center justify-between h-56 px-16 relative">
          {/* Logo */}
          <Link to={`${pathPrefix}/`} className="block">
            <img
              src={imageLogo}
              alt="Bhakti+"
              className="w-[80px] h-auto"
            />
          </Link>

          {/* Right side: Language Selector (homepage only) + Hamburger Menu */}
          <div className="flex items-center gap-8">
            <LanguageSelector />

            {/* Hamburger Menu Button */}
            <button
              type="button"
              onClick={handleOpenNav}
              className="p-8 -mr-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-gold transition-colors"
              aria-label={strings.aria_open_nav_menu}
              aria-expanded={isNavOpen}
              aria-controls="mobile-nav"
            >
              <IconMenu className="w-24 h-24" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isNavOpen}
        onClose={handleCloseNav}
        nav={nav}
      />
    </>
  );
}

