import { useState, useCallback } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData, useRouteLoaderData } from "react-router";
import {
  Container,
  Button,
  ProgressAwareVideoCardLink,
  ProgressAwareHoverVideoCard,
} from "~/components";
import { isNewContent } from "~/lib/utils";
import { useLocale } from "~/hooks";
import { useVideoPlayer } from "~/contexts/VideoPlayerProvider";
import { useTranslations } from "~/contexts/TranslationsProvider";
import type { RootLoader } from "~/root";
import type { Content, SubscriptionTier } from "~/lib/types";
import { userScopedMediaApiContext } from "~/lib/middleware";

const PAGE_SIZE = 24;

export const meta: MetaFunction = () => {
  return [{ title: "All Talks - Bhakti+" }];
};

export async function loader({ context }: LoaderFunctionArgs) {
  const userScopedMediaApi = context.get(userScopedMediaApiContext);

  const talksResponse = await userScopedMediaApi.talks.getList({
    limit: PAGE_SIZE,
    offset: 0,
    sortBy: "publishedAt",
    desc: false,
  });

  return {
    initialTalks: talksResponse.talks ?? [],
    total: talksResponse.total ?? 0,
  };
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-32">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-light" />
    </div>
  );
}

export default function TalksAll() {
  const locale = useLocale();
  const { strings } = useTranslations();
  const { initialTalks, total } = useLoaderData<typeof loader>();
  const { expandedPortalContainerId } = useVideoPlayer();

  const rootData = useRouteLoaderData<RootLoader>("root");
  const subscriptionTier = rootData?.subscriptionTier;
  const customerId = rootData?.user?.shopifyCustomerId;
  const memberships = rootData?.memberships;
  const user = rootData?.user;

  const [talks, setTalks] = useState<Content[]>(initialTalks as Content[]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialTalks.length < total);

  const portalContainerId = "talks-all-portal-container";
  const hasExpandedCard = expandedPortalContainerId === portalContainerId;

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${locale.pathPrefix}/api/talks/all?offset=${talks.length}&limit=${PAGE_SIZE}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = (await response.json()) as {
        talks: Content[];
        total: number;
      };
      const newTalks = data.talks ?? [];

      setTalks((prev) => [...prev, ...newTalks]);
      setHasMore(talks.length + newTalks.length < data.total);
    } catch (error) {
      console.error("Failed to load more talks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, talks.length, locale.pathPrefix]);

  return (
    <div className="talks-all min-h-screen bg-brand-dark text-white pt-[var(--header-height)]">
      <Container>
        <div className="mb-24 pt-24">
          <h1 className="h1-md mb-8">{strings.all_talks_title}</h1>
          <p className="body-b2 text-white/70">
            {strings.showing_talks_count
              .replace("{count}", String(talks.length))
              .replace("{total}", String(total))}
          </p>
        </div>

        <div
          id={portalContainerId}
          className="relative"
          style={{ zIndex: hasExpandedCard ? 50 : 10 }}
        >
          <div
            className="grid gap-x-16 gap-y-24 mb-48"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(250px, 100%), 1fr))",
            }}
          >
            {talks.map((talk) => (
              <ProgressAwareVideoCardLink
                key={talk.contentId}
                content={talk}
                user={user}
                subscriptionTier={
                  subscriptionTier as SubscriptionTier | undefined
                }
                memberships={memberships}
                contentType="talk"
              >
                {({ hasAccess }) => (
                  <ProgressAwareHoverVideoCard
                    videoId={talk.video?.videoId ?? ""}
                    title={talk.title ?? ""}
                    thumbnailUrl={talk.thumbnailUrl}
                    thumbnailUrlVariants={talk.thumbnailUrlVariants}
                    duration={talk.video?.durationSeconds}
                    eyebrow={talk.subtitle}
                    size="auto"
                    aspectRatio="landscape"
                    subscriptionTier={subscriptionTier}
                    customerId={customerId}
                    tags={talk.tags}
                    chapters={talk.video?.chapters}
                    locked={!hasAccess}
                    isNew={isNewContent(talk)}
                  />
                )}
              </ProgressAwareVideoCardLink>
            ))}
          </div>
        </div>

        {hasMore && (
          <div className="flex justify-center pb-64">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <Button variant="secondary" onClick={loadMore}>
                {strings.load_more}
              </Button>
            )}
          </div>
        )}

        {!hasMore && talks.length > 0 && (
          <div className="text-center pb-64">
            <p className="body-b2 text-white/50">
              {strings.showing_all_talks.replace("{count}", String(total))}
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
