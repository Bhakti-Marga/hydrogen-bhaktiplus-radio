import { useEffect, useRef, useMemo } from "react";
import { NavLink, Form } from "react-router";
import { IconClose, IconBhakti } from "~/components/Icons";
import { useUser } from "~/hooks";
import { useCountryCode } from "~/hooks/useCountryCode";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { usePrelaunch } from "~/contexts/PrelaunchProvider";
import { HeaderNav } from "./Header.types";
import { NAV_LINK_LABELS } from "./Header.constants";
import { cn } from "~/lib/utils/css";
import { MOBILE_APP } from "~/lib/constants";

// Nav link IDs that require an active subscription
const SUBSCRIPTION_REQUIRED_LINKS = ["lives", "satsangs", "commentaries", "pilgrimages", "talks"];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  nav: HeaderNav;
}

export function MobileNav({ isOpen, onClose, nav }: MobileNavProps) {
  const { buildUrl } = useCountryCode();
  const { strings } = useTranslations();
  const { isLoggedIn, user, subscriptionTier } = useUser();
  const { isPrelaunchActive } = usePrelaunch();
  const hasActiveSubscription = isLoggedIn && subscriptionTier !== "unsubscribed";
  const navRef = useRef<HTMLDivElement>(null);

  // Filter nav links based on subscription status
  const filteredLinks = useMemo(() => {
    if (hasActiveSubscription) {
      return nav.links;
    }
    // Hide subscription-required links for unsubscribed users
    return nav.links.filter(link => !SUBSCRIPTION_REQUIRED_LINKS.includes(link.id));
  }, [nav.links, hasActiveSubscription]);

  // Lock body scroll when nav is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Focus trap - focus first element when opened
  useEffect(() => {
    if (isOpen && navRef.current) {
      const closeButton = navRef.current.querySelector("button");
      closeButton?.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 tablet:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Navigation Drawer */}
      <nav
        ref={navRef}
        id="mobile-nav"
        className={cn(
          "fixed top-0 right-0 bottom-0 w-[85%] max-w-[320px] bg-brand-dark z-50 tablet:hidden",
          "transform transition-transform duration-300 ease-out",
          "flex flex-col",
          "shadow-2xl",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label={strings.aria_mobile_navigation}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-56 px-16 border-b border-grey-dark/50 flex-shrink-0">
          <IconBhakti className="w-80 h-auto" />
          <button
            type="button"
            onClick={onClose}
            className="p-8 -mr-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-gold transition-colors"
            aria-label={strings.aria_close_nav_menu}
          >
            <IconClose className="w-16 h-16" />
          </button>
        </div>

        {/* Navigation Links - use deep links to open in app */}
        <div className="flex-1 overflow-y-auto py-24">
          <ul className="space-y-4">
            {filteredLinks.map((link) => {
              const deepLink = MOBILE_APP.DEEP_LINKS[link.link];
              // Use deep link if available, otherwise fall back to web link
              const href = deepLink || buildUrl(link.link);
              return (
                <li key={link.name}>
                  <a
                    href={href}
                    onClick={onClose}
                    className="block px-24 py-12 text-18 font-500 transition-colors text-white hover:text-gold hover:bg-white/5"
                  >
                    {link.name === "Livestreams" && (
                      <span className="inline-block w-[6px] h-[6px] bg-red rounded-full mr-8 align-middle" />
                    )}
                    {NAV_LINK_LABELS[link.name] ? strings[NAV_LINK_LABELS[link.name]] : link.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Section - Auth & Region */}
        <div className="flex-shrink-0 border-t border-grey-dark/50 p-16 space-y-12">
          {/* Auth Buttons */}
          {isLoggedIn ? (
            <div className="space-y-8">
              {user?.email && (
                <p className="text-14 text-grey-light truncate px-8">{user.email}</p>
              )}
              <NavLink
                to={buildUrl("/my")}
                onClick={onClose}
                className="block w-full py-12 px-16 text-center text-14 font-600 text-white bg-grey-dark/50 rounded-lg hover:bg-grey-dark transition-colors"
              >
                {strings.account_nav_my_bhakti_plus}
              </NavLink>
              {!hasActiveSubscription && (
                <div
                  className="block w-full py-12 px-16 text-center text-14 font-600 text-brand bg-gold rounded-lg opacity-70 pointer-events-none cursor-not-allowed"
                >
                  {strings.coming_soon}
                </div>
              )}
              <Form method="post" action={buildUrl("/account/logout")}>
                <button
                  type="submit"
                  className="w-full py-12 px-16 text-center text-14 font-600 text-grey-light hover:text-white transition-colors"
                >
                  {strings.nav_logout}
                </button>
              </Form>
            </div>
          ) : (
            <div className="space-y-8">
              {isPrelaunchActive ? (
                <div
                  className="block w-full py-12 px-16 text-center text-14 font-600 text-brand bg-gold rounded-lg opacity-70 pointer-events-none cursor-not-allowed"
                >
                  {strings.coming_soon}
                </div>
              ) : (
                <a
                  href="/router?intent=login&return_to=/"
                  onClick={onClose}
                  className="block w-full py-12 px-16 text-center text-14 font-600 text-white bg-grey-dark/50 rounded-lg hover:bg-grey-dark transition-colors"
                >
                  {strings.nav_sign_in}
                </a>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

