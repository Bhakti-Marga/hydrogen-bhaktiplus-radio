# Codebase Refactoring Plan

**Date**: October 2025
**Purpose**: Eliminate anti-patterns and refactor to use composition over complex mega-components

---

## Executive Summary

This codebase exhibits several React anti-patterns that increase complexity and reduce maintainability:

1. **Mega components** with excessive props and conditional logic
2. **Schema-based props** that obscure component behavior
3. **Mapper function patterns** that force repetitive code
4. **Poor composition** - components do too much internally

The Hero component refactor (commit `fbde92c`) demonstrates the desired direction: breaking components into smaller, composable pieces. We'll apply this pattern throughout the codebase.

---

## Critical Anti-Patterns

### 1. ContentRow: The Mega Component Problem

**Location**: `app/components/ContentRow/ContentRow.tsx`

**Issues**:
- **16 props**, many of which are complex functions or React nodes
- Handles carousel, expansion, active states, background images, scrolling
- Used **22 times** across **11 files**
- Forces every consumer to implement `contentToBaseCardPropsMapper` function

**Current Interface**:
```typescript
interface ContentRowProps {
  title: string;
  exploreAllLink?: string;
  swiperProps?: SwiperProps;
  content: Array<Content | CategoryDto>;
  contentToBaseCardPropsMapper: (content: Content) => BaseCardProps | null;
  activeContent?: ReactNode | null;
  onContentClick?: (content: Content, idx: number) => void;
  handleCloseExpanded?: () => void;
  isActiveContent?: (content: Content, idx: number) => boolean;
  activeAspectRatio?: "square" | "landscape" | "portrait";
  shouldScrollToContent?: boolean;
  expandedBackgroundImage?: string | null;
}
```

#### ❌ What's Bad (Current)

```typescript
// From shared-components.tsx - Wrapper function anti-pattern
export function Commentaries({ commentaries, title }: { commentaries: Content[]; title: string }) {
  return (
    <ContentRow
      title={title}
      exploreAllLink="/commentaries"
      handleCloseExpanded={() => { }}
      content={commentaries}
      swiperProps={{
        slidesPerView: 4.2,
        slidesPerGroup: 4,
      }}
      contentToBaseCardPropsMapper={(commentary) => {
        return {
          aspectRatio: "landscape" as const,
          params: {
            eyebrow: commentary.subtitle,
            title: commentary.title ?? "",
          },
          url: `/commentaries/${commentary.slug}`,
          image: {
            square: commentary.thumbnailUrl,
            landscape: commentary.thumbnailUrl,
            portrait: commentary.thumbnailUrlVertical,
          },
        };
      }}
    />
  );
}

// Usage
<Commentaries commentaries={commentaries} title="Latest Commentaries" />
```

**Problems**:
- Unnecessary wrapper function
- Mapper function is boilerplate
- Can't see what's being rendered
- Hard to customize individual cards
- Props passed through multiple layers

#### ✅ What's Good (After Refactor)

```typescript
// Direct composition - clear and flexible
<div className="animated-link-chevron-trigger max-w-screen overflow-hidden relative z-10">
  <SectionHeader title="Latest Commentaries" exploreAllLink="/commentaries" />
  <Carousel slidesPerView={4.2} slidesPerGroup={4}>
    {commentaries.map(commentary => (
      <ContentCard
        key={commentary.id}
        aspectRatio="landscape"
        url={`/commentaries/${commentary.slug}`}
        eyebrow={commentary.subtitle}
        title={commentary.title}
        image={commentary.thumbnailUrl}
      />
    ))}
  </Carousel>
</div>

// Or without header/link - just the carousel:
<Carousel slidesPerView={4.2} slidesPerGroup={4}>
  {commentaries.map(commentary => (
    <ContentCard key={commentary.id} {...} />
  ))}
</Carousel>
```

**Benefits**:
- Clear component hierarchy
- Easy to see what's being rendered
- Can customize individual cards inline
- No mapper function boilerplate
- No unnecessary wrapper

---

### 2. Schema Pattern: Obscuring Component Behavior

**Problem**: Components accept "schema" objects that abstract the actual structure, making it hard to understand what's being rendered and preventing composition.

#### ❌ What's Bad: Old Hero Component (Pre-Refactor)

```typescript
// Building a schema object
const heroSchema: HeroSchema = {
  title: "Welcome",
  titleUppercase: true,
  description: "Description here",
  showOverlay: true,
  backgroundImage: {
    url: imageUrl,
    type: "external",
    altText: "Hero image",
  },
  verticalAlignment: "center",
  horizontalAlignment: "left",
  tags: [{ label: "LIVE", bgColor: "red", textColor: "white" }],
};

// Usage - can't see what's being rendered
<Hero
  schema={heroSchema}
  height="3xl"
  handleNegativeMargin={true}
  imageCover={true}
  button={<Button>Play</Button>}
  secondaryButton={<Button>Details</Button>}
/>
```

**Problems**:
- Schema object abstracts the structure
- Mix of schema props and component props
- Can't see component hierarchy
- Hard to rearrange elements
- TypeScript autocomplete doesn't help much

#### ✅ What's Good: Refactored Hero (Commit `fbde92c`)

```typescript
<HeroBackground
  backgroundImage={{
    url: imageUrl,
    type: "external",
    altText: "Hero image",
  }}
  showOverlay
  imageCover
>
  <HeroContent
    horizontalAlignment="left"
    verticalAlignment="center"
    padding="py-128"
  >
    <HeroTags tags={[{ label: "LIVE", bgColor: "red", textColor: "white" }]} />
    <HeroTitle uppercase>Welcome</HeroTitle>
    <HeroDescription>Description here</HeroDescription>
    <HeroButtons>
      <Button>Play</Button>
      <Button variant="secondary">Details</Button>
    </HeroButtons>
  </HeroContent>
</HeroBackground>
```

**Benefits**:
- Clear component hierarchy
- Can see exactly what's being rendered
- Easy to rearrange, remove, or add elements
- No schema object to maintain
- Better TypeScript autocomplete
- Easier to test individual pieces
- Can compose differently in different places

---

### 3. BaseCard: Complex Aspect Ratio Logic

**Location**: `app/components/BaseCard/BaseCard.tsx`

**Issues**:
- 320 lines of code
- Complex aspect ratio transition logic with fade-to-black workaround
- HACK comments indicate technical debt

#### ❌ What's Bad (Current HACK)

```typescript
// Lines 64-112 - Complex workaround
// HACK HACK HACK: Fade-to-dark transition for aspect ratio changes
//
// This is a temporary workaround because we're using separate images for portrait
// and landscape aspect ratios. When the aspect ratio changes, we:
// 1. Fade to a dark overlay (200ms)
// 2. Swap the image while overlay is opaque
// 3. Wait 10 animation frames (~166ms) for the new image to fully render
// 4. Fade the overlay out to reveal the new image

React.useEffect(() => {
  if (previousAspectRatio !== aspectRatio) {
    setIsFadingToBlack(true);
    const switchTimer = setTimeout(() => {
      setPreviousAspectRatio(aspectRatio);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setIsFadingToBlack(false);
              });
            });
          });
        });
      });
    }, 200);
    return () => clearTimeout(switchTimer);
  }
}, [aspectRatio, previousAspectRatio]);
```

#### ✅ What's Good (After Refactor)

```typescript
// Simple card that just displays what it's given
export function ContentCard({
  aspectRatio = "portrait",
  image,
  title,
  eyebrow,
  subtitle,
  url,
  badges,
  duration,
  progress,
  onClick,
}: ContentCardProps) {
  return (
    <div className="content-card">
      {url ? (
        <Link to={url} className="content-card__link">
          <CardContent {...} />
        </Link>
      ) : (
        <button onClick={onClick} className="content-card__button">
          <CardContent {...} />
        </button>
      )}
    </div>
  );
}
```

**Benefits**:
- ~100 lines instead of 320
- No complex transition logic
- No HACK workarounds
- If aspect ratio needs to change, parent handles it explicitly
- Simpler mental model

---

## Other Schema-Based Components to Refactor

All of these follow the same pattern - they take schema objects instead of using composition:

### 1. PlatformFeatures

**Location**: `app/sections/PlatformFeatures/`

#### ❌ Current
```typescript
const schema: PlatformFeaturesSchema = {
  title: "Platform Features",
  features: [
    { image: img1, title: "Feature 1", description: "..." },
    { image: img2, title: "Feature 2", description: "..." },
  ]
};

<PlatformFeatures schema={schema} />
```

#### ✅ After
```typescript
<PlatformFeatures title="Platform Features">
  <PlatformFeature
    image={img1}
    title="Feature 1"
    description="..."
  />
  <PlatformFeature
    image={img2}
    title="Feature 2"
    description="..."
  />
</PlatformFeatures>
```

### 2. SubscriptionTiers

**Location**: `app/sections/SubscriptionTiers/`

#### ❌ Current
```typescript
<SubscriptionTiers schema={subscriptionTiersSchema} />
```

#### ✅ After
```typescript
<SubscriptionTiers>
  <SubscriptionTier
    name="Basic"
    price={9.99}
    features={["Feature 1", "Feature 2"]}
  />
  <SubscriptionTier
    name="Premium"
    price={19.99}
    features={["All Basic", "Feature 3"]}
  />
</SubscriptionTiers>
```

### 3. Faqs

**Location**: `app/sections/Faqs/`

#### ❌ Current
```typescript
<Faqs schema={faqsSchema} />
```

#### ✅ After
```typescript
<Accordion>
  <AccordionItem question="Question 1" answer="Answer 1" />
  <AccordionItem question="Question 2" answer="Answer 2" />
</Accordion>
```

### 4. PlanBenefits

**Location**: `app/sections/PlanBenefits/`

#### ❌ Current
```typescript
<PlanBenefits schema={planBenefitsSchema} />
```

#### ✅ After
```typescript
<PlanBenefits>
  <PlanBenefit icon={icon1} title="Benefit 1" description="..." />
  <PlanBenefit icon={icon2} title="Benefit 2" description="..." />
</PlanBenefits>
```

---

## Refactoring Plan

### Phase 1: Content Display Components

#### Step 1: Create Base Carousel
**Create**: `app/components/Carousel/Carousel.tsx`
- Pure carousel component
- No title/link requirements
- Just wraps Swiper with sensible defaults

#### Step 2: Create Section Header
**Create**: `app/components/SectionHeader/SectionHeader.tsx`
- Extracted animated link pattern
- Can be used with or without "explore all" link
- Small, focused component

#### Step 3: Create Simple ContentCard
**Create**: `app/components/ContentCard/ContentCard.tsx`
- Simplified from BaseCard
- Remove aspect ratio transition HACK
- ~100 lines instead of 320
- Direct props, no complex patterns

#### Step 4: Update All ContentRow Usages
**Update these 11 files**:
1. `app/components/Homepage/shared-components.tsx` - Remove all 6 wrapper functions
2. `app/routes/$(locale).livestreams._index.tsx`
3. `app/routes/$(locale).satsangs._index.tsx`
4. `app/routes/$(locale).satsangs.$categoryId_.tsx`
5. `app/routes/$(locale).satsangs.$categoryId.subcategories.$subcategoryId.tsx`
6. `app/components/SatsangCategories/SatsangCategories.tsx`
7. `app/components/SatsangCategories/SatsangCategoryDetails.tsx`
8. `app/components/Commentaries/Commentaries.tsx`
9. `app/components/Pilgrimages/Pilgrimages.tsx`
10. `app/components/Homepage/CoreHomepage.tsx`
11. `app/components/Homepage/PremiumHomepage.tsx`

**Pattern**: Replace ContentRow with direct composition:
- Use `SectionHeader` for title/explore all link
- Use `Carousel` for the swiper
- Use `ContentCard` for individual items
- Compose together directly in JSX

#### Step 5: Delete Old Components
**Delete**:
- `app/components/ContentRow/ContentRow.tsx`
- `app/components/ContentRow/ContentRow.loading.tsx`
- `app/components/ContentRow/ContentRow.css`
- `app/components/BaseCard/BaseCard.tsx`

#### Step 6: Refactor ContentGrid
**Update**: `app/components/ContentGrid/ContentGrid.tsx`
- Follow same pattern as ContentRow
- Use composition instead of mapper functions
- Or delete if not needed after refactor

---

### Phase 2: Schema-Based Sections

Follow Hero refactor pattern for each:

#### Step 1: PlatformFeatures
**Refactor**: `app/sections/PlatformFeatures/PlatformFeatures.tsx`
**Delete**: `app/sections/PlatformFeatures/PlatformFeatures.schema.ts`
**Update**: `app/sections/PlatformFeatures/PlatformFeatures.loader.ts` - return data directly

#### Step 2: SubscriptionTiers
**Refactor**: `app/sections/SubscriptionTiers/SubscriptionTiers.tsx`
**Delete**: `app/sections/SubscriptionTiers/SubscriptionsTiers.schema.ts`

#### Step 3: Faqs
**Refactor**: `app/sections/Faqs/Faqs.tsx`
**Delete**:
- `app/sections/Faqs/Faqs.schema.ts`
- `app/sections/Faqs/Faqs.data.ts`

#### Step 4: PlanBenefits
**Refactor**: `app/sections/PlanBenefits/PlanBenefits.tsx`
**Delete**:
- `app/sections/PlanBenefits/PlanBenefits.schema.ts`
- `app/sections/PlanBenefits/PlanBenefits.data.ts`

#### Step 5: Tabs
**Refactor**: `app/sections/Tabs/Tabs.tsx`
**Consolidate**: With `app/components/Tabs/Tabs.tsx` if needed

---

### Phase 3: Cleanup & Styling

#### Step 1: Remove BEM-Style Classes
Throughout the codebase, we have BEM-style class names that add no value with component-based architecture.

**Anti-pattern to remove**:
```typescript
// BAD - BEM classes that just mirror component names
<div className="carousel-with-header">
  <div className="carousel-with-header__header">
    <div className="carousel-with-header__header__inner">
      <h2 className="carousel-with-header__title">Title</h2>
    </div>
  </div>
  <div className="carousel-with-header__content">
    {children}
  </div>
</div>
```

**Replace with**:
```typescript
// GOOD - Minimal Tailwind utilities
<div className="max-w-screen overflow-hidden relative z-10">
  <div className="container mx-auto flex items-center px-60 mb-16">
    <h2 className="text-white h2-md mr-16">Title</h2>
  </div>
  <div className="overflow-visible">
    {children}
  </div>
</div>
```

**Files to clean up** (scan for BEM patterns):
- All newly created components
- Existing components during refactor
- Look for patterns like: `component__element`, `component--modifier`

**Replace with**:
- Direct Tailwind utilities
- Design system tokens (not raw values)
- See `DEVELOPMENT_PRINCIPLES.md` for styling guidelines

#### Step 2: Remove Wrapper Functions
Remove wrapper functions from `app/components/Homepage/shared-components.tsx`

#### Step 3: Update Exports
Update component exports in `app/components/index.ts` and `app/sections/index.ts`

#### Step 4: Final Cleanup
1. Clean up any unused imports
2. Remove any other schema files found during refactor
3. Remove unused CSS files

---

## Files Summary

### To Create:
- `app/components/Carousel/Carousel.tsx`
- `app/components/SectionHeader/SectionHeader.tsx`
- `app/components/ContentCard/ContentCard.tsx`

### To Delete:
- `app/components/ContentRow/ContentRow.tsx`
- `app/components/ContentRow/ContentRow.loading.tsx`
- `app/components/ContentRow/ContentRow.css`
- `app/components/BaseCard/BaseCard.tsx`
- `app/components/ContentGrid/ContentGrid.tsx` (maybe)
- `app/sections/PlatformFeatures/PlatformFeatures.schema.ts`
- `app/sections/SubscriptionTiers/SubscriptionsTiers.schema.ts`
- `app/sections/Faqs/Faqs.schema.ts`
- `app/sections/Faqs/Faqs.data.ts`
- `app/sections/PlanBenefits/PlanBenefits.schema.ts`
- `app/sections/PlanBenefits/PlanBenefits.data.ts`

### To Significantly Refactor:
- All ContentRow consumers (11 files)
- All schema-based sections (5 components)

---

## Expected Outcomes

### Code Quality:
- **30-40% reduction** in lines of code
- **Simpler components** with single responsibilities
- **Clear hierarchy** visible in JSX
- **No prop drilling** or mapper functions
- **Better TypeScript** autocomplete and type safety

### Developer Experience:
- Easier to understand what's being rendered
- Easier to modify without touching component internals
- Faster to create new pages/features
- Easier to test individual components
- Better error messages

### Maintainability:
- Future developers can understand code quickly
- No complex abstractions to learn
- Direct, explicit code
- Smaller surface area for bugs

---

## Example: Complete Before & After

### ❌ Before (from livestreams route)

```typescript
// Wrapper function in shared-components.tsx
function LiveContentRow({ content, title, exploreAllLink, aspectRatio }) {
  return (
    <ContentRow
      title={title}
      exploreAllLink={exploreAllLink}
      handleCloseExpanded={() => { }}
      content={content as unknown as Content[]}
      swiperProps={{
        slidesPerView: 4.2,
        slidesPerGroup: 4,
      }}
      contentToBaseCardPropsMapper={(item) => {
        return {
          aspectRatio,
          url: `/video?videoId=${item.video?.videoId}&contentType=live&contentId=${item.contentId}`,
          params: {
            eyebrow: item.subtitle,
            title: item.title ?? "",
            durationSeconds: item.video?.durationSeconds,
          },
          image: {
            square: item.thumbnailUrl,
            landscape: item.thumbnailUrl,
            portrait: item.thumbnailUrlVertical,
          },
        };
      }}
    />
  );
}

// Usage in route
<Suspense fallback={<ContentRowLoading />}>
  <Await resolve={livesLatestReleases}>
    {(resolvedLives) => (
      <LiveContentRow
        content={resolvedLives as unknown as Content[]}
        title="Latest releases"
        exploreAllLink="/lives"
        aspectRatio="landscape"
      />
    )}
  </Await>
</Suspense>
```

**Problems**:
- Unnecessary wrapper function
- Boilerplate mapper
- Can't see what's rendered
- Multiple type assertions
- Props passed through layers

### ✅ After

```typescript
// Direct composition - clear and flexible
<Suspense fallback={<CarouselLoading />}>
  <Await resolve={livesLatestReleases}>
    {(lives) => (
      <div className="animated-link-chevron-trigger max-w-screen overflow-hidden relative z-10">
        <SectionHeader title="Latest releases" exploreAllLink="/lives" />
        <Carousel slidesPerView={4.2} slidesPerGroup={4}>
          {lives.map(live => (
            <ContentCard
              key={live.contentId}
              aspectRatio="landscape"
              url={`/video?videoId=${live.video?.videoId}&contentType=live&contentId=${live.contentId}`}
              eyebrow={live.subtitle}
              title={live.title}
              duration={live.video?.durationSeconds}
              image={live.thumbnailUrl}
            />
          ))}
        </Carousel>
      </div>
    )}
  </Await>
</Suspense>
```

**Benefits**:
- 40+ lines → 18 lines
- No wrapper function
- No mapper boilerplate
- Clear what's being rendered
- No type assertions
- Easy to customize individual cards

---

## Progress Summary (October 10, 2025)

### 🎉 Major Wins

**Phase 1 ContentRow Refactor: COMPLETE** ✅
- ✅ **Removed 400KB+ Swiper.js dependency** - 0 imports remaining
- ✅ **Deleted ContentRow & ContentGrid** - Mega components eliminated
- ✅ **Deleted all legacy CSS** - contentRow.css, carousel.css removed
- ✅ **Built native scroll-snap carousel** - No external dependencies
- ✅ **Created Netflix-style hover cards** - Portal-based video previews
- ✅ **Simplified all homepage components** - Direct composition, no mappers

**Code Reduction**:
- Removed ~2,000+ lines of complex component code
- Eliminated mapper function boilerplate across 11 files
- Cleaned up BEM-style classes in favor of Tailwind

**Developer Experience**:
- Clear, readable JSX everywhere
- No schema objects to maintain
- Easy to customize individual cards
- Better TypeScript autocomplete

---

### ✅ Completed

1. **Created New Card Architecture** (Composition over Configuration)
   - `Card.tsx` - Pure presentational base component with subcomponents:
     - `Card.Image` - Image display
     - `Card.Overlay` - Text overlay positioning
     - `Card.Title` - Styled title
     - `Card.Eyebrow` - Styled eyebrow text
   - `VideoCard.tsx` - Composed card for video content with duration badge
   - Supports size tokens: `xs` (226px), `sm` (256px), `md` (300px), `lg` (318px)
   - Default size: `md` (300px)

2. **Created Native Scroll-Snap Carousel** (Replaced Swiper.js)
   - ✅ **Removed ALL Swiper.js code** (0 imports remaining)
   - Built simple carousel using native CSS `scroll-snap-type`
   - `Carousel.tsx` - Container with navigation buttons
   - `Carousel.Slide` - Individual slide wrapper with scroll-snap
   - Cards determine their own size; carousel shows as many as fit
   - Carousel handles z-index on hover for overlapping
   - Cards handle their own scale/shadow effects
   - 16px vertical padding to accommodate scale effect

3. **Created SectionHeader Component**
   - Extracted animated link pattern from old carousel
   - Handles title + optional "explore all" link
   - Small, focused, reusable component

4. **Migrated livestreams._index.tsx**
   - Replaced ContentRow with Carousel + VideoCard composition
   - Removed mapper function boilerplate
   - Clean, direct JSX composition
   - Works perfectly with native carousel

5. **Defined Card Size Tokens in CSS**
   - Added to `app/styles/base.css`:
     ```css
     --card-width-xs: 226px;
     --card-width-sm: 256px;
     --card-width-md: 300px;
     --card-width-lg: 318px;
     ```

6. **Removed BEM Classes from New Components**
   - All new components use Tailwind utilities + design tokens
   - No BEM-style naming (e.g., `component__element`)

7. **Created Netflix-Style Hover Video Card** (October 10, 2025 - Evening)
   - `HoverVideoCard.tsx` - Card with video preview on hover
   - Uses portal + fixed positioning for 1.5x scale expansion
   - 500ms hover delay before video plays
   - Solves overflow clipping issues with portal pattern
   - Auto-plays video on hover (muted by default)
   - Integrated into satsangs index page category carousels

8. **Deleted ContentRow and ContentGrid Components** (October 10, 2025 - Evening)
   - ✅ Removed `app/components/ContentRow/` directory entirely
   - ✅ Removed `app/components/ContentGrid/` directory entirely
   - ✅ Created `CarouselLoading` component to replace `ContentRowLoading`
   - ✅ Updated all Homepage components to use `CarouselLoading`
   - ✅ Replaced all `.content-row` class usages with plain Tailwind
   - 0 ContentRow/ContentGrid imports remaining in codebase

9. **Cleaned Up Legacy CSS Files** (October 10, 2025 - Evening)
   - ✅ Deleted `app/styles/components/contentRow.css`
   - ✅ Deleted `app/styles/components/carousel.css` (Swiper nav styles)
   - ✅ Created `app/styles/components/hero.css` (hero overlays only)
   - ✅ Removed legacy CSS imports from `app/styles/app.css`
   - Organized styles by actual usage, not component names

10. **Deleted BaseCard and Created SearchCard** (October 10, 2025 - Late Evening)
   - ✅ Created `SearchCard.tsx` - Card with badge + duration support for search results
   - ✅ Refactored search feature dropdown to use `SearchCard`
   - ✅ Refactored search results page to use `SearchCard`
   - ✅ Deleted entire `app/components/BaseCard/` directory
   - ✅ **Eliminated 320 lines of complex code with aspect ratio HACK**
   - Replaced with simple composition-based card (~70 lines)

### 🔧 Key Architectural Decisions

1. **Card Size is King** - Cards have fixed widths; carousel adapts to show as many as fit
2. **Separation of Concerns**:
   - `Carousel.Slide` - Handles z-index for overlapping in carousel context
   - `VideoCard` - Handles scale/shadow hover effects (card's own behavior)
   - No coordination needed between card sizes and carousel
3. **Composition over Configuration** - Use `<Card>` primitives directly or compose into specialized cards like `VideoCard`
4. **Native over Library** - Built carousel with CSS scroll-snap instead of Swiper

---

## Next Steps

### 🔄 Remaining Work

#### 1. ~~Migrate Remaining ContentRow Usages~~ ✅ **COMPLETED**
**Status**: ContentRow and ContentGrid have been completely removed from the codebase!
- ✅ All 11 files migrated or updated
- ✅ All wrapper functions removed
- ✅ All components and CSS files deleted
- ✅ All imports cleaned up

#### 2. ~~Delete Old BaseCard~~ ✅ **COMPLETED** (October 10, 2025)
**Status**: BaseCard has been completely removed!
- ✅ Created `SearchCard` component with badge support
- ✅ Refactored `SearchFeatured.tsx` to use new card
- ✅ Refactored `search.tsx` route to use new card
- ✅ Removed all BaseCard imports from codebase
- ✅ Deleted `app/components/BaseCard/` directory entirely
- **Eliminated 320 lines of complex code with HACK workarounds**

#### 3. Phase 2: Schema-Based Sections
Follow Hero refactor pattern for:
- `PlatformFeatures` - Break into composable parts
- `SubscriptionTiers` - Direct composition
- `Faqs` - Use Accordion directly
- `PlanBenefits` - Composable benefits
- `Tabs` - Consolidate with component version

#### 4. Final Cleanup
- Remove unused imports
- Delete schema files
- Remove unused CSS files
- Update all component exports

---

## Development Principles Applied

1. ✅ **Composition over Inheritance** - Use `Card` primitives, compose into `VideoCard`
2. ✅ **No BEM Classes** - Use Tailwind utilities directly
3. ✅ **Design System Tokens** - Use `--card-width-md` not raw `300px`
4. ✅ **Avoid Abstractions** - No schema objects, no mapper functions
5. ✅ **Native over Library** - CSS scroll-snap instead of Swiper
6. ✅ **Single Responsibility** - Each component does one thing well

---

**Notes**:
- No backwards compatibility needed
- Test locally as we go
- Product isn't shipped yet, so we can make breaking changes freely
- Follow the Hero refactor pattern from commit `fbde92c` as the gold standard
- Reference livestreams._index.tsx migration as the template for ContentRow replacements
