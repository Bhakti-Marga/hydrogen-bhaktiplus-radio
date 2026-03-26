import { Suspense, useState, useEffect } from "react";
import { Await, Form, useLocation, useNavigate } from "react-router";
import { Link, ExternalLink } from "~/components/Link";
import { Search } from "./Search";
import { HeaderProps } from "./Header.types";
import { MEGA_MENU_PORTAL_ID } from "./Header.constants";
import { useUser } from "~/hooks";
import { SubmenuSkeleton } from "./SubmenuSkeleton";
import { Container, LanguageSelector } from "~/components";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { HeaderSubmenuProvider, useHeaderSubmenu } from "~/contexts/HeaderSubmenuProvider";
import { useHeaderVisibility } from "~/contexts/HeaderVisibilityProvider";
import { ProfileMenu } from "./ProfileMenu";
import { usePrelaunch } from "~/contexts/PrelaunchProvider";

import imageLogo from "~/assets/logo.png";
import { HeaderNav } from "./HeaderNav";
import { Z_INDEX } from "~/lib/constants";

function HeaderContent({ onSearch, nav, submenuData, contentNewStatus }: HeaderProps) {
  const { strings } = useTranslations();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(
    location.pathname.includes("/search"),
  );
  const { isLoggedIn, user, subscriptionTier } = useUser();
  const { activeSubmenu } = useHeaderSubmenu();
  const { isHeaderHidden } = useHeaderVisibility();
  const { isPrelaunchActive } = usePrelaunch();
  const hasActiveSubscription = isLoggedIn && subscriptionTier !== "unsubscribed";

  // Check if we're on the homepage (root path or region/language prefixed root)
  // New URL patterns: /us/, /fr/, /ca/fr/, etc.
  const isHomepage = location.pathname === "/" || !!location.pathname.match(/^\/[a-z]{2}(\/[a-z]{2})?(\/)?$/);

  const isVideoPage = /\/video$/.test(location.pathname);

  // In prelaunch mode, hide search for unsubscribed users
  const showSearch = hasActiveSubscription && !isPrelaunchActive;
  // Always show "Choose Plan" button for users without active subscription
  const showChoosePlan = !hasActiveSubscription;

  // Extract search query from URL
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("q") || "";

  // Auto-open search when on search page, close when leaving
  useEffect(() => {
    if (location.pathname.includes("/search")) {
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
    }
  }, [location.pathname]);

  // Handle navigation to subscription-tiers section on homepage
  useEffect(() => {
    if (location.hash === "#subscription-tiers") {
      // Small delay to ensure the page has loaded
      const timer = setTimeout(() => {
        const subscriptionTiers = document.getElementById("subscription-tiers");
        if (subscriptionTiers) {
          subscriptionTiers.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location.hash, location.pathname]);

  const handleSearchOpen = () => {
    setIsSearchOpen(true);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
  };

  const handleChoosePlanClick = (evt: React.MouseEvent<HTMLAnchorElement>) => {
    evt?.preventDefault();

    if (isHomepage) {
      // We're on homepage, scroll to the section
      const subscriptionTiers = document.getElementById("subscription-tiers");
      if (subscriptionTiers) {
        subscriptionTiers.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // We're not on homepage, navigate to homepage with hash
      // Extract region (and optional language) from current path
      // Use lookahead (?=\/|$) to ensure language code is a standalone 2-letter segment,
      // not the start of a longer word like "satsangs"
      const pathMatch = location.pathname.match(/^\/([a-z]{2})(\/[a-z]{2}(?=\/|$))?/);
      const homePath = pathMatch ? `${pathMatch[0]}/` : "/";
      navigate(`${homePath}#subscription-tiers`);
    }
  };

  return (
    <header
      className={`site-header sticky top-0 left-0 right-0 ${Z_INDEX.header} text-white py-10 h-[var(--header-height)] hidden tablet:block transition-all relative ${isHeaderHidden ? "-translate-y-full" : "translate-y-0"
        } ${
        // Background transitions: ease-out when opening, ease-in when closing (slow start, fast end)
        activeSubmenu !== null
          ? "bg-brand ease-out duration-300"
          : "bg-transparent ease-in duration-300"
        }`}
    >
      <div
        className={`absolute inset-x-0 top-0 pointer-events-none h-[var(--header-height)] transition-opacity duration-300 ${activeSubmenu !== null ? "ease-out opacity-0" : "ease-in opacity-100"
          }`}
        style={{
          background: "linear-gradient(to bottom, rgb(var(--brand-dark)) 0%, rgb(var(--brand-dark) / 0) 100%)",
        }}
      />
      <Container className="site-header__container flex items-center justify-between relative z-40">
        <div
          className={`site-header__left flex items-center  ${!isSearchOpen ? "flex-grow" : ""
            }`}
        >
          <div className="site-header__logo flex items-center mr-40">
            <Link to="/" className="text-2xl font-serif text-white ">
              <img
                src={imageLogo}
                alt="BhaktiMarga"
                className="min-w-[106px] w-[106px]"
              />
            </Link>
          </div>

          <div
            className={`site-header__nav-container ${isSearchOpen ? "!hidden" : ""
              }`}
          >
            <HeaderNav nav={nav} submenuData={submenuData} contentNewStatus={contentNewStatus} />
          </div>
        </div>

        {showSearch && (
          <div className="site-header__search mr-12">
            <Search
              onSearch={onSearch}
              onSearchOpenCallback={handleSearchOpen}
              onSearchCloseCallback={handleSearchClose}
              initialIsSearchOpen={isSearchOpen}
              initialSearchValue={searchQuery}
            />
          </div>
        )}

        <div className="site-header__right">
          <div className="flex items-center gap-12">
            {!isVideoPage && <LanguageSelector withBorder />}
            {isLoggedIn ? (
              <>
                {showChoosePlan && (
                  <Link
                    to="#subscription-tiers"
                    className="btn btn--secondary btn--sm"
                    onClick={handleChoosePlanClick}
                  >
                    {strings.nav_choose_plan}
                  </Link>
                )}
                <ProfileMenu />
              </>
            ) : (
              <>
                {!isPrelaunchActive && (
                  <a
                    href="/router?intent=login&return_to=/"
                    className="btn btn--secondary btn--sm"
                  >
                    {strings.nav_sign_in}
                  </a>
                )}
                {showChoosePlan && (
                  <Link
                    to="#subscription-tiers"
                    className="btn btn--primary btn--sm"
                    onClick={handleChoosePlanClick}
                  >
                    {strings.content_choose_plan}
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </Container>

      {/* Portal target for mega menus - positioned relative to header */}
      <div id={MEGA_MENU_PORTAL_ID} className={`absolute top-full left-0 right-0 ${Z_INDEX.headerMenu}`} />
    </header>
  );
}

export function Header(props: HeaderProps) {
  return (
    <HeaderSubmenuProvider>
      <HeaderContent {...props} />
    </HeaderSubmenuProvider>
  );
}
