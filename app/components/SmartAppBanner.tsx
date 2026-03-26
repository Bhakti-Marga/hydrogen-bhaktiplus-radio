import { Button } from "~/components";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { MOBILE_APP } from "~/lib/constants";
import favicon from "~/assets/favicon.svg";

/**
 * Detects if the user is on iOS
 */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Attempts to open the app, falls back to app store if not installed.
 * Uses a timeout-based detection since browsers don't fire error events
 * for failed custom URL scheme navigations.
 */
function openAppWithFallback(deepLink: string) {
  const storeUrl = isIOS() ? MOBILE_APP.APP_STORE_URL : MOBILE_APP.PLAY_STORE_URL;

  // Record the time we tried to open the app
  // const startTime = Date.now();

  // Try to open the app
  // window.location.href = deepLink;
  window.location.href = storeUrl;

  // TODO: implement deep linking after launch

  // // After a delay, check if we're still here
  // // If the app opened, this page will be backgrounded/hidden
  // setTimeout(() => {
  //   // If less than 2 seconds passed and page is still visible,
  //   // the app probably isn't installed
  //   if (Date.now() - startTime < 2000 && !document.hidden) {
  //     window.location.href = storeUrl;
  //   }
  // }, 1500);
}

/**
 * Smart App Banner - shows a suggestion to open the app on mobile devices.
 * This is a non-blocking banner that appears at the top of the page.
 */
export function SmartAppBanner() {
  const handleOpenApp = () => {
    openAppWithFallback(MOBILE_APP.DEEP_LINK_SCHEME);
  };

  const { strings } = useTranslations();

  return (
    <div className="smart-app-banner relative z-20 bg-gold w-full px-8 py-12 block tablet:hidden mb-0">
      <div className="smart-app-banner__container flex items-center">
        <div className="smart-app-banner__icon w-[32px] mr-8">
          <img src={favicon} alt="Bhakti+" className="w-full aspect-square rounded-md" />
        </div>
        <div className="smart-app-banner__content text-left flex-grow">
          <p className="smart-app-banner__title text-brand text-16 font-600 mb-2 leading-none">
            Bhakti+
          </p>
          <p className="smart-app-banner__description text-14 text-brand/70">
            {strings.mobile_button_open_app}
          </p>
        </div>
        <div className="smart-app-banner__button">
          <Button variant="blue" size="small" onClick={handleOpenApp}>
            OPEN
          </Button>
        </div>
      </div>
    </div>
  );
}
