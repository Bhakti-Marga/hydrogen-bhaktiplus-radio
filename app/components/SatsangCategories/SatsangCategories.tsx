import React, { useCallback, useState } from "react";
import { Content, SatsangCategory } from "~/lib/types";
import { Carousel, CategoryCard, Container, SectionHeader, ExpandableSection } from "~/components";
import { useFetcher } from "react-router";
import { SatsangCategoryDetails } from "./SatsangCategoryDetails";

interface SatsangCategoriesProps {
  categories: SatsangCategory[];
  title: string;
  aspectRatio: "square" | "portrait" | "landscape";
  expandOnClick?: boolean; // Enable expand-on-click behavior
  /** 
   * PRELAUNCH: Disable links inside expanded section - cards expand but video links are not clickable.
   * TODO: Remove this prop after prelaunch when full functionality should be enabled.
   */
  disableLinks?: boolean;
  /** When false, cards are not clickable and don't show hover effects (default: true) */
  interactive?: boolean;
  showLock?: boolean;
}

export function SatsangCategories({
  categories,
  title,
  aspectRatio,
  disableLinks = false,
  interactive = true,
  showLock = true,
}: SatsangCategoriesProps) {
  const fetcher = useFetcher<{ satsangs: Content[] }>();
  const [activeCategory, setActiveCategory] = useState<SatsangCategory | null>(
    null,
  );

  const handleCategoryClick = useCallback(
    (category: SatsangCategory) => {
      if (!category || !interactive) return;

      const categoryId = category.id;
      setActiveCategory(category);

      // Fetch satsangs for this category
      fetcher.load(`/api/bhakti/satsangs/${categoryId}`);
    },
    [fetcher, interactive],
  );

  const handleCloseExpanded = useCallback(() => {
    setActiveCategory(null);
  }, []);

  const hasActiveContent = activeCategory !== null;

  // When not interactive, hide explore link
  const showExploreLink = interactive && !disableLinks;

  return (
    <ExpandableSection isExpanded={hasActiveContent} onClose={handleCloseExpanded}>
      <div className="animated-link-chevron-trigger max-w-screen relative z-[5]">
        <Container>
          <SectionHeader title={title} exploreAllLink={showExploreLink ? "/satsangs" : undefined} />
        </Container>
        <Container bleedRight>
          <Carousel>
            {categories.map((category) => {
              return (
                <Carousel.Slide key={category.id} disableHover={!interactive}>
                  <CategoryCard
                    title={category.name ?? ""}
                    className="bg-brand"
                    image={category.thumbnailUrl}
                    imageVariants={category.thumbnailUrlVariants}
                    size="xxs"
                    onClick={interactive ? () => handleCategoryClick(category) : undefined}
                    videoCount={category.videoCount ?? 0}
                    active={category.id === activeCategory?.id}
                  />
                </Carousel.Slide>
              );
            })}
          </Carousel>
        </Container>
      </div>

      {/* Expanded content section below carousel */}
      <ExpandableSection.Content key={activeCategory?.id}>
        <ExpandableSection.CloseButton onClick={handleCloseExpanded} />
        {activeCategory && (
          <SatsangCategoryDetails
            category={activeCategory}
            title={activeCategory.name}
            satsangs={fetcher.data?.satsangs || []}
            loading={fetcher.state === "loading"}
            disableLinks={disableLinks}
            showLock={showLock}
          />
        )}
      </ExpandableSection.Content>
    </ExpandableSection>
  );
}
