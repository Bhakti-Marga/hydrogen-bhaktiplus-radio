import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { CUSTOMER_ACCOUNT_QUERY } from '~/graphql/customer-account/CustomerAccountQuery';
import { userScopedMediaApiContext } from '~/lib/middleware';

/**
 * API Route: /api/user/preferences
 *
 * GET - Fetch user preferences
 * PUT - Update user preferences
 */

export async function loader({ context }: LoaderFunctionArgs) {
  const { customerAccount } = context;
  const userScopedMediaApi = context.get(userScopedMediaApiContext);

  // Check if user is logged in
  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get user email from customer account
  const { data, errors } = await customerAccount.query(CUSTOMER_ACCOUNT_QUERY);

  if (errors?.length || !data?.customer) {
    console.error('[api.user.preferences] Failed to fetch customer data:', errors);
    return Response.json({ error: 'Could not get customer data' }, { status: 400 });
  }

  const email = data.customer.emailAddress?.emailAddress;
  if (!email) {
    return Response.json({ error: 'Could not get user email' }, { status: 400 });
  }

  try {
    const preferences = await userScopedMediaApi.user.getPreferences({
      email,
    });

    return Response.json(preferences);
  } catch (error) {
    console.error('[api.user.preferences] Failed to fetch preferences:', error);
    return Response.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function action({ context, request }: ActionFunctionArgs) {
  const { customerAccount } = context;
  const userScopedMediaApi = context.get(userScopedMediaApiContext);
  
  // Only accept PUT requests
  if (request.method !== 'PUT') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Check if user is logged in
  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get user email from customer account
  const { data, errors } = await customerAccount.query(CUSTOMER_ACCOUNT_QUERY);

  if (errors?.length || !data?.customer) {
    console.error('[api.user.preferences] Failed to fetch customer data:', errors);
    return Response.json({ error: 'Could not get customer data' }, { status: 400 });
  }

  const email = data.customer.emailAddress?.emailAddress;
  if (!email) {
    return Response.json({ error: 'Could not get user email' }, { status: 400 });
  }

  // Parse request body
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const result = await userScopedMediaApi.user.updatePreferences(
      { email },
      body
    );

    if (!result) {
      return Response.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return Response.json(result);
  } catch (error) {
    console.error('[api.user.preferences] Failed to update preferences:', error);
    return Response.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
