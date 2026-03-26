import { Link } from "./Link";
import { IconChevron } from "./Icons";
import { useTranslations } from "~/contexts/TranslationsProvider";

export interface SectionHeaderProps {
  title: string;
  exploreAllLink?: string;
  className?: string;
}

export function SectionHeader({
  title,
  exploreAllLink,
  className = "",
}: SectionHeaderProps) {
  const { strings } = useTranslations();

  return (
    <div className={`animated-link-text-trigger flex items-center ${className}`}>
      <h2 className="text-white h2-md font-400 font-figtree">{title}</h2>
      {exploreAllLink && (
        <Link to={exploreAllLink} className="animated-link text-gold-light body-b1 transition-opacity duration-300 ml-8 flex items-center">
          <div className="animated-link__text body-b3 ml-8">
            {strings.explore_all || "Explore All"}
          </div>
          <div className="animated-link__icon block w-12 -pb-1 -rotate-90 opacity-0 transition-opacity duration-300">
            <IconChevron />
          </div>
        </Link>
      )}
    </div>
  );
}
