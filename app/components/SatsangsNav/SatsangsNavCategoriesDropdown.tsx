import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Link } from "~/components";
import { IconChevron } from "../Icons";

// Minimal type that works with both CategoryDto and SubCategoryDto
export interface NavCategory {
  id: number | null;
  name: string | null;
}

interface SatsangsNavCategoriesDropdownProps {
  title: string;
  categories: NavCategory[];
  level: "category" | "subcategory";
  categoryId?: number;
}

export function SatsangsNavCategoriesDropdown({
  title,
  categories,
  level,
  categoryId,
}: SatsangsNavCategoriesDropdownProps) {
  return (
    <div>
      <Popover className="relative">
        {({ open }) => (
          <>
            <PopoverButton className="box-border border-solid border-[0.5px] border-white/50 rounded-full py-12 px-16 min-w-[163px] h-40 flex items-center justify-between">
              <span className="body-b3">{title}</span>
              <i
                className={`block size-[14px] relative top-[-1px] transition-transform duration-300 ${open ? "rotate-180" : ""
                  }`}
              >
                <IconChevron />
              </i>
            </PopoverButton>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <PopoverPanel
                anchor={{
                  to: "bottom start",
                  gap: 8,
                }}
                className="rounded-lg z-50 shadow-lg bg-white p-16 max-h-[400px] overflow-y-auto"
              >
                <nav>
                  <ul className="columns-3">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <Link
                          key={category.id}
                          to={
                            level === "category"
                              ? `/satsangs/${category.id}`
                              : `/satsangs/${categoryId}/subcategories/${category.id}`
                          }
                          className="block body-b4 px-8 py-12 text-black rounded-md focus:bg-grey-light hover:bg-grey-light"
                        >
                          {category.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </PopoverPanel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
}
