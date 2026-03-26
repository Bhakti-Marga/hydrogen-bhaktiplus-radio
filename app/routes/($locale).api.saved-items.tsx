import {json, type ActionFunctionArgs, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {
  parseSavedItems,
  addSavedItem,
  removeSavedItem,
  SAVED_ITEMS_METAFIELD_NAMESPACE,
  SAVED_ITEMS_METAFIELD_KEY,
  type SavedItem,
  type SavedItemType,
} from '~/lib/saved-items';
import {
  SAVED_ITEMS_QUERY,
  SAVED_ITEMS_SET_MUTATION,
} from '~/graphql/customer-account/SavedItemsQueries';

export async function loader({context}: LoaderFunctionArgs) {
  try {
    const isLoggedIn = await context.customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return json({savedItems: [], isLoggedIn: false});
    }

    const {data} = await context.customerAccount.query(SAVED_ITEMS_QUERY);
    const items = parseSavedItems(data?.customer?.metafield?.value);
    return json({savedItems: items, isLoggedIn: true});
  } catch {
    return json({savedItems: [], isLoggedIn: false});
  }
}

export async function action({request, context}: ActionFunctionArgs) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return json({error: 'Not authenticated', savedItems: []}, {status: 401});
  }

  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const itemId = formData.get('itemId') as string;

  const {data: queryData} = await context.customerAccount.query(SAVED_ITEMS_QUERY);
  const customerId = queryData?.customer?.id;
  const currentItems = parseSavedItems(queryData?.customer?.metafield?.value);

  if (!customerId) {
    return json({error: 'Customer not found', savedItems: currentItems}, {status: 400});
  }

  let updatedItems: SavedItem[];

  if (intent === 'save') {
    const newItem = {
      id: itemId,
      type: formData.get('type') as SavedItemType,
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || undefined,
      imageUrl: (formData.get('imageUrl') as string) || undefined,
    };
    updatedItems = addSavedItem(currentItems, newItem);
  } else if (intent === 'remove') {
    updatedItems = removeSavedItem(currentItems, itemId);
  } else {
    return json({error: 'Invalid intent', savedItems: currentItems}, {status: 400});
  }

  try {
    const {data, errors} = await context.customerAccount.mutate(SAVED_ITEMS_SET_MUTATION, {
      variables: {
        metafields: [
          {
            ownerId: customerId,
            namespace: SAVED_ITEMS_METAFIELD_NAMESPACE,
            key: SAVED_ITEMS_METAFIELD_KEY,
            type: 'json',
            value: JSON.stringify(updatedItems),
          },
        ],
      },
    });

    if (errors?.length || data?.metafieldsSet?.userErrors?.length) {
      const errorMsg = errors?.[0]?.message || data?.metafieldsSet?.userErrors?.[0]?.message;
      return json({error: errorMsg, savedItems: currentItems}, {status: 400});
    }

    return json({savedItems: updatedItems, isLoggedIn: true});
  } catch (error: any) {
    return json({error: error?.message || 'Failed to save', savedItems: currentItems}, {status: 500});
  }
}
