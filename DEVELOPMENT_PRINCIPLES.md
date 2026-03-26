# Development Principles & Style Guide

**Last Updated**: October 2025

---

## Core Principles

### 1. Composition Over Inheritance

**Bad (Inheritance/Configuration)**:
```typescript
// Component tries to do everything through props
<Hero
  schema={heroSchema}
  height="3xl"
  handleNegativeMargin={true}
  imageCover={true}
  showOverlay={true}
  button={<Button>Play</Button>}
  secondaryButton={<Button>Details</Button>}
/>
```

**Good (Composition)**:
```typescript
// Small, focused components that compose together
<HeroBackground backgroundImage={image} showOverlay imageCover>
  <HeroContent horizontalAlignment="left" verticalAlignment="center">
    <HeroTags tags={tags} />
    <HeroTitle uppercase>{title}</HeroTitle>
    <HeroDescription>{description}</HeroDescription>
    <HeroButtons>
      <Button>Play</Button>
      <Button variant="secondary">Details</Button>
    </HeroButtons>
  </HeroContent>
</HeroBackground>
```

**Why Composition Wins**:
- Clear visual hierarchy in code
- Easy to rearrange elements
- Simple to customize individual pieces
- No complex prop drilling
- Better TypeScript support
- Easier to test

---

### 2. Explicit Over Implicit

**Bad (Implicit/Hidden)**:
```typescript
// Mapper function hides what's being rendered
<ContentRow
  content={lives}
  contentToBaseCardPropsMapper={(item) => ({
    aspectRatio: "landscape",
    params: { title: item.title },
    image: { landscape: item.thumbnailUrl }
  })}
/>
```

**Good (Explicit)**:
```typescript
// Clear what's being rendered
<Carousel>
  {lives.map(live => (
    <ContentCard
      key={live.id}
      aspectRatio="landscape"
      title={live.title}
      image={live.thumbnailUrl}
    />
  ))}
</Carousel>
```

**Why Explicit Wins**:
- No hidden abstractions
- Easy to understand at a glance
- Simple to modify
- No mapper boilerplate

---

### 3. Small Components Over Mega Components

**Bad (Mega Component)**:
```typescript
// One component with 16 props doing too much
interface ContentRowProps {
  title: string;
  exploreAllLink?: string;
  swiperProps?: SwiperProps;
  content: Array<Content>;
  contentToBaseCardPropsMapper: (content: Content) => BaseCardProps;
  activeContent?: ReactNode;
  onContentClick?: (content: Content) => void;
  handleCloseExpanded?: () => void;
  isActiveContent?: (content: Content) => boolean;
  activeAspectRatio?: "square" | "landscape" | "portrait";
  shouldScrollToContent?: boolean;
  expandedBackgroundImage?: string;
  // ... more props
}
```

**Good (Small Components)**:
```typescript
// Each component has a single, clear purpose
<CarouselWithHeader title="Latest Lives" exploreAllLink="/lives">
  <Carousel slidesPerView={4.2}>
    {lives.map(live => (
      <ContentCard {...live} />
    ))}
  </Carousel>
</CarouselWithHeader>
```

**Guidelines**:
- If a component has >8 props, consider breaking it down
- Each component should have one clear responsibility
- Prefer multiple small components over one large configurable component

---

### 4. No Schema Objects

Schema objects abstract away the structure and prevent composition.

**Bad (Schema Pattern)**:
```typescript
const schema = {
  title: "Features",
  items: [
    { title: "Feature 1", description: "..." },
    { title: "Feature 2", description: "..." },
  ]
};

<Features schema={schema} />
```

**Good (Direct Composition)**:
```typescript
<Features title="Features">
  <Feature title="Feature 1" description="..." />
  <Feature title="Feature 2" description="..." />
</Features>
```

**Why No Schemas**:
- Schemas hide structure
- Can't see what's being rendered
- Hard to customize
- Poor TypeScript autocomplete
- Can't easily rearrange or remove items

---

## Styling Principles

### 1. Use Tailwind Utilities Directly

We use **Tailwind CSS** for all styling. Keep it simple and direct.

**Bad (BEM-style classes)**:
```typescript
<div className="carousel-with-header animated-link-chevron-trigger">
  <div className="carousel-with-header__header container">
    <div className="carousel-with-header__header__inner">
      <h2 className="carousel-with-header__title">Title</h2>
    </div>
  </div>
  <div className="carousel-with-header__content">
    {children}
  </div>
</div>
```

**Good (Minimal, direct Tailwind)**:
```typescript
<div className="max-w-screen overflow-hidden relative z-10">
  <div className="container mx-auto flex items-center px-60 mb-16">
    <h2 className="text-white h2-md mr-16">Title</h2>
  </div>
  <div className="overflow-visible">
    {children}
  </div>
</div>
```

**Why Minimal Classes**:
- BEM is redundant with component-based architecture
- Extra classes add no value
- Harder to read and maintain
- We have component names for scoping

---

### 2. Use Design System Tokens, Not Raw Values

Our design system provides spacing, colors, and typography tokens. **Always use these instead of raw Tailwind values.**

**Bad (Raw Tailwind values)**:
```typescript
<div className="p-4 text-16 bg-blue-500 gap-8">
  <h1 className="text-32 font-bold mb-2">Title</h1>
</div>
```

**Good (Design system tokens)**:
```typescript
<div className="p-16 body-b2 bg-brand gap-8">
  <h1 className="h1-lg mb-8">Title</h1>
</div>
```

**Design System Reference**:

#### Spacing
Use our spacing scale (defined in CSS variables):
- `var(--spacing-1)` through `var(--spacing-10)`
- Direct classes: `gap-8`, `p-16`, `mb-24`, `px-60`, `py-128`, etc.
- **Never use**: `p-4`, `mb-2`, `gap-3`, etc. (raw Tailwind values)

#### Typography
Use our typography classes:
- Headings: `h1-lg`, `h1-md`, `h1-sm`, `h2-md`, `h3-lg`
- Body: `body-b1`, `body-b2`, `body-b3`, `body-b4`, `body-b5`
- **Never use**: `text-16`, `text-24`, `text-xl`, etc. (raw Tailwind sizes)

#### Colors
Use our color tokens:
- `bg-brand`, `bg-brand-light`, `bg-brand-dark`
- `text-gold`, `text-white`, `text-grey-dark`, `text-grey-light`
- **Never use**: `bg-blue-500`, `text-gray-600`, etc. (raw Tailwind colors)

---

### 3. Component-Specific Styling

When you need component-specific behavior, use:
1. **Inline styles** for dynamic values
2. **Tailwind classes** for everything else
3. **CSS files** only for complex animations or pseudo-elements that can't be done in Tailwind

**Good Examples**:
```typescript
// Dynamic inline style
<div style={{ width: `${progress}%` }} />

// Tailwind for everything else
<div className="absolute bottom-0 w-full h-2 bg-grey-light/30">
  <div
    className="h-full bg-grey-light"
    style={{ width: `${progress}%` }}
  />
</div>
```

**Avoid**:
```typescript
// Don't create CSS classes for simple layouts
// carousel.css
.carousel-wrapper {
  position: relative;
  overflow: visible;
}

// Just use Tailwind directly
<div className="relative overflow-visible">
```

---

## Component Structure

### Naming Conventions

**Components**: PascalCase
- `ContentCard`, `Carousel`, `HeroBackground`

**Props Interfaces**: Component name + `Props`
- `ContentCardProps`, `CarouselProps`

**Files**: Match component name
- `ContentCard.tsx`, `Carousel.tsx`

---

### File Organization

```
app/components/
  ComponentName/
    ComponentName.tsx       # Main component
    index.ts                # Export
    ComponentName.css       # Only if absolutely necessary
```

**Keep it simple**:
- One component per file
- No barrel exports of multiple components
- CSS files only when Tailwind can't handle it

---

### Props Interface Structure

Order props logically:

```typescript
export interface ContentCardProps {
  // Required content props first
  title: string;
  image: string;

  // Optional content
  eyebrow?: string;
  subtitle?: string;

  // Layout/appearance
  aspectRatio?: "square" | "landscape" | "portrait";

  // Interaction
  url?: string;
  onClick?: () => void;

  // Flags/booleans
  active?: boolean;

  // Styling (always last)
  className?: string;
}
```

---

## React Best Practices

### 1. Avoid Unnecessary Abstractions

**Bad (Unnecessary wrapper)**:
```typescript
// Don't create wrapper components that just pass props
export function Lives({ lives, title }: Props) {
  return <ContentRow content={lives} title={title} />;
}
```

**Good (Direct usage)**:
```typescript
// Use components directly where needed
<Carousel>
  {lives.map(live => <ContentCard {...live} />)}
</Carousel>
```

---

### 2. Prefer Children Over Render Props

**Bad (Render props)**:
```typescript
<List
  items={items}
  renderItem={(item) => <Card {...item} />}
/>
```

**Good (Children)**:
```typescript
<List>
  {items.map(item => (
    <Card key={item.id} {...item} />
  ))}
</List>
```

---

### 3. Keep Components Pure

Components should be pure functions of their props.

**Bad (Side effects in render)**:
```typescript
function Component({ data }) {
  // Don't mutate or fetch in render
  data.items.sort();
  fetchMoreData();

  return <div>{data.items.map(...)}</div>;
}
```

**Good (Pure function)**:
```typescript
function Component({ data }) {
  // Pure transformation
  const sortedItems = useMemo(
    () => [...data.items].sort(),
    [data.items]
  );

  return <div>{sortedItems.map(...)}</div>;
}
```

---

## Performance Guidelines

### Only Optimize When Needed

Don't prematurely optimize. Use `useMemo`, `useCallback`, and `React.memo` only when:
1. Profiling shows a performance issue
2. Component renders hundreds of times
3. Expensive calculations need caching

**Default (No optimization needed)**:
```typescript
export function ContentCard({ title, image }: ContentCardProps) {
  return (
    <div className="relative">
      <img src={image} alt={title} />
      <h3>{title}</h3>
    </div>
  );
}
```

**Only when needed**:
```typescript
export const ContentCard = React.memo(({ title, image }: ContentCardProps) => {
  return (
    <div className="relative">
      <img src={image} alt={title} />
      <h3>{title}</h3>
    </div>
  );
}, (prev, next) => {
  // Custom comparison only if default shallow compare isn't enough
  return prev.title === next.title && prev.image === next.image;
});
```

---

## Anti-Patterns to Avoid

### ❌ Mapper Functions
```typescript
// BAD
contentToBaseCardPropsMapper={(item) => ({ title: item.title })}

// GOOD
{items.map(item => <Card title={item.title} />)}
```

### ❌ Schema Objects
```typescript
// BAD
<Component schema={{ title: "x", items: [...] }} />

// GOOD
<Component title="x">
  {items.map(item => <Item {...item} />)}
</Component>
```

### ❌ BEM Class Names
```typescript
// BAD
<div className="card card--active card__title">

// GOOD
<div className="relative p-16">
```

### ❌ Wrapper Components That Just Pass Props
```typescript
// BAD
export function LivesRow(props) {
  return <ContentRow {...props} />;
}

// GOOD
// Just use ContentRow directly (or better yet, use Carousel + ContentCard)
```

### ❌ Complex Conditional Props
```typescript
// BAD
<Component
  showHeader={condition1}
  renderFooter={condition2 ? () => <Footer /> : undefined}
  customLayout={condition3 ? "grid" : "flex"}
/>

// GOOD
<Component>
  {condition1 && <Header />}
  <Content />
  {condition2 && <Footer />}
</Component>
```

---

## Code Review Checklist

Before submitting code, check:

- [ ] Using composition over configuration?
- [ ] No schema objects?
- [ ] No mapper functions?
- [ ] No BEM-style class names?
- [ ] Using design system tokens (not raw Tailwind values)?
- [ ] Component has single, clear responsibility?
- [ ] Props interface is clean (< 8 props ideally)?
- [ ] No unnecessary abstractions or wrapper components?
- [ ] Children used instead of render props where possible?
- [ ] TypeScript types are clear and helpful?

---

## Examples: Before & After

### Example 1: Content Display

**❌ Before (Anti-patterns)**:
```typescript
// Complex wrapper with mapper function
export function Commentaries({ commentaries, title }) {
  return (
    <ContentRow
      title={title}
      exploreAllLink="/commentaries"
      content={commentaries}
      contentToBaseCardPropsMapper={(commentary) => ({
        aspectRatio: "landscape",
        params: {
          eyebrow: commentary.subtitle,
          title: commentary.title,
        },
        url: `/commentaries/${commentary.slug}`,
        image: {
          square: commentary.thumbnailUrl,
          landscape: commentary.thumbnailUrl,
        },
      })}
    />
  );
}
```

**✅ After (Composition)**:
```typescript
// Direct composition, clear and explicit
<CarouselWithHeader
  title="Latest Commentaries"
  exploreAllLink="/commentaries"
>
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
</CarouselWithHeader>
```

### Example 2: Hero Section

**❌ Before (Schema pattern)**:
```typescript
const heroSchema: HeroSchema = {
  title: "Welcome",
  description: "Description",
  backgroundImage: { url: image, type: "external" },
  tags: [{ label: "LIVE", bgColor: "red" }],
};

<Hero
  schema={heroSchema}
  height="3xl"
  button={<Button>Play</Button>}
/>
```

**✅ After (Composition)**:
```typescript
<HeroBackground backgroundImage={{ url: image, type: "external" }} showOverlay>
  <HeroContent verticalAlignment="center">
    <HeroTags tags={[{ label: "LIVE", bgColor: "red" }]} />
    <HeroTitle uppercase>Welcome</HeroTitle>
    <HeroDescription>Description</HeroDescription>
    <HeroButtons>
      <Button>Play</Button>
    </HeroButtons>
  </HeroContent>
</HeroBackground>
```

---

## Summary

1. **Composition > Configuration**: Small components that compose, not mega components with many props
2. **Explicit > Implicit**: Direct, clear code over hidden abstractions
3. **Minimal Tailwind**: Use design system tokens, no BEM classes
4. **No Schemas**: Use composition instead of schema objects
5. **No Mappers**: Map directly in JSX, not through abstraction functions
6. **Keep it Simple**: Don't over-engineer or add unnecessary abstractions

**When in doubt**: Look at the Hero refactor (commit `fbde92c`) as the gold standard.
