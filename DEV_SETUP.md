# Development Setup & Workflow

Quick reference for developers joining the Bhakti Marga Media Platform project.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure local development (optional - for testing without auth)
echo "ENVIRONMENT=development" >> .env.local
echo "DEVELOPMENT_USER_TAGS=premium-member" >> .env.local

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` - changes appear instantly with hot reload.

## 🛠 Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript verification |
| `npm run lint` | ESLint checking |
| `npm run format` | Prettier formatting |

**Before committing:** Run `npm run typecheck && npm run lint`

## 🏗 Project Architecture

```
app/
├── routes/          # Remix routes ($(locale) pattern)
├── components/      # Reusable React components  
├── styles/          # CSS modules + Tailwind
├── lib/             # API client, utilities, types
└── contexts/        # React global state
```

**Key patterns:**
- Routes: `$(locale).routename.tsx` for i18n
- Components: TypeScript interfaces + Tailwind classes
- Imports: Use `~/` alias for app directory

## 🎨 Styling with Tailwind CSS

### Philosophy
Utility-first CSS - compose styles with pre-built classes instead of writing custom CSS.

```jsx
// ❌ Traditional CSS
<div className="custom-card">

// ✅ Tailwind approach
<div className="bg-white p-4 rounded-lg shadow-md">
```

### Custom Design System
Your project uses custom Tailwind configuration:

**Colors:** `bg-brand`, `text-gold`, `bg-brand-light`
**Spacing:** `p-xs` (12px), `p-sm` (16px), `p-md` (24px)
**Typography:** `text-16` (16px), `font-700` (weight 700)

### Common Patterns

```jsx
// Layout
className="flex flex-col justify-center items-center"

// Responsive design
className="text-sm md:text-lg lg:text-xl"

// Custom spacing
className="py-[22px] px-16"  // Exact values

// Combining with custom CSS
className="content-card bg-brand rounded-xl"
```

## 🔧 Component Development Workflow

1. **Create component:**
   ```
   app/components/MyComponent/MyComponent.tsx
   ```

2. **Follow existing patterns:**
   ```tsx
   interface MyComponentProps {
     title: string;
     className?: string;
   }
   
   export function MyComponent({ title, className }: MyComponentProps) {
     return (
       <div className={`base-styles ${className}`}>
         {title}
       </div>
     );
   }
   ```

3. **Add to component index if needed:**
   ```
   app/components/index.ts
   ```

## 🧪 Testing Different User Access

Change subscription tier for local testing:

```bash
# In .env.local
DEVELOPMENT_USER_TAGS=core-member     # Core access
DEVELOPMENT_USER_TAGS=premium-member  # Premium access  
DEVELOPMENT_USER_TAGS=supporter       # Full access
```

Restart dev server after changes.

## 📱 Platform Notes

- **Desktop only:** Mobile access restricted
- **Authentication:** Shopify Customer Account API
- **Content tiers:** unsubscribed → live → core → premium → supporter
- **Internationalization:** Routes use `$(locale)` prefix

## 🚨 Common Gotchas

1. **Environment variables:** Must be added in 3 places:
   - `.env.local`
   - `env.d.ts` (TypeScript types)
   - `vite.config.ts` (Oxygen runtime)

2. **TypeScript paths:** Use `~/lib/utils` not `../../../lib/utils`

3. **Auto-generated files:** Don't edit `*.generated.d.ts` files

4. **CSS custom properties:** Colors use `rgb(var(--brand))` pattern

## 🔍 Debugging Tips

**Styling issues:**
- Use browser DevTools to inspect Tailwind classes
- Check `tailwind.config.js` for custom utilities
- Look in `app/styles/` for component-specific CSS

**TypeScript errors:**
- Run `npm run typecheck` for detailed output
- Check import paths use `~/` alias

**Build issues:**
- Clear `.cache` and `dist` directories
- Restart dev server

## 📚 Key Documentation

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Hydrogen Docs](https://shopify.dev/custom-storefronts/hydrogen)
- [Remix Docs](https://remix.run/docs)
- Project README.md for detailed architecture

---

**Need help?** Check existing components for patterns, or ask the team!