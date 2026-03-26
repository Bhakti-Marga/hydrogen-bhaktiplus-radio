import {useParams, Await, useRouteLoaderData} from '@remix-run/react';
import {Suspense, useState, useCallback, useEffect, useRef} from 'react';

import {type LayoutQuery} from 'storefrontapi.generated';
import {Link} from '~/components/Link';
import {
  type EnhancedMenu,
  useIsHomePath,
} from '~/lib/utils';
import type {RootLoader} from '~/root';
import logoImg from '~/assets/logo.png';
import {TimezoneSwitcher} from '~/components/TimezoneSwitcher';

type LayoutProps = {
  children: React.ReactNode;
  layout?: LayoutQuery & {
    headerMenu?: EnhancedMenu | null;
    footerMenu?: EnhancedMenu | null;
  };
};

const RADIO_NAV_ITEMS = [
  {label: 'Radio', to: '/', type: 'internal' as const},
  {label: 'Podcasts', to: '/#weekly-shows', type: 'anchor' as const},
  {label: 'Kirtan Circle', to: 'https://kirtan-circle.org', type: 'external' as const},
  {label: 'Live', to: '/#weekly-shows', type: 'anchor' as const},
  {label: 'Events', to: '', type: 'dropdown' as const, children: [
    {label: 'Just Love Festival — July 2026', url: 'https://events.bhaktimarga.org/collections/just-love-festival'},
    {label: 'With Paramahamsa Vishwananda', url: 'https://events.bhaktimarga.org/collections/paramahamsa-vishwananda'},
    {label: 'All Events', url: 'https://events.bhaktimarga.org'},
  ]},
];

export function PageLayout({children, layout}: LayoutProps) {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div>
          <a href="#mainContent" className="sr-only">
            Skip to content
          </a>
        </div>
        <RadioHeader />
        <main role="main" id="mainContent" className="flex-grow">
          {children}
        </main>
      </div>
      <RadioFooter />
    </>
  );
}

function NavDropdown({item}: {item: typeof RADIO_NAV_ITEMS[number]}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const children = 'children' in item ? (item as any).children : [];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="font-figtree text-14 font-600 text-grey-light hover:text-white transition-colors uppercase tracking-wide flex items-center gap-4"
      >
        {item.label}
        <svg className={`w-10 h-10 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-8 bg-brand border border-brand-light/30 rounded-lg shadow-dropdown overflow-hidden min-w-[260px]" style={{zIndex: 9999}}>
          {children.map((child: any) => (
            <a
              key={child.url}
              href={child.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-16 py-12 text-14 font-figtree text-grey-light hover:text-white hover:bg-brand-light/30 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {child.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function RadioHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleListenLive = () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  return (
    <>
      {/* Desktop Header */}
      <header
        role="banner"
        className="hidden tablet:flex items-center sticky z-40 top-0 w-full h-[var(--header-height)] px-24 desktop:px-60 bg-brand/90 backdrop-blur-md border-b border-brand-light/20"
      >
        <div className="flex items-center gap-32 flex-1">
          <Link to="/" className="shrink-0 flex items-center gap-8" prefetch="intent">
            <img src={logoImg} alt="Bhakti+" className="h-28 desktop:h-32 w-auto" />
            <span className="font-figtree text-12 font-400 text-grey-dark hidden desktop:inline">
              RADIO
            </span>
          </Link>

          <nav className="flex items-center gap-24">
            {RADIO_NAV_ITEMS.map((item) =>
              item.type === 'dropdown' ? (
                <NavDropdown key={item.label} item={item} />
              ) : item.type === 'external' ? (
                <a
                  key={item.label}
                  href={item.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-figtree text-14 font-600 text-grey-light hover:text-white transition-colors uppercase tracking-wide"
                >
                  {item.label}
                </a>
              ) : item.type === 'anchor' ? (
                <a
                  key={item.label}
                  href={item.to}
                  className="font-figtree text-14 font-600 text-grey-light hover:text-white transition-colors uppercase tracking-wide"
                  onClick={(e) => {
                    e.preventDefault();
                    const id = item.to.split('#')[1];
                    document.getElementById(id)?.scrollIntoView({behavior: 'smooth'});
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  prefetch="intent"
                  className="font-figtree text-14 font-600 text-grey-light hover:text-white transition-colors uppercase tracking-wide"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>

        <div className="flex items-center gap-16">
          <button
            className="flex items-center gap-8 bg-gold text-brand font-figtree font-700 text-14 px-20 py-8 rounded-full hover:opacity-90 transition-opacity cursor-pointer"
            onClick={handleListenLive}
          >
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Listen Live
          </button>

          <TimezoneSwitcher variant="header" />

          {/* Search */}
          <div className="relative flex items-center">
            {isSearchOpen && (
              <input
                ref={searchRef}
                type="text"
                placeholder="Search..."
                className="w-[180px] bg-brand-light/50 text-white text-14 font-figtree px-12 py-4 rounded-md border border-brand-light/30 focus:border-gold/50 focus:outline-none mr-4"
                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsSearchOpen(false);
                }}
              />
            )}
            <button
              className="text-grey-light hover:text-white transition-colors p-8"
              aria-label="Search"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </div>

          <Link to="/myradio" className="text-grey-light hover:text-gold transition-colors p-8" aria-label="My Radio" prefetch="intent">
            <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </Link>

          <Link to="/account" className="text-grey-light hover:text-white transition-colors p-8" aria-label="Account">
            <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Mobile Header */}
      <header
        role="banner"
        className="flex tablet:hidden items-center sticky z-40 top-0 w-full h-[var(--header-height)] px-12 bg-brand/90 backdrop-blur-md border-b border-brand-light/20"
      >
        <button
          className="text-white p-8"
          aria-label="Menu"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>

        <Link to="/" className="flex-1 flex justify-center" prefetch="intent">
          <img src={logoImg} alt="Bhakti+" className="h-24 w-auto" />
        </Link>

        <button
          className="flex items-center gap-4 bg-gold text-brand font-figtree font-700 text-12 px-12 py-8 rounded-full cursor-pointer"
          onClick={handleListenLive}
        >
          <svg className="w-14 h-14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Live
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 tablet:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <nav className="absolute top-[var(--header-height)] left-0 right-0 bg-brand border-b border-brand-light/20 shadow-dropdown">
            <div className="flex flex-col py-16">
              {RADIO_NAV_ITEMS.map((item) =>
                item.type === 'dropdown' ? (
                  <div key={item.label}>
                    <p className="px-24 py-12 font-figtree text-16 font-600 text-grey-light uppercase tracking-wide">
                      {item.label}
                    </p>
                    {('children' in item ? (item as any).children : []).map((child: any) => (
                      <a
                        key={child.url}
                        href={child.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-40 py-10 font-figtree text-14 text-grey-dark hover:text-white hover:bg-brand-light/20 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {child.label}
                        <svg className="w-12 h-12 inline ml-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                      </a>
                    ))}
                  </div>
                ) : item.type === 'external' ? (
                  <a
                    key={item.label}
                    href={item.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-24 py-12 font-figtree text-16 font-600 text-grey-light hover:text-white hover:bg-brand-light/20 transition-colors uppercase tracking-wide"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                    <svg className="w-14 h-14 inline ml-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </a>
                ) : item.type === 'anchor' ? (
                  <a
                    key={item.label}
                    href={item.to}
                    className="px-24 py-12 font-figtree text-16 font-600 text-grey-light hover:text-white hover:bg-brand-light/20 transition-colors uppercase tracking-wide"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsMobileMenuOpen(false);
                      const id = item.to.split('#')[1];
                      setTimeout(() => document.getElementById(id)?.scrollIntoView({behavior: 'smooth'}), 300);
                    }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="px-24 py-12 font-figtree text-16 font-600 text-grey-light hover:text-white hover:bg-brand-light/20 transition-colors uppercase tracking-wide"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}

              {/* My Radio link */}
              <div className="border-t border-brand-light/20 mt-8">
                <Link
                  to="/myradio"
                  className="flex items-center gap-12 px-24 py-14 font-figtree text-16 font-600 text-gold hover:bg-brand-light/20 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                  prefetch="intent"
                >
                  <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  My Radio
                </Link>
              </div>

              {/* Timezone switcher in mobile menu */}
              <div className="px-24 py-16 border-t border-brand-light/20">
                <p className="text-12 text-grey-dark mb-8 uppercase tracking-wide">Timezone</p>
                <TimezoneSwitcher variant="inline" />
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

function RadioFooter() {
  return (
    <footer className="bg-brand border-t border-brand-light/20 pb-[72px]">
      <div className="max-w-[1536px] mx-auto px-12 tablet:px-24 desktop:px-60 py-48">
        <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-32">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-8 mb-16">
              <img src={logoImg} alt="Bhakti+" className="h-28 w-auto" />
              <span className="font-figtree text-14 font-400 text-grey-dark">RADIO</span>
            </div>
            <p className="body-b4 text-grey-dark opacity-70">
              One World. One Frequency.<br />
              Millions of hearts connected to Divine Love.
            </p>
          </div>

          {/* Radio */}
          <div>
            <p className="h3-sm text-gold mb-16">RADIO</p>
            <nav className="flex flex-col gap-8">
              <Link to="/" className="body-b3 text-grey-light hover:text-white transition-colors">Bhakti+ Radio</Link>
              <Link to="/" className="body-b3 text-grey-light hover:text-white transition-colors">Mantra Radio</Link>
              <Link to="/" className="body-b3 text-grey-light hover:text-white transition-colors">Saints and Divine Stories</Link>
              <a href="https://kirtan-circle.org" target="_blank" rel="noopener noreferrer" className="body-b3 text-grey-light hover:text-white transition-colors">Kirtan Circle Radio</a>
            </nav>
          </div>

          {/* Content */}
          <div>
            <p className="h3-sm text-gold mb-16">CONTENT</p>
            <nav className="flex flex-col gap-8">
              <a href="https://bhakti.plus" target="_blank" rel="noopener noreferrer" className="body-b3 text-grey-light hover:text-white transition-colors">Bhakti+ Premium</a>
              <a href="https://atma-bhog.org" target="_blank" rel="noopener noreferrer" className="body-b3 text-grey-light hover:text-white transition-colors">Bhajan Lyrics</a>
              <a href="https://events.bhaktimarga.org" target="_blank" rel="noopener noreferrer" className="body-b3 text-grey-light hover:text-white transition-colors">Events</a>
              <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" className="body-b3 text-grey-light hover:text-white transition-colors">Spotify</a>
            </nav>
          </div>

          {/* Community */}
          <div>
            <p className="h3-sm text-gold mb-16">COMMUNITY</p>
            <nav className="flex flex-col gap-8">
              <a href="https://bhaktimarga.org" target="_blank" rel="noopener noreferrer" className="body-b3 text-grey-light hover:text-white transition-colors">Bhakti Marga</a>
              <a href="https://kirtan-circle.org" target="_blank" rel="noopener noreferrer" className="body-b3 text-grey-light hover:text-white transition-colors">Kirtan Circle</a>
              <a href="https://atma-bhog.org" target="_blank" rel="noopener noreferrer" className="body-b3 text-grey-light hover:text-white transition-colors">Atma Bhog</a>
              <a href="https://events.bhaktimarga.org/pages/contact" target="_blank" rel="noopener noreferrer" className="body-b3 text-grey-light hover:text-white transition-colors">Contact</a>
            </nav>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-48 pt-24 border-t border-brand-light/20 flex flex-col tablet:flex-row justify-between items-center gap-16">
          <p className="body-b5 text-grey-dark opacity-50">
            &copy; {new Date().getFullYear()} Bhakti Marga. All rights reserved.
          </p>
          <div className="flex gap-16">
            <Link to="/policies/privacy-policy" className="body-b5 text-grey-dark opacity-50 hover:opacity-80 transition-opacity">Privacy</Link>
            <Link to="/policies/terms-of-service" className="body-b5 text-grey-dark opacity-50 hover:opacity-80 transition-opacity">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
