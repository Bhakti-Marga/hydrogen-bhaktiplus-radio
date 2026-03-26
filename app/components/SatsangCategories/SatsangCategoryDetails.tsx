import { useMemo } from "react";
import {
  Carousel,
  Container,
  SectionHeader,
  ProgressAwareHoverVideoCard,
  ProgressAwareVideoCardLink,
  GenreEyebrow,
  type Genre,
} from "~/components";
import { Content, SatsangCategory, SubscriptionTier } from "~/lib/types";
import { SatsangCategoryDetailsSkeleton } from "./SatsangCategoryDetailsSkeleton";
import { useVideoPlayer } from "~/contexts/VideoPlayerProvider";
import { useRootLoaderData } from "~/hooks";
import { isNewContent } from "~/lib/utils";

// Fisher-Yates shuffle algorithm - randomizes array order
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface SatsangCategoryDetailsProps {
  title?: string | null;
  category: SatsangCategory;
  satsangs: Content[];
  loading?: boolean;
  /** PRELAUNCH: Disable video links - show cards but prevent navigation */
  disableLinks?: boolean;
  showLock?: boolean;
}

export function SatsangCategoryDetails({
  title,
  category,
  satsangs,
  loading = false,
  disableLinks = false,
  showLock = true,
}: SatsangCategoryDetailsProps) {
  const { expandedPortalContainerId } = useVideoPlayer();
  const portalContainerId = `satsang-category-${category.id}-portal-container`;
  const hasExpandedCard = expandedPortalContainerId === portalContainerId;
  const { user, memberships, subscriptionTier } = useRootLoaderData();
  const customerId = user?.shopifyCustomerId;

  // Randomize satsang order - memoized so it doesn't re-shuffle on every render
  const shuffledSatsangs = useMemo(() => shuffleArray(satsangs), [satsangs]);

  if (loading) {
    return <SatsangCategoryDetailsSkeleton />;
  }

  return (
    <div className="satsang-category-details py-60 bg-brand">
      <div className="satsang-category-details__layout">
        <div className="satsang-category-details__header mb-[100px]">
          <Container className="text-white">
            <div className="flex flex-row flex-nowrap gap-80">
              <div className="satsang-category-details__quote flex-1">
                {category.quote && (
                  <p className="h1-sm uppercase">"{category.quote}"</p>
                )}
                {category.quote_author && (
                  <p className="satsang-category-details__quote-author body-b2 text-gold mt-16">
                    {category.quote_author}
                  </p>
                )}
              </div>
              <div className="satsang-category-details__description body-b1 flex-1">
                {category.description && <p>{category.description}</p>}
              </div>
            </div>
          </Container>
        </div>
        <div
          className="relative"
          style={{ zIndex: hasExpandedCard ? 50 : 10 }}
          id={portalContainerId}
        >
          <div className="animated-link-chevron-trigger max-w-screen overflow-hidden">
            <Container>
              <SectionHeader title={title ?? ""} />
            </Container>
            <Container bleedRight>
              <Carousel>
                {shuffledSatsangs.map((content) => (
                  <Carousel.Slide key={content.contentId}>
                    <ProgressAwareVideoCardLink
                      content={content}
                      user={user}
                      subscriptionTier={
                        subscriptionTier as SubscriptionTier | undefined
                      }
                      memberships={memberships ?? undefined}
                      contentType="satsang"
                      disableNavigation={disableLinks}
                    >
                      {({ hasAccess }) => (
                        <ProgressAwareHoverVideoCard
                          videoId={content.video?.videoId ?? ""}
                          title={content.title ?? ""}
                          thumbnailUrl={content.thumbnailUrl}
                          thumbnailUrlVariants={content.thumbnailUrlVariants}
                          duration={content.video?.durationSeconds}
                          eyebrow={
                            content.genre ? (
                              <GenreEyebrow
                                genre={content.genre as Genre}
                                contentType="Satsang"
                              />
                            ) : undefined
                          }
                          aspectRatio="landscape"
                          subscriptionTier={subscriptionTier}
                          customerId={customerId ?? undefined}
                          tags={content.tags}
                          chapters={content.video?.chapters}
                          disableClickableStyle={disableLinks}
                          locked={!hasAccess && showLock}
                          isNew={isNewContent(content)}
                        />
                      )}
                    </ProgressAwareVideoCardLink>
                  </Carousel.Slide>
                ))}
              </Carousel>
            </Container>
          </div>
        </div>
      </div>
    </div>
  );
}
