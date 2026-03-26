import { forwardRef, useMemo } from "react";
import type { ReactNode } from "react";
import { Link as RemixLink } from "react-router";
import type { LinkProps as RemixLinkProps } from "react-router";

import { useCountryCode } from "~/hooks/useCountryCode";

/* Docs: https://remix.run/docs/en/main/components/link */

const getValidatedHref = ({
  href,
  type,
  urlPrefix,
  absolute,
}: {
  href: string | undefined | null;
  type: string | undefined | null;
  urlPrefix: string;
  absolute: boolean;
}) => {
  if (!href) return "";

  // Handle absolute links - no locale prefix
  if (absolute) {
    // If it's a full URL (http/https), return as-is
    if (href.startsWith("http://") || href.startsWith("https://")) {
      return href;
    }
    return href.startsWith("/") ? href : `/${href}`;
  }

  // Handle page links - prepend URL prefix for internal links
  if (type === "isPage") {
    // Don't double-prefix if already prefixed
    if (href.startsWith(urlPrefix)) return href;
    // Handle root paths
    const path = href.startsWith("/") ? href : `/${href}`;
    return `${urlPrefix}${path === "/" ? "" : path}`;
  }

  // Handle external links
  if (type === "isExternal") {
    // If it starts with /, treat as internal and prefix
    if (href.startsWith("/")) {
      if (href.startsWith(urlPrefix)) return href;
      return `${urlPrefix}${href}`;
    }
    // Otherwise, ensure it's a valid external URL
    try {
      return new URL(href).href;
    } catch {
      return `https://${href}`;
    }
  }

  // Handle email links
  if (type === "isEmail") {
    return href.startsWith("mailto:") ? href : `mailto:${href}`;
  }

  // Handle phone links
  if (type === "isPhone") {
    return href.startsWith("tel:") ? href : `tel:${href}`;
  }

  return href;
};

type LinkProps = {
  /** Skip locale prefix - use for paths like /router that should be absolute */
  absolute?: boolean;
  children?: ReactNode;
  className?: string;
  draggable?: boolean;
  href?: string | undefined | null;
  isExternal?: boolean;
  newTab?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  prefetch?: RemixLinkProps["prefetch"]; // 'none' | 'intent' | 'viewport' | 'render'
  preventScrollReset?: RemixLinkProps["preventScrollReset"];
  relative?: RemixLinkProps["relative"];
  reloadDocument?: RemixLinkProps["reloadDocument"];
  replace?: RemixLinkProps["replace"];
  state?: RemixLinkProps["state"];
  style?: React.CSSProperties;
  tabIndex?: number | undefined;
  text?: string;
  to?: RemixLinkProps["to"] | string | undefined | null;
  type?: "isPage" | "isExternal" | "isEmail" | "isPhone" | undefined | null;
  url?: string | undefined | null;
} & React.HTMLProps<HTMLAnchorElement>;

export const Link = forwardRef(
  (
    {
      absolute = false, // skip locale prefix
      children,
      className,
      href = "", // html property
      isExternal = false, // cms property
      newTab = false,
      prefetch = "none", // remix property
      preventScrollReset = false, // remix property
      relative, // remix property
      reloadDocument = false, // remix property
      replace = false, // remix property
      state, // remix property
      text = "", // cms property
      to = "", // remix property
      type = "isPage", // cms property
      url = "", // cms property
      ...props
    }: LinkProps,
    ref: React.Ref<HTMLAnchorElement> | undefined,
  ) => {
    const { urlPrefix } = useCountryCode();
    const initialHref = (to || href || url) as string;

    const finalHref = useMemo(() => {
      return getValidatedHref({
        href: initialHref,
        type: isExternal ? "isExternal" : type,
        urlPrefix,
        absolute,
      });
    }, [initialHref, isExternal, urlPrefix, type, absolute]);

    return finalHref ? (
      <RemixLink
        className={className}
        prefetch={prefetch}
        preventScrollReset={preventScrollReset}
        ref={ref}
        relative={relative}
        reloadDocument={reloadDocument}
        replace={replace}
        state={state}
        to={finalHref}
        {...(newTab ? { target: "_blank" } : null)}
        {...props}
      >
        {children || text}
      </RemixLink>
    ) : (
      // When there's no href, render a div without spreading anchor-specific props
      <div className={className} style={props.style} tabIndex={props.tabIndex}>
        {children || text}
      </div>
    );
  },
);

Link.displayName = "Link";
