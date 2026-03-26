import { useState, Suspense } from "react";
import { useLoaderData, Await } from "react-router";
import { Stack , CarouselLoading , ContentSeriesCarousel, SatsangCategories, Talks, MobileWall } from "~/components";
import { Faqs } from "~/sections";
import { Content } from "~/lib/types";
import type { CategoryDto, WatchHistoryEntryDto } from "~/lib/api/types";
import { useTranslations } from "~/contexts/TranslationsProvider";
import {
  FeaturedLiveHero,
  DailySatsangHero,
  SatsangContentRow,
  SatsangsOfTheWeekRow,
  HistoryContentRow,
} from "./shared-components";
import type { loader } from "~/routes/($countryCode).($language)._index";

export function PremiumHomepage() {
  const {
    featuredLive,
    dailySatsang,
    satsangCategories,
    commentaries,
    pilgrimages,
    talks,
    continueWatching,
    satsangsLatestReleases,
    satsangsWeekly,
    satsangsSaints,
    satsangsBhakti,
    videosInProgressCount,
    subscriptionTier,
    user,
    faqsSchema,
  } = useLoaderData<typeof loader>();
  const { strings } = useTranslations();
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  return (
    <MobileWall>
      <div className="homepage">
        {featuredLive ? (
        <FeaturedLiveHero
          featuredLive={featuredLive}
          isDetailsVisible={isDetailsVisible}
          setIsDetailsVisible={setIsDetailsVisible}
          subscriptionTier={subscriptionTier}
          customerId={user?.shopifyCustomerId}
        />
      ) : dailySatsang ? (
        <DailySatsangHero
          dailySatsang={dailySatsang}
          subscriptionTier={subscriptionTier}
          customerId={user?.shopifyCustomerId}
        />
      ) : null}

      <Stack gap={7} className="mt-[var(--spacing-xs)]">
        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={satsangsWeekly}>
            {(resolved) => {
              const { satsangs, todayIndex } = resolved as unknown as { satsangs: Content[]; todayIndex: number };
              return (
                <SatsangsOfTheWeekRow
                  content={satsangs}
                  title={strings.homepage_satsang_week_title}
                  description={strings.homepage_satsang_week_description}
                  aspectRatio="landscape"
                  subscriptionTier={subscriptionTier}
                  customerId={user?.shopifyCustomerId}
                  id="satsang-weekly"
                  todayIndex={todayIndex}
                />
              );
            }}
          </Await>
        </Suspense>

        {videosInProgressCount > 0 && (
          <Suspense fallback={<CarouselLoading />}>
            <Await resolve={continueWatching}>
              {(resolved) => (
                <HistoryContentRow
                  content={resolved as unknown as WatchHistoryEntryDto[]}
                  title={strings.homepage_continue_watching_title}
                  aspectRatio="landscape"
                  subscriptionTier={subscriptionTier}
                  customerId={user?.shopifyCustomerId}
                  id="continue-watching"
                />
              )}
            </Await>
          </Suspense>
        )}

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={satsangsLatestReleases}>
            {(resolved) => (
              <SatsangContentRow
                content={resolved as unknown as Content[]}
                title={strings.homepage_latest_releases_title}
                exploreAllLink="/satsangs"
                aspectRatio="landscape"
                subscriptionTier={subscriptionTier}
                customerId={user?.shopifyCustomerId}
                id="latest-releases"
              />
            )}
          </Await>
        </Suspense>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={commentaries}>
            {(resolved) => (
              <ContentSeriesCarousel
                title={strings.homepage_commentaries_year_title}
                items={resolved}
                contentType="commentary"
                exploreAllLink="/commentaries"
              />
            )}
          </Await>
        </Suspense>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={pilgrimages}>
            {(resolved) => (
              <ContentSeriesCarousel
                title={strings.homepage_pilgrimages_premium_title}
                items={resolved}
                contentType="pilgrimage"
                exploreAllLink="/pilgrimages"
                videosSubtitle={(count) => `Days (${count})`}
              />
            )}
          </Await>
        </Suspense>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={talks}>
            {(resolvedTalks) => (
              <Talks
                talks={resolvedTalks}
                title={strings.homepage_talks_title}
              />
            )}
          </Await>
        </Suspense>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={satsangCategories}>
            {(resolved) => (
              <SatsangCategories
                categories={resolved as CategoryDto[]}
                title={strings.homepage_satsang_topic_title}
                aspectRatio="square"
                expandOnClick
              />
            )}
          </Await>
        </Suspense>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={satsangsSaints}>
            {(resolved) => (
              <SatsangContentRow
                content={resolved as unknown as Content[]}
                title={strings.homepage_satsang_saints_title}
                exploreAllLink="/satsangs"
                aspectRatio="landscape"
                subscriptionTier={subscriptionTier}
                customerId={user?.shopifyCustomerId}
                id="satsang-saints"
              />
            )}
          </Await>
        </Suspense>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={satsangsBhakti}>
            {(resolved) => (
              <SatsangContentRow
                content={resolved as unknown as Content[]}
                title={strings.homepage_satsang_bhakti_title}
                exploreAllLink="/satsangs"
                aspectRatio="landscape"
                subscriptionTier={subscriptionTier}
                customerId={user?.shopifyCustomerId}
                id="satsang-bhakti"
              />
            )}
          </Await>
        </Suspense>

        <Faqs
          showMoreLink={true}
          bottomPadding="lg"
          schema={faqsSchema}
          withImageBackground
        />

      </Stack>
      </div>
    </MobileWall>
  );
}
