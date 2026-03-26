# Design System Reference

Quick reference for styling patterns in this codebase. **Follow these golden paths for consistency.**

## Spacing

**Use numeric values only.** Legacy semantic spacing (`px-lg`, `gap-md`) is deprecated.

```
4px   -> gap-4, p-4, m-4
8px   -> gap-8, p-8, m-8
12px  -> gap-12, p-12, m-12
16px  -> gap-16, p-16, m-16
24px  -> gap-24, p-24, m-24
32px  -> gap-32, p-32, m-32
48px  -> gap-48, p-48, m-48
64px  -> gap-64, p-64, m-64
```

## Colors

Use Tailwind classes, never hardcoded hex values.

### Brand Colors
- `bg-brand` / `text-brand` - Primary brand (#16254c)
- `bg-brand-light` / `text-brand-light` - Lighter variant
- `bg-brand-dark` / `text-brand-dark` - Darker variant (#041236)

### Accent Colors
- `text-gold` / `bg-gold` - Accent/CTA color
- `text-red` / `bg-red` - Error/destructive
- `text-purple` / `bg-purple` - Badge gradients

### Neutrals
- `text-white` / `bg-white` - Off-white (#f1f4ff)
- `text-grey` / `bg-grey` - Neutral light
- `text-grey-light` - Light grey for secondary text
- `text-text-muted` - Muted text (#9B9B9B)
- `text-text-placeholder` - Placeholder text

### Overlays
- `bg-overlay-dark` - Card shadows/overlays (#0C162F)

## Typography

### Font Families
- `font-figtree` - Primary font (default)
- `font-avenir-next` - Secondary font

### Font Sizes (use numeric)
```
text-10, text-12, text-14, text-16, text-18, text-20, text-24, text-32, text-40, text-48
```

### Font Weights
```
font-300, font-400, font-500, font-600, font-700, font-900
```

## Buttons

**Always use the Button component** from `~/components/Button/Button`.

### Basic Usage
```tsx
import { Button } from '~/components/Button/Button';

// Primary (default)
<Button>Click me</Button>

// As a link
<Button as="link" href="/path">Go somewhere</Button>
```

### Variants
- `variant="primary"` - White bg, brand text (default)
- `variant="secondary"` - White/20 bg, white text
- `variant="blue"` - Brand bg, white text
- `variant="red"` - Red bg, white text (destructive actions)
- `variant="ghost"` - Transparent bg, border, grey text (cancel/secondary)

### Shapes
- `shape="pill"` - Rounded full (default)
- `shape="rectangle"` - Rounded-md (for modals)

### States
- `disabled` - Disabled state
- `loading` - Loading state (disables + cursor-wait)

### Sizes
- `size="small"` - Smaller padding
- `size="default"` - Default (no need to specify)
- `size="large"` - Larger padding

### Modal Button Pattern
```tsx
<div className="flex justify-end gap-12">
  <Button variant="ghost" shape="rectangle" onClick={onClose}>
    Cancel
  </Button>
  <Button variant="blue" shape="rectangle" onClick={onConfirm}>
    Confirm
  </Button>
</div>
```

### Destructive Action Pattern
```tsx
<Button variant="red" shape="rectangle" loading={isDeleting}>
  {isDeleting ? 'Deleting...' : 'Delete'}
</Button>
```

## Links

**Always use the Link component** from `~/components/Link/Link`, never `Link` from `react-router`.

```tsx
import { Link } from '~/components/Link/Link';

<Link to="/path">Internal link</Link>
```

Use `NavLink` from `react-router` only when you need active state styling (navigation menus).

## Shadows

Use Tailwind shadow utilities:
- `shadow-card` - Card shadow (0px 4px 14px)
- `shadow-card-hover` - Hover state shadow
- `shadow-dropdown` - Dropdown shadow
- `shadow-none` - Remove shadow

## Gradients

Use gradient utilities:
- `gradient-brand` - Brand gradient background
- `gradient-purple` - Purple gradient
- `gradient-purple-dark` - Dark purple gradient

## Border Radius

- `rounded-none` - 0
- `rounded-sm` - 6px
- `rounded-md` - 8px (modal buttons)
- `rounded-lg` - 12px (cards)
- `rounded-xl` - 16px
- `rounded-full` - Pill shape (default buttons)

## Icon Sizes

- `icon-sm` - 12px
- `icon-md` - 16px
- `icon-lg` - 24px
- `icon-xl` - 32px
- `icon-2xl` - 40px

## Render Optimization

Always use `EMPTY_ARRAY` and `EMPTY_OBJECT` from `~/lib/constants` for default values:

```tsx
import { EMPTY_ARRAY, EMPTY_OBJECT } from '~/lib/constants';

// Prevents unnecessary re-renders
<Component items={data ?? EMPTY_ARRAY} options={config ?? EMPTY_OBJECT} />
```

## Deprecated Patterns (Avoid)

### Legacy Semantic Spacing
```tsx
// DON'T use these
gap-md, px-lg, py-xs, gap-sm, px-xl

// DO use numeric
gap-24, px-32, py-12, gap-16, px-40
```

### Hardcoded Colors
```tsx
// DON'T
style={{ color: '#9B9B9B' }}
className="text-[#041236]"

// DO
className="text-text-muted"
className="text-brand-dark"
```

### Ad-hoc Buttons
```tsx
// DON'T
<button className="px-24 py-12 bg-brand text-white rounded-md...">

// DO
<Button variant="blue" shape="rectangle">
```

### React Router Link
```tsx
// DON'T
import { Link } from 'react-router';

// DO
import { Link } from '~/components/Link/Link';
```

## Container Component

**CRITICAL: Container handles all horizontal padding and layout. Never add padding to components.**

### Overview

- `Container` - Standard layout with responsive horizontal padding and centered max-width (1536px)
- `ContainerWide` - Full-width layout with NO horizontal padding, for edge-to-edge content

Container provides: `px-12 tablet:px-24 desktop:px-60 wide:px-60` and `max-w-[1536px]`

### Core Rules

1. **Container at section level, not page level** - Wrap each section individually with Container/ContainerWide
2. **Never wrap multiple sections in one Container** - This prevents using ContainerWide for bleed effects
3. **Never add custom horizontal padding** - No `px-*`, `pl-*`, `pr-*` classes anywhere except Container
4. **Never nest Container inside Container** - No double padding
5. **Components are padding-agnostic** - Components should be reusable; parent Container handles spacing

### Basic Usage

```tsx
// ✅ CORRECT: Each section wrapped individually
export default function MyPage() {
  return (
    <Stack gap={7}>
      <Container>
        <SectionHeader title="Featured" />
        <FeaturedContent />
      </Container>

      <ContainerWide>
        <FullWidthCarousel />
      </ContainerWide>

      <Container>
        <SectionHeader title="All Items" />
        <ItemGrid />
      </Container>
    </Stack>
  );
}
```

### With Vertical Spacing

```tsx
<Container topPadding="md" bottomPadding="lg">
  {/* Responsive horizontal padding + vertical spacing */}
</Container>
```

### BleedRight Mode

For carousels that need to align with headers while bleeding to the viewport edge:

```tsx
// Header aligned with standard padding
<Container>
  <SectionHeader title="My Section" />
</Container>

// Carousel - left aligns with header, bleeds to right edge
<Container bleedRight>
  <Carousel>
    {/* Cards align with header, extend to viewport edge */}
  </Carousel>
</Container>
```

### ContainerWide

For content that needs full viewport width (no horizontal padding):

```tsx
<ContainerWide>
  <FullBleedHeroImage />
</ContainerWide>

<ContainerWide topPadding="lg">
  <EdgeToEdgeCarousel />
</ContainerWide>
```

---

## 🚨 Anti-Patterns (DO NOT DO)

### Anti-Pattern 1: Wrapping Multiple Sections in One Container

**Why it's wrong**: Prevents using ContainerWide for individual sections that need bleed effects

```tsx
// ❌ WRONG: One Container wrapping multiple sections
<Container>
  <SectionHeader title="All Items" />
  <ItemGrid />
  {hasMore && <LoadMoreButton />}
  <Footer />
</Container>

// ✅ CORRECT: Each section wrapped individually
<Container>
  <SectionHeader title="All Items" />
</Container>

<ContainerWide>
  <ItemGrid />  {/* Can now bleed edge-to-edge if needed */}
</ContainerWide>

<Container>
  {hasMore && <LoadMoreButton />}
</Container>
```

**Real example from codebase** (`talks._index.tsx`):

```tsx
// ❌ WRONG: Container wraps header, grid, AND pagination together
<Container>
  <div className="mb-24">
    <SectionHeader title="All Talks" />
    <p>Showing X of Y talks</p>
  </div>
  <TalksGrid talks={talks} ... />
  {hasMore && <Button>Load More</Button>}
</Container>

// ✅ CORRECT: Each logical section wrapped individually
<Container>
  <SectionHeader title="All Talks" />
  <p>Showing X of Y talks</p>
</Container>

<Container>
  <TalksGrid talks={talks} ... />
</Container>

<Container>
  {hasMore && <Button>Load More</Button>}
</Container>
```

### Anti-Pattern 2: Nesting Container Components

**Why it's wrong**: Creates double horizontal padding

```tsx
// ❌ WRONG: Nested Containers
<Container>
  <Container>  {/* Double padding! */}
    <Content />
  </Container>
</Container>

// ❌ WRONG: Container inside a component that's already in a Container
function MyComponent() {
  return <Container><Content /></Container>;
}
// Then in page:
<Container>
  <MyComponent />  {/* Double padding! */}
</Container>

// ✅ CORRECT: One Container at the top level
<Container>
  <Content />
</Container>
```

### Anti-Pattern 3: Custom Horizontal Padding

**Why it's wrong**: Inconsistent spacing, breaks responsive design

```tsx
// ❌ WRONG: Custom horizontal padding
<div className="px-60">Content</div>
<section className="pl-24 pr-32">Content</section>
<Container className="px-16">Content</Container>

// ✅ CORRECT: Let Container handle all horizontal padding
<Container>
  <Content />
</Container>
```

### Anti-Pattern 4: Using Container Inside Reusable Components

**Why it's wrong**: Component becomes unusable in different contexts, forces layout decisions

```tsx
// ❌ WRONG: Container inside component definition
function VideoCard() {
  return (
    <Container>  {/* Component now forces layout */}
      <div>Card content</div>
    </Container>
  );
}

// ✅ CORRECT: Component is padding-agnostic
function VideoCard() {
  return <div>Card content</div>;
}

// Page controls layout
<Container>
  <VideoCard />
</Container>
```

---

## When to Use Each

| Scenario | Component |
|----------|-----------|
| Standard content sections | `Container` |
| Section headers with text | `Container` |
| Grids, forms, text content | `Container` |
| Full-width hero images | `ContainerWide` |
| Edge-to-edge carousels | `ContainerWide` or `Container bleedRight` |
| Left-aligned carousel (bleed right only) | `Container bleedRight` |

---

## Mental Model

Think of the page as a stack of independent sections:

```
┌─────────────────────────────────────────────┐
│ Container                                    │
│   ┌─────────────────────────────────────┐   │
│   │ Section Header                      │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ContainerWide (full bleed)                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Full Width Carousel                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Container                                    │
│   ┌─────────────────────────────────────┐   │
│   │ Grid or Other Content               │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

Each section decides its own padding. Don't group unrelated content in one Container.

## File References

- Tailwind config: `tailwind.config.js`
- Button styles: `app/styles/buttons.css`
- Button component: `app/components/Button/Button.tsx`
- Base CSS variables: `app/styles/base.css`
- Link component: `app/components/Link/Link.tsx`
- Container component: `app/components/Container/Container.tsx`
- ContainerWide component: `app/components/Container/ContainerWide.tsx`
- Constants: `app/lib/constants.ts`
