import { forwardRef } from "react";
import type { ReactNode } from "react";

type ExternalLinkProps = {
  children?: ReactNode;
  className?: string;
  draggable?: boolean;
  href: string;
  newTab?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  style?: React.CSSProperties;
  tabIndex?: number | undefined;
  rel?: string;
  target?: string;
} & Omit<React.HTMLProps<HTMLAnchorElement>, 'href'>;

/**
 * ExternalLink component for rendering external URLs without locale prefixing.
 *
 * Use this component when:
 * - Linking to external domains
 * - Linking to absolute URLs that shouldn't be prefixed with locale
 * - Linking to non-route URLs (e.g., mailto:, tel:, custom protocols)
 *
 * For internal app navigation, use the `Link` component instead.
 */
export const ExternalLink = forwardRef<HTMLAnchorElement, ExternalLinkProps>(
  (
    {
      children,
      className,
      href,
      newTab = false,
      rel,
      target,
      ...props
    },
    ref,
  ) => {
    // Default to opening external links in new tab with security attributes
    const finalTarget = target || (newTab ? "_blank" : undefined);
    const finalRel = rel || (finalTarget === "_blank" ? "noopener noreferrer" : undefined);

    return (
      <a
        className={className}
        href={href}
        ref={ref}
        target={finalTarget}
        rel={finalRel}
        {...props}
      >
        {children}
      </a>
    );
  },
);

ExternalLink.displayName = "ExternalLink";
