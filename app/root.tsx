import { useNonce, getShopAnalytics, Analytics, Script } from "@shopify/hydrogen";
import {
  type LoaderFunctionArgs,
  Links,
  Meta,
  Outlet,
  Scripts,
  useRouteError,
  useRouteLoaderData,
  ScrollRestoration,
  isRouteErrorResponse,
  useMatches,
  redirect,
  type ShouldRevalidateFunction,
} from "react-router";
import type { ShopAnalytics } from "@shopify/hydrogen";
import type {
  CountryCode as ShopifyCountryCode,
  LanguageCode as ShopifyLanguageCode,
} from "@shopify/hydrogen/storefront-api-types";
import * as Sentry from "@sentry/react-router/cloudflare";
import favicon from "~/assets/favicon.svg";
import appStyles from "~/styles/app.css?url";
import { PageLayout, StagingToolbar } from "~/components";
import { PageTransition } from "~/components/PageTransition";
import { DebugMenu } from "~/components/DebugMenu";
import { GlobalProvider } from "./contexts/GlobalProvider";
import { UserProvider, DebugProvider, WatchProgressProvider, UserPreferencesProvider, HeaderVisibilityProvider } from "./contexts";
import { TranslationsProvider } from "./contexts/TranslationsProvider";
import { VideoPlayerProvider } from "./contexts/VideoPlayerProvider";
import { getHeaderNavStructure, loadHeaderSubmenuData, loadContentNewStatus } from "./lib/utils/server.utils";
import type { HeaderSubmenuData } from "./components/Header/Header.types";
import { SUBSCRIPTION_TIERS } from "./lib/constants";
// getAuthenticatedUser is now called by authMiddleware - use context.get() to access results
import type { VideoProgressEntryDto, UserPreferencesDto, ContentNewStatusResponseDto } from "./lib/api/types";
import { TRANSLATIONS_QUERY } from "./graphql/translations.query";
import {
  type CountryCode,
  type LanguageCode,
  type Country,
  type Language,
  SUPPORTED_COUNTRIES,
  hasCountryCodePrefix,
  stripLocalePrefix,
  validateUrlLocale,
  getShopifyLanguageCode,
} from "~/lib/locale";
import { getPrelaunchConfig, isPrelaunchActive as checkPrelaunchActive } from "~/lib/utils/prelaunch";
import { PrelaunchProvider } from "~/contexts/PrelaunchProvider";
import { getClientStoreContext, type StoreContextClient } from "~/lib/store-routing";
import {
  authMiddleware,
  userContext,
  subscriptionTierContext,
  videosInProgressCountContext,
  userProfileContext,
  userScopedMediaApiContext,
  localeContext,
} from "~/lib/middleware";

export type RootLoader = {
  publicCheckoutDomain: string;
  shop: Promise<ShopAnalytics | null>;
  consent: {
    checkoutDomain: string;
    storefrontAccessToken: string;
    withPrivacyBanner: boolean;
    country: ShopifyCountryCode;
    language: ShopifyLanguageCode;
  };
  ENV: {
    PUBLIC_BASE_URL: string;
    PUBLIC_CHECKOUT_DOMAIN: string;
    PUBLIC_COOKIE_DOMAIN: string;
    SENTRY_DSN: string;
    SENTRY_RELEASE: string;
    ENVIRONMENT: "production" | "development" | undefined;
  };
  // Country/language system
  countryCode: CountryCode;
  language: LanguageCode;
  localeSource: 'url' | 'user_selection' | 'user_preferences' | 'cookie' | 'geoip' | 'default';
  urlHasLocalePrefix: boolean;
  urlLocalePrefix: string;
  supportedCountries: Country[];
  supportedLanguages: Language[];
  detectedCountry: string | null;
  // User preferences (from API)
  userPreferences: UserPreferencesDto | null;
  userEmail: string | null;
  userId: number | null;
  // Cookie-based preferred language (for debug display)
  preferredLanguageCookie: string | null;
  // Translations
  translations: {
    [locale: string]: { [key: string]: string };
  };
  // User data
  user: any;
  subscriptionTier: any;
  videosInProgressCount: number;
  cart: any;
  memberships: any;
  header: {
    nav: any;
    // Deferred submenu data - only loaded for subscribed users
    submenuData: Promise<HeaderSubmenuData | null>;
  };
  footer: {
    menus: any;
  };
  // Watch progress for all video cards
  watchProgress: Promise<VideoProgressEntryDto[]>;
  // Store context for multi-store routing (client-safe only)
  storeContext: StoreContextClient;
  // Prelaunch mode configuration
  prelaunchConfig: {
    isPrelaunchMode: boolean;
    prelaunchEndDateFormatted: string | null;
    isActive: boolean;
  };
  // 404 state for invalid locale URLs
  notFound?: {
    reason: string;
  };
};

/**
 * Middleware that runs before the loader.
 * Sets user context, userScopedMediaApi, and determined locale for child loaders.
 *
 * NOTE: During Phase 2, the root loader still calls getAuthenticatedUser() independently.
 * The middleware runs but its context values aren't used yet. This is intentional -
 * we verify the middleware runs without breaking anything before migrating loaders.
 */
export const middleware = [authMiddleware];

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== "GET") return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: "preconnect",
      href: "https://cdn.shopify.com",
    },
    {
      rel: "stylesheet",
      href: "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css",
    },
    {
      rel: "preconnect",
      href: "https://shop.app",
    },
    {
      rel: "preconnect",
      href: "https://use.typekit.net",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      href: "https://use.typekit.net/tzn6uuk.css",
      as: "style",
    },
    {
      rel: "stylesheet",
      href: "https://use.typekit.net/tzn6uuk.css",
    },
    { rel: "icon", type: "image/svg+xml", href: favicon },
  ];
}

async function loadCriticalData({ context, request }: LoaderFunctionArgs) {
  const { env } = context;
  const url = new URL(request.url);
  const urlHasLocalePrefix = hasCountryCodePrefix(url.pathname);

  // Get auth data from middleware context (no async fetch needed!)
  // The authMiddleware has already called getAuthenticatedUser() and set these values
  const user = context.get(userContext);
  const subscriptionTier = context.get(subscriptionTierContext);
  const videosInProgressCount = context.get(videosInProgressCountContext);
  const userProfile = context.get(userProfileContext);
  const userScopedMediaApi = context.get(userScopedMediaApiContext);
  const determinedLocale = context.get(localeContext);

  // Use determined locale from middleware
  const { countryCode, language, source: localeSource } = determinedLocale;

  // Compute client-safe store context for multi-store routing
  // Uses determined countryCode from locale cascade
  const storeContext = getClientStoreContext(userProfile, countryCode, env);

  // Header nav structure is SYNC - no API calls needed
  const headerNav = getHeaderNavStructure();

  // Only fetch memberships in critical path (needed for subscription tiers UI)
  const memberships = await userScopedMediaApi.memberships.getMemberships().catch((error) => {
    console.error('Error loading memberships:', error);
    return { memberships: [], currencyCode: 'EUR', regionId: 1 };
  });

  // Content new status - lightweight call for header NEW badge
  const contentNewStatus = await loadContentNewStatus(userScopedMediaApi);

  return {
    user,
    subscriptionTier,
    videosInProgressCount,
    storeContext,
    userProfile,
    userScopedMediaApi, // Pass to deferred loader for submenu data
    headerNav,
    memberships,
    contentNewStatus,
    // Locale data determined in critical path
    countryCode,
    language,
    localeSource,
    urlHasLocalePrefix,
  };
}

function loadDeferredData(
  { context }: LoaderFunctionArgs,
  criticalData: {
    user: any;
    subscriptionTier: any;
    userScopedMediaApi: any;
  }
) {
  const { cart } = context;
  const { userScopedMediaApi, subscriptionTier, user } = criticalData;

  // Check if user is subscribed
  const isSubscribed = subscriptionTier && subscriptionTier !== SUBSCRIPTION_TIERS.UNSUBSCRIBED;

  // Header submenu data - only load for subscribed users (they see mega-menu)
  // Unsubscribed users see simple nav links without mega-menu dropdowns
  const headerSubmenuData = isSubscribed
    ? loadHeaderSubmenuData(userScopedMediaApi)
    : Promise.resolve(null);

  // Defer watch progress loading - only for subscribed users
  // Uses the condensed /user/video-progress endpoint (instead of /user/watch-history)
  const watchProgress = isSubscribed
    ? (async () => {
        try {
          if (!user?.email) {
            return [];
          }
          return await userScopedMediaApi.user.getVideoProgress({
            email: user.email,
            subscriptionTier: subscriptionTier,
          });
        } catch (error) {
          console.error('Error loading watch progress:', error);
          return [];
        }
      })()
    : Promise.resolve([]);

  return {
    cart: cart.get(),
    watchProgress,
    headerSubmenuData,
  };
}

export async function loader(args: LoaderFunctionArgs) {
  const url = new URL(args.request.url);

  // Validate URL locale segments before proceeding
  // This catches invalid URLs like /asdf, /en/satsangs, /us/xyz/videos
  const localeValidation = validateUrlLocale(url.pathname);
  const isInvalidLocaleUrl = !localeValidation.valid;
  if (isInvalidLocaleUrl) {
    // eslint-disable-next-line no-console
    console.log(`[Root] Invalid locale URL: ${url.pathname} - ${localeValidation.reason}`);
  }

  const criticalData = await loadCriticalData(args);
  const deferredData = loadDeferredData(args, criticalData);
  const { storefront, env, urlCountryCode, detectedCountry, preferredLanguageCookie } = args.context;

  const hasSafetyParam = url.searchParams.has('_psr');

  // Use locale data from criticalData (determined in loadCriticalData using userProfile.preferredLanguage)
  const { userProfile, countryCode, language, localeSource, urlHasLocalePrefix } = criticalData;

  // Region-locked user redirect: explicit locale URL → non-locale URL
  // Users with stampedRegionId are locked to their region and cannot change via URL
  // This prevents region-hopping via URL manipulation
  if (
    userProfile?.stampedRegionId &&
    urlHasLocalePrefix &&
    !hasSafetyParam
  ) {
    const pathWithoutLocale = stripLocalePrefix(url.pathname);
    const redirectUrl = new URL(url);
    redirectUrl.pathname = pathWithoutLocale;
    redirectUrl.searchParams.set('_psr', '1');

    throw redirect(redirectUrl.pathname + redirectUrl.search);
  }

  // Prelaunch configuration
  const prelaunchConfig = getPrelaunchConfig(env);
  const isPrelaunch = checkPrelaunchActive(prelaunchConfig);
  // DEBUG: Log prelaunch config for troubleshooting
  console.log('[Root] Prelaunch config:', {
    envPrelaunchMode: env.PRELAUNCH_MODE,
    envPrelaunchEndDate: env.PRELAUNCH_END_DATE,
    isPrelaunchMode: prelaunchConfig.isPrelaunchMode,
    prelaunchEndDate: prelaunchConfig.prelaunchEndDate?.toISOString(),
    isPrelaunch,
  });

  // Fetch supported languages from Media API (source of truth for all languages)
  // Falls back to English-only if the API is unavailable (e.g., endpoint offline)
  const FALLBACK_LANGUAGES: Language[] = [
    { code: "en" as LanguageCode, name: "English", nativeName: "English", shopifyCode: "EN" },
  ];

  const userScopedMediaApi = args.context.get(userScopedMediaApiContext);
  let supportedLanguages: Language[];
  try {
    const localesResponse = await userScopedMediaApi.locale.getLocalesSupported();
    supportedLanguages = localesResponse.locales.map((locale) => {
      const [langCode] = locale.localeCode.split('-');
      return {
        code: langCode.toLowerCase() as LanguageCode,
        name: locale.name,
        nativeName: locale.name, // Media API provides name in native script
        shopifyCode: locale.codeShopify.toUpperCase(),
      };
    });
  } catch (error) {
    console.error("[Root] Failed to fetch supported locales, using fallback:", error);
    supportedLanguages = FALLBACK_LANGUAGES;
  }

  // Fetch translations from Shopify metaobjects
  // See docs/TRANSLATIONS.md for complete translation system documentation
  // IMPORTANT: Use the determined language/countryCode (from locale cascade), NOT storefront.i18n
  // storefront.i18n is set during context creation and doesn't know about user preferences or GeoIP
  const currentLanguage = language.toLowerCase();
  
  // Look up the shopifyCode from supportedLanguages to get the full locale code (e.g., "PT-PT", "ZH-CN")
  // If shopifyCode has a hyphen, we need to send both language and country to @inContext
  // Otherwise, just send language (works for simple codes like EN, DE, etc.)
  const currentLangConfig = supportedLanguages.find(l => l.code === currentLanguage);
  const shopifyCode = currentLangConfig?.shopifyCode || currentLanguage.toUpperCase();
  
  // Parse shopifyCode to extract language and optional country
  // Shopify uses underscore-separated language codes for regional variants (e.g., ZH_CN, PT_PT)
  // e.g., "ZH-CN" → { lang: "ZH_CN", country: "CN" }
  // e.g., "PT-PT" → { lang: "PT_PT", country: "PT" }
  // e.g., "EN" → { lang: "EN", country: undefined }
  const hasCountry = shopifyCode.includes('-');
  const shopifyLanguage = hasCountry 
    ? shopifyCode.replace('-', '_')  // Convert ZH-CN to ZH_CN for Shopify
    : shopifyCode;
  const translationCountry = hasCountry 
    ? shopifyCode.split('-')[1]  // Extract country part (CN from ZH-CN)
    : undefined;

  console.log('🌐 [Translations] Fetching from Shopify with:', {
    inputLanguage: language,
    shopifyCode,
    shopifyLanguage,
    translationCountry: translationCountry || '(none - language only)',
    graphqlVariables: translationCountry 
      ? `@inContext(language: ${shopifyLanguage}, country: ${translationCountry})`
      : `@inContext(language: ${shopifyLanguage})`,
  });

  // Helper to fetch all translations with pagination (Shopify max is 250 per request)
  // For locales with hyphen (e.g., pt-PT), sends both language and country
  // For simple locales (e.g., EN), sends only language
  async function fetchAllTranslations(
    lang: ShopifyLanguageCode,
    country?: ShopifyCountryCode
  ): Promise<any[]> {
    const allNodes: any[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      console.log('🌐 [Translations] GraphQL request:', {
        query: 'TRANSLATIONS_QUERY',
        variables: { country: country || '(none)', language: lang, cursor },
      });

      const queryResult: { metaobjects?: { nodes?: any[]; pageInfo?: { hasNextPage?: boolean; endCursor?: string | null } } } = await storefront.query(TRANSLATIONS_QUERY, {
        variables: {
          // Only include country if it exists (for locales like pt-PT, zh-CN)
          ...(country && { country }),
          language: lang,
          cursor,
        },
      });

      const nodes = queryResult.metaobjects?.nodes || [];
      allNodes.push(...nodes);

      hasNextPage = queryResult.metaobjects?.pageInfo?.hasNextPage ?? false;
      cursor = queryResult.metaobjects?.pageInfo?.endCursor ?? null;
    }

    return allNodes;
  }

  // Fetch current language translations
  // For locales with country (pt-PT, zh-CN), pass both; otherwise just language
  const currentNodes = await fetchAllTranslations(
    shopifyLanguage as ShopifyLanguageCode,
    translationCountry as ShopifyCountryCode | undefined
  );

  console.log('🌐 [Translations] Fetched for', shopifyLanguage, ':', currentNodes.length, 'translations');

  // Also fetch English translations for fallback (only if current language is not English)
  // English typically doesn't need country context
  const englishNodes = currentLanguage !== 'en'
    ? await fetchAllTranslations('EN' as ShopifyLanguageCode)
    : currentNodes;

  if (currentLanguage !== 'en') {
    console.log('🌐 [Translations] Fetched English fallback:', englishNodes.length, 'translations');
  }

  // Sanitize corrupted Unicode escape sequences in translation text
  // Some translations have NUL character + hex codes (e.g., "\u00003C" for "<")
  // This converts them back to proper characters
  const sanitizeTranslationText = (text: string): string => {
    // Pattern: NUL character (\x00) followed by 2-4 hex digits
    // e.g., "\x003C" should become "<", "\x0022" should become '"'
    return text.replace(/\x00([0-9A-Fa-f]{2,4})/g, (_match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
  };

  // Transform Shopify metaobjects into usable translation strings
  // Converts spaces to underscores in keys (e.g., "homepage title" → "homepage_title")
  const transformMetaobjects = (nodes: any[]) => {
    return nodes?.reduce((acc: { [key: string]: string }, node: any) => {
      const key = node.fields.find((f: any) => f.key === "key")?.value;
      const text = node.fields.find((f: any) => f.key === "text")?.value;
      if (key && text) {
        acc[key.replace(/\s+/g, "_")] = sanitizeTranslationText(text);
      }
      return acc;
    }, {}) || {};
  };

  const translations: { [locale: string]: { [key: string]: string } } = {
    [currentLanguage]: transformMetaobjects(currentNodes),
    'en': transformMetaobjects(englishNodes),
  };

  // Log sample translations to verify they're in the correct language
  const currentTranslations = translations[currentLanguage];
  const sampleTranslations = {
    homepage_hero_title: currentTranslations['homepage_hero_title'] || '(missing)',
    homepage_satsang_title: currentTranslations['homepage_satsang_title'] || '(missing)',
    homepage_satsang_live_title: currentTranslations['homepage_satsang_live_title'] || '(missing)',
    homepage_satsang_god_title: currentTranslations['homepage_satsang_god_title'] || '(missing)',
    explore_all: currentTranslations['explore_all'] || '(missing)',
  };
  console.log('🌐 [Translations] Sample translations for', currentLanguage.toUpperCase(), ':', sampleTranslations);

  // Destructure criticalData to exclude non-serializable userScopedMediaApi
  const { userScopedMediaApi: _api, headerNav, ...serializableCriticalData } = criticalData;

  return {
    ...deferredData,
    ...serializableCriticalData,
    // Header nav structure (sync) + deferred submenu data + content new status (critical)
    header: {
      nav: headerNav,
      submenuData: deferredData.headerSubmenuData,
      contentNewStatus: criticalData.contentNewStatus,
    },
    publicCheckoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: true,
      // Use determined locale (from locale cascade) instead of storefront.i18n
      // storefront.i18n doesn't know about user preferences
      country: countryCode.toUpperCase() as ShopifyCountryCode,
      language: language.toUpperCase() as ShopifyLanguageCode,
    },
    // NOTE: these are the only ENV vars exposed from server-side to client-side
    ENV: {
      PUBLIC_BASE_URL: env.PUBLIC_BASE_URL || '/',
      PUBLIC_CHECKOUT_DOMAIN: env.PUBLIC_CHECKOUT_DOMAIN,
      PUBLIC_COOKIE_DOMAIN: env.PUBLIC_COOKIE_DOMAIN,
      SENTRY_DSN: env.SENTRY_DSN,
      // SENTRY_RELEASE is stamped at build time via vite.config.ts define option (not a runtime env var)
      SENTRY_RELEASE: process.env.SENTRY_RELEASE || 'unknown',
      ENVIRONMENT: env.ENVIRONMENT,
    },
    translations,
    // Country/language data (countryCode, language, localeSource, urlHasLocalePrefix are in serializableCriticalData)
    urlLocalePrefix: urlHasLocalePrefix ? `/${urlCountryCode}` : "",
    supportedCountries: SUPPORTED_COUNTRIES,
    supportedLanguages,
    detectedCountry,
    // User preferences - null for now, fetch on-demand in Preferences UI
    // userProfile.preferredLanguage is used for locale determination
    userPreferences: null as { preferredLanguage?: string } | null,
    userEmail: criticalData.user?.email ?? null,
    userId: userProfile?.userId ?? null,
    // Cookie-based preferred language (for debug display)
    preferredLanguageCookie,
    // Prelaunch mode configuration
    prelaunchConfig: {
      isPrelaunchMode: prelaunchConfig.isPrelaunchMode,
      prelaunchEndDateFormatted: prelaunchConfig.prelaunchEndDateFormatted,
      isActive: isPrelaunch,
    },
    // 404 for invalid locale URLs
    notFound: isInvalidLocaleUrl ? { reason: localeValidation.reason! } : undefined,
  };
}

export function Layout({ children }: { children?: React.ReactNode }) {
  const nonce = useNonce();
  const data = useRouteLoaderData<RootLoader>("root") as RootLoader;
  const { user, subscriptionTier, translations, language, userPreferences, userEmail, userId } = data || {};
  const matches = useMatches();

  // Check if any matched route has skipLayout handle
  const shouldSkipLayout = matches.some(
    (match) => (match.handle as { skipLayout?: boolean })?.skipLayout
  );

  return (
    <html lang={language || "en"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {data?.ENV?.ENVIRONMENT !== "production" && (
          <>
            <meta name="robots" content="noindex, nofollow" />
            <meta name="googlebot" content="noindex, nofollow" />
          </>
        )}
        <link rel="stylesheet" href={appStyles}></link>
        <Meta />
        <Links />
        <Script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data?.ENV || {})};`,
          }}
        />
      </head>
      <body>
        {data ? (
          shouldSkipLayout ? (
            // Render without layout (no header, footer, mobile wall)
            <GlobalProvider>
              <TranslationsProvider
                translations={translations}
                locale={language || 'en'}
              >
                {children}
              </TranslationsProvider>
            </GlobalProvider>
          ) : (
            <Analytics.Provider
              cart={data.cart}
              shop={data.shop}
              consent={data.consent}
              cookieDomain={data.ENV.PUBLIC_COOKIE_DOMAIN}
            >
              <GlobalProvider>
                <DebugProvider>
                  <PrelaunchProvider>
                    <UserPreferencesProvider
                      initialPreferences={userPreferences}
                      userEmail={userEmail}
                      userId={userId}
                    >
                      <UserProvider user={user} subscriptionTier={subscriptionTier}>
                        <WatchProgressProvider watchProgressPromise={data.watchProgress}>
                          <DebugMenu />
                          <TranslationsProvider
                            translations={translations}
                            locale={language || 'en'}
                          >
                            <HeaderVisibilityProvider>
                              <VideoPlayerProvider>
                                <PageLayout
                                  {...data}
                                  showStagingToolbarPadding={
                                    data.ENV?.ENVIRONMENT !== "production"
                                  }
                                >
                                  {children}
                                </PageLayout>
                                <StagingToolbar />
                              </VideoPlayerProvider>
                            </HeaderVisibilityProvider>
                          </TranslationsProvider>
                        </WatchProgressProvider>
                      </UserProvider>
                    </UserPreferencesProvider>
                  </PrelaunchProvider>
                </DebugProvider>
              </GlobalProvider>
            </Analytics.Provider>
          )
        ) : (
          children
        )}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <Script
          nonce={nonce}
          id="hs-script-loader"
          async
          defer
          src="https://js.hs-scripts.com/8952526.js"
        />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>("root");

  // Render 404 content for invalid locale URLs
  if (data?.notFound) {
    return (
      <PageTransition>
        <NotFoundContent reason={data.notFound.reason} />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Outlet />
    </PageTransition>
  );
}

/**
 * 404 Content component - rendered within the normal layout (with header/footer)
 */
function NotFoundContent({ reason }: { reason?: string }) {
  return (
    <div className="not-found-content min-h-[60vh] flex flex-col items-center justify-center px-24 py-48">
      {/* Lotus Icon */}
      <div className="mb-40">
        <svg
          className="w-[72px] h-[72px]"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Bhakti+ Lotus</title>
          <path
            d="M16.9007 9.57781C16.9007 12.5336 15.1828 15.0599 13.8691 16.5757C15.587 16.4494 18.1891 15.9441 19.907 14.2262C21.8776 12.2557 22.2312 9.12307 22.2818 7.48096C22.2818 7.2536 22.1049 7.07675 21.9028 7.10202C20.6649 7.12728 18.5681 7.35465 16.7744 8.31465C16.8502 8.71886 16.9007 9.14833 16.9007 9.57781Z"
            fill="currentColor"
            className="text-white/20"
          />
          <path
            d="M11.6973 3.13597C10.5605 4.32334 8.61523 6.79913 8.61523 9.57808C8.61523 12.357 10.5858 14.8328 11.6973 16.0454C11.8489 16.197 12.1016 16.197 12.2531 16.0454C13.39 14.8581 15.3352 12.357 15.3352 9.57808C15.3352 6.79913 13.3647 4.32334 12.2531 3.11071C12.1016 2.95913 11.8489 2.95913 11.6973 3.13597Z"
            fill="currentColor"
            className="text-white/20"
          />
          <path
            d="M10.0791 16.5761C8.79068 15.0856 7.04752 12.534 7.04752 9.5782C7.04752 9.12346 7.09805 8.69399 7.17384 8.28978C5.38015 7.32978 3.28331 7.12767 2.04542 7.07715C1.81805 7.07715 1.64121 7.25399 1.66647 7.4561C1.717 9.0982 2.07068 12.2308 4.04121 14.2014C5.7591 15.9445 8.33594 16.4498 10.0791 16.5761Z"
            fill="currentColor"
            className="text-white/20"
          />
          <path
            d="M21.0695 15C21.0442 15.0253 21.0189 15.0505 20.9937 15.0758C18.4674 17.6274 14.5263 17.9305 12.7832 17.9305C12.3537 17.9305 11.5958 17.9305 11.1663 17.9305C9.44842 17.9305 5.50737 17.6274 2.95579 15.0758C2.93053 15.0505 2.93053 15.0253 2.90526 15.0253C1.03579 15.6821 0 16.4653 0 17.1221C0 18.5116 4.67368 20.5326 12 20.5326C19.3263 20.5326 24 18.5116 24 17.1221C24 16.4653 22.9389 15.6568 21.0695 15Z"
            fill="currentColor"
            className="text-white/20"
          />
        </svg>
      </div>

      {/* 404 Number */}
      <p className="text-64 md:text-80 font-600 text-white/20 font-figtree mb-8">
        404
      </p>

      {/* Heading */}
      <h1 className="text-22 md:text-28 font-600 text-white text-center mb-16 font-figtree leading-tight">
        Page Not Found
      </h1>

      {/* Subtext */}
      <p className="text-16 text-white/60 text-center mb-24 max-w-[320px]">
        Sorry, the page you're looking for doesn't exist or has been moved.
      </p>

      {/* Reason hint */}
      {reason && (
        <p className="text-14 text-white/40 text-center mb-32 max-w-[400px]">
          {reason}
        </p>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error('[ERROR BOUNDARY] Error caught:', error);
  console.error('[ERROR BOUNDARY] Error type:', typeof error);
  console.error('[ERROR BOUNDARY] Error is RouteErrorResponse:', isRouteErrorResponse(error));

  let errorMessage = "Unknown error";
  let errorStatus = 500;

  let eventId = null;
  if (isRouteErrorResponse(error)) {
    console.error('[ERROR BOUNDARY] RouteErrorResponse data:', error.data);
    console.error('[ERROR BOUNDARY] RouteErrorResponse status:', error.status);
    console.error('[ERROR BOUNDARY] RouteErrorResponse statusText:', error.statusText);

    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;

    // Only capture 5xx errors in Sentry (not 404s or other client errors)
    if (errorStatus >= 500) {
      eventId = Sentry.captureException(new Error(`Route Error ${errorStatus}: ${errorMessage}`), {
        contexts: {
          routeError: {
            status: errorStatus,
            data: error.data,
            statusText: error.statusText,
          }
        }
      });
    }
  } else if (error instanceof Error) {
    console.error('[ERROR BOUNDARY] Error instance:', error.message);
    console.error('[ERROR BOUNDARY] Error stack:', error.stack);
    errorMessage = error.message;
    eventId = Sentry.captureException(error);
  } else {
    console.error('[ERROR BOUNDARY] Unknown error type:', error);
    // Capture other thrown values (strings, objects, etc.)
    eventId = Sentry.captureException(new Error(`Unknown error type: ${String(error)}`), {
      extra: { thrownValue: error }
    });
  }

  const is404 = errorStatus === 404;
  const title = is404 ? "Page Not Found" : "Something Went Wrong";
  const description = is404
    ? "The page you're looking for doesn't exist or has been moved."
    : "We encountered an unexpected error. Please try again later.";

  return (
    <div className="route-error flex items-center justify-center min-h-[60vh] px-24">
      <div className="text-center max-w-md">
        <p className="text-gold text-14 font-600 uppercase mb-8">
          Error {errorStatus}
        </p>
        <h1 className="text-32 tablet:text-40 font-700 text-white mb-16">
          {title}
        </h1>
        <p className="text-grey-light text-16 mb-32">
          {description}
        </p>
        <a
          href="/"
          className="btn btn--primary inline-flex items-center gap-8"
        >
          Back to Home
        </a>
        {eventId && (
          <p className="text-text-muted text-12 mt-32">
            Event ID for support: <code className="text-grey-light" suppressHydrationWarning>{eventId}</code>
          </p>
        )}
      </div>
    </div>
  );
}
