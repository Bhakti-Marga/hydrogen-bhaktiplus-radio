import { redirect, type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { CUSTOMER_ACCOUNT_QUERY } from '~/graphql/customer-account/CustomerAccountQuery';
import { Carousel, ContentCard, Container } from '~/components';
import { encodeVideoId } from '~/lib/utils/video-id-encoder';
import type { PurchasesResponseDto } from '~/lib/api/types';
import { userScopedMediaApiContext } from '~/lib/middleware';
import { useTranslations } from '~/contexts/TranslationsProvider';

interface LoaderData {
  purchases: PurchasesResponseDto;
  error?: string;
}

export async function loader({ context }: LoaderFunctionArgs) {
  const { customerAccount } = context;

  // Check if user is logged in using Customer Account API
  const isLoggedIn = await customerAccount.isLoggedIn();

  if (!isLoggedIn) {
    return redirect('/account/login');
  }

  try {
    // Get customer email from Customer Account API
    const { data, errors } = await customerAccount.query(CUSTOMER_ACCOUNT_QUERY);

    if (errors?.length || !data?.customer) {
      throw new Error('Failed to fetch customer data');
    }

    const customerEmail = data.customer.emailAddress?.emailAddress;

    if (!customerEmail) {
      throw new Error('No email found for customer');
    }

    // Get userScopedMediaApi from middleware context
    const userScopedMediaApi = context.get(userScopedMediaApiContext);

    // Fetch purchases from Media API using userScopedMediaApi
    const purchases = await userScopedMediaApi.user.getPurchases({
      email: customerEmail,
    });

    return {
      purchases,
    };
  } catch (error) {
    console.error('Error loading purchases:', error);
    return {
      purchases: { purchases: [] },
      error: error instanceof Error ? error.message : 'Failed to load purchases',
    };
  }
}

export default function Purchases() {
  const { purchases, error } = useLoaderData<LoaderData>();
  const { strings } = useTranslations();

  const getContentUrl = (purchase: typeof purchases.purchases[0]) => {
    // Build video URL using encoded video ID
    if (purchase.videoId) {
      const encodedVideoId = encodeVideoId(purchase.videoId);
      return `/video?videoId=${encodedVideoId}`;
    }
    return '#';
  };

  return (
    <div className="purchases">
      <h2 className="text-24 desktop:text-32 font-700 mb-20 desktop:mb-32 text-white">{strings.account_my_purchases}</h2>

      {error && (
        <div className="bg-red-500/20 text-red-400 p-16 rounded-md mb-24 border border-red-500/30">
          {error}
        </div>
      )}

      {purchases.purchases.length === 0 ? (
        <div className="text-grey-light">
          <p>{strings.account_no_purchases}</p>
        </div>
      ) : (
        <Container bleedRight>
          <Carousel>
            {purchases.purchases.map((purchase) => (
              <Carousel.Slide key={purchase.id}>
                <Link to={getContentUrl(purchase)}>
                  <ContentCard
                    size="md"
                    aspectRatio="portrait"
                    title={purchase.title}
                    image={purchase.thumbnailUrlVertical || purchase.thumbnailUrl || ''}
                    className={purchase.isExpired ? 'opacity-60' : ''}
                  />
                </Link>
              </Carousel.Slide>
            ))}
          </Carousel>
        </Container>
      )}
    </div>
  );
}
