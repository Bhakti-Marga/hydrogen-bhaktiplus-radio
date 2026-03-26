import { useState, Suspense } from "react";
import { useLoaderData, Await } from "react-router";
import { Stack , CarouselLoading , ContentSeriesCarousel, SatsangCategories, Talks, Container, MoreBhaktiEyebrow, MobileWall } from "~/components";
import { Faqs } from "~/sections";
import { Content } from "~/lib/types";
import type { CategoryDto, WatchHistoryEntryDto, PurchaseDto } from "~/lib/api/types";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { FeaturedLiveHero, DailySatsangHero, Lives, SatsangsOfTheWeekRow, HistoryContentRow, MyPurchasesRow } from "./shared-components";
import type { loader } from "~/routes/($countryCode).($language)._index";

export function LiveHomepage() {
  const {
    featuredLive,
    dailySatsang,
    satsangCategories,
    commentaries,
    pilgrimages,
    talks,
    lives,
    satsangsWeekly,
    continueWatching,
    videosInProgressCount,
    subscriptionTier,
    user,
    purchases,
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
          <Await resolve={lives}>
            {(resolvedLives) => (
              <Lives
                lives={resolvedLives as unknown as Content[]}
                title={strings.homepage_live_title}
                aspectRatio="landscape"
                subscriptionTier={subscriptionTier}
                customerId={user?.shopifyCustomerId}
                id="homepage-lives"
                hideMoreBhaktiEyebrow
              />
            )}
          </Await>
        </Suspense>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={purchases}>
            {(resolvedPurchases) => (
              <MyPurchasesRow
                purchases={resolvedPurchases as unknown as PurchaseDto[]}
                title={strings.account_my_purchases}
              />
            )}
          </Await>
        </Suspense>

        <Container>
          <MoreBhaktiEyebrow text={strings.account_more_on_bhakti_plus} className="mt-64 mb-16 desktop:mt-64 desktop:mb-4" />
        </Container>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={satsangCategories}>
            {(resolvedCategories) => (
              <SatsangCategories
                categories={resolvedCategories as CategoryDto[]}
                title={strings.homepage_upgrade_satsang_message}
                aspectRatio="square"
                expandOnClick
              />
            )}
          </Await>
        </Suspense>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={commentaries}>
            {(resolvedCommentaries) => (
              <ContentSeriesCarousel
                title={strings.homepage_upgrade_commentaries_message}
                items={resolvedCommentaries}
                contentType="commentary"
                exploreAllLink="/commentaries"
              />
            )}
          </Await>
        </Suspense>

        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={pilgrimages}>
            {(resolvedPilgrimages) => (
              <ContentSeriesCarousel
                title={strings.homepage_upgrade_pilgrimages_message}
                items={resolvedPilgrimages}
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
