/**
 * Translation Sync Script
 *
 * Syncs translation keys from app/lib/translations/keys.ts to Shopify metaobjects.
 *
 * This script:
 * 1. Parses TRANSLATION_KEYS from keys.ts to get all defined keys and default values
 * 2. Queries Shopify Admin API for existing Translation metaobjects
 * 3. Compares to find:
 *    - Missing keys (will be created in Shopify)
 *    - Differing values (shows info only - Shopify is source of truth)
 *    - Extra keys in Shopify (shows info only)
 * 4. Creates new metaobjects for missing keys
 *
 * Usage:
 *   npx tsx scripts/sync-translations.ts             # Show status and create missing
 *   npx tsx scripts/sync-translations.ts --dry-run   # Show status only, don't create
 *   npx tsx scripts/sync-translations.ts --status    # Show status only (same as --dry-run)
 *
 * Environment variables (from .env.local):
 *   PRIVATE_ADMIN_API_TOKEN - Shopify Admin API token
 *   PUBLIC_STORE_DOMAIN - Shopify store domain (e.g., guruconnect-108.myshopify.com)
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Configuration
// ============================================================================

const SHOPIFY_API_VERSION = '2024-10';
const METAOBJECT_TYPE = 'translation';
const BATCH_SIZE = 25; // How many to create at a time (to avoid rate limits)
const RATE_LIMIT_DELAY_MS = 500; // Delay between batches

// ============================================================================
// Environment Setup
// ============================================================================

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local file not found');
    process.exit(1);
  }

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

const SHOPIFY_ADMIN_API_TOKEN = process.env.PRIVATE_ADMIN_API_TOKEN!;
const SHOPIFY_STORE_DOMAIN = process.env.PUBLIC_STORE_DOMAIN!;

// CLI flags
const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('--status');
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');

// ============================================================================
// Types
// ============================================================================

interface TranslationEntry {
  key: string;
  value: string;
}

interface ShopifyMetaobject {
  id: string;
  handle: string;
  fields: Array<{
    key: string;
    value: string | null;
  }>;
}

interface SyncResult {
  missing: TranslationEntry[]; // Keys in keys.ts but not in Shopify
  differing: Array<{
    key: string;
    keysValue: string;
    shopifyValue: string;
  }>; // Keys where values differ
  extraInShopify: string[]; // Keys in Shopify but not in keys.ts
  matching: string[]; // Keys that match exactly
}

// ============================================================================
// Parse keys.ts
// ============================================================================

function parseTranslationKeys(): Map<string, string> {
  const keysPath = path.join(process.cwd(), 'app/lib/translations/keys.ts');

  if (!fs.existsSync(keysPath)) {
    console.error('Error: keys.ts not found at', keysPath);
    process.exit(1);
  }

  const content = fs.readFileSync(keysPath, 'utf-8');

  // Extract the TRANSLATION_KEYS object content
  const match = content.match(/export const TRANSLATION_KEYS\s*=\s*\{([\s\S]*?)\}\s*as const;/);
  if (!match) {
    console.error('Error: Could not find TRANSLATION_KEYS in keys.ts');
    process.exit(1);
  }

  const objectContent = match[1];
  const translations = new Map<string, string>();

  // Parse each key-value pair
  // Matches: key: 'value', or key: "value",
  // Handles multi-line values and escaped quotes
  const keyValueRegex = /^\s*(\w+):\s*(['"`])((?:[^'"`\\]|\\.|[\s\S])*?)\2,?\s*$/gm;

  let kvMatch;
  while ((kvMatch = keyValueRegex.exec(objectContent)) !== null) {
    const key = kvMatch[1];
    let value = kvMatch[3];

    // Unescape the value
    value = value
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\\\/g, '\\');

    translations.set(key, value);
  }

  // Also handle template literals and complex values more carefully
  // Re-scan for any keys we might have missed
  const simpleKeyRegex = /^\s*(\w+):\s*/gm;
  let simpleMatch;
  const foundKeys = new Set(translations.keys());

  while ((simpleMatch = simpleKeyRegex.exec(objectContent)) !== null) {
    const key = simpleMatch[1];
    if (!foundKeys.has(key)) {
      // Try to extract the value more carefully
      const startIndex = simpleMatch.index + simpleMatch[0].length;
      const valueMatch = objectContent.slice(startIndex).match(/^(['"`])((?:[^'"`\\]|\\.)*)\1/);
      if (valueMatch) {
        let value = valueMatch[2];
        value = value
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\\\/g, '\\');
        translations.set(key, value);
      }
    }
  }

  return translations;
}

// ============================================================================
// Shopify Admin API
// ============================================================================

async function shopifyGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify API error: ${response.status} - ${text}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`);
  }

  return data.data;
}

/**
 * Fetch all Translation metaobjects from Shopify
 * Uses pagination to handle >250 objects
 */
async function fetchAllTranslations(): Promise<Map<string, { value: string; id: string }>> {
  const translations = new Map<string, { value: string; id: string }>();
  let cursor: string | null = null;
  let hasMore = true;

  console.log('Fetching existing translations from Shopify...');

  while (hasMore) {
    const query = `
      query GetTranslations($cursor: String) {
        metaobjects(first: 250, type: "${METAOBJECT_TYPE}", after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            handle
            fields {
              key
              value
            }
          }
        }
      }
    `;

    const data = await shopifyGraphQL<{
      metaobjects: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: ShopifyMetaobject[];
      };
    }>(query, { cursor });

    for (const node of data.metaobjects.nodes) {
      const keyField = node.fields.find((f) => f.key === 'key');
      const textField = node.fields.find((f) => f.key === 'text');

      if (keyField?.value) {
        // Normalize key: replace spaces with underscores (Shopify might have spaces)
        const normalizedKey = keyField.value.replace(/\s+/g, '_');
        translations.set(normalizedKey, {
          value: textField?.value || '',
          id: node.id,
        });
      }
    }

    hasMore = data.metaobjects.pageInfo.hasNextPage;
    cursor = data.metaobjects.pageInfo.endCursor;

    if (hasMore) {
      process.stdout.write('.');
    }
  }

  console.log(` Found ${translations.size} translations in Shopify.`);
  return translations;
}

/**
 * Create a single Translation metaobject in Shopify
 */
async function createTranslation(
  key: string,
  value: string
): Promise<{ success: boolean; error?: string }> {
  const mutation = `
    mutation CreateTranslation($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject {
          id
          handle
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const variables = {
    metaobject: {
      type: METAOBJECT_TYPE,
      fields: [
        { key: 'key', value: key },
        { key: 'text', value: value },
      ],
    },
  };

  try {
    const data = await shopifyGraphQL<{
      metaobjectCreate: {
        metaobject: { id: string; handle: string } | null;
        userErrors: Array<{ field: string[]; message: string; code: string }>;
      };
    }>(mutation, variables);

    if (data.metaobjectCreate.userErrors.length > 0) {
      return {
        success: false,
        error: data.metaobjectCreate.userErrors.map((e) => e.message).join(', '),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Comparison Logic
// ============================================================================

function compareTranslations(
  keysTs: Map<string, string>,
  shopify: Map<string, { value: string; id: string }>
): SyncResult {
  const result: SyncResult = {
    missing: [],
    differing: [],
    extraInShopify: [],
    matching: [],
  };

  // Check each key from keys.ts
  for (const [key, keysValue] of keysTs) {
    const shopifyEntry = shopify.get(key);

    if (!shopifyEntry) {
      // Key missing from Shopify
      result.missing.push({ key, value: keysValue });
    } else if (shopifyEntry.value !== keysValue) {
      // Values differ
      result.differing.push({
        key,
        keysValue,
        shopifyValue: shopifyEntry.value,
      });
    } else {
      // Perfect match
      result.matching.push(key);
    }
  }

  // Check for extra keys in Shopify (not in keys.ts)
  for (const key of shopify.keys()) {
    if (!keysTs.has(key)) {
      result.extraInShopify.push(key);
    }
  }

  return result;
}

// ============================================================================
// Display Functions
// ============================================================================

function printSummary(result: SyncResult) {
  console.log('\n' + '='.repeat(70));
  console.log('TRANSLATION SYNC STATUS');
  console.log('='.repeat(70));

  console.log(`\n  Matching:         ${result.matching.length} keys`);
  console.log(`  Missing:          ${result.missing.length} keys (to be created)`);
  console.log(`  Differing values: ${result.differing.length} keys (Shopify is source of truth)`);
  console.log(`  Extra in Shopify: ${result.extraInShopify.length} keys (not in keys.ts)`);
}

function printMissing(missing: TranslationEntry[]) {
  if (missing.length === 0) return;

  console.log('\n' + '-'.repeat(70));
  console.log('MISSING KEYS (will be created in Shopify)');
  console.log('-'.repeat(70));

  for (const entry of missing) {
    const displayValue =
      entry.value.length > 50 ? entry.value.substring(0, 50) + '...' : entry.value;
    console.log(`  + ${entry.key}`);
    if (VERBOSE) {
      console.log(`    Default: "${displayValue}"`);
    }
  }
}

function printDiffering(
  differing: Array<{ key: string; keysValue: string; shopifyValue: string }>
) {
  if (differing.length === 0) return;

  console.log('\n' + '-'.repeat(70));
  console.log('DIFFERING VALUES (Shopify is source of truth - no action taken)');
  console.log('-'.repeat(70));

  for (const entry of differing) {
    console.log(`  ~ ${entry.key}`);
    if (VERBOSE) {
      const keysDisplay =
        entry.keysValue.length > 40 ? entry.keysValue.substring(0, 40) + '...' : entry.keysValue;
      const shopifyDisplay =
        entry.shopifyValue.length > 40
          ? entry.shopifyValue.substring(0, 40) + '...'
          : entry.shopifyValue;
      console.log(`    keys.ts:  "${keysDisplay}"`);
      console.log(`    Shopify:  "${shopifyDisplay}"`);
    }
  }
}

function printExtra(extra: string[]) {
  if (extra.length === 0) return;

  console.log('\n' + '-'.repeat(70));
  console.log('EXTRA IN SHOPIFY (not in keys.ts - consider adding or removing)');
  console.log('-'.repeat(70));

  for (const key of extra) {
    console.log(`  ? ${key}`);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Translation Sync Script');
  console.log('='.repeat(70));

  // Validate environment
  if (!SHOPIFY_ADMIN_API_TOKEN) {
    console.error('Error: PRIVATE_ADMIN_API_TOKEN not set in .env.local');
    process.exit(1);
  }
  if (!SHOPIFY_STORE_DOMAIN) {
    console.error('Error: PUBLIC_STORE_DOMAIN not set in .env.local');
    process.exit(1);
  }

  console.log(`Store: ${SHOPIFY_STORE_DOMAIN}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'SYNC (will create missing keys)'}`);
  console.log('');

  // Step 1: Parse keys.ts
  console.log('Parsing app/lib/translations/keys.ts...');
  const keysTs = parseTranslationKeys();
  console.log(`Found ${keysTs.size} keys in keys.ts`);

  // Step 2: Fetch from Shopify
  const shopifyTranslations = await fetchAllTranslations();

  // Step 3: Compare
  const result = compareTranslations(keysTs, shopifyTranslations);

  // Step 4: Print status
  printSummary(result);
  printMissing(result.missing);
  printDiffering(result.differing);
  printExtra(result.extraInShopify);

  // Step 5: Create missing keys (if not dry run)
  if (result.missing.length > 0 && !DRY_RUN) {
    console.log('\n' + '='.repeat(70));
    console.log('CREATING MISSING TRANSLATIONS');
    console.log('='.repeat(70));

    let created = 0;
    let failed = 0;
    const errors: Array<{ key: string; error: string }> = [];

    for (let i = 0; i < result.missing.length; i++) {
      const entry = result.missing[i];
      const progress = `[${i + 1}/${result.missing.length}]`;

      process.stdout.write(`${progress} Creating "${entry.key}"... `);

      const createResult = await createTranslation(entry.key, entry.value);

      if (createResult.success) {
        console.log('OK');
        created++;
      } else {
        console.log(`FAILED: ${createResult.error}`);
        failed++;
        errors.push({ key: entry.key, error: createResult.error || 'Unknown error' });
      }

      // Rate limiting
      if ((i + 1) % BATCH_SIZE === 0 && i + 1 < result.missing.length) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
      }
    }

    console.log('\n' + '-'.repeat(70));
    console.log(`Created: ${created}`);
    console.log(`Failed: ${failed}`);

    if (errors.length > 0) {
      console.log('\nFailed keys:');
      for (const err of errors) {
        console.log(`  - ${err.key}: ${err.error}`);
      }
    }
  } else if (result.missing.length > 0 && DRY_RUN) {
    console.log('\n[DRY RUN] Would create', result.missing.length, 'new translations.');
    console.log('Run without --dry-run to create them.');
  } else {
    console.log('\nAll keys are already in Shopify!');
  }

  console.log('\n' + '='.repeat(70));
  console.log('Done!');
  console.log('='.repeat(70));
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
