import { ReactNode } from "react";
import { Button, Stack, Container, Cover } from "~/components";
import { HeroTitle } from "~/sections";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { MOBILE_APP } from "~/lib/constants";
import unsubscribedHeroBg from "~/assets/images/unsubscribed-hero-bg.png";

/**
 * Detects if the user is on iOS
 */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Opens the appropriate app store based on the device
 */
function openAppStore() {
  const storeUrl = isIOS() ? MOBILE_APP.APP_STORE_URL : MOBILE_APP.PLAY_STORE_URL;
  window.location.href = storeUrl;
}

/**
 * MobileWall - A full-page wall shown on mobile devices that prompts users
 * to open the mobile app instead of viewing content on the mobile web.
 *
 * Uses the same hero background as UnsubscribedHomepage.
 * Uses CSS media queries to show/hide - no JS hydration delay.
 */
function MobileWallContent() {
  const { strings } = useTranslations();

  return (
    <div className="mobile-wall min-h-[calc(100vh-var(--header-height))] bg-brand relative">
      {/* Background image */}
      <img
        src={unsubscribedHeroBg}
        alt=""
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Content overlay */}
      <div className="relative h-full flex flex-col">
        <Cover minHeight="calc(100vh - var(--header-height))" padding="0">
          <Cover.Center>
            <Container>
              <Stack gap={4} className="text-center items-center">
                <div className="max-w-[300px]">
                  <HeroTitle dangerouslySetInnerHTML={{ __html: strings.homepage_unsubscribed_hero_title }} />
                </div>

                <Button
                  as="button"
                  variant="primary"
                  size="large"
                  onClick={openAppStore}
                >
                  {strings.mobile_button_open_app}
                </Button>
              </Stack>
            </Container>
          </Cover.Center>
        </Cover>
      </div>
    </div>
  );
}

/**
 * MobileWall wrapper component that renders EITHER the wall (on mobile)
 * OR the children (on tablet+). Uses CSS to control which is visible,
 * avoiding hydration issues.
 *
 * Both are in the DOM but only one is visible at a time via CSS media queries.
 */
export function MobileWall({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Mobile: Show wall, hide content */}
      <div className="block tablet:hidden">
        <MobileWallContent />
      </div>

      {/* Tablet+: Hide wall, show content */}
      <div className="hidden tablet:block">
        {children}
      </div>
    </>
  );
}
