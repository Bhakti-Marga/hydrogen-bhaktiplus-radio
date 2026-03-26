import { IconChevron } from "~/components/Icons";
import { useTranslations } from "~/contexts/TranslationsProvider";

export function SubmenuViewAllLink() {
  const { strings } = useTranslations();

  return (
    <div className="animated-link text-gold-light body-b1 transition-opacity duration-300 ml-8 flex items-center">
      <div className="animated-link__text body-b3 ml-8">
        {strings.nav_view_all}
      </div>
      <div className="animated-link__icon block w-12 -pb-1 -rotate-90 opacity-0 transition-opacity duration-300">
        <IconChevron />
      </div>
    </div>
  );
}
