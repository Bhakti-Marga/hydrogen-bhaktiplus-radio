import { useMemo } from "react";
import { Container } from "~/components";

interface SubmenuSkeletonProps {
  id: string;
  triggerId: string;
  isActive: boolean;
  linkCount?: number;
  hasFeaturedContent?: boolean;
  hasSecondaryLinks?: boolean;
}

export function SubmenuSkeleton({
  id,
  triggerId,
  isActive,
  linkCount = 6,
  hasFeaturedContent = true,
  hasSecondaryLinks = true,
}: SubmenuSkeletonProps) {
  return (
    <div
      id={id}
      role="region"
      className={`submenu bg-white text-black rounded mt-[var(--spacing-1)]`}
      aria-hidden={!isActive}
      aria-labelledby={triggerId}
    >
      <Container>
        <div className="submenu__container flex h-[250px]">
          <div className="submenu__primary max-h-full p-40">
            <div className="submenu__title h-16 w-[140px] bg-grey-light rounded-full animate-pulse mb-16" />
            <ul className={`submenu__list columns-2`}>
              {Array.from({ length: linkCount }).map((_, idx) => (
                <li key={idx} className="submenu__item mb-16">
                  <div className="h-12 w-[120px] bg-grey-light rounded-full animate-pulse" />
                </li>
              ))}
            </ul>
          </div>
          <div className="submenu__secondary max-h-full flex-grow bg-grey-light">
            {hasFeaturedContent && (
              <div className="submenu__featured-content">
                <div className="submenu__featured-title h-16 w-[140px] bg-white rounded-full animate-pulse mb-12" />
                <ul className="submenu__featured-list max-w-[400px] overflow-hidden flex gap-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <li key={idx} className="submenu__featured-item">
                      <div className="w-[200px] h-[120px] rounded-md animate-pulse bg-brand" />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasSecondaryLinks && (
              <div className="submenu__secondary-content">
                <div className="submenu__secondary-title h-14 w-40 bg-white rounded-full animate-pulse mb-12 ml-16" />
                <ul className={`submenu__list columns-2 gap-10`}>
                  {Array.from({ length: linkCount }).map((_, idx) => (
                    <li key={idx} className="submenu__item mb-8">
                      <div className="h-22 w-24 bg-white rounded-full animate-pulse" />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
