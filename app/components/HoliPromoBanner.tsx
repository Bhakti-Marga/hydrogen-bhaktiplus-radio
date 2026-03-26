import { useTranslations } from "~/contexts/TranslationsProvider";

/**
 * "Thank you" banner for Premium Yearly subscribers who have access to the
 * Holi 2026 pilgrimage. Shown in place of ExclusiveContentTooltip on the
 * holi-2026 page for these users.
 *
 * The caller (SeriesHeroContent) is responsible for the access + tier check;
 * this component simply renders the banner.
 */
export function HoliPromoBanner() {
  const { strings } = useTranslations();

  return (
    <div className="relative flex items-start gap-16 rounded-xl bg-brand-light/60 p-24 border border-white/20">
      {/* Heart shine icon - hidden on mobile */}
      <div className="hidden tablet:block shrink-0 w-[42px] h-[42px]">
        <IconHeartShine />
      </div>

      {/* Text content */}
      <div className="flex flex-col gap-8 text-white">
        <p className="text-16 leading-[24px]">
          <span className="font-400">{strings.promo_holi_header_prefix_member} </span>
          <span className="font-700">{strings.promo_holi_header_plan}</span>
        </p>
        <p className="text-14 leading-[20px] text-white/60">
          {strings.promo_holi_description_member}
        </p>
      </div>
    </div>
  );
}

/** Heart-shine icon used only for the Holi promo banner. */
function IconHeartShine() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 42 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.9998 1.93774C21.7343 1.93774 22.3297 2.53317 22.3297 3.26767V6.81415C22.3297 7.54865 21.7343 8.14408 20.9998 8.14408C20.2653 8.14408 19.6699 7.54865 19.6699 6.81415V3.26767C19.6699 2.53317 20.2653 1.93774 20.9998 1.93774ZM9.41998 9.42022C9.93935 8.90085 10.7814 8.90085 11.3008 9.42022L11.9095 10.0289C12.4288 10.5483 12.4288 11.3903 11.9095 11.9097C11.3901 12.4291 10.548 12.4291 10.0287 11.9097L9.41998 11.301C8.90061 10.7817 8.90061 9.93959 9.41998 9.42022ZM32.5796 9.42022C33.099 9.93959 33.099 10.7817 32.5796 11.301L31.9709 11.9097C31.4516 12.4291 30.6095 12.4291 30.0901 11.9097C29.5708 11.3903 29.5708 10.5483 30.0901 10.0289L30.6988 9.42022C31.2182 8.90085 32.0603 8.90085 32.5796 9.42022ZM1.9375 21C1.9375 20.2656 2.53293 19.6701 3.26743 19.6701H6.8139C7.5484 19.6701 8.14383 20.2656 8.14383 21C8.14383 21.7345 7.5484 22.33 6.8139 22.33H3.26743C2.53293 22.33 1.9375 21.7345 1.9375 21ZM33.8558 21C33.8558 20.2656 34.4512 19.6701 35.1857 19.6701H38.7322C39.4667 19.6701 40.0621 20.2656 40.0621 21C40.0621 21.7345 39.4667 22.33 38.7322 22.33H35.1857C34.4512 22.33 33.8558 21.7345 33.8558 21ZM11.9091 30.0908C12.4285 30.6101 12.4285 31.4522 11.9091 31.9716L11.3008 32.5799C10.7814 33.0992 9.93935 33.0992 9.41998 32.5799C8.90061 32.0605 8.90061 31.2184 9.41998 30.6991L10.0283 30.0908C10.5477 29.5714 11.3897 29.5714 11.9091 30.0908ZM30.0905 30.0908C30.6099 29.5714 31.452 29.5714 31.9713 30.0908L32.5796 30.6991C33.099 31.2184 33.099 32.0605 32.5796 32.5799C32.0603 33.0992 31.2182 33.0992 30.6988 32.5799L30.0905 31.9716C29.5712 31.4522 29.5712 30.6101 30.0905 30.0908ZM20.9998 33.856C21.7343 33.856 22.3297 34.4515 22.3297 35.186V38.7324C22.3297 39.4669 21.7343 40.0624 20.9998 40.0624C20.2653 40.0624 19.6699 39.4669 19.6699 38.7324V35.186C19.6699 34.4515 20.2653 33.856 20.9998 33.856Z"
        fill="#897DFF"
      />
      <path
        d="M12.1338 19.3322C12.1338 23.8404 15.6975 26.2427 18.3062 28.3929C19.2267 29.1517 20.1134 29.8661 21 29.8661C21.8866 29.8661 22.7732 29.1517 23.6938 28.3929C26.3025 26.2427 29.8662 23.8404 29.8662 19.3322C29.8662 14.8241 24.9896 11.627 21 15.9611C17.0103 11.627 12.1338 14.8241 12.1338 19.3322Z"
        fill="#897DFF"
      />
    </svg>
  );
}
