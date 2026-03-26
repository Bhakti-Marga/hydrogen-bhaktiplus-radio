/**
 * CATALOG PAGE - Mobile App Entry Point
 * ======================================
 *
 * This page displays the content catalog for mobile app users.
 * It follows Apple/Android store guidelines by NOT showing prices
 * or purchase buttons directly - users are directed through the
 * router for region detection and store routing.
 *
 * Layout:
 * 1. Membership plans (Monthly / Yearly) - PRIMARY ACTION
 * 2. Content categories preview
 */

import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import imageLogo from "~/assets/logo.png";

export const meta: MetaFunction = () => {
  return [
    { title: "Catalog - Bhakti+" },
    { name: "description", content: "Paramahamsa Vishwananda's wisdom in one place. Watch everywhere, anytime, without distractions. Available in 28+ languages." },
  ];
};

/**
 * Signal to root layout that this page should render without the standard layout
 * (no header, footer, mobile wall, etc.)
 */
export const handle = {
  skipLayout: true,
};

// Membership plans - no prices shown (Apple/Android compliance)
const MEMBERSHIP_PLANS = [
  {
    id: "live",
    title: "Live",
    description: "Access to all live streams and replays",
    icon: "🔴",
    badge: null,
    features: ["Live streams", "7-day replays"],
  },
  {
    id: "premium",
    title: "Premium",
    description: "Full access to all content library",
    icon: "🪷",
    badge: "Most Popular",
    features: ["Everything in Live", "Satsangs", "Pilgrimages", "Commentaries"],
  },
  {
    id: "supporter",
    title: "All-Inclusive",
    description: "Premium plus exclusive talks and early access",
    icon: "✨",
    badge: null,
    features: ["Everything in Premium", "Exclusive Talks", "Early access"],
  },
] as const;

// Individual products for purchase
const PRODUCT_CATEGORIES = [
  {
    id: "pilgrimages",
    title: "Virtual Pilgrimages",
    icon: "🌍",
    items: [
      { id: 24, title: "Ashtavinayak 2025" },
      { id: 19, title: "Peru 2025" },
      { id: 25, title: "Bali 2024" },
      { id: 26, title: "Holi 2024" },
    ],
  },
  {
    id: "commentaries",
    title: "Scripture Commentaries",
    icon: "📖",
    items: [
      { id: 20, title: "Shandilya Bhakti Sutra" },
      { id: 16, title: "Narada Bhakti Sutra" },
    ],
  },
  {
    id: "talks",
    title: "Exclusive Talks",
    icon: "🎤",
    items: [
      { id: 125, title: "Maha-Lakshmi Talk 2" },
      { id: 124, title: "Maha-Lakshmi Talk 1" },
      { id: 29, title: "Narasimha Talk" },
      { id: 22, title: "Bhakti Talks USA 1" },
    ],
  },
] as const;

export default function CatalogPage() {
  return (
    <div className="catalog-page min-h-screen bg-brand-dark flex flex-col">
      {/* Header with logo */}
      <header className="catalog-header py-16 px-24 relative flex items-center justify-between">
        <Link to="/welcome" className="text-white/50 hover:text-white/70 transition-colors">
          <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <img
          src={imageLogo}
          alt="Bhakti+"
          className="h-[28px] w-auto"
        />
        <div className="w-24" /> {/* Spacer for centering */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </header>

      {/* Main Content */}
      <main className="catalog-main flex-1 px-20 py-32">
        {/* Page Title */}
        <div className="catalog-intro text-center mb-32">
          <h1 className="text-28 md:text-32 font-600 text-white mb-12 font-figtree">
            Choose Your Plan
          </h1>
          <p className="text-16 text-white/60 max-w-[300px] mx-auto">
            Unlimited access to all teachings in 28 languages
          </p>
        </div>

        {/* Membership Plans - PRIMARY */}
        <div className="catalog-plans space-y-20 max-w-[400px] mx-auto mb-48">
          {MEMBERSHIP_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`catalog-plan-card p-24 rounded-20 border-2 ${plan.badge
                ? "bg-gradient-to-br from-gold/15 to-gold/5 border-gold/30"
                : "bg-white/5 border-white/10"
                }`}
            >
              {/* Plan Header */}
              <div className="flex items-start gap-12 mb-16">
                <span className="text-28">{plan.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-8">
                    <h2 className="text-20 font-600 text-white">{plan.title}</h2>
                    {plan.badge && (
                      <span className="px-8 py-2 text-10 font-600 uppercase tracking-wide rounded-full bg-gold/20 text-gold">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-13 text-white/50 mt-2">{plan.description}</p>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-6 mb-20">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-8 text-13 text-white/60">
                    <svg className="w-14 h-14 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Billing Options */}
              <div className="flex gap-12">
                <Link
                  to={`/router?intent=subscribe&membership_id=${plan.id}&billing_period=monthly`}
                  className="flex-1 py-12 px-16 text-center text-14 font-600 rounded-12 bg-white/10 text-white border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all"
                >
                  Monthly
                </Link>
                <Link
                  to={`/router?intent=subscribe&membership_id=${plan.id}&billing_period=yearly`}
                  className={`flex-1 py-12 px-16 text-center text-14 font-600 rounded-12 transition-all ${plan.badge
                    ? "bg-gold text-brand-dark hover:bg-gold/90"
                    : "bg-white text-brand-dark hover:bg-white/90"
                    }`}
                >
                  Yearly
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Global features */}
        <div className="catalog-global-features max-w-[400px] mx-auto text-center mb-48">
          <p className="text-13 text-white/40">
            All plans include: Access on all devices • 28 languages • Cancel anytime
          </p>
        </div>

        {/* Divider */}
        <div id="products" className="flex items-center gap-16 max-w-[400px] mx-auto mb-32">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="text-12 text-white/40 uppercase tracking-wider">Or buy individually</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        {/* Individual Products */}
        <div className="catalog-products space-y-32 max-w-[400px] mx-auto">
          {PRODUCT_CATEGORIES.map((category) => (
            <div key={category.id} className="catalog-product-category">
              {/* Category Header */}
              <div className="flex items-center gap-10 mb-12">
                <span className="text-20">{category.icon}</span>
                <h3 className="text-16 font-600 text-white">{category.title}</h3>
              </div>

              {/* Category Items */}
              <div className="space-y-8">
                {category.items.map((item) => (
                  <Link
                    key={item.id}
                    to={`/router?intent=product&content_type=${category.id}&content_id=${item.id}`}
                    className="flex items-center justify-between p-14 rounded-12 bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/15 transition-all"
                  >
                    <span className="text-14 text-white/80">{item.title}</span>
                    <svg
                      className="w-16 h-16 text-white/30"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="catalog-footer py-20 px-24">
        <nav className="catalog-footer-nav flex justify-center gap-20 mb-8">
          <a
            href="https://app.fastbots.ai/embed/cmf5fvjk60058p71lzwipms12"
            target="_blank"
            rel="noopener noreferrer"
            className="text-14 text-white/50 hover:text-white/70 transition-colors"
          >
            Help
          </a>
          <a
            href="https://bhaktimarga.org/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-14 text-white/50 hover:text-white/70 transition-colors"
          >
            Terms
          </a>
          <a
            href="https://bhaktimarga.org/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-14 text-white/50 hover:text-white/70 transition-colors"
          >
            Privacy
          </a>
        </nav>
        <p className="text-12 text-white/35 text-center">
          © {new Date().getFullYear()} Bhakti Marga
        </p>
      </footer>
    </div>
  );
}

