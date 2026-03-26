# Bhakti Marga Media Platform

A Hydrogen v2 Shopify storefront for streaming spiritual content with tiered subscription access. This platform integrates Shopify commerce with a custom media API to deliver video content (satsangs, commentaries, pilgrimages, talks) based on user subscription levels.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

## 🏗️ Tech Stack

- **Hydrogen 2025.1.3** - Shopify's React framework for headless commerce
- **Remix** - Full-stack web framework with v3 features
- **TypeScript** - Full type safety
- **Vite** - Build tool with Oxygen runtime
- **Tailwind CSS** - Utility-first styling
- **Custom Media API** - Bhakti Marga content delivery system

## 📁 Project Structure

```
app/
├── routes/          # Remix routes with $(locale) prefix pattern
│   ├── $(locale)._index.tsx           # Homepage
│   ├── $(locale).video.tsx            # Video player
│   ├── $(locale).satsangs.*.tsx       # Satsang pages
│   ├── $(locale).commentaries.*.tsx   # Commentary pages
│   └── $(locale).api.*.tsx            # API routes
├── components/      # Reusable UI components
│   ├── VideoPlayer/      # Custom video player with chapters
│   ├── ContentCard/      # Media content cards
│   ├── Modal/           # Access modals & overlays
│   └── [30+ more components]
├── sections/        # Page sections with loaders
│   ├── Hero/            # Hero banners with schemas
│   ├── SubscriptionTiers/
│   └── PlatformFeatures/
├── lib/
│   ├── api/            # BhaktiMargMediaApi client
│   │   ├── services/   # API service modules
│   │   └── client.ts   # Base API client
│   ├── types/          # TypeScript definitions
│   ├── utils/          # Helper functions
│   └── constants.ts    # App constants
├── contexts/           # React contexts
│   ├── UserProvider.tsx
│   ├── TranslationsProvider.tsx
│   └── GlobalProvider.tsx
└── graphql/           # Shopify GraphQL queries
```

## 🔑 Key Concepts

### API Architecture (Important!)

This project uses **two separate APIs** with clear responsibilities:

| API | Purpose |
|-----|---------|
| **Media Platform API** | **Almost everything** - video content, user profiles, subscription tiers, watch history, search |
| **Shopify APIs** | **Minimal** - authentication (login/logout), checkout products, UI translations |

**The Media Platform API is the source of truth for content and user data.**

See **[docs/API_ARCHITECTURE.md](docs/API_ARCHITECTURE.md)** for detailed guidance on which API to use.

### Subscription Tiers

The platform uses hierarchical subscription tiers with cumulative access:

- **`unsubscribed`** - Free content only
- **`live`** - Live streams + free content  
- **`core`** - Core recordings + everything below
- **`premium`** - All content except pay-per-view
- **`supporter`** - Everything including PPV content

Tiers are determined by Shopify customer tags:
- `core-member`
- `live-member`
- `premium-member`
- `supporter-member`

### Content Types

Content is organized into 5 main types:

1. **Satsangs** - Categorized spiritual talks (God, Saints, Bhakti, Happiness)
2. **Commentaries** - Multi-part series on scriptures
3. **Pilgrimages** - Multi-part travel documentaries
4. **Lives** - Live streaming events
5. **Talks** - Standalone presentations

### Authentication Flow

1. User logs in via Shopify Customer Account API
2. Server reads customer tags to determine subscription tier
3. Media API receives `shopifyCustomerId` + `subscriptionTier`
4. Content is filtered server-side based on access level
5. Client receives only accessible content

## 🌍 Environment Variables

### Pull Environment Variables from Shopify

To get environment variables from your linked Hydrogen storefront:

```bash
# Link your local project to a Hydrogen storefront (first time setup)
shopify hydrogen link

# Pull environment variables from the linked storefront
shopify hydrogen env pull
```

This creates/updates a `.env` file with variables configured in your Hydrogen storefront on Shopify.

### Adding New Environment Variables

Hydrogen uses Cloudflare Workers (Oxygen) which requires a 3-step process:

#### 1. Add to `.env.local`
```bash
MY_CUSTOM_VAR=value
```

#### 2. Add TypeScript types in `env.d.ts`
```typescript
interface Env extends HydrogenEnv {
  MY_CUSTOM_VAR: string;
}
```

#### 3. Pass to Oxygen runtime in `vite.config.ts`
```typescript
oxygen({
  env: {
    MY_CUSTOM_VAR: env.MY_CUSTOM_VAR,
  },
}),
```

### Required Environment Variables

```bash
# Shopify Configuration
PUBLIC_STOREFRONT_ID=
PUBLIC_STOREFRONT_API_TOKEN=
PUBLIC_STORE_DOMAIN=
PUBLIC_CHECKOUT_DOMAIN=
PRIVATE_STOREFRONT_API_TOKEN=
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID=
PUBLIC_CUSTOMER_ACCOUNT_API_URL=
SESSION_SECRET=

# Media API Configuration
MEDIA_API_URL=https://media-api.bhaktimarga.org
MEDIA_API_KEY=
MEDIA_API_VERSION=2025-04-29

# Development Configuration
ENVIRONMENT=development|production
DEVELOPMENT_USER_TAGS=  # e.g., "core-member" for local testing
```

## 🛠️ Development Tips

### Local Development with User Stubbing

For local development without logging in, use `DEVELOPMENT_USER_TAGS`:

```bash
# .env.local
ENVIRONMENT=development
DEVELOPMENT_USER_TAGS=premium-member
```

This will bypass Shopify auth and stub a user with the specified tier.

### Important Files

- **`server.ts:20-180`** - Request handling & user authentication
- **`app/root.tsx:155-202`** - Root loader with app-wide data
- **`app/lib/api/index.ts`** - Media API client initialization
- **`app/lib/constants.ts`** - Subscription tiers & content mappings
- **`app/lib/context.ts`** - Hydrogen context setup

### Routing Patterns

Routes use a `$(locale)` prefix for internationalization:

```
$(locale)._index.tsx → /en-us/ (homepage)
$(locale).video.tsx → /en-us/video
$(locale).satsangs.$categoryId.tsx → /en-us/satsangs/1
$(locale).purchase.tsx → /en-us/purchase
```

**Valid Content Paths:**
The following paths are recognized as valid content routes (defined in `app/lib/locale/url.utils.ts`):
- `account`, `api`, `checkout`, `choose-plan`, `commentaries`, `faqs`, `livestreams`, `pages`, `pilgrimages`, `policies`, `purchase`, `satsangs`, `search`, `subscribe`, `talks`, `test`, `video`, `welcome`

### Data Loading Pattern

Routes use a split loading pattern for performance:

```typescript
async function loadCriticalData() {
  // Data needed for initial render
}

function loadDeferredData() {
  // Non-blocking data (cart, recommendations)
}

export async function loader(args) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return { ...deferredData, ...criticalData };
}
```

## 🎥 Video Player Features

- **Multi-part Content** - Commentaries/pilgrimages with grouped videos
- **Chapters** - Timeline navigation within videos
- **Progress Tracking** - Resume from last position
- **PPV Support** - Pay-per-view content handling
- **Access Modals** - Upgrade prompts for restricted content

## 🌐 Internationalization

- Multi-locale support with automatic detection
- Translations via Shopify metaobjects
- Dynamic locale-based routing
- Currency/country handled by Hydrogen i18n

### Translation Sync Script

Sync translation keys from `app/lib/translations/keys.ts` to Shopify metaobjects:

```bash
# Check status only (no changes)
npx tsx scripts/sync-translations.ts --status

# Sync: create missing keys in Shopify
npx tsx scripts/sync-translations.ts

# Verbose output (shows values)
npx tsx scripts/sync-translations.ts --verbose
```

**Workflow**: When adding new translation keys, first add them to `app/lib/translations/keys.ts`, then run the sync script to create them in Shopify.

See **[docs/TRANSLATIONS.md](docs/TRANSLATIONS.md)** for complete translation system documentation.

## 📱 Platform Restrictions

- **Desktop Only** - Mobile access restricted via `<MobileWall />` component
- **Authenticated Features** - Watch history, progress tracking
- **Geographic Restrictions** - Content availability by country

## 🚧 Known Quirks

1. **Environment Variables** - Must be added in 3 places (see above)
2. **Route Parameters** - `$(locale)` prefix can cause issues with special chars
3. **TypeScript Paths** - Uses `~` alias configured in `vite.config.ts`
4. **Session Handling** - Custom session implementation in `lib/session.ts`
5. **GraphQL Types** - Auto-generated, don't edit `*.generated.d.ts` files

## 📝 Development Workflow

1. **Feature Development**
   - Create feature branch from `main`
   - Use TypeScript for all new code
   - Follow existing patterns in codebase

2. **Testing**
   - Test with different subscription tiers using `DEVELOPMENT_USER_TAGS`
   - Verify mobile wall on responsive views
   - Check content access restrictions

3. **Deployment**
   - Deployments handled via Shopify Oxygen
   - Environment variables set in Shopify admin
   - Production uses `ENVIRONMENT=production`

## 🤝 Contributing

When contributing:
- Follow existing code patterns
- Maintain TypeScript types
- Update this README for significant changes
- Test across subscription tiers
- Ensure mobile restrictions work

## 📚 Resources

- [API Architecture Guide](docs/API_ARCHITECTURE.md) - **When to use Media API vs Shopify API**
- [Hydrogen Documentation](https://shopify.dev/custom-storefronts/hydrogen)
- [Remix Documentation](https://remix.run/docs)
- [Shopify Customer Account API](https://shopify.dev/docs/api/customer)
- Media API Documentation: See `api_spec-3.md`

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module '~/lib/...'"**
- Ensure `vite-tsconfig-paths` plugin is configured
- Restart dev server

**Environment variable not available**
- Check all 3 places: `.env.local`, `env.d.ts`, `vite.config.ts`
- Restart dev server after changes

**User subscription tier not working**
- Verify customer tags in Shopify admin
- Check `DEVELOPMENT_USER_TAGS` format in development
- Clear browser cookies/session

**Video access denied**
- Confirm subscription tier has access
- Check content type restrictions
- Verify user authentication status

## 📧 Support

For platform issues, contact the development team.
For content issues, contact the content team.


for Translations 
add text using the keys.ts
then in the terminal run the commmand
npx tsx scripts/sync-translations.ts 