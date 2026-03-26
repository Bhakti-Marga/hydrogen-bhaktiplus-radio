/**
 * One-time script to create Shopify products for all Talks from the Media API
 *
 * Creates DRAFT products without SKUs - you'll need to manually:
 * 1. Assign SKUs to each product variant
 * 2. Set status to ACTIVE when ready
 *
 * Usage:
 *   npx tsx scripts/create-talk-products.ts
 *
 * Or dry-run first:
 *   npx tsx scripts/create-talk-products.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value !== undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFile();

// Configuration
const MEDIA_API_URL = process.env.MEDIA_API_URL!;
const MEDIA_API_KEY = process.env.MEDIA_API_KEY!;
const MEDIA_API_VERSION = process.env.MEDIA_API_VERSION || '2025-04-29';
const SHOPIFY_ADMIN_API_TOKEN = process.env.PRIVATE_ADMIN_API_TOKEN!;
const SHOPIFY_STORE_DOMAIN = process.env.PUBLIC_STORE_DOMAIN!;

const DRY_RUN = process.argv.includes('--dry-run');

// Price Configuration (in EUR)
const DEFAULT_PRICE = '50.00';
const NARASIMHA_PRICE = '100.00';

// Product Configuration
const PRODUCT_TYPE = 'Event / Talk / Full';
const VENDOR = 'Mediaplatform';
const PRODUCT_STATUS = 'DRAFT';

interface Talk {
  contentId: number;
  contentTypeId: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string;
  location: {
    id: number;
    countryCode: string;
    country: string;
    city: string;
    location: string;
  } | null;
  subscriptionTiers: string[];
  shopifyProductId: number | null;
  shopifyVariantId: number | null;
  ppvTag: string | null;
  video: {
    videoId: number;
    title: string;
    durationSeconds: number;
  } | null;
}

interface TalksResponse {
  talks: Talk[];
}

/**
 * Normalize a string to kebab-case for ppvTag
 */
function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate ppvTag from talk title
 */
function generatePpvTag(title: string): string {
  return `talk-${toKebabCase(title)}`;
}

/**
 * Determine price based on talk title
 */
function getPrice(title: string): string {
  if (title.toLowerCase().includes('narasimha')) {
    return NARASIMHA_PRICE;
  }
  return DEFAULT_PRICE;
}

/**
 * Fetch all talks from Media API
 */
async function fetchTalks(): Promise<Talk[]> {
  console.log('Fetching talks from Media API...');

  const response = await fetch(`${MEDIA_API_URL}/talks?locale=en-US&limit=100`, {
    headers: {
      'X-API-Key': MEDIA_API_KEY,
      'api_version': MEDIA_API_VERSION,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch talks: ${response.status} ${response.statusText}`);
  }

  const data: TalksResponse = await response.json();
  console.log(`Found ${data.talks.length} talks`);

  return data.talks;
}

// Sales channels to publish to
const REQUIRED_SALES_CHANNELS = ['Online Store', 'Hydrogen', 'Headless'];

/**
 * Get publication IDs for the required sales channels
 */
async function getPublicationIds(): Promise<{ name: string; id: string }[]> {
  const query = `
    query GetPublications {
      publications(first: 20) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `;

  const response = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch publications: ${response.status}`);
  }

  const data = await response.json();
  const publications = data.data.publications.edges;

  // Find required publications
  const found: { name: string; id: string }[] = [];
  const missing: string[] = [];

  for (const channelName of REQUIRED_SALES_CHANNELS) {
    const pub = publications.find((p: any) => p.node.name === channelName);
    if (pub) {
      found.push({ name: channelName, id: pub.node.id });
    } else {
      missing.push(channelName);
    }
  }

  if (missing.length > 0) {
    console.log('Available publications:', publications.map((p: any) => p.node.name));
    console.warn(`Warning: Could not find publications: ${missing.join(', ')}`);
  }

  return found;
}

/**
 * Publish a product to multiple sales channels
 */
async function publishToSalesChannels(
  productId: string,
  publications: { name: string; id: string }[]
): Promise<string[]> {
  const mutation = `
    mutation PublishProduct($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable {
          availablePublicationsCount {
            count
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: productId,
    input: publications.map((p) => ({ publicationId: p.id })),
  };

  const response = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
      },
      body: JSON.stringify({ query: mutation, variables }),
    }
  );

  if (!response.ok) {
    console.error(`  Failed to publish product: ${response.status}`);
    return [];
  }

  const data = await response.json();

  if (data.data?.publishablePublish?.userErrors?.length > 0) {
    console.error('  Publish errors:', data.data.publishablePublish.userErrors);
    return [];
  }

  return publications.map((p) => p.name);
}

/**
 * Create a Shopify product for a talk
 */
async function createShopifyProduct(
  talk: Talk
): Promise<{ productId: string; variantId: string } | null> {
  const ppvTag = generatePpvTag(talk.title);
  const price = getPrice(talk.title);

  console.log(`\nCreating product for: "${talk.title}"`);
  console.log(`  Price: €${price}`);
  console.log(`  ppvTag: ${ppvTag}`);
  console.log(`  Status: ${PRODUCT_STATUS}`);

  if (DRY_RUN) {
    console.log('  [DRY RUN] Skipping actual creation');
    return null;
  }

  const mutation = `
    mutation CreateTalkProduct($input: ProductSetInput!) {
      productSet(input: $input) {
        product {
          id
          title
          variants(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      title: talk.title,
      descriptionHtml: talk.description || `<p>${talk.title}</p>`,
      handle: talk.slug,
      productType: PRODUCT_TYPE,
      vendor: VENDOR,
      status: PRODUCT_STATUS,
      metafields: [
        {
          namespace: 'custom',
          key: 'payperview_tag',
          value: ppvTag,
          type: 'single_line_text_field',
        },
      ],
      productOptions: [
        {
          name: 'Title',
          values: [{ name: 'Default Title' }],
        },
      ],
      variants: [
        {
          optionValues: [
            {
              optionName: 'Title',
              name: 'Default Title',
            },
          ],
          price: price,
        },
      ],
    },
  };

  const response = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
      },
      body: JSON.stringify({ query: mutation, variables }),
    }
  );

  if (!response.ok) {
    console.error(`  Failed to create product: ${response.status} ${response.statusText}`);
    return null;
  }

  const data = await response.json();

  if (data.errors) {
    console.error('  GraphQL errors:', data.errors);
    return null;
  }

  if (data.data.productSet.userErrors?.length > 0) {
    console.error('  User errors:', data.data.productSet.userErrors);
    return null;
  }

  const product = data.data.productSet.product;
  const productId = product.id;
  const variantId = product.variants.edges[0]?.node.id;

  console.log(`  Created! Product ID: ${productId}`);

  return { productId, variantId };
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Create Shopify Products for Talks');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('\n*** DRY RUN MODE - No products will be created ***\n');
  }

  // Validate environment
  if (!MEDIA_API_URL || !MEDIA_API_KEY) {
    throw new Error('Missing MEDIA_API_URL or MEDIA_API_KEY in environment');
  }
  if (!SHOPIFY_ADMIN_API_TOKEN || !SHOPIFY_STORE_DOMAIN) {
    throw new Error('Missing SHOPIFY_ADMIN_API_TOKEN or SHOPIFY_STORE_DOMAIN in environment');
  }

  console.log(`Media API: ${MEDIA_API_URL}`);
  console.log(`Shopify Store: ${SHOPIFY_STORE_DOMAIN}`);
  console.log(`Default Price: €${DEFAULT_PRICE}`);
  console.log(`Narasimha Price: €${NARASIMHA_PRICE}`);
  console.log(`Product Status: ${PRODUCT_STATUS} (SKUs will need to be set manually)`);
  console.log('');

  // Fetch talks
  const talks = await fetchTalks();

  // Filter out talks that already have a Shopify product
  const talksWithoutProducts = talks.filter((talk) => !talk.shopifyProductId);
  console.log(`\n${talksWithoutProducts.length} talks need products created`);

  if (talksWithoutProducts.length === 0) {
    console.log('No new products to create!');
    return;
  }

  // Get publication IDs for sales channels
  let publications: { name: string; id: string }[] = [];
  if (!DRY_RUN) {
    console.log('\nFetching publication IDs for sales channels...');
    publications = await getPublicationIds();
    console.log(`Found ${publications.length} sales channels: ${publications.map((p) => p.name).join(', ')}`);
  }

  // Create products
  const results: Array<{
    talk: Talk;
    productId: string | null;
    variantId: string | null;
    ppvTag: string;
    publishedTo: string[];
  }> = [];

  for (let i = 0; i < talksWithoutProducts.length; i++) {
    const talk = talksWithoutProducts[i];
    const ppvTag = generatePpvTag(talk.title);

    const result = await createShopifyProduct(talk);

    let publishedTo: string[] = [];
    if (result && publications.length > 0) {
      publishedTo = await publishToSalesChannels(result.productId, publications);
      if (publishedTo.length > 0) {
        console.log(`  Published to: ${publishedTo.join(', ')}`);
      }
    }

    results.push({
      talk,
      productId: result?.productId || null,
      variantId: result?.variantId || null,
      ppvTag,
      publishedTo,
    });

    // Small delay to avoid rate limiting
    if (!DRY_RUN) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const created = results.filter((r) => r.productId);
  const failed = results.filter((r) => !r.productId && !DRY_RUN);

  console.log(`\nTotal talks processed: ${results.length}`);
  if (!DRY_RUN) {
    console.log(`Successfully created: ${created.length}`);
    console.log(`Published to sales channels: ${results.filter(r => r.publishedTo.length > 0).length}`);
    console.log(`Failed: ${failed.length}`);
  }

  // Output mapping for updating Media API database
  console.log('\n--- Mapping for MediaPlatform Database Update ---');
  console.log('ContentId | ppvTag | ShopifyProductId | ShopifyVariantId');
  console.log('-'.repeat(80));

  for (const result of results) {
    const productIdNum = result.productId
      ? result.productId.replace('gid://shopify/Product/', '')
      : 'N/A';
    const variantIdNum = result.variantId
      ? result.variantId.replace('gid://shopify/ProductVariant/', '')
      : 'N/A';

    console.log(
      `${result.talk.contentId} | ${result.ppvTag} | ${productIdNum} | ${variantIdNum}`
    );
  }

  // Generate SQL update statements
  if (!DRY_RUN && created.length > 0) {
    console.log('\n--- SQL UPDATE Statements for MediaPlatform Database ---');
    console.log('-- NOTE: PpvTag is NOT stored on MediaPlatContent.');
    console.log('-- It is read from ShopifyProduct.PayPerViewTag (synced from Shopify metafield).');
    console.log('-- Make sure BM_ShopifyApp syncs these products first!\n');

    for (const result of created) {
      const productIdNum = result.productId!.replace('gid://shopify/Product/', '');
      const variantIdNum = result.variantId!.replace('gid://shopify/ProductVariant/', '');

      console.log(`UPDATE MediaPlatContent SET ShopifyProductId = ${productIdNum}, ShopifyVariantId = ${variantIdNum} WHERE Id = ${result.talk.contentId};`);
    }

    console.log('\n-- After BM_ShopifyApp syncs, verify PayPerViewTag on ShopifyProduct:');
    console.log('-- SELECT Id, Title, PayPerViewTag FROM ShopifyProduct WHERE Id IN (' +
      created.map(r => r.productId!.replace('gid://shopify/Product/', '')).join(', ') + ');');
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
