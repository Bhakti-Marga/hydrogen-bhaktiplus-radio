import { useState } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, useFetcher, redirect } from 'react-router';
import { Container } from '~/components/Container/Container';
import { Button } from '~/components/Button/Button';
import { PRODUCT_DETAIL_QUERY, COLLECTION_QUERY } from '~/graphql/product.queries';
import { Image } from '~/components/Image';

// Product ID to display in first section
const FEATURED_PRODUCT_ID = 'gid://shopify/Product/15247882715515';

// Collection IDs to display in order
const COLLECTION_IDS = [
  'gid://shopify/Collection/677003559291',
  'gid://shopify/Collection/677003526523',
  'gid://shopify/Collection/677003624827',
];

interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: {
    amount: string;
    currencyCode: string;
  };
  compareAtPrice?: {
    amount: string;
    currencyCode: string;
  };
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  image?: {
    altText?: string;
    height?: number;
    id: string;
    url: string;
    width?: number;
  };
}

interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  descriptionHtml?: string;
  featuredImage?: {
    altText?: string;
    height?: number;
    id: string;
    url: string;
    width?: number;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  options: Array<{
    name: string;
    values: string[];
  }>;
  variants: {
    nodes: ProductVariant[];
  };
}

interface CollectionProduct {
  id: string;
  title: string;
  handle: string;
  featuredImage?: {
    altText?: string;
    height?: number;
    id: string;
    url: string;
    width?: number;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: {
    nodes: Array<{
      id: string;
      availableForSale: boolean;
      price: {
        amount: string;
        currencyCode: string;
      };
    }>;
  };
}

interface Collection {
  id: string;
  title: string;
  description?: string;
  products: {
    nodes: CollectionProduct[];
  };
}

interface PurchaseLoaderData {
  featuredProduct: Product | null;
  collections: Collection[];
}

export async function loader({ context }: LoaderFunctionArgs) {
  const { storefront } = context;

  // Fetch featured product
  let featuredProduct: Product | null = null;
  try {
    const productResult = await storefront.query(PRODUCT_DETAIL_QUERY, {
      variables: { id: FEATURED_PRODUCT_ID },
    });
    featuredProduct = productResult.product as Product;
  } catch (error) {
    console.error('Error fetching featured product:', error);
  }

  // Fetch collections
  const collectionPromises = COLLECTION_IDS.map(async (collectionId) => {
    try {
      const result = await storefront.query(COLLECTION_QUERY, {
        variables: { id: collectionId, first: 4 },
      });
      return result.collection as Collection;
    } catch (error) {
      console.error(`Error fetching collection ${collectionId}:`, error);
      return null;
    }
  });

  const collections = (await Promise.all(collectionPromises)).filter(
    (c): c is Collection => c !== null
  );

  return {
    featuredProduct,
    collections,
  } satisfies PurchaseLoaderData;
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { cart } = context;
  const formData = await request.formData();
  const variantId = formData.get('variantId') as string;

  if (!variantId) {
    return Response.json({ error: 'Variant ID is required' }, { status: 400 });
  }

  try {
    const result = await cart.addLines([
      {
        merchandiseId: variantId,
        quantity: 1,
      },
    ]);

    if (result?.cart?.checkoutUrl) {
      // Redirect to checkout
      return redirect(result.cart.checkoutUrl);
    }

    // If no checkout URL, return success (item added to cart)
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return Response.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

function formatPrice(amount: string, currencyCode: string): string {
  const numAmount = parseFloat(amount);
  const symbol = currencyCode === 'EUR' ? '€' : currencyCode === 'USD' ? '$' : currencyCode === 'GBP' ? '£' : '';
  return `${symbol}${numAmount.toFixed(2)}`;
}

function ProductDetailSection({ product }: { product: Product }) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants.nodes[0]?.id || ''
  );
  const fetcher = useFetcher();
  const isAddingToCart = fetcher.state !== 'idle';

  const selectedVariant = product.variants.nodes.find((v) => v.id === selectedVariantId) || product.variants.nodes[0];
  const displayImage = selectedVariant?.image || product.featuredImage;
  const displayPrice = selectedVariant?.price || {
    amount: product.priceRange.minVariantPrice.amount,
    currencyCode: product.priceRange.minVariantPrice.currencyCode,
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !selectedVariant.availableForSale) return;
    fetcher.submit(
      { variantId: selectedVariant.id },
      { method: 'post' }
    );
  };

  return (
    <Container topPadding="md" bottomPadding="md">
      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-32">
        {/* Left Column - Product Image */}
        <div className="order-1">
          {displayImage && (
            <div className="w-full overflow-hidden rounded-lg bg-white/5">
              <Image
                data={{
                  url: displayImage.url,
                  altText: displayImage.altText || product.title,
                  width: displayImage.width || 800,
                  height: displayImage.height || 800,
                }}
                width={displayImage.width || 800}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
        </div>

        {/* Right Column - Product Details */}
        <div className="order-2 flex flex-col gap-24">
          {/* Title */}
          <h1 className="text-32 font-700 text-white">{product.title}</h1>

          {/* Price */}
          <div className="text-24 font-600 text-white">
            {formatPrice(displayPrice.amount, displayPrice.currencyCode)}
            {selectedVariant?.compareAtPrice && (
              <span className="ml-12 text-18 text-grey-light line-through">
                {formatPrice(selectedVariant.compareAtPrice.amount, selectedVariant.compareAtPrice.currencyCode)}
              </span>
            )}
          </div>

          {/* Variants */}
          {product.options.length > 0 && (
            <div className="flex flex-col gap-16">
              {product.options.map((option) => (
                <div key={option.name} className="flex flex-col gap-8">
                  <label className="text-16 font-600 text-white">{option.name}</label>
                  <div className="flex flex-wrap gap-8">
                    {option.values.map((value) => {
                      // Find variant that matches this option value
                      const matchingVariant = product.variants.nodes.find((v) =>
                        v.selectedOptions.some(
                          (opt) => opt.name === option.name && opt.value === value
                        )
                      );
                      const isSelected = selectedVariant?.selectedOptions.some(
                        (opt) => opt.name === option.name && opt.value === value
                      );
                      const isAvailable = matchingVariant?.availableForSale ?? true;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            if (matchingVariant) {
                              setSelectedVariantId(matchingVariant.id);
                            }
                          }}
                          disabled={!isAvailable}
                          className={`px-16 py-8 rounded-lg text-14 font-500 transition-colors ${
                            isSelected
                              ? 'bg-brand-light text-white'
                              : 'bg-white/10 text-grey-light hover:bg-white/15 hover:text-white'
                          } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            variant="blue"
            shape="rectangle"
            onClick={handleAddToCart}
            disabled={!selectedVariant || !selectedVariant.availableForSale || isAddingToCart}
            loading={isAddingToCart}
            className="w-full py-16 text-18"
          >
            {isAddingToCart
              ? 'Adding to cart...'
              : selectedVariant?.availableForSale
              ? 'Add to Cart'
              : 'Sold Out'}
          </Button>
        </div>
      </div>
    </Container>
  );
}

function ProductCard({ product }: { product: CollectionProduct }) {
  const fetcher = useFetcher();
  const isAddingToCart = fetcher.state !== 'idle';
  const firstVariant = product.variants.nodes[0];
  const price = product.priceRange.minVariantPrice;

  const handleAddToCart = () => {
    if (!firstVariant || !firstVariant.availableForSale) return;
    fetcher.submit(
      { variantId: firstVariant.id },
      { method: 'post' }
    );
  };

  return (
    <div className="flex flex-col gap-16">
      {/* Product Image */}
      {product.featuredImage && (
        <div className="w-full overflow-hidden rounded-lg bg-white/5">
          <Image
            data={{
              url: product.featuredImage.url,
              altText: product.featuredImage.altText || product.title,
              width: product.featuredImage.width || 400,
              height: product.featuredImage.height || 400,
            }}
            width={product.featuredImage.width || 400}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* Title */}
      <h3 className="text-18 font-600 text-white">{product.title}</h3>

      {/* Price */}
      <div className="text-20 font-600 text-white">
        {formatPrice(price.amount, price.currencyCode)}
      </div>

      {/* Add to Cart Button */}
      <Button
        variant="blue"
        shape="rectangle"
        onClick={handleAddToCart}
        disabled={!firstVariant || !firstVariant.availableForSale || isAddingToCart}
        loading={isAddingToCart}
        className="w-full py-12 text-16"
      >
        {isAddingToCart
          ? 'Adding...'
          : firstVariant?.availableForSale
          ? 'Add to Cart'
          : 'Sold Out'}
      </Button>
    </div>
  );
}

function CollectionSection({ collection }: { collection: Collection }) {
  // Ensure we always show 4 columns, padding with empty divs if needed
  const products = collection.products.nodes;
  const emptySlots = Math.max(0, 4 - products.length);

  return (
    <Container topPadding="md" bottomPadding="md">
      <div className="flex flex-col gap-24">
        {/* Collection Title */}
        <h2 className="text-28 font-700 text-white">{collection.title}</h2>

        {/* Products Grid - Always 4 columns */}
        <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-24">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {/* Empty slots to maintain 4-column layout */}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <div key={`empty-${index}`} className="flex flex-col gap-16">
              {/* Empty card to maintain grid structure */}
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}

export default function PurchasePage() {
  const { featuredProduct, collections } = useLoaderData<PurchaseLoaderData>();

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Featured Product Section */}
      {featuredProduct && <ProductDetailSection product={featuredProduct} />}

      {/* Collection Sections */}
      {collections.map((collection) => (
        <CollectionSection key={collection.id} collection={collection} />
      ))}
    </div>
  );
}

