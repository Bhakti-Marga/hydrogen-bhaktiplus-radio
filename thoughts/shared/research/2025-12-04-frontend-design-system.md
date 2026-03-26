---
date: 2025-12-04T17:33:49Z
git_commit: 308adb24eb8f269f97b537c1d912b8bde77dcf1a
branch: main
topic: "Frontend Design System and Patterns"
tags: [research, design-system, components, css, tailwind, styling]
status: complete
---

# Research: Frontend Design System and Patterns

**Date**: 2025-12-04T17:33:49Z
**Git Commit**: 308adb24eb8f269f97b537c1d912b8bde77dcf1a
**Branch**: main

## Research Question

Document the frontend design system and patterns used in this codebase, including styling methodology, component patterns, design tokens, and layout system.

## Summary

This codebase implements a comprehensive design system using a **hybrid Tailwind CSS + custom CSS approach**. The system includes:

- **Styling**: Tailwind CSS utilities with PostCSS processing, extended with custom component classes using `@apply`
- **Components**: 80+ React components organized in `app/components/` with barrel exports
- **Design Tokens**: CSS custom properties for colors, spacing, and layout variables
- **Typography**: Figtree (primary) and Avenir Next fonts with semantic typography classes
- **Icons**: 40+ SVG icon components with consistent naming (`Icon[Name]`)
- **Layout**: Container, Stack, and Cover components with responsive breakpoints

## Detailed Findings

### 1. Styling Methodology

#### Hybrid Approach
The codebase uses **Tailwind CSS as the primary styling approach** with custom CSS files for:
- Design tokens (CSS custom properties)
- Typography scale
- Component-specific styles (buttons, badges, cards)
- Animations and transitions

#### Entry Points
- **Main stylesheet**: `app/styles/app.css`
- **Root import**: `app/root.tsx:22` imports `~/styles/app.css?url`

#### CSS Import Order (`app/styles/app.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
@import './fonts.css';
@import './base.css';
@import './image.css';
@import './typography.css';
@import './buttons.css';
@import './rte.css';
@import './animations.css';
@import './components/animated-link.css';
@import './components/pageTransition.css';
@import './components/videoChapters.css';
@import './components/badge.css';
@import './components/baseCard.css';
@import './components/submenu.css';
@import './components/hero.css';
@import './components/account.css';
```

#### PostCSS Configuration (`postcss.config.cjs`)
- `postcss-import` - resolves @import statements
- `tailwindcss` - processes Tailwind directives
- `autoprefixer` - adds vendor prefixes

### 2. Design Tokens

#### Colors (`app/styles/base.css:49-79`)
Colors are defined as RGB triplets to work with Tailwind's opacity utilities:

| Token | RGB Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--brand` | 22 37 76 | #16254c | Primary brand color |
| `--brand-light` | 47 60 95 | #2f3c5f | Lighter brand variant |
| `--brand-dark` | 4 18 54 | #041236 | Darker brand variant |
| `--gold` | 214 191 144 | #d6bf90 | Accent/CTA color |
| `--grey` | 239 239 239 | #efefef | Neutral light |
| `--white` | 241 244 255 | Off-white | Text/backgrounds |
| `--red` | 232 14 25 | Error/destructive | |
| `--purple` | 86 68 253 | Badge gradients | |

Usage in Tailwind: `rgb(var(--brand))` configured in `tailwind.config.js:35-51`

#### Spacing System

**CSS Variables** (`app/styles/base.css:27-35`):
```css
--spacing-1: 0.5rem;   /* 8px */
--spacing-2: 1rem;     /* 16px */
--spacing-3: 1.5rem;   /* 24px */
--spacing-4: 2rem;     /* 32px */
--spacing-5: 3rem;     /* 48px */
--spacing-6: 4rem;     /* 64px */
--spacing-7: 5rem;     /* 80px */
--spacing-8: 6rem;     /* 96px */
```

**Tailwind Semantic Scale** (`tailwind.config.js:85-129`):
```javascript
"sp-0.5": "0.25rem",   // 4px
"sp-1": "0.5rem",      // 8px
"sp-1.5": "0.75rem",   // 12px
"sp-2": "1rem",        // 16px
"sp-3": "1.5rem",      // 24px
"sp-4": "2rem",        // 32px
"sp-5": "3rem",        // 48px
"sp-6": "4rem",        // 64px
"sp-7": "5rem",        // 80px
"sp-8": "6rem",        // 96px
"sp-9": "8rem",        // 128px
```

#### Layout Variables
```css
--header-height: 65px;
--card-width-xs: 226px;
--card-width-sm: 256px;
--card-width-md: 300px;
--card-width-lg: 318px;
```

### 3. Typography System

#### Font Families (`app/styles/fonts.css`)
- **Figtree** (primary): Variable font, weight range 300-900
- **Avenir Next**: Static weights - Roman (400), Book (500), Black (700)

#### Tailwind Configuration (`tailwind.config.js:53-84`)
```javascript
fontFamily: {
  "avenir-next": ["Avenir Next", "sans-serif"],
  figtree: ["Figtree", "sans-serif"],
}
fontSize: {
  10: "0.625rem",   // 10px
  12: "0.75rem",    // 12px
  14: "0.875rem",   // 14px
  16: "1rem",       // 16px
  18: "1.125rem",   // 18px
  20: "1.25rem",    // 20px
  // ... up to 48px
}
```

#### Semantic Typography Classes (`app/styles/typography.css`)
```css
/* Headings */
.h1-lg, .h1-md, .h1-sm
.h2-lg, .h2-md, .h2-sm
.h3-lg, .h3-sm

/* Body */
.body-b1, .body-b2, .body-b3, .body-b4, .body-b5

/* Button */
.btn-text
```

### 4. Responsive Breakpoints

**Tailwind Configuration** (`tailwind.config.js:23-33`):

| Name | Value | Pixels |
|------|-------|--------|
| `max-mobile` | max-width: 576px | Mobile only |
| `tablet` | 48rem | 768px |
| `desktop` | 64rem | 1024px |
| `laptop` | 71.25rem | 1140px |
| `widescreen` | 80rem | 1280px |
| `extrawide` | 90rem | 1440px |
| `landscape` | orientation: landscape OR min-width: 768px | |

### 5. Component Organization

#### Directory Structure
```
app/components/
├── index.ts                    # Central barrel export
├── Button/
│   ├── Button.tsx
│   └── index.ts
├── Card/
│   ├── Card.tsx
│   ├── VideoCard.tsx
│   ├── CategoryCard.tsx
│   ├── ContentCard.tsx
│   └── SearchCard.tsx
├── Container/
│   ├── Container.tsx
│   ├── ContainerWide.tsx
│   └── index.ts
├── Icons/
│   ├── index.ts
│   ├── Icon*.tsx (23 files)
│   └── flags/ (17 country flags)
├── Modal/
│   ├── Modal.tsx
│   ├── GeneralModal.tsx
│   └── AccessModal.tsx
└── ... (80+ component folders/files)
```

#### Component Categories
- **Layout**: Container, ContainerWide, Stack, Cover, PageLayout
- **Interactive**: Button, Modal, Accordion, Tooltip, Carousel
- **Cards**: Card, VideoCard, CategoryCard, ContentCard, HoverVideoCard
- **Navigation**: Header, Footer, SearchNav, SatsangsNav
- **Media**: VideoPlayer, Image, HoverVideoPlayer
- **Form**: FormInput
- **Icons**: 40+ icon components

### 6. Component Patterns

#### Pattern A: Compound Components
**File**: `app/components/Card/Card.tsx`

```tsx
function Card({ children, size, aspectRatio }: CardProps) {
  return <div className={...}>{children}</div>;
}

Card.Image = CardImage;
Card.Overlay = CardOverlay;
Card.Title = CardTitle;
Card.Eyebrow = CardEyebrow;

// Usage:
<Card size="xs">
  <Card.Image src={...} />
  <Card.Overlay>
    <Card.Title>{title}</Card.Title>
  </Card.Overlay>
</Card>
```

#### Pattern B: Polymorphic Components
**File**: `app/components/Button/Button.tsx`

```tsx
type ButtonProps = {
  as?: "button" | "link";
  variant?: "primary" | "secondary" | "blue" | "red";
  size?: "default" | "small" | "large";
  // ...
};

// Renders as <button> or <Link> based on `as` prop
```

#### Pattern C: forwardRef with TypeScript
```tsx
export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>((props, ref) => {
  // ...
});
```

#### Pattern D: Context-Based Compound Components
**File**: `app/components/ExpandableSection.tsx`

```tsx
const ExpandableSectionContext = createContext<...>(null);

function ExpandableSectionRoot({ children }) {
  return (
    <ExpandableSectionContext.Provider value={...}>
      {children}
    </ExpandableSectionContext.Provider>
  );
}

export const ExpandableSection = Object.assign(ExpandableSectionRoot, {
  CloseButton,
  Content,
});
```

### 7. Layout Components

#### Container (`app/components/Container/Container.tsx`)

**CRITICAL: Container Usage Guidelines**

The Container component is responsible for **all horizontal padding and layout centering**. Follow these rules:

1. **Never add padding to components** - Components should not have `px-*`, `pl-*`, or `pr-*` classes
2. **Always use Container in route/index pages** - Route pages (`app/routes/`) should wrap content sections with Container
3. **Components are padding-agnostic** - Components should be reusable and let their parent Container handle spacing
4. **Container handles responsive padding** - Automatically applies `px-12 tablet:px-24 desktop:px-60 wide:px-60`

**Basic Usage:**
```tsx
// ✅ CORRECT: Container in route page
export default function MyPage() {
  return (
    <Container>
      <MyComponent />
    </Container>
  );
}

// ❌ WRONG: Padding in component
function MyComponent() {
  return <div className="px-60">Content</div>; // DON'T DO THIS
}
```

**With Vertical Spacing:**
```tsx
<Container topPadding="md" bottomPadding="lg">
  {/* Centered content with responsive horizontal padding */}
  {/* Plus vertical spacing via topPadding/bottomPadding props */}
</Container>
```

**BleedRight Mode (for carousels that align with headers):**
```tsx
// Header section
<Container>
  <SectionHeader title="My Section" />
</Container>

// Carousel section - aligns left with header, bleeds to right edge
<Container bleedRight>
  <Carousel>
    {/* Cards align with header, extend to viewport edge */}
  </Carousel>
</Container>
```

**How Container Works:**
- Uses flexbox (`flex justify-center`) to center content
- Applies responsive horizontal padding internally
- Sets `max-w-[1536px]` to constrain content width
- When `bleedRight={true}`, uses `flex justify-start` and removes right padding
- If className contains flex utilities, applies them directly (for special cases like Header)

**Common Mistakes to Avoid:**
```tsx
// ❌ DON'T: Add padding to components
<div className="px-60">Content</div>

// ❌ DON'T: Use Container inside components
function MyComponent() {
  return <Container>...</Container>; // Container belongs in route pages
}

// ❌ DON'T: Mix Container with manual padding
<Container className="px-16">...</Container> // Container already handles padding

// ✅ DO: Use Container in route pages only
export default function Page() {
  return <Container><MyComponent /></Container>;
}

// ✅ DO: Let Container handle all horizontal spacing
<Container>
  <Section1 />
  <Section2 />
</Container>
```

#### Stack (`app/components/Stack.tsx`)
```tsx
<Stack gap={6}>  {/* 64px gap */}
  <Section1 />
  <Section2 />
</Stack>
```

#### Cover (`app/components/Cover.tsx`)
```tsx
<Cover minHeight="70vh">
  <Cover.Center>
    {/* Vertically centered content */}
  </Cover.Center>
</Cover>
```

#### PageLayout (`app/components/PageLayout.tsx`)
```tsx
<PageLayout header={...} footer={...}>
  {/* Page content */}
</PageLayout>
```

### 8. Icon System

#### Structure
- Location: `app/components/Icons/`
- Naming: `Icon[Name].tsx` (e.g., `IconPlay.tsx`, `IconChevron.tsx`)
- Export: Barrel file at `app/components/Icons/index.ts`

#### Icon Props Pattern
```tsx
interface IconProps {
  className?: string;
}

export function IconPlay({ className }: IconProps) {
  return (
    <svg className={`icon icon--play ${className || ""}`}>
      <title>Play</title>
      <path fill="currentColor" ... />
    </svg>
  );
}
```

#### Color Strategies
1. **currentColor** (themeable): `IconPlay`, `IconChevron`, `IconClose`
2. **Hardcoded**: `IconLotus` (#5644FD), `IconVideos` (white)
3. **Props-based**: `IconProfileLotus` accepts `lotusColor`, `bgColor`, `bgGradient`

#### Dynamic Flag Selector
**File**: `app/components/Icons/IconCountry.tsx`
```tsx
<IconCountry code="US" />  // Renders IconFlagUS
```

### 9. Button System

**File**: `app/styles/buttons.css`

#### Base Class
```css
.btn {
  @apply block whitespace-nowrap font-figtree leading-24 text-16
         font-600 px-lg py-xs rounded-full cursor-pointer
         bg-white text-brand transition-opacity duration-200;
}
```

#### Variants
| Class | Background | Text |
|-------|------------|------|
| `.btn` (primary) | white | brand |
| `.btn--secondary` | white/20 | white |
| `.btn--blue` | brand | white |
| `.btn--red` | red | white |

#### Sizes
- `.btn--sm`: Smaller padding
- `.btn--md`: Medium padding
- `.btn--lg`: Larger padding

### 10. Loading States

#### Skeleton Components
**File**: `app/components/Loading/CardSkeleton.tsx`
```tsx
export function CardSkeleton({ className }) {
  return (
    <div className={`w-full min-h-[200px] rounded-lg bg-brand ${className}`} />
  );
}
```

#### Animation
Uses Tailwind's `animate-pulse` class for skeleton shimmer effect.

#### Naming Convention
- `[Component]Skeleton` or `[Component]Loading`
- Examples: `CardSkeleton`, `CarouselLoading`, `VideoChaptersLoading`

### 11. Render Optimization

#### EMPTY_ARRAY and EMPTY_OBJECT Constants
**File**: `app/lib/constants.ts`

```typescript
export const EMPTY_ARRAY: readonly any[] = Object.freeze([]);
export const EMPTY_OBJECT: Readonly<Record<string, never>> = Object.freeze({});

// Usage - prevents unnecessary re-renders
<Component items={data ?? EMPTY_ARRAY} />
```

### 12. CSS Utilities

#### Custom Utilities (`app/styles/base.css`)
- `.visually-hidden` - Accessible hidden content
- `.no-scrollbar` / `.scrollbar-hide` - Hide scrollbars
- `.bhakti-gradient` - Brand gradient background

#### Tailwind Plugin Utilities (`tailwind.config.js:166-185`)
```javascript
'.icon-sm': { width: '12px', height: '12px' },
'.icon-md': { width: '16px', height: '16px' },
'.icon-lg': { width: '24px', height: '24px' },
'.icon-xl': { width: '32px', height: '32px' },
'.icon-2xl': { width: '40px', height: '40px' },
```

### 13. Animations

**File**: `app/styles/animations.css`

#### Keyframes
- `slideInFromRight` - Slide and fade from right
- `expandCard` - Scale up from center
- `fade-in` - Simple opacity fade

#### Staggered Animation
`.animate-slide-left-container` animates children with easing-based delays using CSS `nth-child()` selectors.

## Code References

### Style Files
- `app/styles/app.css` - Main entry point
- `app/styles/base.css` - Design tokens and utilities
- `app/styles/typography.css` - Typography scale
- `app/styles/buttons.css` - Button system
- `app/styles/animations.css` - Keyframe animations
- `tailwind.config.js` - Tailwind configuration

### Component Files
- `app/components/index.ts` - Central exports
- `app/components/Container/Container.tsx` - Container component
- `app/components/Stack.tsx` - Stack layout
- `app/components/Card/Card.tsx` - Card compound component
- `app/components/Button/Button.tsx` - Polymorphic button
- `app/components/Icons/index.ts` - Icon exports

### Utility Files
- `app/lib/utils/css.ts` - CSS utility functions
- `app/lib/constants.ts` - EMPTY_ARRAY, EMPTY_OBJECT

## Architecture Documentation

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `VideoCard` |
| Props interfaces | `[Name]Props` | `VideoCardProps` |
| Type files | `[Name].types.ts` | `Badge.types.ts` |
| Loading states | `[Name]Loading` | `CarouselLoading` |
| Icons | `Icon[Name]` | `IconPlay` |
| CSS class (BEM) | block__element--modifier | `badge__wrapper--gold` |
| CSS class (utility) | Tailwind convention | `text-16 font-600` |

### Export Patterns
- Named exports (not default)
- Barrel exports via `index.ts`
- Types exported alongside components
- Central `components/index.ts` for all components

### File Organization
- One component per folder for complex components
- Single files for simple components
- Types in separate `.types.ts` files when complex
- Loading states co-located with components

## Historical Context (from thoughts/)

No existing documentation found in `thoughts/` directory. This is the first research document on the design system.

## Related Research

This is the initial design system documentation. Future research could explore:
- Accessibility patterns
- Animation system in depth
- Theme customization capabilities
- Component API documentation

## Open Questions

1. **Theme switching**: Is dark/light mode planned? Currently only dark theme exists.
2. **Component library extraction**: Could the design system be extracted as a separate package?
3. **Design token documentation**: Should tokens be documented in a format like Style Dictionary?
4. **Storybook integration**: Would Storybook benefit component development?
