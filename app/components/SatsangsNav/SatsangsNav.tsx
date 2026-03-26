import { SatsangsNavCategoriesDropdown, NavCategory } from "./SatsangsNavCategoriesDropdown";
import { IconChevron } from "../Icons";
import { Link } from "~/components/Link";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { useHeaderVisibility } from "~/contexts/HeaderVisibilityProvider";
import { Z_INDEX } from "~/lib/constants";

interface SatsangsNavProps {
  level: "category" | "subcategory";
  categoryId?: number;
  categoryName?: string;
  subcategoryName?: string;
  categories?: NavCategory[];
  /** When true, the nav becomes sticky and responds to header visibility */
  sticky?: boolean;
}

export function SatsangsNav({
  categories,
  level,
  categoryId,
  categoryName,
  subcategoryName,
  sticky = false,
}: SatsangsNavProps) {
  const { strings } = useTranslations();
  const { isHeaderHidden } = useHeaderVisibility();
  
  // Filter out "Other" subcategories (id is null or -1) - these shouldn't appear in dropdown
  const regularCategories = categories?.filter(
    (cat) => cat.id !== null && cat.id > 0
  );

  // Sticky positioning: when header is visible, position below it; when hidden, stick to top
  const stickyClasses = sticky
    ? `sticky transition-all duration-300 ${
        isHeaderHidden 
          ? "top-0" 
          : "top-[var(--header-height)]"
      }`
    : "";

  return (
    <div className={`satsangs-nav relative w-full ${Z_INDEX.sticky} ${stickyClasses}`}>
      <div className="satsangs-nav__layout flex justify-between items-center relative">
        <div className="satsangs-nav__layout-left flex items-center gap-24">
          <div className="satsangs-nav__layout-left-header flex items-center gap-12">
            {categoryName || subcategoryName ? (
              <Link to="/satsangs" className="body-b1">
                {strings.nav_satsangs}
              </Link>
            ) : (
              <h1 className="h1-sm">{strings.nav_satsangs}</h1>
            )}
            {categoryName ? (
              subcategoryName ? (
                <>
                  <i className="block size-[14px] -rotate-90">
                    <IconChevron />
                  </i>
                  <Link to={`/satsangs/${categoryId}`} className="body-b1">
                    {categoryName}
                  </Link>
                </>
              ) : (
                <>
                  <i className="block size-[14px] -rotate-90">
                    <IconChevron />
                  </i>
                  <h1 className="h1-sm">{categoryName}</h1>
                </>
              )
            ) : null}
            {subcategoryName && (
              <>
                <i className="block size-[14px] -rotate-90">
                  <IconChevron />
                </i>
                <h1 className="h1-sm">{subcategoryName}</h1>
              </>
            )}
          </div>
          {categories && regularCategories && regularCategories.length > 0 ? (
            <SatsangsNavCategoriesDropdown
              title={categoryName ? `All ${categoryName}` : "All Satsangs"}
              categories={categories}
              level={level}
              categoryId={categoryId}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
