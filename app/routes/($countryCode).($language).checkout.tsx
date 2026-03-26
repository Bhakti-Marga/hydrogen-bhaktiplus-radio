import type {LoaderFunctionArgs} from 'react-router';
import {redirect} from 'react-router';

/**
 * Checkout redirect route
 *
 * This route handles checkout redirects by taking a variant ID from the query string
 * and redirecting to Shopify's hosted checkout with that variant in the cart.
 *
 * Usage: /checkout?variant=gid://shopify/ProductVariant/123456789
 */
export async function loader({request, context}: LoaderFunctionArgs) {
  const {storefront, cart} = context;
  const url = new URL(request.url);
  const variantId = url.searchParams.get('variant');

  if (!variantId) {
    // If no variant provided, redirect to home page
    return redirect('/');
  }

  try {
    // Get or create a cart and add the variant
    const cartResult = await cart.get();

    if (!cartResult) {
      // Create a new cart with the variant
      const result = await cart.addLines([
        {
          merchandiseId: variantId,
          quantity: 1,
        },
      ]);

      if (result?.cart?.checkoutUrl) {
        return redirect(result.cart.checkoutUrl);
      }
    } else {
      // Add to existing cart
      const result = await cart.addLines([
        {
          merchandiseId: variantId,
          quantity: 1,
        },
      ]);

      if (result?.cart?.checkoutUrl) {
        return redirect(result.cart.checkoutUrl);
      }
    }

    // Fallback: redirect to home if something went wrong
    return redirect('/');
  } catch (error) {
    console.error('Error in checkout route:', error);
    // On error, redirect to home page
    return redirect('/');
  }
}
