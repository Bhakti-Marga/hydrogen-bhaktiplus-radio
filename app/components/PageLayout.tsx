import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import type { CartApiQueryFragment } from "storefrontapi.generated";
import { Header, Footer, Modal, AccessModal, SmartAppBanner, AvailableSoonBanner, PromoBanner } from "~/components";
import { MobileHeader } from "~/components/Header";
import { useGlobal } from "~/hooks";
import { usePrelaunch } from "~/contexts/PrelaunchProvider";
import type { HeaderNav, HeaderSubmenuData } from "~/components/Header/Header.types";
import type { ContentNewStatusResponseDto } from "~/lib/api/types";

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  header: {
    nav: HeaderNav;
    submenuData: Promise<HeaderSubmenuData | null>;
    contentNewStatus?: ContentNewStatusResponseDto | null;
  };
  children?: React.ReactNode;
  /** When true, adds bottom padding to prevent content from overlapping the fixed StagingToolbar */
  showStagingToolbarPadding?: boolean;
}

export function PageLayout({
  children = null,
  header,
  showStagingToolbarPadding = false,
}: PageLayoutProps) {
  const [searchParams] = useSearchParams();
  const { openModal, modal } = useGlobal();
  const navigate = useNavigate();
  const { isPrelaunchActive } = usePrelaunch();
  const [hasShownModal, setHasShownModal] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "no-access" && !modal?.children && !hasShownModal) {
      setHasShownModal(true);
      openModal(<AccessModal />);

      // Clean up URL after modal is opened
      setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("error");
        newSearchParams.delete("requiredPlans");
        const newUrl = newSearchParams.toString()
          ? `${window.location.pathname}?${newSearchParams.toString()}`
          : window.location.pathname;
        navigate(newUrl, { replace: true });
      }, 100);
    }
  }, [searchParams, modal?.children, hasShownModal, openModal, navigate]);

  useEffect(() => {
    if (!searchParams.get("error") && hasShownModal) {
      setHasShownModal(false);
    }
  }, [searchParams, hasShownModal]);

  return (
    <div id="page-wrapper" className="flex flex-col min-h-screen">
      <Modal />
      {isPrelaunchActive && <AvailableSoonBanner />}
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>
      {/* PRELAUNCH: Hide SmartAppBanner during prelaunch - uncomment after prelaunch */}
      {!isPrelaunchActive && <SmartAppBanner />}
      <PromoBanner />
      <MobileHeader nav={header.nav} submenuData={header.submenuData} contentNewStatus={header.contentNewStatus} />
      <Header nav={header.nav} submenuData={header.submenuData} contentNewStatus={header.contentNewStatus} />
      <main
        id="main-content"
        className={`flex-1 ${showStagingToolbarPadding ? "pb-[48px]" : ""}`}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
