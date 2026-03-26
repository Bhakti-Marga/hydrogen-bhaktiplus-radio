# Content Hero Refactoring - Commentaries & Pilgrimages

**Date**: October 11, 2025
**Status**: ✅ Complete

## Overview

We've successfully refactored all Commentary and Pilgrimage pages (both index and slug pages) to use composition following the principles in `REFACTORING_PLAN.md`. All pages now use the shared composable components for consistent behavior and maintainability.

---

## ✅ Completed Work

### 1. Created Composable Components

#### `ContentActionButtons` (`app/components/ContentActionButtons/`)
- Handles PPV/Premium/Supporter button logic
- Reusable across all content types (commentary, pilgrimage, satsang, talk, live)
- Encapsulates subscription check logic
- Single source of truth for access buttons

```typescript
<ContentActionButtons content={commentary} contentType="commentary" />
```

#### `ContentDetailsTabs` (`app/components/ContentDetailsTabs/`)
- Manages the About/Videos/Details tabs structure
- Handles loading and error states for videos
- Accepts hero content as a prop (composition!)
- Reusable for any series content

```typescript
<ContentDetailsTabs
  title={title}
  description={description}
  videoCount={videoCount}
  videos={allVideos}
  isLoadingVideos={isLoading}
  videosError={error}
  videosSubtitle="Videos (10)"
  info={info}
  heroContent={<YourHeroContent />}
  onTabChange={(tabId) => setActiveTab(tabId)}
/>
```

#### `transformSeriesVideos` (`app/lib/utils/series-videos.ts`)
- Shared video transformation utility
- Flattens video groups into individual video cards
- Used across 4+ files
- Eliminated ~132 lines of duplicated code

```typescript
const allVideos = transformSeriesVideos({
  videoGroups: videosFetcher.data?.videoGroups,
  contentId: content.contentId,
  contentType: "commentary",
  fallbackThumbnail: content.thumbnailUrl,
  prependGroupName: true, // optional
});
```

### 2. Refactored Components

**✅ `ExpandedCommentaryView`** - Reduced from ~210 lines to ~80 lines
- Uses `HeroContent`, `HeroTitle`, `HeroDescription`, `HeroButtons`
- Uses `ContentActionButtons` for button logic
- Uses `ContentDetailsTabs` for tabs
- Clear, readable composition

**✅ `ExpandedPilgrimageView`** - Reduced from ~210 lines to ~80 lines
- Same refactoring pattern as Commentary
- Includes tags with `HeroTags`
- Uses all shared composable components

**✅ `CommentariesHero` in `commentaries._index.tsx`** - Reduced from ~210 lines to ~90 lines
- Removed unused imports and variables
- Uses `ContentActionButtons` for button logic
- Uses `ContentDetailsTabs` for tabs structure
- Already using `transformSeriesVideos` with `prependGroupName: true`

**✅ `PilgrimagesHero` in `pilgrimages._index.tsx`** - Reduced from ~210 lines to ~90 lines
- Same refactoring pattern as Commentaries index
- Subtitle uses "Days" instead of "Videos"
- Uses `transformSeriesVideos` without prependGroupName

**✅ `CommentaryHero` in `commentaries.$slug.tsx`** - Reduced from ~220 lines to ~90 lines
- Replaced manual video transformation with `transformSeriesVideos` utility
- Uses composable components for hero content
- Eliminated ~30 lines of forEach video transformation logic

**✅ `PilgrimageHero` in `pilgrimages.$slug.tsx`** - Reduced from ~220 lines to ~90 lines
- Same refactoring as commentaries slug page
- Replaced manual video transformation with `transformSeriesVideos`
- Using composition pattern throughout

---

## 🎉 Refactoring Complete

**Commit**: `e5f11173eb878de206193487ebba4992ce08de28`
**Message**: "refactor: Series components used the same in Commentaries/Pilgrimages pages"

All pages have been successfully refactored!

---

## Summary of Changes

### All Pages Refactored

**4 files updated** in commit `e5f11173eb878de206193487ebba4992ce08de28`:

1. `app/routes/$(locale).commentaries._index.tsx` - CommentariesHero
2. `app/routes/$(locale).pilgrimages._index.tsx` - PilgrimagesHero
3. `app/routes/$(locale).commentaries.$slug.tsx` - CommentaryHero
4. `app/routes/$(locale).pilgrimages.$slug.tsx` - PilgrimageHero

### Key Changes Applied

**Removed unused code:**
- `useTranslations`, `isPPVContent`, `getSubscriptionTiersFromContent`
- `isPremium`, `isSupporter`, `strings`, `buttonText`, `handleVideoClick`
- Manual video transformation logic (~30 lines per slug page)
- Button rendering logic (~50 lines per page)
- Tabs structure (~150 lines per page)

**Added composable components:**
- `HeroTitle`, `HeroDescription`, `HeroButtons` for structured hero content
- `ContentActionButtons` for all button logic
- `ContentDetailsTabs` for tabs structure
- `transformSeriesVideos` for consistent video transformation

**Pattern applied:**
```typescript
// Create heroContent with composition
const heroContent = (
  <div className="container mx-auto px-60 h-full flex items-center">
    <div className="max-w-2xl text-left">
      <CollapsibleTags tags={tags} />
      <HeroTitle uppercase size="h1-lg">{title}</HeroTitle>
      <HeroDescription size="body-b2">{description}</HeroDescription>
      <HeroButtons>
        <ContentActionButtons content={content} contentType="commentary" />
      </HeroButtons>
    </div>
  </div>
);

// Replace Tabs with ContentDetailsTabs
<ContentDetailsTabs
  title={title}
  videos={allVideos}
  info={info}
  heroContent={heroContent}
  onTabChange={(tabId) => setActiveTab(tabId)}
/>
```

---

## Benefits Achieved

### Code Quality
- **~60% reduction** in all hero components (210 → 90 lines)
- **Eliminated ~400+ lines** of duplicate code across 4 files
- **Single source of truth** for buttons, tabs, and video transformation
- Consistent behavior across index and slug pages

### Composition Over Configuration
- ✅ No mega-components with switches
- ✅ Reusable pieces that can be composed differently
- ✅ Clear component hierarchy visible in JSX
- ✅ Easy to see what's being rendered

### Maintainability
- Change button logic once → applies everywhere
- Change tabs structure once → applies everywhere
- Change video transformation once → applies everywhere
- Each component has a single, clear responsibility

---

## Testing Checklist

Recommended tests for the refactored pages:

- [ ] Commentaries index page - All tabs work correctly
- [ ] Commentaries slug page - All tabs work correctly
- [ ] Pilgrimages index page - All tabs work correctly
- [ ] Pilgrimages slug page - All tabs work correctly
- [ ] Background video plays on About tab
- [ ] Videos tab loads and displays all videos
- [ ] Details tab shows content information
- [ ] PPV content shows correct buttons
- [ ] Premium/Supporter content shows Play button
- [ ] Unsubscribed users see correct access buttons
- [ ] "Show more/Show less" description toggle works

---

## Notes

- All 4 pages (commentaries + pilgrimages, index + slug) now use the same composable components
- Consistent behavior and maintainability across all pages
- Video transformation logic unified with `transformSeriesVideos` utility
- Slug pages benefited from replacing ~30 lines of manual forEach logic per file
