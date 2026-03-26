# Translation System Documentation

This document explains how translations work in the Hydrogen application. **There are two distinct translation systems** that serve different purposes.

## Two Translation Systems

### 1. UI/Static Translations (Shopify Metaobjects)
**Purpose**: Interface text, labels, buttons, section titles
**Source**: Shopify Admin metaobjects
**Examples**: "Latest Releases", "Watch LIVE", "Continue Watching"

### 2. Content Translations (Media Platform CMS)
**Purpose**: Dynamic content like video titles, descriptions, categories
**Source**: Media Platform CMS database
**Examples**: Satsang titles, video descriptions, category names

---

## System 1: UI/Static Translations

### Overview
Static interface translations use **Shopify metaobjects** as the source of truth for all user-facing UI text. This allows content editors to manage interface translations directly in Shopify Admin without touching code.

### Architecture Flow
```
Shopify Metaobjects → GraphQL Query → Root Loader → Context Provider → Components
```

### 1. Source: Shopify Metaobjects

### Location
**Shopify Admin** → **Content** → **Metaobjects** → **translation** type

### Structure
Each translation is a metaobject with two fields:
- **key**: The identifier used in code (e.g., `homepage latest releases title`)
- **text**: The actual display text (e.g., `Latest Releases`)

### Example Metaobject
```
Type: translation
Fields:
  - key: "homepage latest releases title"
  - text: "Latest Releases"
```

### Key Naming Convention
- **IMPORTANT**: Use underscores (not spaces) in Shopify metaobject keys
- Keys must EXACTLY match the keys defined in `app/lib/translations/keys.ts`
- Example: Use `homepage_latest_releases_title` (with underscores) in both Shopify and code

### 2. Data Fetching: GraphQL Query

### Query Location
`app/graphql/translations.query.ts`

### Query Structure
```graphql
query Translations($country: CountryCode, $language: LanguageCode, $cursor: String) 
  @inContext(language: $language, country: $country) {
  metaobjects(first: 250, type: "translation", after: $cursor) {
    nodes {
      fields {
        key    # The translation key
        value  # The translation text
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

The loader uses cursor-based pagination to fetch all translations when there are more than 250.

### Notes
- Uses pagination to fetch all translations (handles 250+ metaobjects)
- Fetched on every page load (cached by Shopify/CDN)

### 3. Root Loader Processing

### Location
`app/root.tsx:161-231`

### Processing Steps
1. Query Shopify for metaobjects of type "translation"
2. Transform the data structure:
   ```typescript
   const translations = {
     [locale]: {
       "homepage_latest_releases_title": "Latest Releases",
       "homepage_satsang_topic_title": "Watch Satsangs by topic",
       // ... more translations
     }
   };
   ```
3. Pass to TranslationsProvider

**Note**: Keys are now used directly with underscores. No space-to-underscore conversion occurs.

### Locale Detection
- Based on `storefront.i18n.language` from Shopify
- Supports multiple languages/countries
- Falls back to empty object if locale not found

### 4. Context Provider

### Location
`app/contexts/TranslationsProvider.tsx`

### Provider Setup
```typescript
<TranslationsProvider 
  translations={translations} 
  locale={currentLocale}
>
  {children}
</TranslationsProvider>
```

### Context Value
```typescript
{
  strings: TranslationDictionary  // Typed dictionary with all translation keys
}
```

**New in 2025**: The translation system now uses a typed dictionary defined in `app/lib/translations/keys.ts`. This provides:
- **Type safety**: TypeScript autocomplete for all keys
- **Fail-fast behavior**: App throws error if invalid key is accessed
- **Searchable keys**: All translation keys are searchable in the codebase
- **ESLint protection**: Dynamic lookups (e.g., `strings[variable]`) are prohibited

### 5. Component Usage

### Hook: useTranslations()
```typescript
import { useTranslations } from "~/contexts/TranslationsProvider";

function MyComponent() {
  const { strings } = useTranslations();
  
  return (
    <h1>{strings.homepage_latest_releases_title}</h1>
    // Renders: "Latest Releases"
  );
}
```

### Hook: useTranslation(key)
```typescript
import { useTranslation } from "~/contexts/TranslationsProvider";

function MyComponent() {
  const title = useTranslation("homepage_latest_releases_title");
  
  return <h1>{title}</h1>;
  // Renders: "Latest Releases" or the key itself if not found
}
```

### Fallback Behavior (3-Tier System)
1. **Current locale**: Returns value from Shopify for the user's locale
2. **English fallback**: If missing in current locale, returns English value from Shopify (with console warning)
3. **Hardcoded fallback**: If missing in both locales, returns default value from `app/lib/translations/keys.ts` (with console warning)

**Error Handling**:
- If an invalid key (not in `keys.ts`) is accessed, the app will **throw an error immediately**
- This fail-fast behavior prevents typos and ensures all translation keys are properly defined
- Console warnings alert developers when translations are missing from Shopify

## Common Translation Keys

### Homepage Sections (Core Users)
- `homepage_continue_watching_title` → "Continue Watching"
- `homepage_latest_releases_title` → "Latest Releases"
- `homepage_satsang_premium_title` → "Premium Content"
- `homepage_satsang_topic_title` → "Watch Satsangs by topic"
- `homepage_satsang_live_title` → "LIVE Satsangs"
- `homepage_satsang_god_title` → "God"
- `homepage_satsang_saints_title` → "Saints"
- `homepage_satsang_bhakti_title` → "Bhakti"
- `homepage_satsang_happiness_title` → "Happiness"
- `homepage_commentaries_scripture_title` → "Scripture Commentaries"

### Buttons & Actions
- `homepage_button_play` → "Play"
- `homepage_button_details` → "Details"
- `livestream_watch_live` → "Watch LIVE"

## Adding New Translations

**⚠️ IMPORTANT**: You must add translations in TWO places!

### 1. In Code First (`app/lib/translations/keys.ts`)
Add the key to the `TRANSLATION_KEYS` object:
```typescript
export const TRANSLATION_KEYS = {
  // ... existing keys
  my_new_translation_key: 'My New Translation Text',  // English fallback
} as const;
```

**Why define in code?**
- Provides TypeScript autocomplete and type safety
- Acts as a fallback if Shopify translations fail to load
- Documents all available translation keys in one place
- Prevents typos with compile-time checks

### 2. Sync to Shopify (Recommended)

Run the translation sync script to automatically create missing keys in Shopify:

```bash
# Check what would be created (dry run)
npx tsx scripts/sync-translations.ts --status

# Create missing translations in Shopify
npx tsx scripts/sync-translations.ts

# Verbose mode (shows default values)
npx tsx scripts/sync-translations.ts --verbose
```

The script will:
- Parse all keys from `app/lib/translations/keys.ts`
- Compare against existing Shopify metaobjects
- Create any missing translations with the default values from code
- Report differing values and extra keys in Shopify

**Required environment variables** (in `.env.local`):
- `PRIVATE_ADMIN_API_TOKEN` - Shopify Admin API token
- `PUBLIC_STORE_DOMAIN` - Store domain (e.g., `your-store.myshopify.com`)

### 2b. Manual Creation (Alternative)

If you prefer to add manually in Shopify Admin:
1. Go to **Content** → **Metaobjects**
2. Click **Add metaobject** of type "translation"
3. Fill in:
   - **key**: `my_new_translation_key` (exact match with code, using underscores)
   - **text**: `My New Translation Text` (English text)
4. Save
5. **For other locales**: Re-run the BM Shopify Translation Service to automatically translate the new metaobject to all supported languages

### 3. Use in Components
```typescript
const { strings } = useTranslations();

// ✅ Correct: Direct property access with autocomplete
const myText = strings.my_new_translation_key;

// ❌ Wrong: Dynamic lookup (ESLint will error)
const myText = strings[`my_new_translation_key`];
```

### 4. Deploy
- **Code changes**: Require deployment (for the key definition)
- **Shopify changes**: Take effect immediately (translations are fetched live)
- After initial key is deployed, you can update translations in Shopify without redeployment

## Multi-Language Support

### Current Implementation
- Single locale per request based on Shopify i18n settings
- Translations stored per language in Shopify
- Automatic locale detection from URL/headers

### Extending for Multiple Languages
1. Create translation metaobjects for each language in Shopify
2. Use language-specific GraphQL context
3. The system automatically handles different locales

## Performance Considerations

### Caching
- Translations cached by Shopify's CDN
- Root loader data cached by Remix
- No unnecessary re-fetching on navigation

### Optimization Tips
- Keep translation keys descriptive but concise
- Group related translations with consistent prefixes
- Consider lazy loading for large translation sets

## Debugging Translations

### Missing Translations
- Check browser console for key names
- Verify key exists in Shopify with exact spelling
- Check spaces vs underscores conversion

### Wrong Text Displaying
- Check Shopify metaobject "text" field
- Verify correct locale is selected
- Check browser language settings

### Common Issues
1. **Key not found**: Translation key doesn't exist in Shopify
2. **Wrong locale**: User's language doesn't match available translations
3. **Typos**: Mismatch between Shopify key and code usage
4. **Caching**: Old translations cached, clear browser/CDN cache

## Best Practices

### Key Naming
- Use descriptive, hierarchical names: `section_subsection_element_type`
- Example: `homepage_satsang_god_title`
- Keep consistent naming patterns across the app
- **Always use underscores**, never spaces
- Keys must be searchable with grep/search tools

### Content Management
- **Always define keys in code first** before adding to Shopify
- Use Shopify's built-in preview features
- Test translations across different screen sizes
- Consider character limits for different languages
- Add translations for all supported locales in Shopify

### Development
- **Never use dynamic lookups**: `strings[variable]` is prohibited by ESLint
- Always use direct property access: `strings.my_key`
- Never hardcode text in components
- All translation keys must be defined in `app/lib/translations/keys.ts`
- Group related translations logically with prefixes
- The hardcoded values in `keys.ts` are fallbacks only - production values come from Shopify

### Code Review Checklist
- [ ] New translation key added to `app/lib/translations/keys.ts`
- [ ] Translation metaobjects created in Shopify for all locales
- [ ] Keys match exactly between code and Shopify (including underscores)
- [ ] No dynamic lookups used (ESLint should catch these)
- [ ] TypeScript autocomplete works for the new key

---

## System 2: Content Translations (Media Platform CMS)

### Overview
Content translations are handled by the **Media Platform CMS** and contain the actual content data like video titles, descriptions, and category names. These translations are **not** managed through Shopify metaobjects.

### Architecture Flow
```
Media Platform CMS → API Calls with locale → Dynamic Content → Components
```

### How It Works

#### 1. API Integration
Content translations are fetched through API calls to the Media Platform CMS by passing a `locale` parameter:

```typescript
// Example API calls with locale
mediaApi.satsangs.getList({ locale: 'en' })
mediaApi.commentaries.getList({ locale: 'es' }) 
mediaApi.pilgrimages.getList({ locale: 'fr' })
```

#### 2. Locale Detection
The locale is typically determined by:
- User's browser language settings
- URL path parameters (e.g., `/en/satsangs`, `/es/satsangs`)
- User account preferences
- Default fallback locale

#### 3. Dynamic Content Examples
Content that uses this system includes:

**Satsang Content**:
- Video titles: "The Path to Inner Peace" (EN) → "El Camino a la Paz Interior" (ES)
- Descriptions: Full video descriptions in multiple languages
- Category names: "God" → "Dios", "Saints" → "Santos"

**Commentary Content**:
- Scripture commentary titles
- Commentary descriptions and metadata
- Author information

**Pilgrimage Content**:
- Pilgrimage destination names
- Journey descriptions
- Historical context

#### 4. Implementation Pattern
```typescript
// Typical usage pattern in loaders
export async function loader({ context, params }: LoaderFunctionArgs) {
  const locale = getLocaleFromRequest(request); // Extract from URL/headers
  
  const satsangs = await context.mediaApi.satsangs.getList({
    locale, // Pass locale to get translated content
    categoryId: params.categoryId
  });
  
  return { satsangs };
}

// In components, content is already translated
function SatsangCard({ satsang }) {
  return (
    <div>
      <h3>{satsang.title}</h3>     {/* Already translated by API */}
      <p>{satsang.description}</p>  {/* Already translated by API */}
    </div>
  );
}
```

### Key Differences from UI Translations

| Aspect | UI Translations (Shopify) | Content Translations (CMS) |
|--------|---------------------------|---------------------------|
| **Source** | Shopify metaobjects | Media Platform CMS database |
| **Management** | Shopify Admin interface | CMS admin interface |
| **Usage** | Interface text, buttons, labels | Video titles, descriptions, content |
| **Implementation** | `useTranslations()` hook | API calls with `locale` parameter |
| **Caching** | Root loader, global context | Per-route, request-specific |
| **Examples** | "Latest Releases", "Play" | "The Journey Within", video descriptions |

### Best Practices for Content Translations

#### API Calls
- Always pass the current locale to API calls
- Handle missing translations gracefully with fallbacks
- Cache translated content appropriately

#### Locale Management
```typescript
// Get locale from various sources
const locale = getLocaleFromRequest(request) || 
               getUserPreferredLocale(user) || 
               DEFAULT_LOCALE;
```

#### Error Handling
```typescript
// Fallback to default locale if translation unavailable
const satsangs = await mediaApi.satsangs.getList({ locale }).catch(() => 
  mediaApi.satsangs.getList({ locale: 'en' }) // Fallback to English
);
```

### Content Translation Workflow

#### For Content Editors
1. **Access CMS**: Log into Media Platform CMS admin
2. **Select Content**: Choose video, category, or other content
3. **Add Translations**: Add translations for each supported language
4. **Publish**: Changes appear immediately in the app

#### For Developers
1. **Identify Content**: Determine what content needs translation
2. **API Integration**: Ensure API calls include locale parameter
3. **Fallback Logic**: Implement graceful fallbacks for missing translations
4. **Testing**: Test with different locale parameters

## File References

### UI Translation System (Shopify)
- **Keys Dictionary**: `app/lib/translations/keys.ts` - Defines all available keys with fallbacks
- **Query**: `app/graphql/translations.query.ts` - Fetches translations from Shopify
- **Loading**: `app/root.tsx:366-430` - Processes and provides translations (with pagination)
- **Context**: `app/contexts/TranslationsProvider.tsx` - Manages translation state with type safety
- **Sync Script**: `scripts/sync-translations.ts` - Syncs keys.ts to Shopify metaobjects
- **Debug Endpoint**: `/api/debug-translations` - Inspect translation data (dev only)
- **ESLint Config**: `eslint.config.js` - Enforces no dynamic lookups rule
- **Usage**: Throughout `app/routes/` and `app/components/`

### Content Translation System (CMS)
- **Locale Utils**: `app/lib/utils/locale.utils.ts`
- **API Integration**: Throughout `app/routes/` loader functions
- **Usage**: Dynamic content in components receiving translated data