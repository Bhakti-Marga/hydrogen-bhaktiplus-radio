/**
 * Utility function to conditionally join classNames together
 * Filters out falsy values and joins the rest with spaces
 *
 * @example
 * cn('base-class', isActive && 'active', 'another-class')
 * // => 'base-class active another-class'
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const containerClasses = {
  paddingTop: {
    xs: "section-pt-xs",
    sm: "section-pt-sm",
    md: "section-pt-md",
    lg: "section-pt-lg",
    xl: "section-pt-xl",
    "2xl": "section-pt-2xl",
  },
  paddingBottom: {
    xs: "section-pb-xs",
    sm: "section-pb-sm",
    md: "section-pb-md",
    lg: "section-pb-lg",
    xl: "section-pb-xl",
    "2xl": "section-pb-2xl",
  },
  marginTop: {
    xs: "section-mt-xs",
    sm: "section-mt-sm",
    md: "section-mt-md",
    lg: "section-mt-lg",
    xl: "section-mt-xl",
    "2xl": "section-mt-2xl",
  },
  marginBottom: {
    xs: "section-mb-xs",
    sm: "section-mb-sm",
    md: "section-mb-md",
    lg: "section-mb-lg",
    xl: "section-mb-xl",
    "2xl": "section-mb-2xl",
  },
};
