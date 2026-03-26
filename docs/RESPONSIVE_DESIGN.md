# Responsive Design System

Quick reference for responsive patterns in this codebase. **Follow these golden paths for consistency.**

## Breakpoints

**Use these blessed breakpoints only:**

| Breakpoint | Width | Tailwind Class | Use Case |
|------------|-------|----------------|----------|
| (base) | < 640px | (no prefix) | Mobile-first default |
| `tablet` | ≥ 640px | `tablet:` | Tablets, landscape phones |
| `desktop` | ≥ 1024px | `desktop:` | Laptops, desktops |
| `wide` | ≥ 1280px | `wide:` | Large monitors |

### Mobile-First Pattern (ALWAYS use this)

```tsx
// ✅ DO: Mobile-first, add complexity as screen grows
<div className="px-16 tablet:px-24 desktop:px-32">
<h1 className="text-24 tablet:text-32 desktop:text-48">

// ❌ DON'T: Desktop-first or max-width queries
<div className="px-32 max-mobile:px-16">
```

## Spacing by Breakpoint

| Element | Mobile (base) | Tablet | Desktop |
|---------|---------------|--------|---------|
| Container padding | 16px | 24px | 32-60px |
| Section gap | 48px | 64px | 80px |
| Card gap | 8px | 12px | 16px |

## Typography by Breakpoint

| Class | Mobile (base) | Tablet | Desktop |
|-------|---------------|--------|---------|
| `.h1-lg` | 32px | 40px | 48px |
| `.h1-md` | 28px | 36px | 48px |
| `.h1-sm` | 24px | 28px | 32px |
| `.h2-lg` | 18px | 20px | 24px |
| `.h2-md` | 18px | 20px | 24px |
| `.body-b1` | 16px | 18px | 18px |

> **Note**: These responsive typography values will be implemented in Phase 2. Current typography uses fixed sizes.

## Common Patterns

### Grid Layouts

```tsx
// Cards: 1 → 2 → 4 columns
<div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-8">

// Content sections: full → 2 columns
<div className="grid grid-cols-1 desktop:grid-cols-2 gap-16">

// 3-column layout
<div className="grid grid-cols-1 tablet:grid-cols-3 gap-8">
```

### Flexbox Direction

```tsx
// Stack on mobile, row on larger screens
<div className="flex flex-col tablet:flex-row gap-16">

// Centered content that stacks on mobile
<div className="flex flex-col tablet:flex-row items-center justify-center gap-16">
```

### Show/Hide Elements

```tsx
// Mobile only (hidden on tablet and above)
<div className="block tablet:hidden">

// Desktop only (hidden below desktop)
<div className="hidden desktop:block">

// Tablet and up
<div className="hidden tablet:block">

// Mobile and tablet only (hidden on desktop)
<div className="block desktop:hidden">
```

### Responsive Padding

```tsx
// Section padding
<section className="py-48 tablet:py-64 desktop:py-80">

// Container padding
<div className="px-16 tablet:px-24 desktop:px-60">

// Asymmetric padding
<div className="p-16 tablet:p-24 desktop:p-32">
```

### Touch Targets

- Minimum 44px × 44px for all interactive elements on mobile
- Use `min-h-[44px] min-w-[44px]` when needed
- Add sufficient padding to small icons to meet touch target requirements

```tsx
// Ensure touch-friendly buttons
<button className="min-h-[44px] min-w-[44px] px-16 py-12">

// Icon buttons need explicit sizing
<button className="p-12 min-w-[44px] min-h-[44px]">
  <IconClose className="w-20 h-20" />
</button>
```

## Reference Implementation: Account Section

The Account section demonstrates a complete mobile implementation pattern:

### Mobile Header Pattern
```tsx
// app/components/Account/AccountMobileHeader.tsx
<header className="desktop:hidden bg-brand-dark border-b border-grey-dark">
  <div className="flex items-center justify-between h-56 px-16">
    {/* Logo left, user info right */}
  </div>
</header>
```

### Mobile Navigation Pattern
```tsx
// app/components/Account/AccountMobileNav.tsx
<nav className="desktop:hidden fixed bottom-0 left-0 right-0 bg-brand-dark border-t border-grey-dark z-50">
  <ul className="flex justify-around items-center h-64">
    {/* Tab items */}
  </ul>
</nav>
```

### Layout Pattern
```tsx
// app/components/Account/AccountLayout.tsx
<div className="max-w-[1440px] mx-auto px-12 py-12 desktop:px-60 desktop:py-60">
  {/* Mobile header (hidden on desktop) */}
  <AccountMobileHeader customer={customer} />
  
  <div className="flex gap-24 desktop:gap-60">
    {/* Desktop sidebar (hidden on mobile) */}
    <aside className="hidden desktop:block w-[280px] flex-shrink-0">
    
    {/* Main content with bottom padding for mobile nav */}
    <main className="flex-1 min-w-0 pb-72 desktop:pb-0">
  </div>
  
  {/* Mobile bottom nav (hidden on desktop) */}
  <AccountMobileNav />
</div>
```

## Deprecated Patterns (DO NOT USE)

These patterns exist in the codebase but should not be used for new code:

```tsx
// ❌ max-mobile: - Use mobile-first pattern instead
className="hidden max-mobile:block"

// ❌ laptop: - Use desktop:
className="laptop:grid-cols-3"

// ❌ widescreen: - Use wide:
className="widescreen:px-60"

// ❌ extrawide: - Use wide: or custom one-off
className="extrawide:max-w-[660px]"

// ❌ Component-specific breakpoints
className="desktop-header:flex"
className="header-breakpoint:hidden"
```

## Testing Checklist

When implementing responsive features:

- [ ] Test at 375px (iPhone SE / small mobile)
- [ ] Test at 640px (tablet breakpoint)
- [ ] Test at 1024px (desktop breakpoint)
- [ ] Test at 1280px (wide breakpoint)
- [ ] Verify no horizontal overflow at any size
- [ ] Verify touch targets are ≥44px on mobile
- [ ] Test with keyboard navigation
- [ ] Check text doesn't clip or overflow
- [ ] Verify images scale appropriately

## Z-Index Reference

Mobile overlays and navigation need careful z-index management:

| Component | Z-Index | Notes |
|-----------|---------|-------|
| Mobile bottom nav | 50 | Fixed bottom navigation |
| Mobile menu overlay | 50 | Full-screen mobile menu |
| Header | 40 | Sticky header |
| Mega menu | 30 | Dropdown menus |
| Modal backdrop | 60 | Behind modals |
| Modal content | 70 | Modal dialogs |

See `Z_INDEX_REFERENCE.md` for complete reference.

## Migration Guide

When updating existing components to be mobile-responsive:

1. **Start with mobile styles** (no prefix)
2. **Add tablet breakpoint** (`tablet:`) for tablet layouts
3. **Add desktop breakpoint** (`desktop:`) for full desktop experience
4. **Add wide breakpoint** (`wide:`) only if needed for extra-large screens

Example migration:
```tsx
// Before (desktop-only)
<div className="px-60 grid grid-cols-4 gap-16">

// After (mobile-first)
<div className="px-16 tablet:px-24 desktop:px-60 grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-8 tablet:gap-12 desktop:gap-16">
```




