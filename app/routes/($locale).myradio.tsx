import {json, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {Container} from '~/components/Container';
import {Stack} from '~/components/Stack';
import {SaveButton} from '~/components/SaveButton';
import {Link} from '~/components/Link';
import {
  parseSavedItems,
  SAVED_ITEM_TYPE_LABELS,
  type SavedItem,
  type SavedItemType,
} from '~/lib/saved-items';
import {SAVED_ITEMS_QUERY} from '~/graphql/customer-account/SavedItemsQueries';

export async function loader({context, params}: LoaderFunctionArgs) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return redirect(params.locale ? `/${params.locale}/account/login` : '/account/login');
  }

  const {data} = await context.customerAccount.query(SAVED_ITEMS_QUERY);
  const savedItems = parseSavedItems(data?.customer?.metafield?.value);
  const firstName = data?.customer?.firstName || '';

  return json({savedItems, firstName});
}

const TYPE_ORDER: SavedItemType[] = ['station', 'show', 'track', 'schedule_slot'];

const TYPE_GRADIENTS: Record<SavedItemType, string> = {
  station: 'gradient-brand',
  show: 'gradient-purple',
  track: 'bg-brand-light/40',
  schedule_slot: 'bg-brand-light/30',
};

const TYPE_EMPTY_MESSAGES: Record<SavedItemType, string> = {
  station: 'Save your favorite stations from the homepage',
  show: 'Save weekly shows to never miss them',
  track: 'Save tracks while listening to the radio',
  schedule_slot: 'Save schedule slots you want to tune in to',
};

function TypeIcon({type, className = 'w-24 h-24'}: {type: SavedItemType; className?: string}) {
  switch (type) {
    case 'station':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2a5.5 5.5 0 0 1 0-8.4" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <path d="M16.2 7.8a5.5 5.5 0 0 1 0 8.4M19.1 4.9C23 8.8 23 15.1 19.1 19" />
        </svg>
      );
    case 'show':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'track':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      );
    case 'schedule_slot':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
  }
}

function SavedItemCard({item}: {item: SavedItem}) {
  return (
    <div className="bg-brand-light/30 hover:bg-brand-light/50 rounded-xl p-20 transition-all duration-200 group border border-brand-light/10 hover:border-gold/20">
      <div className="flex items-start gap-16">
        <div className="w-44 h-44 rounded-lg bg-brand-light/50 flex items-center justify-center shrink-0 text-gold/70">
          <TypeIcon type={item.type} className="w-22 h-22" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="body-b3 font-600 text-white truncate">{item.title}</p>
          {item.description && (
            <p className="body-b5 text-grey-dark opacity-70 mt-4 line-clamp-2">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-8 mt-8">
            <span className="text-10 font-600 uppercase px-8 py-2 rounded-full bg-gold/10 text-gold">
              {SAVED_ITEM_TYPE_LABELS[item.type]}
            </span>
            <span className="text-10 text-grey-dark opacity-40">
              {new Date(item.savedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
        <SaveButton
          itemId={item.id}
          type={item.type}
          title={item.title}
          description={item.description}
          imageUrl={item.imageUrl}
          size="sm"
        />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-64">
      <div className="w-80 h-80 mx-auto rounded-full bg-brand-light/30 flex items-center justify-center mb-24">
        <svg className="w-40 h-40 text-gold opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h3 className="h2-md text-white mb-12">Nothing saved yet</h3>
      <p className="body-b2 text-grey-dark opacity-70 max-w-md mx-auto mb-32">
        Explore the radio, discover stations and shows, and save everything you love. It will all appear here.
      </p>
      <Link to="/" className="btn btn--gold">
        Explore Bhakti+ Radio
      </Link>
    </div>
  );
}

export default function MyRadio() {
  const {savedItems, firstName} = useLoaderData<typeof loader>();

  const groupedItems = TYPE_ORDER.reduce(
    (acc, type) => {
      const items = savedItems.filter((item) => item.type === type);
      if (items.length > 0) acc[type] = items;
      return acc;
    },
    {} as Partial<Record<SavedItemType, SavedItem[]>>,
  );

  const hasItems = savedItems.length > 0;
  const groupEntries = Object.entries(groupedItems) as [SavedItemType, SavedItem[]][];

  return (
    <div className="min-h-screen pb-[72px]">
      {/* Hero header */}
      <div className="relative bg-gradient-to-b from-brand-light/20 to-transparent">
        <Container>
          <div className="pt-40 pb-32 tablet:pt-56 tablet:pb-40">
            <Stack gap={2}>
              <p className="h3-sm text-gold tracking-wider">MY RADIO</p>
              <h1 className="h1-lg text-white">
                {firstName ? `${firstName}'s Library` : 'My Library'}
              </h1>
              <p className="body-b1 text-grey-dark opacity-70 max-w-xl">
                Your saved stations, shows, and tracks — all in one place.
              </p>
              {hasItems && (
                <div className="flex items-center gap-16 mt-8">
                  <span className="text-14 font-figtree font-600 text-grey-light">
                    {savedItems.length} saved {savedItems.length === 1 ? 'item' : 'items'}
                  </span>
                  <div className="flex gap-8">
                    {groupEntries.map(([type, items]) => (
                      <span
                        key={type}
                        className="text-10 font-600 uppercase px-10 py-4 rounded-full bg-brand-light/50 text-grey-light"
                      >
                        {items.length} {SAVED_ITEM_TYPE_LABELS[type]}{items.length > 1 ? 's' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Stack>
          </div>
        </Container>
      </div>

      {/* Content */}
      <Container>
        {!hasItems ? (
          <EmptyState />
        ) : (
          <Stack gap={6}>
            {groupEntries.map(([type, items]) => (
              <div key={type}>
                <div className="flex items-center gap-12 mb-20">
                  <div className="w-36 h-36 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                    <TypeIcon type={type} className="w-20 h-20" />
                  </div>
                  <div>
                    <h2 className="h2-sm text-white">
                      {SAVED_ITEM_TYPE_LABELS[type]}s
                    </h2>
                    <p className="text-12 text-grey-dark opacity-60">
                      {items.length} saved
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-12">
                  {items.map((item) => (
                    <SavedItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </Stack>
        )}
      </Container>
    </div>
  );
}
