import { Suspense } from "react";
import { Await } from "react-router";
import {
  Container,
  Carousel,
  SectionHeader,
  CarouselLoading,
  ProgressAwareVideoCardLink,
  ProgressAwareHoverVideoCard,
} from "~/components";
import { Content, SubscriptionTier } from "~/lib/types";
import { useRootLoaderData } from "~/hooks";
import { useVideoPlayer } from "~/contexts/VideoPlayerProvider";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { isNewContent } from "~/lib/utils";

interface LivesArchiveProps {
  lives: Content[] | Promise<Content[]>;
  title: string;
  subscriptionTier?: string;
  customerId?: string | number | null;
}

/**
 * Format a date string to show when the stream occurred
 * Uses translation strings for relative dates
 */
function formatStreamDate(
  dateString: string | undefined,
  strings: ReturnType<typeof useTranslations>["strings"],
): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return strings.streamed_today;
  if (diffDays === 1) return strings.streamed_yesterday;
  if (diffDays < 7)
    return strings.streamed_days_ago.replace("{days}", String(diffDays));

  return strings.streamed_on_date.replace(
    "{date}",
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    }),
  );
}

export function LivesArchive({
  lives,
  title,
  subscriptionTier,
  customerId,
}: LivesArchiveProps) {
  const { user, memberships } = useRootLoaderData();
  const { expandedPortalContainerId } = useVideoPlayer();
  const { strings } = useTranslations();
  const portalContainerId = "lives-archive-portal-container";
  const hasExpandedCard = expandedPortalContainerId === portalContainerId;

  const renderLives = (resolvedLives: Content[]) => {
    // Filter out upcoming/future lives, show only past streams
    const pastLives = resolvedLives.filter(
      (live) => !live.isUpcoming && live.startDate,
    );

    if (pastLives.length === 0) return null;

    return (
      <div
        className="relative"
        style={{ zIndex: hasExpandedCard ? 50 : 10 }}
        id={portalContainerId}
      >
        <div className="animated-link-chevron-trigger max-w-screen overflow-hidden">
          <Container>
            <SectionHeader title={title} exploreAllLink="/livestreams" />
          </Container>
          <Container bleedRight>
            <Carousel>
              {pastLives.map((live) => (
                <Carousel.Slide key={live.contentId}>
                  <ProgressAwareVideoCardLink
                    content={live}
                    user={user}
                    subscriptionTier={
                      subscriptionTier as SubscriptionTier | undefined
                    }
                    memberships={memberships ?? undefined}
                    contentType="livestream"
                  >
                    {({ hasAccess }) => (
                      <ProgressAwareHoverVideoCard
                        aspectRatio="landscape"
                        eyebrow={formatStreamDate(live.startDate, strings)}
                        title={live.title ?? ""}
                        duration={live.video?.durationSeconds}
                        thumbnailUrl={live.thumbnailUrl}
                        thumbnailUrlVariants={live.thumbnailUrlVariants}
                        videoId={live.video?.videoId}
                        subscriptionTier={subscriptionTier}
                        customerId={customerId ?? undefined}
                        tags={live.tags}
                        chapters={live.video?.chapters}
                        locked={!hasAccess}
                        isNew={isNewContent(live)}
                      />
                    )}
                  </ProgressAwareVideoCardLink>
                </Carousel.Slide>
              ))}
            </Carousel>
          </Container>
        </div>
      </div>
    );
  };

  // Handle both Promise and resolved array
  if (lives instanceof Promise) {
    return (
      <Suspense fallback={<CarouselLoading />}>
        <Await resolve={lives}>
          {(resolvedLives) => renderLives(resolvedLives as Content[])}
        </Await>
      </Suspense>
    );
  }

  return renderLives(lives);
}
