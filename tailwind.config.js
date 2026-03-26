/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  safelist: ["text-gold", "text-red", "btn", "btn--red", "btn--blue", "btn--secondary", "btn--gold"],
  theme: {
    // Container config removed - we use the Container component instead
    // which handles padding via Tailwind utility classes (px-12 tablet:px-24 desktop:px-60)
    borderRadius: {
      'none': '0',
      'sm': '0.375rem',   // 6px
      'md': '0.5rem',      // 8px
      'lg': '.75rem',        // 12px
      'xl': '1rem', // 16px
      'full': '9999px',    // pill shape
    },
    screens: {
      // === BLESSED BREAKPOINTS (use these) ===
      // See docs/RESPONSIVE_DESIGN.md for usage guidelines
      tablet: "40rem",        // 640px - tablets, landscape phones
      desktop: "64rem",       // 1024px - laptops, desktops  
      wide: "80rem",          // 1280px - large monitors

      // === DEPRECATED (migrate away, then remove) ===
      // @deprecated - Use mobile-first pattern instead of max-width queries
      "max-mobile": { raw: "(max-width: 576px)" },
      // @deprecated - Use desktop: instead
      laptop: "71.25rem",     // 1140px
      // @deprecated - Use wide: instead
      widescreen: "80rem",    // 1280px
      // @deprecated - Use wide: instead
      extrawide: "90rem",     // 1440px
      // @deprecated - Remove component-specific breakpoints, use standard ones
      "desktop-header": "77.8125rem",   // 1245px
      "header-breakpoint": "84.75rem",  // 1356px
      // @deprecated - Use CSS @media queries in specific components if truly needed
      landscape: { raw: "(orientation: landscape), (min-width: 768px)" },
      "landscape-all": { raw: "(orientation: landscape)" },
    },
    colors: {
      transparent: "transparent",
      brand: "rgb(var(--brand))",
      "brand-light": "rgb(var(--brand-light))",
      "brand-lighter": "rgb(var(--brand-lighter))",
      "brand-dark": "rgb(var(--brand-dark))",
      gold: "rgb(var(--gold))",
      "gold-light": "rgb(var(--gold-light))",
      grey: "rgb(var(--grey))",
      "grey-light": "rgb(var(--grey-light))",
      "grey-dark": "rgb(var(--grey-dark))",
      "grey-grey": "rgb(var(--grey-grey))",
      white: "rgb(var(--white))",
      black: "rgb(var(--black))",
      red: "rgb(var(--red))",
      link: "rgb(var(--link))",
      purple: "rgb(var(--purple))",
      "purple-dark": "rgb(var(--purple-dark))",
      orange: "rgb(var(--orange))",
      "neutral-blue": "rgb(var(--neutral-blue))",
      "text-muted": "rgb(var(--text-muted))",
      "text-placeholder": "rgb(var(--text-placeholder))",
      "overlay-dark": "rgb(var(--overlay-dark))"
    },
    fontFamily: {
      // Font stacks include system-ui fallback for proper multi-script support
      // (Korean, Japanese, Chinese, Cyrillic, Arabic, Hebrew, etc.)
      "avenir-next": [
        "Avenir Next",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "sans-serif",
      ],
      figtree: [
        "Figtree",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "sans-serif",
      ],
      // Display serif font - Bauer Bodoni for genre eyebrows
      "display-serif": ["Bauer Bodoni Std", "Georgia", "serif"],
    },
    fontWeight: {
      200: "200",
      300: "300",
      400: "400",
      500: "500",
      600: "600",
      700: "700",
      800: "800",
      900: "900",
    },
    fontSize: {
      10: "10px",
      12: "12px",
      14: "14px",
      16: "16px",
      18: "18px",
      20: "20px",
      24: "24px",
      32: "32px",
      40: "40px",
      48: "48px",
      xxs: "10px",
      xs: "12px",
      sm: "14px",
      md: "16px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "32px",
    },
    spacing: {
      0: "0",
      1: "0.0625rem", // 1px
      2: "0.125rem",  // 2px
      4: "0.25rem",   // 4px
      8: "0.5rem",    // 8px
      10: "0.625rem", // 10px
      12: "0.75rem",  // 12px
      14: "0.875rem", // 14px
      16: "1rem",     // 16px
      20: "1.25rem",  // 20px
      24: "1.5rem",   // 24px
      28: "1.75rem",  // 28px
      32: "2rem",     // 32px
      36: "2.25rem",  // 36px
      40: "2.5rem",   // 40px
      48: "3rem",     // 48px
      56: "3.5rem",   // 56px
      60: "3.75rem",  // 60px
      64: "4rem",     // 64px
      80: "5rem",     // 80px
      96: "6rem",     // 96px
      128: "8rem",    // 128px

      // Legacy aliases (keeping for compatibility)
      xxs: "0.5rem",  // 8px
      xs: "0.75rem",  // 12px
      sm: "1rem",     // 16px
      md: "1.5rem",   // 24px
      lg: "2rem",     // 32px
      xl: "2.5rem",   // 40px
      "2xl": "3rem",  // 48px
      "3xl": "4rem",  // 64px

      // Semantic spacing scale
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
    },
    lineHeight: {
      "8": "8px",
      "14": "14px",
      "16": "16px",
      "18": "18px",
      "20": "20px",
      "24": "24px",
      "32": "32px",
      "40": "40px",
      "48": "48px",
      "56": "56px",
    },
    letterSpacing: {
      "tighter": "-.05em",
      "normal": "normal",
      "wide": ".03em",
      "wider": "1em",
    },
    boxShadow: {
      'none': 'none',
      'card': '0px 4px 14px 0px rgba(12, 22, 47, 0.3)',
      'card-hover': '0px 8px 32px 0px rgba(0, 0, 0, 0.4)',
      'dropdown': '0px 4px 16px 0px rgba(0, 0, 0, 0.25)',
    },
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 1s ease-in',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        // Icon size utilities
        '.icon-sm': {
          width: '0.75rem',   // 12px
          height: '0.75rem',
        },
        '.icon-md': {
          width: '1rem',      // 16px
          height: '1rem',
        },
        '.icon-lg': {
          width: '1.5rem',    // 24px
          height: '1.5rem',
        },
        '.icon-xl': {
          width: '2rem',      // 32px
          height: '2rem',
        },
        '.icon-2xl': {
          width: '2.5rem',    // 40px
          height: '2.5rem'
        },
        // Gradient utilities
        '.gradient-brand': {
          background: 'linear-gradient(265.3deg, rgba(22, 37, 76, 0) 40%, #051237 60%), linear-gradient(0deg, #051337 0%, rgba(5, 19, 55, 0.6) 100%)',
        },
        '.gradient-purple': {
          background: 'linear-gradient(180deg, #5745FF 0%, #231F92 100%)',
        },
        '.gradient-purple-dark': {
          background: 'linear-gradient(180deg, #242099 0%, #0C0B33 100%)',
        },
      });
    },
  ],
};
