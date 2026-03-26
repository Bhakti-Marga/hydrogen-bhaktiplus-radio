import { redirect, type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { CUSTOMER_ACCOUNT_QUERY } from '~/graphql/customer-account/CustomerAccountQuery';
import { Carousel, CatalogCard, Container } from '~/components';
import type { CommentaryDto, TalkDto, PilgrimageDto, PurchaseDto } from '~/lib/api/types';
import { userScopedMediaApiContext, userProfileContext } from '~/lib/middleware';
import { useTranslations } from '~/contexts/TranslationsProvider';

interface LoaderData {
  commentaries: CommentaryDto[];
  talks: TalkDto[];
  pilgrimages: PilgrimageDto[];
  currencyCode: string;
  error?: string;
}

/**
 * Filter out content where user's subscriptionTier matches any tier in content's subscriptionTiers array.
 * Case-insensitive comparison.
 */
function filterBySubscriptionTier<T extends { subscriptionTiers?: string[] | null }>(
  items: T[],
  userSubscriptionTier: string | null | undefined,
): T[] {
  if (!userSubscriptionTier) {
    return items;
  }

  const userTierLower = userSubscriptionTier.toLowerCase();

  return items.filter((item) => {
    const tiers = item.subscriptionTiers || [];
    // If no subscriptionTiers, show the item (it's available to all)
    if (tiers.length === 0) {
      return true;
    }
    // Hide if user's tier matches any of the content's tiers
    return !tiers.some((tier) => tier.toLowerCase() === userTierLower);
  });
}

/**
 * Filter out purchased content from catalog items.
 * Matches by contentId or ppvTag.
 */
function filterPurchasedContent<T extends { contentId?: number; ppvTag?: string | null }>(
  items: T[],
  purchasedContentIds: Set<number>,
  purchasedPpvTags: Set<string>,
): T[] {
  return items.filter((item) => {
    const itemContentId = item.contentId;
    
    // Check if contentId matches any purchased contentId
    if (itemContentId && purchasedContentIds.has(itemContentId)) {
      return false;
    }
    
    // Check if ppvTag matches any purchased ppvTag
    if (item.ppvTag && purchasedPpvTags.has(item.ppvTag)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Get router URL for product purchase based on content type
 * Routes to https://bhakti.plus/router with product intent
 */
function getContentUrl(content: CommentaryDto | TalkDto | PilgrimageDto): string {
  const contentId = content.contentId;
  const contentTypeId = content.contentTypeId;

  if (!contentId) {
    return '#';
  }

  // Map ContentTypeId to content_type parameter
  // ContentTypeId: 1=Talk, 2=Commentary, 3=Pilgrimage, 4=Satsang, 5=Live
  let contentType: string;
  if (contentTypeId === 1) {
    contentType = 'talks';
  } else if (contentTypeId === 2) {
    contentType = 'commentaries';
  } else if (contentTypeId === 3) {
    contentType = 'pilgrimages';
  } else {
    // Unknown content type, return fallback
    return '#';
  }

  // Build router URL: /router?intent=product&content_type={type}&content_id={id}
  const params = new URLSearchParams();
  params.set('intent', 'product');
  params.set('content_type', contentType);
  params.set('content_id', String(contentId));

  return `/router?${params.toString()}`;
}

export async function loader({ context }: LoaderFunctionArgs) {
  const { customerAccount } = context;

  // Check if user is logged in using Customer Account API
  const isLoggedIn = await customerAccount.isLoggedIn();

  if (!isLoggedIn) {
    return redirect('/account/login');
  }

  try {
    // Get user subscription info AND userScopedMediaApi from middleware context
    const userProfile = context.get(userProfileContext);
    const userScopedMediaApi = context.get(userScopedMediaApiContext);

    if (!userProfile) {
      return {
        commentaries: [],
        talks: [],
        pilgrimages: [],
        currencyCode: 'EUR',
        error: 'Failed to load user profile',
      };
    }

    // Determine currency code based on region ID
    const currencyCode = userProfile.stampedRegionId === 2 ? 'USD' : 'EUR';

    // Build sets of purchased contentIds and ppvTags for efficient lookup
    const purchasedContentIds = new Set<number>();
    const purchasedPpvTags = new Set<string>();
    
    // Add from user profile ppv array (ppvTags)
    if (userProfile.ppv && Array.isArray(userProfile.ppv)) {
      userProfile.ppv.forEach((ppvTag: unknown) => {
        if (typeof ppvTag === 'string' && ppvTag.length > 0) {
          purchasedPpvTags.add(ppvTag);
        }
      });
    }

    // Fetch content types sequentially to avoid hanging (if one hangs, others can still load)
    let commentaries: CommentaryDto[] = [];
    let talks: TalkDto[] = [];
    let pilgrimages: PilgrimageDto[] = [];

    try {
      const result = await userScopedMediaApi.commentaries.getList();
      commentaries = Array.isArray(result?.commentaries) ? result.commentaries : [];
    } catch (err) {
      console.error('Error fetching commentaries:', err);
    }

    try {
      const result = await userScopedMediaApi.talks.getList();
      talks = Array.isArray(result?.talks) ? result.talks : [];
    } catch (err) {
      console.error('Error fetching talks:', err);
    }

    try {
      const result = await userScopedMediaApi.pilgrimages.getList();
      pilgrimages = Array.isArray(result?.pilgrimages) ? result.pilgrimages : [];
    } catch (err) {
      console.error('Error fetching pilgrimages:', err);
    }

    // Filter out content where user's subscriptionTier matches content's subscriptionTiers
    const filteredByTierCommentaries = filterBySubscriptionTier(
      commentaries,
      userProfile.subscriptionTier,
    );
    const filteredByTierTalks = filterBySubscriptionTier(
      talks,
      userProfile.subscriptionTier,
    );
    const filteredByTierPilgrimages = filterBySubscriptionTier(
      pilgrimages,
      userProfile.subscriptionTier,
    );

    // Filter out purchased content
    const filteredCommentaries = filterPurchasedContent(
      filteredByTierCommentaries,
      purchasedContentIds,
      purchasedPpvTags,
    );
    const filteredTalks = filterPurchasedContent(
      filteredByTierTalks,
      purchasedContentIds,
      purchasedPpvTags,
    );
    const filteredPilgrimages = filterPurchasedContent(
      filteredByTierPilgrimages,
      purchasedContentIds,
      purchasedPpvTags,
    );

    return {
      commentaries: filteredCommentaries,
      talks: filteredTalks,
      pilgrimages: filteredPilgrimages,
      currencyCode,
    };
  } catch (error) {
    console.error('Error loading catalog:', error);
    return {
      commentaries: [],
      talks: [],
      pilgrimages: [],
      currencyCode: 'EUR',
      error: error instanceof Error ? error.message : 'Failed to load catalog',
    };
  }
}

export default function Catalog() {
  const { commentaries, talks, pilgrimages, currencyCode, error } = useLoaderData<LoaderData>();
  const { strings } = useTranslations();

  return (
    <div className="catalog">
      <h2 className="text-24 desktop:text-32 font-700 mb-20 desktop:mb-32 text-white">{strings.account_catalog}</h2>

      {error && (
        <div className="bg-red-500/20 text-red-400 p-16 rounded-md mb-24 border border-red-500/30">
          {error}
        </div>
      )}

      {/* Commentaries Section */}
      {commentaries.length > 0 && (
        <div className="mb-32 desktop:mb-48">
          <h3 className="text-20 desktop:text-24 font-700 mb-16 desktop:mb-24 text-white">
            {strings.commentaries}
          </h3>
          <Container bleedRight>
            <Carousel>
              {commentaries.map((commentary) => {
                const contentId = commentary.contentId;
                return (
                  <Carousel.Slide key={contentId}>
                    <CatalogCard
                      content={commentary}
                      size="md"
                      aspectRatio="landscape"
                      eyebrow={commentary.subtitle}
                      description={commentary.summary200}
                      durationSeconds={commentary.totalVideoDurationSeconds}
                    />
                  </Carousel.Slide>
                );
              })}
            </Carousel>
          </Container>
        </div>
      )}

      {/* Virtual Pilgrimages Section */}
      {pilgrimages.length > 0 && (
        <div className="mb-32 desktop:mb-48">
          <h3 className="text-20 desktop:text-24 font-700 mb-16 desktop:mb-24 text-white">
            {strings.virtual_pilgrimages}
          </h3>
          <Container bleedRight>
            <Carousel>
              {pilgrimages.map((pilgrimage) => {
                const contentId = pilgrimage.contentId;
                return (
                  <Carousel.Slide key={contentId}>
                    <CatalogCard
                      content={pilgrimage}
                      size="md"
                      aspectRatio="landscape"
                      eyebrow={pilgrimage.subtitle}
                      description={pilgrimage.summary200}
                      durationSeconds={pilgrimage.totalVideoDurationSeconds}
                    />
                  </Carousel.Slide>
                );
              })}
            </Carousel>
          </Container>
        </div>
      )}

      {/* Talks Section */}
      {talks.length > 0 && (
        <div className="mb-32 desktop:mb-48">
          <h3 className="text-20 desktop:text-24 font-700 mb-16 desktop:mb-24 text-white">{strings.nav_talks}</h3>
          <Container bleedRight>
            <Carousel>
              {talks.map((talk) => {
                const contentId = talk.contentId;
                return (
                  <Carousel.Slide key={contentId}>
                    <CatalogCard
                      content={talk}
                      size="md"
                      aspectRatio="landscape"
                      eyebrow={talk.subtitle}
                      description={talk.summary200}
                      durationSeconds={talk.video?.durationSeconds}
                    />
                  </Carousel.Slide>
                );
              })}
            </Carousel>
          </Container>
        </div>
      )}

      {/* Empty State */}
      {commentaries.length === 0 && talks.length === 0 && pilgrimages.length === 0 && (
        <div className="text-grey-light">
          <p>{strings.catalog_empty_state}</p>
        </div>
      )}
    </div>
  );
}
