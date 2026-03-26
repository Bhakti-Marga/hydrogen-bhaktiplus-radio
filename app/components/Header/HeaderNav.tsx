import {
  Suspense,
  useEffect,
  useRef,
  useState,
  startTransition,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { Await, NavLink, useLocation } from "react-router";
import { HeaderProps, HeaderSubmenuData } from "./Header.types";
import { MEGA_MENU_PORTAL_ID, NAV_LINK_LABELS } from "./Header.constants";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { useHeaderSubmenu } from "~/contexts/HeaderSubmenuProvider";
import { useLocale, useUser } from "~/hooks";
import { SubmenuSkeleton } from "./SubmenuSkeleton";
import {
  LivesSubmenu,
  SatsangsSubmenu,
  CommentariesSubmenu,
  PilgrimagesSubmenu,
  TalksSubmenu,
} from "./Submenus";
import { cn } from "~/lib/utils/css";
import { EMPTY_ARRAY } from "~/lib/constants";
import { IconNewBlurb } from "~/components/Icons";
import type { ContentNewStatusResponseDto } from "~/lib/api/types";
import { CONTENT_TYPE_IDS } from "~/lib/api/types";
import "~/styles/components/submenu.css";

// Nav link IDs that require an active subscription
const SUBSCRIPTION_REQUIRED_LINKS = [
  "lives",
  "satsangs",
  "commentaries",
  "pilgrimages",
  "talks",
];

// Map content type IDs to nav link IDs
const CONTENT_TYPE_TO_NAV_LINK: Record<number, string> = {
  [CONTENT_TYPE_IDS.SATSANG]: "satsangs",
  [CONTENT_TYPE_IDS.COMMENTARY]: "commentaries",
  [CONTENT_TYPE_IDS.PILGRIMAGE]: "pilgrimages",
  [CONTENT_TYPE_IDS.TALK]: "talks",
};

/**
 * Determine which nav link should show the NEW badge.
 * Only ONE link should show NEW - the one with the most recently published new content.
 */
function getNavLinkWithNewBadge(
  contentNewStatus: ContentNewStatusResponseDto | null,
): string | null {
  if (!contentNewStatus?.contentTypes) return null;

  // Filter to content types that have new content
  const typesWithNewContent = contentNewStatus.contentTypes.filter(
    (ct) => ct.hasNewContent && ct.latestPublishedAt,
  );

  if (typesWithNewContent.length === 0) return null;

  // Sort by latestPublishedAt descending to find the most recent
  const sorted = [...typesWithNewContent].sort((a, b) => {
    const dateA = new Date(a.latestPublishedAt!).getTime();
    const dateB = new Date(b.latestPublishedAt!).getTime();
    return dateB - dateA;
  });

  // Return the nav link ID for the most recently published content type
  const latestContentType = sorted[0];
  return CONTENT_TYPE_TO_NAV_LINK[latestContentType.contentTypeId] || null;
}

export function HeaderNav({ nav, submenuData, contentNewStatus }: HeaderProps) {
  const { strings } = useTranslations();
  const { pathPrefix } = useLocale();
  const { activeSubmenu, setActiveSubmenu } = useHeaderSubmenu();
  const { isLoggedIn, subscriptionTier } = useUser();
  const hasActiveSubscription =
    isLoggedIn && subscriptionTier !== "unsubscribed";

  // Filter nav links based on subscription status
  const filteredLinks = useMemo(() => {
    if (hasActiveSubscription) {
      return nav.links;
    }
    // Hide subscription-required links for unsubscribed users
    return nav.links.filter(
      (link) => !SUBSCRIPTION_REQUIRED_LINKS.includes(link.id),
    );
  }, [nav.links, hasActiveSubscription]);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const location = useLocation();
  const ignoreNextHoverRef = useRef(false);
  const prevActiveSubmenuRef = useRef<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const overlayCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track resolved submenu data for NEW badges on nav links
  const [resolvedSubmenuData, setResolvedSubmenuData] =
    useState<HeaderSubmenuData | null>(null);

  // Resolve submenu data promise when it changes
  useEffect(() => {
    if (!submenuData) {
      setResolvedSubmenuData(null);
      return;
    }

    submenuData.then((data) => {
      setResolvedSubmenuData(data);
    });
  }, [submenuData]);

  // Determine which nav link should show the NEW badge (only one)
  // contentNewStatus is loaded in critical path, so it's available immediately
  const navLinkWithNewBadge = useMemo(
    () => getNavLinkWithNewBadge(contentNewStatus ?? null),
    [contentNewStatus],
  );


  // Track previous active submenu for close animation
  useEffect(() => {
    if (activeSubmenu !== null) {
      prevActiveSubmenuRef.current = activeSubmenu;
    }
  }, [activeSubmenu]);

  useEffect(() => {
    // Find the portal target element on mount (client-only)
    // Use startTransition to avoid hydration mismatch issues
    // portalTarget being null means we're on server or pre-hydration
    startTransition(() => {
      setPortalTarget(document.getElementById(MEGA_MENU_PORTAL_ID));
    });
  }, []);

  const handleNavItemEnter = (idx: number) => {
    // Don't enable hover-to-open if submenuData is null (unsubscribed users)
    if (!submenuData) return;

    console.log(
      "[HeaderNav] Nav item enter:",
      idx,
      "activeSubmenu:",
      activeSubmenu,
    );

    // Prevent reopening menu if we just clicked a nav link
    if (ignoreNextHoverRef.current) {
      console.log("[HeaderNav] Ignoring hover due to recent click");
      return;
    }

    // Clear any pending hover timeout (this prevents switching if user moves across items quickly)
    if (hoverTimeoutRef.current) {
      console.log("[HeaderNav] Clearing pending timeout");
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Only skip delay if hovering the same item that's already active
    const isHoveringSameItem = activeSubmenu === idx;
    console.log("[HeaderNav] isHoveringSameItem:", isHoveringSameItem);

    if (isHoveringSameItem) {
      // No delay when hovering the already-active item
      console.log("[HeaderNav] Already on this item, no change needed");
      return;
    } else {
      // Add delay for all submenu changes (initial open or switching)
      // This prevents accidentally opening menus when moving mouse from address bar to content
      console.log("[HeaderNav] Delaying submenu change");
      hoverTimeoutRef.current = setTimeout(() => {
        console.log("[HeaderNav] Timeout fired, changing to:", idx);
        setActiveSubmenu(idx);
        hoverTimeoutRef.current = null;
      }, 150); // 150ms - must linger to open or switch
    }
  };

  const handleNavItemLeave = () => {
    console.log("[HeaderNav] Nav item leave");
    // Clear any pending timeout when mouse leaves a nav item
    if (hoverTimeoutRef.current) {
      console.log("[HeaderNav] Clearing timeout on leave");
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleNavLinkClick = () => {
    // Clear any pending hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Set flag to ignore next hover event (prevents flicker on click-hold)
    ignoreNextHoverRef.current = true;
    setActiveSubmenu(null);

    // Reset flag after a short delay
    setTimeout(() => {
      ignoreNextHoverRef.current = false;
    }, 300);
  };

  const handleClose = () => {
    console.log("[HeaderNav] Closing submenu");

    // Clear any pending hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    setActiveSubmenu(null);
  };

  const handleOverlayEnter = () => {
    console.log("[HeaderNav] Overlay hover enter");
    // Clear any pending nav item hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Add delay before closing when hovering overlay
    overlayCloseTimeoutRef.current = setTimeout(() => {
      console.log("[HeaderNav] Overlay hover timeout fired, closing");
      setActiveSubmenu(null);
      overlayCloseTimeoutRef.current = null;
    }, 150); // 150ms delay
  };

  /**
   * Render submenu content for a given link.
   * Uses the separate submenuData to look up content by link ID.
   */
  const renderSubmenuContent = (
    linkId: string,
    linkName: string,
    idx: number,
    data: HeaderSubmenuData,
  ) => {
    switch (linkId) {
      case "lives":
        return (
          <LivesSubmenu
            id={`header-submenu-${linkName}`}
            triggerId={`header-nav-link-${linkName}`}
            latestLives={data.lives?.latestLives ?? EMPTY_ARRAY}
            isActive={activeSubmenu === idx}
          />
        );
      case "satsangs":
        return (
          <SatsangsSubmenu
            id={`header-submenu-${linkName}`}
            triggerId={`header-nav-link-${linkName}`}
            categories={data.satsangs?.categories ?? EMPTY_ARRAY}
            latestReleases={data.satsangs?.latestReleases ?? EMPTY_ARRAY}
            isActive={activeSubmenu === idx}
          />
        );
      case "commentaries":
        return (
          <CommentariesSubmenu
            id={`header-submenu-${linkName}`}
            triggerId={`header-nav-link-${linkName}`}
            publicCommentaries={
              data.commentaries?.publicCommentaries ?? EMPTY_ARRAY
            }
            exclusiveCommentaries={
              data.commentaries?.exclusiveCommentaries ?? EMPTY_ARRAY
            }
            isActive={activeSubmenu === idx}
          />
        );
      case "pilgrimages":
        return (
          <PilgrimagesSubmenu
            id={`header-submenu-${linkName}`}
            triggerId={`header-nav-link-${linkName}`}
            pilgrimages={data.pilgrimages?.pilgrimages ?? EMPTY_ARRAY}
            isActive={activeSubmenu === idx}
          />
        );
      case "talks":
        return (
          <TalksSubmenu
            id={`header-submenu-${linkName}`}
            triggerId={`header-nav-link-${linkName}`}
            latestTalks={data.talks?.latestTalks ?? EMPTY_ARRAY}
            isActive={activeSubmenu === idx}
          />
        );
      default:
        return null;
    }
  };

  /**
   * Overlay fades in/out with menu. Always rendered to allow fade-out animation.
   * pointer-events-none when closed prevents blocking clicks on the page.
   * Uses ease-in when closing (slow start, fast end) for snappy feel.
   */
  const overlayContent = (
    <div
      className={`fixed top-0 left-0 w-screen h-screen backdrop-blur-lg bg-brand-dark/30 transition-opacity duration-300 ${activeSubmenu !== null
          ? "ease-out opacity-100 pointer-events-auto"
          : "ease-in opacity-0 pointer-events-none"
        }`}
      style={{ zIndex: 35 }}
      onMouseEnter={handleOverlayEnter}
    />
  );

  // Only render mega menu if submenuData is provided (subscribed users)
  const megaMenuContent = submenuData ? (
    <div
      className={`mega-menu-container bg-brand absolute top-0 left-0 right-0 overflow-hidden rounded-b-md shadow-sm transition-opacity duration-300 ${activeSubmenu !== null
          ? "opacity-100 visible"
          : "opacity-0 invisible pointer-events-none"
        }`}
      style={{ zIndex: 30 }}
    >
      <Suspense
        fallback={
          <SubmenuSkeleton
            id="header-submenu-loading"
            triggerId="header-nav-link-loading"
            isActive={activeSubmenu !== null}
          />
        }
      >
        <Await resolve={submenuData}>
          {(resolvedSubmenuData) => {
            if (!resolvedSubmenuData) return null;

            return filteredLinks.map((link, idx) => {
              const isActive = activeSubmenu === idx;
              const wasActive =
                prevActiveSubmenuRef.current === idx && activeSubmenu === null;

              /**
               * Three animation states:
               * 1. isActive: Opening/visible - wipe reveal from top to bottom over 700ms
               * 2. wasActive: Closing - wipe hide from bottom to top over 300ms (ease-in)
               * 3. Other: Hidden - instant hide, positioned absolutely
               *
               * Note: key includes animation state to force React to remount and retrigger CSS animation
               */
              return (
                <div
                  key={`${link.name}-${isActive ? "active" : wasActive ? "closing" : "hidden"
                    }`}
                  className={`${isActive
                      ? "submenu-reveal opacity-100"
                      : wasActive
                        ? "submenu-hide opacity-100"
                        : "opacity-0 absolute inset-0 pointer-events-none"
                    }`}
                >
                  {renderSubmenuContent(
                    link.id,
                    link.name,
                    idx,
                    resolvedSubmenuData,
                  )}
                </div>
              );
            });
          }}
        </Await>
      </Suspense>
    </div>
  ) : null;

  return (
    <>
      <nav className="site-header__nav relative">
        <ul className="site-header__nav-list flex">
          {filteredLinks.map((link, idx) => (
            <li
              key={link.name}
              className="site-header__nav-item"
              onMouseEnter={() => handleNavItemEnter(idx)}
              onMouseLeave={handleNavItemLeave}
            >
              <NavLink
                to={`${pathPrefix}${link.link}`}
                id={`header-nav-link-${link.name}`}
                className={({ isActive: isActiveNavLink }) => {
                  const isOpenSubmenu = activeSubmenu === idx;
                  const isFullOpacity =
                    (isActiveNavLink && activeSubmenu === null) ||
                    isOpenSubmenu;

                  return cn(
                    // Base styles
                    "site-header__nav-link",
                    "flex items-center justify-center gap-4",
                    "h-40 body-b3 px-12 font-400",
                    "hover:opacity-100 hover:text-gold-light",
                    "transition-opacity relative",
                    // Underline pseudo-element
                    "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
                    "after:h-[2px] after:w-[calc(100%-24px)]",
                    "after:transition-opacity",
                    // Conditional styles
                    isOpenSubmenu && "after:bg-gold-light text-gold-light",
                    isActiveNavLink && "after:bg-gold-light",
                    isFullOpacity ? "opacity-100" : "opacity-70",
                  );
                }}
                aria-label={link.name}
                aria-expanded={activeSubmenu === idx ? "true" : "false"}
                aria-controls={`header-submenu-${link.name}`}
                onClick={handleNavLinkClick}
                // onFocus/onBlur enable keyboard navigation (Tab key accessibility)
                onFocus={() => {
                  // Only enable focus-to-open if submenuData is available
                  if (submenuData) {
                    console.log("onFocus from navLink");
                    setActiveSubmenu(idx);
                  }
                }}
                onBlur={(e) => {
                  console.log("onBlur from navLink");
                  // Only close if focus is not moving to the submenu.
                  // IMPORTANT: Can't use e.currentTarget.parentElement?.contains() because
                  // submenu is portaled outside the nav DOM tree via createPortal.
                  // Must check the portal container directly.
                  const megaMenuPortal =
                    document.getElementById(MEGA_MENU_PORTAL_ID);
                  const isMovingToSubmenu = megaMenuPortal?.contains(
                    e.relatedTarget as Node,
                  );

                  if (!isMovingToSubmenu) {
                    setActiveSubmenu(null);
                  }
                }}
              >
                {link.name === "Livestreams" && (
                  <span className="block w-[5px] h-[5px] bg-red rounded-full"></span>
                )}
                {NAV_LINK_LABELS[link.name]
                  ? strings[NAV_LINK_LABELS[link.name]]
                  : link.name}
                {/* Show NEW badge only on the content type with most recent new content */}
                {navLinkWithNewBadge === link.id && <IconNewBlurb />}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Portal overlay to body - only render after hydration when portalTarget exists */}
      {/* Only show overlay if submenuData is available (subscribed users) */}
      {portalTarget &&
        submenuData &&
        createPortal(overlayContent, document.body)}

      {/* Portal mega menus to header level for full-width positioning */}
      {portalTarget &&
        megaMenuContent &&
        createPortal(megaMenuContent, portalTarget)}
    </>
  );
}
