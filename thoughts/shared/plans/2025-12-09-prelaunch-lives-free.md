# Pre-Launch Lives Free Implementation Plan

## Overview

Implement a "pre-launch mode" for Bhakti+ that allows logged-in users without a paid subscription to access Lives content for free until a specified date. The payment platform features will be replaced with "Coming Soon" UI, and real-time live streaming status detection will be added.

## Current State Analysis

### Key Files:
- `app/lib/utils/content.ts:182-249` - `hasAccessToContent()` main access check
- `app/routes/($region).($language).video.tsx:108-117` - Video token generation (hard gate)
- `app/components/SubscriptionModal.tsx` - Full subscription selection modal
- `app/components/ProgressAwareVideoCardLink/ProgressAwareVideoCardLink.tsx` - Click interception for access
- `app/components/ContentButtons/CTAButtons.tsx` - CTA buttons that open modals
- `app/components/Header/Header.tsx:153-163` - Search conditional rendering
- `app/routes/($region).($language)._index.tsx:268-282` - Homepage routing
- `app/components/Homepage/UnsubscribedHomepage.tsx` - Current unsubscribed homepage

### What exists now:
- Access control via `hasAccessToContent()` checks user subscription tier against content requirements
- Lives content requires "live" tier (the lowest paid tier)
- `SubscriptionModal` shows when user clicks on locked content
- `isLiveContent` field on content indicates content type (Lives category), not streaming status
- No feature flag system exists
- No real-time live status detection

## Desired End State

After this plan is complete:

1. **Environment Variables** control prelaunch mode:
   - `PRELAUNCH_MODE=true` enables prelaunch features
   - `PRELAUNCH_END_DATE=2025-01-15` sets the display date and potential auto-disable

2. **Logged-in users without a plan** see:
   - Modified homepage with featured live, past streams archive, and welcome message
   - Welcome message: "You have access to Ramcharitamanas Live and the live stream archive until X"
   - Can access and watch all Lives content for free
   - "Coming Soon" modal instead of subscription modal when accessing non-Lives content
   - No search functionality
   - No pricing or subscription tier information visible

3. **Non-logged-in users** see:
   - Modified homepage with featured live and "Sign Up for Free Access" CTA
   - CTA mentions "Bhakti+ Pre-Launch: Paramahamsa Vishwananda Ramcharitamanas Live"
   - Lives archive preview (thumbnails visible, login required to watch)
   - Clear path to sign up

4. **Live Status Detection** shows real-time "Currently Live" indicator when streaming

5. **Navigation** works as normal - users can browse all pages but get "Coming Soon" modal for non-Lives content

### Verification:
- Set `PRELAUNCH_MODE=true` and `PRELAUNCH_END_DATE=2025-02-01` in env
- **Non-logged-in**: see prelaunch homepage with "Sign Up for Free Access" CTA mentioning Paramahamsa Vishwananda Ramcharitamanas Live
- **Login without subscription** → see prelaunch homepage with welcome message
- Welcome message shows "Ramcharitamanas Live" and correct end date
- Click on Lives content → can watch video
- Click on Satsangs/Commentaries → see "Coming Soon" modal
- Search icon not visible in header
- No pricing visible anywhere

## What We're NOT Doing

- Backend changes to the Media API (all changes frontend-only)
- Modifying existing subscription payment flow code
- Creating user accounts or free trial subscriptions
- Email signup or notification system for "Coming Soon"
- Analytics tracking for prelaunch (could be added later)

## Implementation Approach

Create a feature flag system using environment variables. Add a prelaunch context that components can query. Modify access control to grant Lives access during prelaunch. Create a "Coming Soon" modal and swap it in place of subscription modals. Modify the UnsubscribedHomepage to show prelaunch content.

For live status detection, create infrastructure that can connect to a backend WebSocket or polling endpoint when available.

---

## Phase 1: Environment Variables and Feature Flag Infrastructure

### Overview
Set up the foundational prelaunch feature flag system using environment variables.

### Changes Required:

#### 1. Add Environment Variable Types
**File**: `env.d.ts`
**Changes**: Add prelaunch environment variables to the Env interface

```typescript
interface Env extends HydrogenEnv {
  // ... existing vars ...
  
  // Prelaunch mode configuration
  PRELAUNCH_MODE?: string; // "true" to enable prelaunch mode
  PRELAUNCH_END_DATE?: string; // ISO date string, e.g., "2025-01-15"
}
```

#### 2. Create Prelaunch Configuration Utility
**File**: `app/lib/utils/prelaunch.ts` (new file)
**Changes**: Create utility functions for prelaunch mode

```typescript
/**
 * Prelaunch mode utilities
 * Controls the "pre-launch" period where Lives content is free
 * and payment features show "Coming Soon"
 */

export interface PrelaunchConfig {
  isPrelaunchMode: boolean;
  prelaunchEndDate: Date | null;
  prelaunchEndDateFormatted: string | null;
}

/**
 * Get prelaunch configuration from environment variables
 * Call this server-side in loaders
 */
export function getPrelaunchConfig(env: {
  PRELAUNCH_MODE?: string;
  PRELAUNCH_END_DATE?: string;
}): PrelaunchConfig {
  const isPrelaunchMode = env.PRELAUNCH_MODE === "true";
  
  let prelaunchEndDate: Date | null = null;
  let prelaunchEndDateFormatted: string | null = null;
  
  if (env.PRELAUNCH_END_DATE) {
    prelaunchEndDate = new Date(env.PRELAUNCH_END_DATE);
    // Format as "January 15, 2025"
    prelaunchEndDateFormatted = prelaunchEndDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  
  return {
    isPrelaunchMode,
    prelaunchEndDate,
    prelaunchEndDateFormatted,
  };
}

/**
 * Check if prelaunch mode is still active (not past end date)
 */
export function isPrelaunchActive(config: PrelaunchConfig): boolean {
  if (!config.isPrelaunchMode) return false;
  if (!config.prelaunchEndDate) return config.isPrelaunchMode;
  
  return new Date() < config.prelaunchEndDate;
}

/**
 * Content types that are free during prelaunch
 */
export const PRELAUNCH_FREE_CONTENT_TYPES = ["live"] as const;

/**
 * Check if a content type is free during prelaunch
 */
export function isContentFreeInPrelaunch(contentType: string): boolean {
  return PRELAUNCH_FREE_CONTENT_TYPES.includes(contentType as any);
}
```

#### 3. Add Prelaunch Config to Root Loader
**File**: `app/root.tsx`
**Changes**: Load prelaunch config and pass to context

In the root loader, add:
```typescript
import { getPrelaunchConfig, isPrelaunchActive } from "~/lib/utils/prelaunch";

// In loader function:
const prelaunchConfig = getPrelaunchConfig(context.env);
const isPrelaunch = isPrelaunchActive(prelaunchConfig);

// Return in loader data:
return {
  // ... existing data ...
  prelaunchConfig: {
    isPrelaunchMode: prelaunchConfig.isPrelaunchMode,
    prelaunchEndDateFormatted: prelaunchConfig.prelaunchEndDateFormatted,
    isActive: isPrelaunch,
  },
};
```

#### 4. Create Prelaunch Context
**File**: `app/contexts/PrelaunchProvider.tsx` (new file)
**Changes**: Create React context for prelaunch state

```typescript
import { createContext, useContext, ReactNode } from "react";
import { useRouteLoaderData } from "react-router";

interface PrelaunchContextValue {
  isPrelaunchMode: boolean;
  isPrelaunchActive: boolean;
  prelaunchEndDateFormatted: string | null;
}

const PrelaunchContext = createContext<PrelaunchContextValue>({
  isPrelaunchMode: false,
  isPrelaunchActive: false,
  prelaunchEndDateFormatted: null,
});

export function PrelaunchProvider({ children }: { children: ReactNode }) {
  const rootData = useRouteLoaderData("root") as any;
  const prelaunchConfig = rootData?.prelaunchConfig ?? {
    isPrelaunchMode: false,
    isActive: false,
    prelaunchEndDateFormatted: null,
  };

  return (
    <PrelaunchContext.Provider
      value={{
        isPrelaunchMode: prelaunchConfig.isPrelaunchMode,
        isPrelaunchActive: prelaunchConfig.isActive,
        prelaunchEndDateFormatted: prelaunchConfig.prelaunchEndDateFormatted,
      }}
    >
      {children}
    </PrelaunchContext.Provider>
  );
}

export function usePrelaunch() {
  return useContext(PrelaunchContext);
}
```

#### 5. Add PrelaunchProvider to App Layout
**File**: `app/root.tsx`
**Changes**: Wrap app with PrelaunchProvider

```typescript
import { PrelaunchProvider } from "~/contexts/PrelaunchProvider";

// In the App component, wrap with PrelaunchProvider:
<PrelaunchProvider>
  {/* existing content */}
</PrelaunchProvider>
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck` (pre-existing errors, new files pass)
- [x] Linting passes: `npm run lint` (pre-existing errors, new files pass)
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [ ] Set `PRELAUNCH_MODE=true` and `PRELAUNCH_END_DATE=2025-02-01` in `.dev.vars`
- [ ] `usePrelaunch()` hook returns correct values in a component
- [ ] Date is formatted correctly as "February 1, 2025"

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to the next phase.

---

## Phase 2: Coming Soon Modal

### Overview
Create a "Coming Soon" modal to replace subscription modals during prelaunch.

### Changes Required:

#### 1. Create ComingSoonModal Component
**File**: `app/components/Modal/ComingSoonModal.tsx` (new file)
**Changes**: Create the Coming Soon modal

```typescript
import { ModalPortal } from "~/components/Portal";
import { Button } from "~/components/Button/Button";
import { usePrelaunch } from "~/contexts/PrelaunchProvider";

interface ComingSoonModalProps {
  onClose: () => void;
  contentType?: string;
}

/**
 * Modal shown during prelaunch when users try to access non-Lives content
 */
export function ComingSoonModal({ onClose, contentType }: ComingSoonModalProps) {
  const { prelaunchEndDateFormatted } = usePrelaunch();

  const contentTypeDisplay = contentType
    ? contentType.charAt(0).toUpperCase() + contentType.slice(1) + "s"
    : "This content";

  return (
    <ModalPortal onClose={onClose} backdrop="dark">
      <div className="bg-brand-dark rounded-lg max-w-[500px] w-full p-32 relative">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-16 right-16 text-grey-light hover:text-white transition-colors text-24 leading-none p-8"
          aria-label="Close"
        >
          ×
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-24">
          <div className="w-80 h-80 rounded-full bg-brand/20 flex items-center justify-center">
            <svg
              className="w-40 h-40 text-brand-light"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-28 font-700 text-white mb-12">Coming Soon</h2>
          <p className="text-grey-light text-16 mb-24">
            {contentTypeDisplay} will be available when Bhakti+ fully launches.
            {prelaunchEndDateFormatted && (
              <>
                {" "}Full access plans will be available for purchase soon.
              </>
            )}
          </p>
          <p className="text-brand-light text-14 mb-24">
            In the meantime, enjoy free access to Ramcharitamanas Live and the
            live stream archive!
          </p>
          <Button variant="primary" onClick={onClose}>
            Continue Exploring
          </Button>
        </div>
      </div>
    </ModalPortal>
  );
}
```

#### 2. Export ComingSoonModal
**File**: `app/components/Modal/index.ts`
**Changes**: Add export

```typescript
export { ComingSoonModal } from "./ComingSoonModal";
```

#### 3. Update CTAButtons to Use Coming Soon Modal
**File**: `app/components/ContentButtons/CTAButtons.tsx`
**Changes**: Show ComingSoonModal instead of SubscriptionModal during prelaunch for non-Lives content

Add imports and conditional logic:
```typescript
import { usePrelaunch } from "~/contexts/PrelaunchProvider";
import { ComingSoonModal } from "~/components/Modal/ComingSoonModal";
import { isContentFreeInPrelaunch } from "~/lib/utils/prelaunch";

// In the component:
const { isPrelaunchActive } = usePrelaunch();

// Determine if this content is free in prelaunch
const isFreeInPrelaunch = isPrelaunchActive && isContentFreeInPrelaunch(contentType);

// In render, conditionally show ComingSoonModal:
{showModal && isPrelaunchActive && !isFreeInPrelaunch && (
  <ComingSoonModal
    onClose={() => setShowModal(false)}
    contentType={contentType}
  />
)}
{showModal && (!isPrelaunchActive || isFreeInPrelaunch) && publicStoreDomain && (
  <SubscriptionModal ... />
)}
```

#### 4. Update ProgressAwareVideoCardLink
**File**: `app/components/ProgressAwareVideoCardLink/ProgressAwareVideoCardLink.tsx`
**Changes**: Show ComingSoonModal during prelaunch for non-Lives content

Similar changes to show ComingSoonModal when appropriate.

#### 5. Update Video Page
**File**: `app/routes/($region).($language).video.tsx`
**Changes**: Show ComingSoonModal when user lacks access to non-Lives content during prelaunch

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck` (pre-existing errors, new files pass)
- [x] Linting passes: `npm run lint` (pre-existing warnings, new files pass)
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [ ] With `PRELAUNCH_MODE=true`, clicking on Satsang content shows "Coming Soon" modal
- [ ] Modal displays correct content type name
- [ ] Modal has proper styling and close functionality
- [ ] "Continue Exploring" button closes the modal

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to the next phase.

---

## Phase 3: Prelaunch Homepage

### Overview
Modify the UnsubscribedHomepage to show prelaunch-specific content for logged-in users without a subscription.

### Changes Required:

#### 1. Create PrelaunchWelcomeSection Component
**File**: `app/components/Homepage/PrelaunchWelcomeSection.tsx` (new file)
**Changes**: Create the welcome message section

```typescript
import { Container, Stack } from "~/components";
import { usePrelaunch } from "~/contexts/PrelaunchProvider";

export function PrelaunchWelcomeSection() {
  const { prelaunchEndDateFormatted } = usePrelaunch();

  return (
    <section className="py-64 bg-gradient-to-b from-brand to-brand-dark">
      <Container>
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-32 tablet:text-40 font-700 text-white mb-16">
            Jai Gurudev!
          </h2>
          <p className="text-18 tablet:text-20 text-white/90 leading-relaxed">
            Welcome to the Pre-Launch of Bhakti+. You have access to
            Ramcharitamanas Live and the live stream archive
            {prelaunchEndDateFormatted && (
              <> until <span className="font-600">{prelaunchEndDateFormatted}</span></>
            )}
            . Full access to Bhakti+ feature plans will be available to purchase
            soon. Hope you enjoy!
          </p>
        </div>
      </Container>
    </section>
  );
}
```

#### 2. Create LivesArchive Component
**File**: `app/components/Homepage/LivesArchive.tsx` (new file)
**Changes**: Show past live streams with dates

```typescript
import { Suspense } from "react";
import { Await } from "react-router";
import {
  Container,
  ContainerWide,
  Carousel,
  SectionHeader,
  VideoCard,
  CarouselLoading,
} from "~/components";
import { ProgressAwareVideoCardLink, ProgressAwareHoverVideoCard } from "~/components";
import { Content, SubscriptionTier } from "~/lib/types";
import { useRootLoaderData } from "~/hooks";

interface LivesArchiveProps {
  lives: Content[] | Promise<Content[]>;
  title: string;
  subscriptionTier?: string;
  customerId?: string;
}

/**
 * Format a date string to show when the stream occurred
 */
function formatStreamDate(dateString: string | undefined): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Streamed today";
  if (diffDays === 1) return "Streamed yesterday";
  if (diffDays < 7) return `Streamed ${diffDays} days ago`;
  
  return `Streamed ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })}`;
}

export function LivesArchive({
  lives,
  title,
  subscriptionTier,
  customerId,
}: LivesArchiveProps) {
  const { publicStoreDomain, user, subscriptionProducts, watchProgress } = useRootLoaderData();

  const renderLives = (resolvedLives: Content[]) => {
    // Filter out upcoming/future lives, show only past streams
    const pastLives = resolvedLives.filter(
      (live) => !live.isUpcoming && live.startDate
    );

    if (pastLives.length === 0) return null;

    return (
      <ContainerWide>
        <Container>
          <SectionHeader title={title} exploreAllLink="/lives" />
          <Carousel>
            {pastLives.map((live) => (
              <Carousel.Slide key={live.contentId}>
                <ProgressAwareVideoCardLink
                  content={live}
                  user={user}
                  subscriptionTier={subscriptionTier as SubscriptionTier | undefined}
                  watchProgress={watchProgress}
                  publicStoreDomain={publicStoreDomain}
                  subscriptionProducts={subscriptionProducts ?? undefined}
                  contentType="livestream"
                >
                  <ProgressAwareHoverVideoCard
                    aspectRatio="landscape"
                    eyebrow={formatStreamDate(live.startDate)}
                    title={live.title ?? ""}
                    duration={live.video?.durationSeconds}
                    thumbnailUrl={live.thumbnailUrl}
                    videoId={live.video?.videoId}
                    subscriptionTier={subscriptionTier}
                    customerId={customerId}
                    tags={live.tags}
                    chapters={live.video?.chapters}
                  />
                </ProgressAwareVideoCardLink>
              </Carousel.Slide>
            ))}
          </Carousel>
        </Container>
      </ContainerWide>
    );
  };

  // Handle both Promise and resolved array
  if (lives instanceof Promise) {
    return (
      <Suspense fallback={<CarouselLoading />}>
        <Await resolve={lives}>
          {(resolvedLives) => renderLives(resolvedLives as Content[])}
        </Await>
      </Suspense>
    );
  }

  return renderLives(lives);
}
```

#### 3. Create PrelaunchSignupCTA Component
**File**: `app/components/Homepage/PrelaunchSignupCTA.tsx` (new file)
**Changes**: CTA section for non-logged-in users to sign up

```typescript
import { Container, Button } from "~/components";
import { Link } from "~/components/Link";

/**
 * CTA section shown to non-logged-in users during prelaunch
 * Encourages sign up for free access
 */
export function PrelaunchSignupCTA() {
  return (
    <section className="py-64 bg-gradient-to-b from-brand to-brand-dark">
      <Container>
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-32 tablet:text-40 font-700 text-white mb-16">
            Bhakti+ Pre-Launch
          </h2>
          <p className="text-18 tablet:text-20 text-white/90 leading-relaxed mb-24">
            Sign up now to get free access to{" "}
            <span className="font-600">Paramahamsa Vishwananda Ramcharitamanas Live</span>{" "}
            and the complete live stream archive.
          </p>
          <Link to="/account/login">
            <Button variant="primary" size="large" showArrow>
              Sign Up for Free Access
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
```

#### 4. Create PrelaunchHomepage Component
**File**: `app/components/Homepage/PrelaunchHomepage.tsx` (new file)
**Changes**: New homepage for prelaunch logged-in users

```typescript
import { useState, Suspense } from "react";
import { useLoaderData, Await } from "react-router";
import { ContainerWide, Stack } from "~/components";
import { CarouselLoading } from "~/components";
import { Content } from "~/lib/types";
import { FeaturedLiveHero } from "./shared-components";
import { PrelaunchWelcomeSection } from "./PrelaunchWelcomeSection";
import { LivesArchive } from "./LivesArchive";
import type { loader } from "~/routes/($region).($language)._index";

export function PrelaunchHomepage() {
  const {
    featuredLive,
    featuredLiveHeroSchema,
    lives,
    subscriptionTier,
    user,
  } = useLoaderData<typeof loader>();

  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  return (
    <div className="homepage prelaunch-homepage">
      {/* Featured Live Hero */}
      <FeaturedLiveHero
        featuredLive={featuredLive}
        featuredLiveHeroSchema={featuredLiveHeroSchema}
        isDetailsVisible={isDetailsVisible}
        setIsDetailsVisible={setIsDetailsVisible}
        subscriptionTier={subscriptionTier}
        customerId={user?.shopifyCustomerId}
      />

      <Stack gap={5} className="tablet:gap-sp-7">
        {/* Welcome Message */}
        <PrelaunchWelcomeSection />

        {/* Lives Archive */}
        <LivesArchive
          lives={lives}
          title="Live Stream Archive"
          subscriptionTier={subscriptionTier}
          customerId={user?.shopifyCustomerId}
        />
      </Stack>
    </div>
  );
}
```

#### 5. Export New Components
**File**: `app/components/Homepage/index.ts` (create or update)
**Changes**: Export new homepage components

```typescript
export { PrelaunchHomepage } from "./PrelaunchHomepage";
export { PrelaunchWelcomeSection } from "./PrelaunchWelcomeSection";
export { PrelaunchSignupCTA } from "./PrelaunchSignupCTA";
export { LivesArchive } from "./LivesArchive";
```

#### 6. Create PrelaunchUnsubscribedHomepage Component
**File**: `app/components/Homepage/PrelaunchUnsubscribedHomepage.tsx` (new file)
**Changes**: Modified homepage for non-logged-in users during prelaunch

```typescript
import { Suspense } from "react";
import { useLoaderData, Await } from "react-router";
import { ContainerWide, Stack, Cover, Button } from "~/components";
import { CarouselLoading } from "~/components";
import {
  HeroBackground,
  HeroContent,
  HeroTags,
  HeroTitle,
  HeroDescription,
  HeroButtons,
  Faqs,
} from "~/sections";
import { Content } from "~/lib/types";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { PrelaunchSignupCTA } from "./PrelaunchSignupCTA";
import { LivesArchive } from "./LivesArchive";
import type { loader } from "~/routes/($region).($language)._index";

/**
 * Homepage for non-logged-in users during prelaunch
 * Shows featured live, sign-up CTA, and lives archive preview
 */
export function PrelaunchUnsubscribedHomepage() {
  const {
    featuredLiveHeroSchema,
    lives,
    faqsSchema,
  } = useLoaderData<typeof loader>();
  const { strings } = useTranslations();

  return (
    <div className="homepage prelaunch-unsubscribed-homepage">
      {/* Featured Live Hero */}
      <HeroBackground
        backgroundImage={featuredLiveHeroSchema.backgroundImage}
        backgroundColor={featuredLiveHeroSchema.backgroundColor}
        imagePosition="top"
      >
        <Cover minHeight="70vh" mobileMinHeight="60vh">
          <HeroContent
            horizontalAlignment={featuredLiveHeroSchema.horizontalAlignment}
            verticalAlignment={featuredLiveHeroSchema.verticalAlignment}
            contentWidth={featuredLiveHeroSchema.contentWidth}
          >
            <Stack gap={3}>
              <Stack gap={2}>
                {featuredLiveHeroSchema.tags && featuredLiveHeroSchema.tags.length > 0 && (
                  <HeroTags tags={featuredLiveHeroSchema.tags} />
                )}
                <HeroTitle
                  uppercase={featuredLiveHeroSchema.titleUppercase}
                  dangerouslySetInnerHTML={{ __html: featuredLiveHeroSchema.title }}
                />
              </Stack>
              {featuredLiveHeroSchema.description && (
                <HeroDescription>{featuredLiveHeroSchema.description}</HeroDescription>
              )}
              <HeroButtons horizontalAlignment="center">
                <a href="/account/login">
                  <Button
                    as="button"
                    variant="primary"
                    size="large"
                    showArrow
                  >
                    Sign Up for Free Access
                  </Button>
                </a>
              </HeroButtons>
            </Stack>
          </HeroContent>
        </Cover>
      </HeroBackground>

      <Stack gap={5} className="tablet:gap-sp-7">
        {/* Prelaunch Sign-Up CTA */}
        <PrelaunchSignupCTA />

        {/* Lives Archive Preview (show thumbnails but require login to watch) */}
        <Suspense fallback={<CarouselLoading />}>
          <Await resolve={lives}>
            {(resolvedLives) => (
              <LivesArchive
                lives={resolvedLives as unknown as Content[]}
                title="Live Stream Archive"
              />
            )}
          </Await>
        </Suspense>

        {/* FAQs */}
        <Faqs
          container={{ bottomPadding: "lg" }}
          schema={faqsSchema}
          withImageBackground
        />
      </Stack>
    </div>
  );
}
```

#### 7. Update Homepage Routing
**File**: `app/routes/($region).($language)._index.tsx`
**Changes**: Show appropriate prelaunch homepage based on login status

```typescript
import { PrelaunchHomepage } from "~/components/Homepage/PrelaunchHomepage";
import { PrelaunchUnsubscribedHomepage } from "~/components/Homepage/PrelaunchUnsubscribedHomepage";
import { getPrelaunchConfig, isPrelaunchActive } from "~/lib/utils/prelaunch";

// In loader, add prelaunch config to return data:
const prelaunchConfig = getPrelaunchConfig(context.env);
const isPrelaunch = isPrelaunchActive(prelaunchConfig);

return {
  // ... existing data ...
  isPrelaunch,
  prelaunchEndDateFormatted: prelaunchConfig.prelaunchEndDateFormatted,
};

// In Homepage component:
export default function Homepage() {
  const { subscriptionTier, isPrelaunch, user } = useLoaderData<typeof loader>();

  // Prelaunch mode for logged-in users without subscription
  if (isPrelaunch && user && (!subscriptionTier || subscriptionTier === SUBSCRIPTION_TIERS.UNSUBSCRIBED)) {
    return <PrelaunchHomepage />;
  }

  // Prelaunch mode for non-logged-in users
  if (isPrelaunch && !user) {
    return <PrelaunchUnsubscribedHomepage />;
  }

  // Normal mode: not logged in or unsubscribed
  if (!subscriptionTier || subscriptionTier === SUBSCRIPTION_TIERS.UNSUBSCRIBED) {
    return <UnsubscribedHomepage />;
  }

  // ... rest of existing logic for subscribed users
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck` (pre-existing errors, new files pass)
- [x] Linting passes: `npm run lint` (pre-existing warnings, new files pass)
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] With `PRELAUNCH_MODE=true`, logged-in user without subscription sees PrelaunchHomepage
- [x] Featured live hero displays correctly
- [x] Welcome message shows "Ramcharitamanas Live" and correct end date
- [x] Lives archive shows past streams with "Streamed X days ago" labels
- [x] With `PRELAUNCH_MODE=true`, non-logged-in users see PrelaunchUnsubscribedHomepage
- [x] Non-logged-in homepage shows "Sign Up for Free Access" CTA
- [x] Sign up CTA mentions "Paramahamsa Vishwananda Ramcharitamanas Live"
- [x] With `PRELAUNCH_MODE=false`, non-logged-in users see normal UnsubscribedHomepage

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to the next phase.

---

## Phase 4: Live Status Detection Infrastructure

### Overview
Create infrastructure for detecting when content is currently streaming live.

### Changes Required:

#### 1. Create Live Status Types
**File**: `app/lib/types/live-status.types.ts` (new file)
**Changes**: Define types for live status

```typescript
export interface LiveStatusInfo {
  isCurrentlyLive: boolean;
  liveContentId?: number;
  liveVideoId?: number;
  liveTitle?: string;
  viewerCount?: number;
  startedAt?: string;
}

export interface LiveStatusResponse {
  status: LiveStatusInfo;
  timestamp: string;
}
```

#### 2. Create Live Status API Service
**File**: `app/lib/api/services/live-status.ts` (new file)
**Changes**: Service for checking live status

```typescript
import { ApiClient } from "../client";
import type { LiveStatusInfo, LiveStatusResponse } from "~/lib/types/live-status.types";

export class LiveStatusService extends ApiClient {
  /**
   * Check if there's currently a live stream
   * This endpoint should be lightweight for polling
   */
  async getCurrentLiveStatus(): Promise<LiveStatusInfo> {
    try {
      const response = await this.get<LiveStatusResponse>("/lives/status");
      return response.data?.status ?? { isCurrentlyLive: false };
    } catch (error) {
      // Fail silently - live status is enhancement, not critical
      console.warn("Failed to fetch live status:", error);
      return { isCurrentlyLive: false };
    }
  }
}
```

#### 3. Add Live Status Service to Media API
**File**: `app/lib/api/index.ts`
**Changes**: Add LiveStatusService to the API client

```typescript
import { LiveStatusService } from "./services/live-status";

// In the BhaktiMargMediaApi class:
liveStatus: LiveStatusService;

constructor(config: ApiConfig) {
  // ... existing services ...
  this.liveStatus = new LiveStatusService(config);
}
```

#### 4. Create Live Status Hook
**File**: `app/hooks/useLiveStatus.ts` (new file)
**Changes**: Hook for polling live status

```typescript
import { useState, useEffect, useCallback } from "react";
import type { LiveStatusInfo } from "~/lib/types/live-status.types";

const POLL_INTERVAL = 30000; // 30 seconds

interface UseLiveStatusOptions {
  enabled?: boolean;
  pollInterval?: number;
}

/**
 * Hook for polling live streaming status
 * Returns current live status and refreshes periodically
 */
export function useLiveStatus(options: UseLiveStatusOptions = {}) {
  const { enabled = true, pollInterval = POLL_INTERVAL } = options;
  
  const [status, setStatus] = useState<LiveStatusInfo>({ isCurrentlyLive: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch from API route that calls the backend
      const response = await fetch("/api/live-status");
      if (!response.ok) throw new Error("Failed to fetch live status");
      
      const data = await response.json();
      setStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      // Don't update status on error - keep last known state
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchStatus();
    
    if (enabled && pollInterval > 0) {
      const interval = setInterval(fetchStatus, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, enabled, pollInterval]);

  return {
    ...status,
    isLoading,
    error,
    refresh: fetchStatus,
  };
}
```

#### 5. Create Live Status API Route
**File**: `app/routes/api.live-status.tsx` (new file)
**Changes**: API route for fetching live status

```typescript
import type { LoaderFunctionArgs } from "@shopify/hydrogen/oxygen";
import { json } from "react-router";

export async function loader({ context }: LoaderFunctionArgs) {
  const status = await context.mediaApi.liveStatus.getCurrentLiveStatus();
  
  return json({
    status,
    timestamp: new Date().toISOString(),
  });
}
```

#### 6. Create LiveNowBadge Component
**File**: `app/components/LiveNowBadge/LiveNowBadge.tsx` (new file)
**Changes**: Visual indicator for live streaming

```typescript
interface LiveNowBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export function LiveNowBadge({
  className = "",
  size = "md",
  pulse = true,
}: LiveNowBadgeProps) {
  const sizeClasses = {
    sm: "text-10 px-6 py-2",
    md: "text-12 px-8 py-4",
    lg: "text-14 px-12 py-6",
  };

  return (
    <div
      className={`
        inline-flex items-center gap-6 bg-red-600 text-white font-600 rounded-full uppercase tracking-wide
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <span
        className={`
          w-8 h-8 rounded-full bg-white
          ${pulse ? "animate-pulse" : ""}
        `}
      />
      <span>Live</span>
    </div>
  );
}
```

#### 7. Export New Components and Hooks
**File**: `app/components/index.ts` and `app/hooks/index.ts`
**Changes**: Export new components and hooks

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck` (pre-existing errors, new files pass)
- [x] Linting passes: `npm run lint` (pre-existing warnings, new files pass)
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [ ] `/api/live-status` endpoint returns JSON response
- [ ] `useLiveStatus` hook polls at configured interval
- [ ] LiveNowBadge displays with pulsing animation
- [ ] Error handling doesn't break the UI if API fails

**Implementation Note**: The backend `/lives/status` endpoint may not exist yet. This phase creates the infrastructure. The actual live detection will work once the backend provides this endpoint. For now, it will gracefully return `isCurrentlyLive: false`.

---

## Phase 5: Hide Search and Pricing in Prelaunch Mode

### Overview
Hide search functionality and all pricing references during prelaunch.

### Changes Required:

#### 1. Update Header to Hide Search
**File**: `app/components/Header/Header.tsx`
**Changes**: Hide search for prelaunch users without subscription

```typescript
import { usePrelaunch } from "~/contexts/PrelaunchProvider";

// In HeaderContent component:
const { isPrelaunchActive } = usePrelaunch();

// Modify the search conditional (around line 153):
// Hide search if:
// 1. User doesn't have active subscription, OR
// 2. Prelaunch is active and user is unsubscribed
const showSearch = hasActiveSubscription && !isPrelaunchActive;

{showSearch && (
  <div className="site-header__search mr-12">
    <Search ... />
  </div>
)}
```

#### 2. Hide "Choose Plan" Button in Header
**File**: `app/components/Header/Header.tsx`
**Changes**: Hide Choose Plan button during prelaunch

```typescript
// In the logged-in section, hide Choose Plan during prelaunch:
{isLoggedIn ? (
  <>
    {!hasActiveSubscription && !isPrelaunchActive && (
      <Link
        to="#subscription-tiers"
        className="btn btn--secondary btn--sm mr-12"
        onClick={handleChoosePlanClick}
      >
        {strings.nav_choose_plan}
      </Link>
    )}
    <ProfileMenu />
  </>
) : (
  // Non-logged-in users - keep existing behavior during prelaunch
  // They should still see sign in and potentially choose plan
  ...
)}
```

#### 3. Hide Subscription Tiers Section on Homepage
**File**: `app/components/Homepage/UnsubscribedHomepage.tsx`
**Changes**: Conditionally hide SubscriptionTiers and PlanBenefits during prelaunch

```typescript
import { usePrelaunch } from "~/contexts/PrelaunchProvider";

// In UnsubscribedHomepage:
const { isPrelaunchActive } = usePrelaunch();

// Conditionally render subscription sections:
{!isPrelaunchActive && (
  <>
    <Suspense fallback={<div className="container mx-auto px-60 py-40">Loading...</div>}>
      <Await resolve={memberships}>
        {(resolvedMemberships) => (
          <SubscriptionTiers memberships={resolvedMemberships} />
        )}
      </Await>
    </Suspense>

    <Suspense fallback={<div className="container mx-auto px-60 py-40">Loading...</div>}>
      <Await resolve={memberships}>
        {(resolvedMemberships) => (
          <PlanBenefits
            title={strings.homepage_plan_benefits_title}
            memberships={resolvedMemberships}
          />
        )}
      </Await>
    </Suspense>
  </>
)}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck` (pre-existing errors, new files pass)
- [x] Linting passes: `npm run lint` (pre-existing warnings, new files pass)
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] With `PRELAUNCH_MODE=true` and logged in without subscription:
  - [x] Search icon not visible in header
  - [x] "Choose Plan" button not visible in header
  - [x] Subscription tiers section not visible on homepage
  - [x] Plan benefits section not visible on homepage
- [ ] With `PRELAUNCH_MODE=false`, all elements appear normally

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to the next phase.

---

## Phase 6: Access Control Bypass for Lives Content

### Overview
Grant access to Lives content during prelaunch for logged-in users without a subscription.

### Changes Required:

#### 1. Update hasAccessToContent Utility
**File**: `app/lib/utils/content.ts`
**Changes**: Add prelaunch bypass for Lives content

```typescript
import { isContentFreeInPrelaunch } from "./prelaunch";

/**
 * Check if user has access to content
 * During prelaunch, logged-in users get free access to Lives content
 */
export function hasAccessToContent(
  user: User,
  subscriptionTier: SubscriptionTier,
  content: Content,
  options?: { isPrelaunch?: boolean }
): boolean {
  if (!user || !content) {
    return false;
  }

  // Prelaunch bypass: logged-in users get free access to Lives content
  if (options?.isPrelaunch) {
    const contentType = getContentType(content);
    if (contentType && isContentFreeInPrelaunch(contentType)) {
      return true;
    }
  }

  // Check PPV access using ppv array from /user/profile
  if (hasAccessViaPPV(user, content)) {
    return true;
  }

  if (hasAccessViaSubscription(subscriptionTier, content)) {
    return true;
  }

  return false;
}
```

#### 2. Update Server-Side hasAccessToContent
**File**: `app/lib/utils/server.utils.ts`
**Changes**: Add prelaunch bypass for server-side access check

Similar changes to the server-side version of `hasAccessToContent`.

#### 3. Pass Prelaunch Flag to Access Checks
**File**: `app/routes/($region).($language).video.tsx`
**Changes**: Pass prelaunch flag when checking access

```typescript
import { getPrelaunchConfig, isPrelaunchActive } from "~/lib/utils/prelaunch";

// In loader:
const prelaunchConfig = getPrelaunchConfig(context.env);
const isPrelaunch = isPrelaunchActive(prelaunchConfig);

// Pass to access check:
const userHasAccess = hasAccessToContent(user, subscriptionTier, video, content, { isPrelaunch });
```

#### 4. Update ProgressAwareVideoCardLink
**File**: `app/components/ProgressAwareVideoCardLink/ProgressAwareVideoCardLink.tsx`
**Changes**: Use prelaunch context for access checks

```typescript
import { usePrelaunch } from "~/contexts/PrelaunchProvider";
import { isContentFreeInPrelaunch } from "~/lib/utils/prelaunch";

// In component:
const { isPrelaunchActive } = usePrelaunch();

// Modify access check:
const contentType = getContentTypeFromContent(content);
const isFreeInPrelaunch = isPrelaunchActive && contentType && isContentFreeInPrelaunch(contentType);

const userHasAccess = isFreeInPrelaunch || (
  user && subscriptionTier
    ? hasAccessToContent(user, subscriptionTier, content)
    : false
);
```

#### 5. Update ContentButtons
**File**: `app/components/ContentButtons/ContentButtons.tsx`
**Changes**: Show play button for Lives content during prelaunch

The access check happens in the parent component, but we need to ensure the play button shows for prelaunch Lives content.

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck` (pre-existing errors, new changes pass)
- [x] Linting passes: `npm run lint` (pre-existing warnings, new changes pass)
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [ ] With `PRELAUNCH_MODE=true` and logged in without subscription:
  - [ ] Can click on Lives content and navigate to video page
  - [ ] Video player shows and plays the content
  - [ ] Video token is generated successfully
- [ ] Clicking on Satsangs shows "Coming Soon" modal
- [ ] With `PRELAUNCH_MODE=false`, access control works normally

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation.

---

## Testing Strategy

### Unit Tests:
- `getPrelaunchConfig()` returns correct values for different env combinations
- `isPrelaunchActive()` correctly handles date comparisons
- `isContentFreeInPrelaunch()` returns true for "live" content type

### Integration Tests:
- Access control grants access to Lives during prelaunch
- Access control denies access to Satsangs during prelaunch
- Modal switching works correctly based on content type

### Manual Testing Steps:
1. Set `PRELAUNCH_MODE=true` and `PRELAUNCH_END_DATE=2025-02-01` in `.dev.vars`
2. Start dev server
3. Log in with a user that has no subscription
4. Verify PrelaunchHomepage displays with welcome message
5. Click on Lives content → should play
6. Click on Satsangs → should show Coming Soon modal
7. Check header has no search icon or Choose Plan button
8. Set `PRELAUNCH_MODE=false` and verify normal behavior returns

## Performance Considerations

- Live status polling should use a reasonable interval (30 seconds) to avoid excessive API calls
- Prelaunch config is loaded once per request in the root loader
- No additional database queries needed - all prelaunch logic is frontend

## References

- Related research: `thoughts/shared/research/2025-12-09-lives-page-prelaunch-research.md`
- Access control implementation: `app/lib/utils/content.ts:182-249`
- Modal system: `app/components/SubscriptionModal.tsx`
- Homepage routing: `app/routes/($region).($language)._index.tsx:263-283`
