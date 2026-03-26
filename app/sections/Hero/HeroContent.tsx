import { ReactNode, useMemo } from "react";
import { CollapsibleTags } from "~/components";

export interface HeroContentProps {
  children: ReactNode;
  contentWidth?: "small" | "medium" | "large";
  padding?: string;
  className?: string;
}

export function HeroContent({
  children,
  contentWidth,
  padding = "py-48 tablet:py-64 desktop:py-128",
  className = "",
}: HeroContentProps) {
  const contentWidthClassNames = useMemo(() => {
    switch (contentWidth) {
      case "small":
        return "max-w-md";
      case "medium":
        return "max-w-3xl";
      case "large":
        return "max-w-5xl";
      default:
        return "max-w-2xl";
    }
  }, [contentWidth]);

  return (
    <div
      className={`hero__content size-full `}
    >
      <div
        className={`hero__content-container z-10 w-full ${padding} ${contentWidthClassNames} ${className} animate-[crossFade_700ms_ease-out_forwards]`}
      >
        {children}
      </div>
    </div>
  );
}

export interface HeroTagsProps {
  tags?: { label: string; bgColor: string; textColor: string }[];
  className?: string;
}

export function HeroTags({ tags, className = "" }: HeroTagsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <CollapsibleTags
      tags={tags}
      maxWidth="432px"
      className={`hero__tags ${className}`}
    />
  );
}

export interface HeroTitleProps {
  children?: ReactNode;
  size?: "h1-md" | "h1-lg" | "h1-sm";
  uppercase?: boolean;
  className?: string;
  dangerouslySetInnerHTML?: { __html: string };
}

export function HeroTitle({
  children,
  size = "h1-lg",
  uppercase = false,
  className = "",
  dangerouslySetInnerHTML,
}: HeroTitleProps) {
  const classNames = `hero__title ${size} ${uppercase ? "uppercase" : ""
    } text-white ${className}`;

  if (dangerouslySetInnerHTML) {
    return (
      <h1
        className={classNames}
        style={{ textTransform: 'none', textWrap: 'balance' }}
        dangerouslySetInnerHTML={dangerouslySetInnerHTML}
      />
    );
  }

  return <h1 className={classNames}>{children}</h1>;
}

export interface HeroDescriptionProps {
  children?: ReactNode;
  size?: "body-b1" | "body-b2";
  className?: string;
}

export function HeroDescription({
  children,
  size = "body-b1",
  className = "",
}: HeroDescriptionProps) {
  if (!children) return null;

  return (
    <p
      className={`hero__description text-grey-dark opacity-70 ${size} ${className}`}
    >
      {children}
    </p>
  );
}

export interface HeroButtonsProps {
  children: ReactNode;
  horizontalAlignment?: "left" | "center" | "right";
  className?: string;
}

export function HeroButtons({
  children,
  horizontalAlignment = "left",
  className = "",
}: HeroButtonsProps) {
  const alignmentClass =
    horizontalAlignment === "center"
      ? "justify-center"
      : horizontalAlignment === "right"
        ? "justify-end"
        : "justify-start";

  return (
    <div className={`hero__buttons flex flex-col tablet:flex-row flex-wrap gap-8 tablet:gap-12 [&>*]:w-full [&>*]:tablet:w-auto ${alignmentClass} ${className}`}>
      {children}
    </div>
  );
}
