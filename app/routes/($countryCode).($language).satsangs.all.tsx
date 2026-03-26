import { useState, useCallback } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData, useRouteLoaderData } from "react-router";
import {
  Container,
  SatsangsNav,
  Button,
  ProgressAwareVideoCardLink,
  ProgressAwareHoverVideoCard,
  GenreEyebrow,
  type Genre,
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
  return [{ title: "All Satsangs - Bhakti+" }];
};

export async function loader({ context }: LoaderFunctionArgs) {
  const userScopedMediaApi = context.get(userScopedMediaApiContext);

  const [{ categories }, satsangsResponse] = await Promise.all([
    userScopedMediaApi.satsangs.getCategories(),
    userScopedMediaApi.satsangs.getList({
      limit: PAGE_SIZE,
      offset: 0,
      sortBy: "publishedAt",
      desc: true,
    }),
  ]);

  return {
    categories,
    initialSatsangs: satsangsResponse.satsangs ?? [],
    total: satsangsResponse.total ?? 0,
  };
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-32">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-light" />
    </div>
  );
}

export default function SatsangsAll() {
  const locale = useLocale();
  const { strings } = useTranslations();
  const { categories, initialSatsangs, total } = useLoaderData<typeof loader>();
  const { expandedPortalContainerId } = useVideoPlayer();

  const rootData = useRouteLoaderData<RootLoader>("root");
  const subscriptionTier = rootData?.subscriptionTier;
  const customerId = rootData?.user?.shopifyCustomerId;
  const memberships = rootData?.memberships;
  const user = rootData?.user;

  const [satsangs, setSatsangs] = useState<Content[]>(
    initialSatsangs as Content[],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialSatsangs.length < total);

  const portalContainerId = "satsangs-all-portal-container";
  const hasExpandedCard = expandedPortalContainerId === portalContainerId;

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${locale.pathPrefix}/api/satsangs/all?offset=${satsangs.length}&limit=${PAGE_SIZE}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = (await response.json()) as {
        satsangs: Content[];
        total: number;
      };
      const newSatsangs = data.satsangs ?? [];

      setSatsangs((prev) => [...prev, ...newSatsangs]);
      setHasMore(satsangs.length + newSatsangs.length < data.total);
    } catch (error) {
      console.error("Failed to load more satsangs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, satsangs.length, locale.pathPrefix]);

  return (
    <div className="satsangs-all min-h-screen bg-brand-dark text-white pt-[var(--header-height)]">
      <Container>
        <SatsangsNav categories={categories} level="category" />

        <div className="mb-24">
          {/* <h1 className="h1-md mb-8">{strings.all_satsangs_title}</h1> */}
          <p className="body-b2 text-white/70">
            {strings.showing_satsangs_count
              .replace("{count}", String(satsangs.length))
              .replace("{total}", String(total))}
          </p>
        </div>

        <div
          id={portalContainerId}
          className="relative"
          style={{ zIndex: hasExpandedCard ? 50 : 10 }}
        >
          <div
            className="grid gap-x-16 gap-y-56 mb-48"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(250px, 100%), 1fr))",
            }}
          >
            {satsangs.map((satsang) => (
              <ProgressAwareVideoCardLink
                key={satsang.contentId}
                content={satsang}
                user={user}
                subscriptionTier={
                  subscriptionTier as SubscriptionTier | undefined
                }
                memberships={memberships}
                contentType="satsang"
              >
                {({ hasAccess }) => (
                  <ProgressAwareHoverVideoCard
                    videoId={satsang.video?.videoId ?? ""}
                    title={satsang.title ?? ""}
                    thumbnailUrl={satsang.thumbnailUrl}
                    thumbnailUrlVariants={satsang.thumbnailUrlVariants}
                    duration={satsang.video?.durationSeconds}
                    eyebrow={
                      satsang.genre ? (
                        <GenreEyebrow
                          genre={satsang.genre as Genre}
                          contentType="Satsang"
                        />
                      ) : undefined
                    }
                    size="auto"
                    aspectRatio="landscape"
                    subscriptionTier={subscriptionTier}
                    customerId={customerId}
                    tags={satsang.tags}
                    chapters={satsang.video?.chapters}
                    locked={!hasAccess}
                    isNew={isNewContent(satsang)}
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

        {!hasMore && satsangs.length > 0 && (
          <div className="text-center pb-64">
            <p className="body-b2 text-white/50">
              {strings.showing_all_satsangs.replace("{count}", String(total))}
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
