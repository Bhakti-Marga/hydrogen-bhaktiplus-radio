import { ButtonHTMLAttributes, AnchorHTMLAttributes, forwardRef } from "react";
import { Link } from "~/components";
import { IconArrow } from "~/components/Icons/IconArrow";

type ButtonProps = {
  /** Skip locale prefix - use for paths like /router that should be absolute */
  absolute?: boolean;
  as?: "button" | "link";
  href?: string;
  variant?: "primary" | "secondary" | "blue" | "red" | "ghost" | "gold";
  size?: "default" | "small" | "large";
  shape?: "pill" | "rectangle";
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
  loading?: boolean;
} & (
    | ButtonHTMLAttributes<HTMLButtonElement>
    | AnchorHTMLAttributes<HTMLAnchorElement>
  );

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(
  (
    {
      absolute = false,
      as = "button",
      children,
      variant = "primary",
      size = "default",
      shape = "pill",
      icon,
      className = "",
      disabled = false,
      loading = false,
      href,
      external,
      showArrow,
      ...props
    },
    ref,
  ) => {
    const sizeClass = size === "small" ? "btn--sm" : size === "large" ? "btn--lg" : "";
    const shapeClass = shape === "rectangle" ? "btn--rect" : "";
    const loadingClass = loading ? "btn--loading" : "";
    const classes = `btn btn--${variant} ${sizeClass} ${shapeClass} ${loadingClass} ${className}`.trim();

    if (as === "link") {
      return external ? (
        <a
          href={href || "#"}
          className={classes}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          target="_blank"
          rel="noopener noreferrer"
          {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {icon && <span>{icon}</span>}
          {children}
          {showArrow && <IconArrow />}
        </a>
      ) : (
        <Link
          to={href || "#"}
          absolute={absolute}
          className={classes}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          prefetch="intent"
          {...(({ type: _, draggable: __, ...rest }) => rest)(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          <span className="flex items-center justify-center gap-2">
            {icon && <span>{icon}</span>}
            {children}
            {showArrow && (
              <span className="ml-8 w-[6px] flex items-center justify-center">
                <IconArrow />
              </span>
            )}
          </span>
        </Link>
      );
    }

    return (
      <button
        className={classes}
        disabled={disabled || loading}
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        <span className="flex items-center justify-center gap-2">
          {icon && <span>{icon}</span>}
          {children}
          {showArrow && (
            <span className="block ml-8 w-8">
              <IconArrow />
            </span>
          )}
        </span>
      </button>
    );
  },
);
