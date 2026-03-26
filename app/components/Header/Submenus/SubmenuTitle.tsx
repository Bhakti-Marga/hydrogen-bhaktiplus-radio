import { useHeaderSubmenu } from "~/contexts/HeaderSubmenuProvider";
import { Link } from "~/components/Link/Link";
import { SubmenuViewAllLink } from "./SubmenuViewAllLink";

interface SubmenuTitleProps {
  children: string;
  viewAllLink?: string;
}

export function SubmenuTitle({ children, viewAllLink }: SubmenuTitleProps) {
  const { setActiveSubmenu } = useHeaderSubmenu();

  /**
   * Close the megamenu immediately when the "View All" link is clicked.
   * Ensures immediate visual feedback rather than waiting for navigation to complete.
   */
  const handleClick = () => {
    setActiveSubmenu(null);
  };

  if (viewAllLink) {
    return (
      <Link to={viewAllLink} className="block" onClick={handleClick}>
        <div className="animated-link-text-trigger flex items-center">
          <h2 className="submenu__title text-lg font-600">
            {children}
          </h2>
          <SubmenuViewAllLink />
        </div>
      </Link>
    );
  }

  return (
    <h2 className="submenu__title text-lg font-600">
      {children}
    </h2>
  );
}
