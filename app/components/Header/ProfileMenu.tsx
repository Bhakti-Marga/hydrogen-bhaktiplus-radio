import { useState } from "react";
import { Form } from "react-router";
import { Link } from "~/components/Link";
import { useUser, useRootLoaderData } from "~/hooks";
import {
  IconProfileLive,
  IconProfilePremium,
  IconProfileSupporter,
  IconProfileUnsubscribed,
} from "~/components/Icons";
import { getRegionDisplayName, getRoutingSourceDescription } from "~/lib/store-routing";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { useCountryCode } from "~/hooks/useCountryCode";
import { Z_INDEX } from "~/lib/constants";

const EMPTY_ARRAY: never[] = [];

export function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, subscriptionTier } = useUser();
  const { storeContext } = useRootLoaderData();
  const { strings } = useTranslations();
  const { buildUrl } = useCountryCode();

  const regionName = storeContext ? getRegionDisplayName(storeContext.storeType) : null;
  const routingDescription = storeContext ? getRoutingSourceDescription(storeContext.routingSource) : null;

  const handleMouseEnter = () => setIsOpen(true);
  const handleMouseLeave = () => setIsOpen(false);

  // Select the appropriate icon based on tier
  const ProfileIcon =
    subscriptionTier === "live"
      ? IconProfileLive
      : subscriptionTier === "premium"
        ? IconProfilePremium
        : subscriptionTier === "supporter"
          ? IconProfileSupporter
          : IconProfileUnsubscribed;

  return (
    <div
      className={`relative ml-8 ${Z_INDEX.accountMenu}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Profile Icon with Tier Badge */}
      <Link
        to={buildUrl("/my")}
        className={`relative block rounded-full hover:opacity-90 transition-opacity z-10 after:content-[''] after:right-0 after:absolute after:top-[30px] after:h-[32px] ${isOpen ? "after:w-[240px]" : "after:w-full"
          }`}
        aria-label={strings.aria_profile_menu}
      >
        <ProfileIcon className="h-40"/>
      </Link>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 top-full mt-8 w-[240px] bg-white text-brand-dark rounded-lg shadow-xl overflow-hidden transition-all duration-200 z-50 ${isOpen
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
      >
        {/* User Email Section */}
        {user?.email && (
          <div className="px-16 py-12 border-b border-gray-200">
            <p className="text-sm text-brand-dark truncate">{user.email}</p>
          </div>
        )}

        {/* Menu Items */}
        <div className="py-8">
          <Link
            to={buildUrl("/my")}
            className="block px-16 py-10 text-sm hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            {strings.account_nav_my_bhakti_plus}
          </Link>

          <Form method="post" action="/account/logout">
            <button
              type="submit"
              className="w-full text-left px-16 py-10 text-sm hover:bg-gray-50 transition-colors"
            >
              {strings.nav_logout}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
