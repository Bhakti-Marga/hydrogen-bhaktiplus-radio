# Locale Routing Architecture

## URL Format

`/{countryCode}/{language?}/path`

- **countryCode**: 2-letter ISO country code (us, ca, de, fr, gb, in, etc.)
- **language**: Optional 2-letter language code (en, fr, de, hi, es)
- **path**: The actual route path (/video, /account, /subscribe, etc.)

Examples:
- `/us/video` - US, English (default), video page
- `/ca/fr/video` - Canada, French, video page
- `/de/video` - Germany, German (default), video page
- `/video` - No explicit locale, determined by cascade

## Locale Determination Cascade

The same cascade applies to ALL routes. Priority order:

### 1. URL Explicit Locale (Highest Priority)
If the URL contains a valid countryCode prefix, use it.
- `/ca/video` → countryCode=ca, language=en (Canada's default)
- `/ca/fr/video` → countryCode=ca, language=fr

### 2. Logged-in Paying Customer
For paying customers (isPayingCustomer=true), use their billing address:
- countryCode: `shopifyBillingCountry` or `shopifyLastKnownBillingCountry`
- language: `preferredLanguage` or country's default language

**Important**: Paying customers on explicit locale URLs are redirected to non-locale paths.
- `/ca/video` (paying customer) → redirect to `/video?_psr=1`

### 3. GeoIP Detection
For anonymous or non-paying users without URL locale:
- countryCode: From `oxygen-buyer-country` header (prod) or IP-API lookup (dev)
- language: From `Accept-Language` header, if available for the country

### 4. Default Fallback
If no locale can be determined:
- countryCode: `us`
- language: `en`

## Special Cases

### Paying Customer Region Lock
Paying customers are locked to their billing country to prevent region-hopping.

**Why**: Subscription pricing varies by region. A customer who subscribed in the US
should not be able to access content as if they're in a different region.

**How**:
- Explicit locale URLs redirect to non-locale: `/de/video` → `/video?_psr=1`
- The `_psr` (paying subscriber redirect) param prevents redirect loops
- Locale is determined from user profile (billing country + preferred language)

### Root Path `/`
The root path `/` is a valid path (no redirect). Locale is determined by cascade:
- Paying customer → billing country
- Anonymous → GeoIP detection
- Fallback → us/en

## Data Flow

```
Request → server.ts
           ↓
    Parse URL for countryCode/language
           ↓
    Create Hydrogen context (with URL-derived or default locale)
           ↓
    root.tsx loader
           ↓
    Fetch user profile (if logged in)
           ↓
    Determine effective locale via cascade
           ↓
    If paying customer on explicit locale URL → redirect
           ↓
    Return locale in loader data
           ↓
    Components use loader data via useCountryCode() hook
```

## API Integration

### Media API
Uses `locale` parameter in format `{language}-{COUNTRYCODE}`:
- `en-US`, `fr-CA`, `de-DE`, `hi-IN`

### Shopify Storefront API
Uses `country` and `language` in the i18n context:
- `{ country: "CA", language: "FR" }`

## Configuration

Supported countries and languages are defined in:
`app/lib/locale/config.ts`

Each country has:
- `code`: 2-letter country code
- `name`: Display name
- `currency`: Currency code (USD, CAD, EUR, etc.)
- `defaultLanguage`: Default language for the country
- `availableLanguages`: Languages available in this country
