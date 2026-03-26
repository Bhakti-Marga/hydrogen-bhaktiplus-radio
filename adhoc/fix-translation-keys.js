// fix-translation-keys.js
// ADHOC SCRIPT TO FIX translation keys in shopify
const SHOPIFY_DOMAIN = 'xxx.myshopify.com';
const ACCESS_TOKEN = 'xxx';
const API_VERSION = '2024-01';

// GraphQL query to get shop locales
const GET_SHOP_LOCALES_QUERY = `
  query GetShopLocales {
    shopLocales {
      locale
      name
      primary
      published
    }
  }
`;

// GraphQL query to get translatable content with digest
const GET_TRANSLATABLES_QUERY = `
  query GetTranslatables($resourceId: ID!) {
    translatableResource(resourceId: $resourceId) {
      resourceId
      translatableContent {
        key
        value
        digest
        locale
      }
    }
  }
`;

// GraphQL query to get all Translation metaobjects with their English keys
const GET_TRANSLATIONS_QUERY = `
  query GetTranslations($cursor: String) {
    metaobjects(first: 50, type: "translation", after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        fields {
          key
          value
        }
      }
    }
  }
`;

// GraphQL mutation to update a metaobject field translation
const UPDATE_TRANSLATION_MUTATION = `
  mutation UpdateMetaobjectTranslation($id: ID!, $key: String!, $locale: String!, $value: String!, $digest: String!) {
    translationsRegister(
      resourceId: $id
      translations: [
        {
          key: $key
          value: $value
          locale: $locale
          translatableContentDigest: $digest
        }
      ]
    ) {
      userErrors {
        message
        field
      }
      translations {
        key
        locale
        value
      }
    }
  }
`;

// Track API cost usage
let totalCost = 0;
let requestCount = 0;
let lastThrottleStatus = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function shopifyGraphQL(query, variables = {}) {
  const response = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  const json = await response.json();

  // Track API cost and auto-delay if needed
  if (json.extensions?.cost) {
    const cost = json.extensions.cost;
    requestCount++;
    totalCost += cost.actualQueryCost || 0;
    lastThrottleStatus = cost.throttleStatus;

    console.log(`\n[API Cost] Request #${requestCount}`);
    console.log(`  Requested: ${cost.requestedQueryCost}`);
    console.log(`  Actual: ${cost.actualQueryCost}`);
    console.log(`  Throttle Status: ${cost.throttleStatus.currentlyAvailable}/${cost.throttleStatus.maximumAvailable}`);
    console.log(`  Restore Rate: ${cost.throttleStatus.restoreRate}/sec`);
    console.log(`  Total Cost So Far: ${totalCost}`);

    // Calculate delay based on actual cost and available points
    const { currentlyAvailable, maximumAvailable, restoreRate } = cost.throttleStatus;
    const actualCost = cost.actualQueryCost;

    // If we're below 50% capacity, add a delay to let the bucket refill
    const usagePercent = ((maximumAvailable - currentlyAvailable) / maximumAvailable) * 100;

    if (usagePercent > 50) {
      // Calculate how long to wait to restore the cost we just used
      const delayMs = (actualCost / restoreRate) * 1000;
      console.log(`  ⏱️  Usage at ${usagePercent.toFixed(1)}% - waiting ${delayMs.toFixed(0)}ms to restore ${actualCost} points`);
      await sleep(delayMs);
    } else {
      // Small delay to avoid hitting rate limits on network/server side
      const minDelay = 100;
      console.log(`  ⏱️  Usage at ${usagePercent.toFixed(1)}% - minimal delay (${minDelay}ms)`);
      await sleep(minDelay);
    }
  }

  if (json.errors) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

async function getAllTranslations() {
  let allMetaobjects = [];
  let cursor = null;
  let hasNextPage = true;

  console.log('Fetching all Translation metaobjects...');

  while (hasNextPage) {
    const data = await shopifyGraphQL(GET_TRANSLATIONS_QUERY, { cursor });
    allMetaobjects = allMetaobjects.concat(data.metaobjects.nodes);

    hasNextPage = data.metaobjects.pageInfo.hasNextPage;
    cursor = data.metaobjects.pageInfo.endCursor;

    console.log(`  Fetched ${allMetaobjects.length} metaobjects...`);
  }

  return allMetaobjects;
}

async function getShopLocales() {
  console.log('Fetching shop locales...\n');
  const data = await shopifyGraphQL(GET_SHOP_LOCALES_QUERY);
  return data.shopLocales;
}

async function getAllTranslatableContent(metaobjects) {
  console.log('\nFetching translatable content (digests) for all metaobjects...');

  const translatableCache = new Map();

  for (let i = 0; i < metaobjects.length; i++) {
    const metaobject = metaobjects[i];

    const translatableData = await shopifyGraphQL(GET_TRANSLATABLES_QUERY, {
      resourceId: metaobject.id,
    });

    const translatableContent = translatableData.translatableResource?.translatableContent || [];
    translatableCache.set(metaobject.id, translatableContent);

    if ((i + 1) % 10 === 0 || i === metaobjects.length - 1) {
      console.log(`  Fetched ${i + 1}/${metaobjects.length} translatable contents...`);
    }
  }

  return translatableCache;
}

async function fixTranslationKeys() {
  // First, get the shop locales
  const shopLocales = await getShopLocales();

  console.log('Shop Locales:');
  console.log(JSON.stringify(shopLocales, null, 2));

  // Extract published locale codes (excluding the primary/English locale)
  const locales = shopLocales
    .filter(sl => sl.published && !sl.primary)
    .map(sl => sl.locale);

  console.log('\nLocales to update:', locales);
  console.log('\n⚠️  Stopping here to show locales. Comment out the return below to continue.\n');

  const metaobjects = await getAllTranslations();

  console.log(`\nFound ${metaobjects.length} Translation metaobjects\n`);

  // Fetch all translatable content (digests) upfront
  const translatableCache = await getAllTranslatableContent(metaobjects);

  console.log(`\nCached translatable content for ${translatableCache.size} metaobjects\n`);

  // Loop over locales first, then metaobjects
  for (const locale of locales) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing locale: ${locale}`);
    console.log(`${'='.repeat(60)}\n`);

    for (let i = 0; i < metaobjects.length; i++) {
      const metaobject = metaobjects[i];

      // Get the English key value
      const keyField = metaobject.fields.find(f => f.key === 'key');
      const englishKey = keyField?.value;

      if (!englishKey) {
        console.log(`[${i + 1}/${metaobjects.length}] Skipping ${metaobject.id} - no English key`);
        continue;
      }

      try {
        console.log(`\nAttempting to update:`);
        console.log(`  Metaobject ID: ${metaobject.id}`);
        console.log(`  English Key: ${englishKey}`);
        console.log(`  Locale: ${locale}`);

        // Get the digest from cache
        const translatableContent = translatableCache.get(metaobject.id) || [];
        const keyFieldContent = translatableContent.find(tc => tc.key === 'key');

        if (!keyFieldContent) {
          console.log(`  ✗ Could not find translatable content for 'key' field`);
          continue;
        }

        console.log(`  Digest: ${keyFieldContent.digest}`);

        const result = await shopifyGraphQL(UPDATE_TRANSLATION_MUTATION, {
          id: metaobject.id,
          key: 'key', // The field name in the metaobject
          locale: locale,
          value: englishKey, // Set to English key value
          digest: keyFieldContent.digest,
        });

        if (result.translationsRegister.userErrors.length > 0) {
          console.log(`\n✗ Error:`, result.translationsRegister.userErrors[0].message);
          console.log(`Full error:`, JSON.stringify(result.translationsRegister.userErrors, null, 2));
        } else {
          console.log(`\n✓ Success! Updated key for ${locale}`);
          console.log(`Result:`, JSON.stringify(result.translationsRegister.translations, null, 2));
        }
      } catch (error) {
        console.error(`\n✗ Failed to update:`, error.message);
        console.error(`Full error:`, error);
        return; // Stop on error
      }
    }
  }
}

fixTranslationKeys()
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('API Usage Summary');
    console.log('='.repeat(60));
    console.log(`Total Requests: ${requestCount}`);
    console.log(`Total Cost: ${totalCost} points`);
    console.log(`Average Cost per Request: ${requestCount > 0 ? (totalCost / requestCount).toFixed(2) : 0} points`);
    console.log('='.repeat(60) + '\n');
  })
  .catch(console.error);
