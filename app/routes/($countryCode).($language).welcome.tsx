import type { MetaFunction } from "react-router";
import { useRouteLoaderData } from "react-router";
import { Link } from "~/components/Link/Link";
import imageLogo from "~/assets/logo.png";
import { useTranslations } from "~/contexts/TranslationsProvider";
import type { RootLoader } from "~/root";

export const meta: MetaFunction = () => {
  return [{ title: "Welcome - Bhakti+" }];
};

/**
 * Signal to root layout that this page should render without the standard layout
 * (no header, footer, mobile wall, etc.)
 */
export const handle = {
  skipLayout: true,
};

/**
 * Static welcome page that provides entry points for:
 * - Creating a new Bhakti+ account
 * - Managing an existing account
 *
 * This page does NOT use auth layer - users can always access it.
 */
export default function WelcomePage() {
  const { strings } = useTranslations();
  const rootData = useRouteLoaderData("root") as RootLoader | undefined;
  const isPrelaunchActive = rootData?.prelaunchConfig?.isActive ?? false;

  return (
    <div className="welcome-page min-h-screen bg-brand-dark flex flex-col">
      {/* Header with logo and gold accent line */}
      <header className="welcome-header py-16 px-24 relative flex items-center justify-center">
        <img
          src={imageLogo}
          alt={strings.alt_logo_bhakti_plus}
          className="h-[28px] w-auto"
        />
        {/* Subtle gold-tinted divider line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </header>

      {/* Main Content */}
      <main className="welcome-main flex-1 flex flex-col items-center justify-center px-24 pb-24">
        {/* Lotus Icon */}
        <div className="welcome-lotus mb-40">
          <WelcomeLotusIcon className="w-[72px] h-[72px]" altText={strings.alt_bhakti_plus_lotus} />
        </div>

        {/* Heading */}
        <h2 className="welcome-heading text-22 md:text-28 font-600 text-white text-center mb-48 font-figtree leading-tight max-w-[280px]">
          {strings.welcome_heading}
        </h2>

        {/* Action Buttons - larger sizing */}
        <div className="welcome-actions w-full max-w-[320px] space-y-16">
          {isPrelaunchActive ? (
            <div
              className="welcome-btn welcome-btn--primary block w-full py-16 px-32 text-center text-16 font-600 rounded-full bg-white/50 text-white/70 cursor-not-allowed opacity-60"
            >
              Coming soon
            </div>
          ) : (
            <>
              <Link
                to="/router?intent=subscribe"
                absolute
                className="welcome-btn welcome-btn--primary block w-full py-16 px-32 text-center text-16 font-600 rounded-full bg-white text-brand transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
              >
                {strings.welcome_create_account}
              </Link>
              <Link
                to="/router?intent=login&return_to=/my"
                absolute
                className="welcome-btn welcome-btn--secondary block w-full py-16 px-32 text-center text-16 font-600 rounded-full bg-white/5 text-white/90 border border-white/15 transition-all duration-200 hover:bg-white/10 hover:border-white/25"
              >
                {strings.welcome_manage_account}
              </Link>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="welcome-footer py-20 px-24">
        <nav className="welcome-footer-nav flex justify-center gap-20 mb-8">
          <a
            href="https://app.fastbots.ai/embed/cmf5fvjk60058p71lzwipms12"
            target="_blank"
            rel="noopener noreferrer"
            className="text-14 text-white/50 hover:text-white/70 transition-colors"
          >
            {strings.footer_help}
          </a>
          <a
            href="https://bhaktimarga.org/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-14 text-white/50 hover:text-white/70 transition-colors"
          >
            {strings.footer_terms}
          </a>
          <a
            href="https://bhaktimarga.org/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-14 text-white/50 hover:text-white/70 transition-colors"
          >
            {strings.footer_privacy}
          </a>
        </nav>
        <p className="text-12 text-white/35 text-center">
          {strings.footer_copyright.replace('{year}', String(new Date().getFullYear()))}
        </p>
      </footer>
    </div>
  );
}

/**
 * White lotus icon for the welcome page
 * Based on the existing IconLotus but with white fill
 */
function WelcomeLotusIcon({ className, altText }: { className?: string; altText?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{altText || 'Bhakti+ Lotus'}</title>
      <path
        d="M16.9007 9.57781C16.9007 12.5336 15.1828 15.0599 13.8691 16.5757C15.587 16.4494 18.1891 15.9441 19.907 14.2262C21.8776 12.2557 22.2312 9.12307 22.2818 7.48096C22.2818 7.2536 22.1049 7.07675 21.9028 7.10202C20.6649 7.12728 18.5681 7.35465 16.7744 8.31465C16.8502 8.71886 16.9007 9.14833 16.9007 9.57781Z"
        fill="white"
      />
      <path
        d="M11.6973 3.13597C10.5605 4.32334 8.61523 6.79913 8.61523 9.57808C8.61523 12.357 10.5858 14.8328 11.6973 16.0454C11.8489 16.197 12.1016 16.197 12.2531 16.0454C13.39 14.8581 15.3352 12.357 15.3352 9.57808C15.3352 6.79913 13.3647 4.32334 12.2531 3.11071C12.1016 2.95913 11.8489 2.95913 11.6973 3.13597Z"
        fill="white"
      />
      <path
        d="M10.0791 16.5761C8.79068 15.0856 7.04752 12.534 7.04752 9.5782C7.04752 9.12346 7.09805 8.69399 7.17384 8.28978C5.38015 7.32978 3.28331 7.12767 2.04542 7.07715C1.81805 7.07715 1.64121 7.25399 1.66647 7.4561C1.717 9.0982 2.07068 12.2308 4.04121 14.2014C5.7591 15.9445 8.33594 16.4498 10.0791 16.5761Z"
        fill="white"
      />
      <path
        d="M21.0695 15C21.0442 15.0253 21.0189 15.0505 20.9937 15.0758C18.4674 17.6274 14.5263 17.9305 12.7832 17.9305C12.3537 17.9305 11.5958 17.9305 11.1663 17.9305C9.44842 17.9305 5.50737 17.6274 2.95579 15.0758C2.93053 15.0505 2.93053 15.0253 2.90526 15.0253C1.03579 15.6821 0 16.4653 0 17.1221C0 18.5116 4.67368 20.5326 12 20.5326C19.3263 20.5326 24 18.5116 24 17.1221C24 16.4653 22.9389 15.6568 21.0695 15Z"
        fill="white"
      />
    </svg>
  );
}

