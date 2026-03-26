import { useState, useEffect, useRef, useCallback } from "react";

import { useTranslations } from "~/contexts/TranslationsProvider";

interface ExpandableTextBaseProps {
  /** Additional classes applied to the text container */
  className?: string;
}

interface ExpandableTextHtmlProps extends ExpandableTextBaseProps {
  /** HTML string rendered via dangerouslySetInnerHTML */
  html: string;
  children?: never;
}

interface ExpandableTextChildrenProps extends ExpandableTextBaseProps {
  html?: never;
  /** Plain text or JSX content */
  children: React.ReactNode;
}

export type ExpandableTextProps =
  | ExpandableTextHtmlProps
  | ExpandableTextChildrenProps;

/**
 * Text container that clamps content to 5 lines and shows a
 * "Show more" / "Show less" toggle when the content overflows.
 *
 * Supports both HTML strings (via `html` prop) and regular children.
 */
export function ExpandableText({
  html,
  children,
  className,
}: ExpandableTextProps) {
  const { strings } = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const checkClamped = useCallback(() => {
    const el = contentRef.current;
    if (el) {
      // Compare scroll height to client height to detect overflow
      setIsClamped(el.scrollHeight > el.clientHeight + 1);
    }
  }, []);

  useEffect(() => {
    checkClamped();
    // Re-check on window resize since line-clamp is layout-dependent
    window.addEventListener("resize", checkClamped);
    return () => window.removeEventListener("resize", checkClamped);
  }, [checkClamped, html, children]);

  return (
    <div>
      <div
        ref={contentRef}
        className={`${className ?? ""} ${!isExpanded ? "line-clamp-5" : ""}`}
        {...(html != null
          ? { dangerouslySetInnerHTML: { __html: html } }
          : undefined)}
      >
        {html == null ? children : undefined}
      </div>
      {(isClamped || isExpanded) && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-8 text-14 font-500 text-white/60 hover:text-white/80 transition-colors cursor-pointer"
        >
          {isExpanded ? strings.show_less : strings.show_more}
        </button>
      )}
    </div>
  );
}
