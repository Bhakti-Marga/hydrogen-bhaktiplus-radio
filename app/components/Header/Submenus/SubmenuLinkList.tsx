import { useHeaderSubmenu } from "~/contexts/HeaderSubmenuProvider";
import { Link } from "~/components/Link/Link";

interface LinkItem {
  name: string;
  link: string;
}

interface SubmenuLinkListProps {
  links: LinkItem[];
  columns?: 1 | 2 | 3;
}

export function SubmenuLinkList({
  links,
  columns = 2
}: SubmenuLinkListProps) {
  const { setActiveSubmenu } = useHeaderSubmenu();
  const columnsClass = columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-2" : "grid-cols-3";

  /**
   * Close the megamenu immediately when a link is clicked.
   * We can't rely solely on the location.pathname useEffect in HeaderNav
   * because navigation is async and may not complete before the menu tries to render.
   */
  const handleClick = () => {
    setActiveSubmenu(null);
  };

  return (
    <ul className={`submenu__list ${columnsClass} gap-x-80 gap-y-12 grid`}>
      {links.map((link, idx) => (
        <li key={idx} className="submenu__item">
          <Link
            to={link.link}
            className="submenu__link inline-block whitespace-nowrap text-16 font-400 opacity-80 transition-color transition-opacity hover:text-gold-light hover:opacity-100"
            onClick={handleClick}
          >
            {link.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
