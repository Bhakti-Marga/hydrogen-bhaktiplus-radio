import { forwardRef } from "react";
import type { PartialDeep } from "type-fest";
import { Image as HydrogenImage } from "@shopify/hydrogen-react";
import type { Image as ImageType } from "@shopify/hydrogen-react/storefront-api-types";

import type { AspectRatio } from "~/lib/types";

type ImageProps = React.ComponentProps<typeof HydrogenImage> & {
  aspectRatio?: AspectRatio | undefined;
  breakpoint?: string;
  isStatic?: boolean;
  type?: "shopify" | "external";
  withLoadingAnimation?: boolean;
  pictureClasses?: string;
  desktop?: {
    data: PartialDeep<
      ImageType,
      {
        recurseIntoArrays: true;
      }
    >;
    aspectRatio?: AspectRatio;
    type?: "shopify" | "external";
  };
};

const getPxWidthNum = (width: string | number | undefined) => {
  if (!width) return undefined;
  if (typeof width === "number") return width;
  if (width.endsWith("rem")) return Number(width.replace("rem", "")) * 16;
  if (width.endsWith("em")) return Number(width.replace("em", "")) * 16;
  return Number(width.replace("px", ""));
};

export const Image = forwardRef(
  (
    {
      aspectRatio: passedAspectRatio,
      breakpoint,
      className,
      data,
      desktop,
      width: passedWidth,
      isStatic, // sets only 1 srcSet option that is 3x scale
      pictureClasses = "",
      type,
      withLoadingAnimation = true, // adds a loading shimmer animation if data.url is undefined
      ...props
    }: ImageProps,
    ref: React.Ref<HTMLImageElement>,
  ) => {
    let width = passedWidth;
    let aspectRatio = passedAspectRatio;
    let aspectRatioDesktop = desktop?.aspectRatio;
    let breakpointRem = "48rem";
    let srcset = data?.url;
    let srcsetDesktop: string | null = null;
    let ar = "--ar-lzimg-tablet";
    const isRelativeWidth =
      typeof width === "string" &&
      (width.endsWith("%") || width.endsWith("vw"));
    if (!isRelativeWidth) {
      width = getPxWidthNum(passedWidth);
    }

    const isPxWidth = typeof width === "number";

    // If no passed in aspect ratio, try to set it with image width/height
    if (!aspectRatio && data?.width && data?.height) {
      aspectRatio = `${data?.width}/${data?.height}`;
    }

    if (
      desktop?.data?.url &&
      !aspectRatioDesktop &&
      desktop?.data?.width &&
      desktop?.data?.height
    ) {
      aspectRatioDesktop = `${desktop?.data?.width}/${desktop?.data?.height}`;
    }

    pictureClasses += (pictureClasses ? " " : "") + "lazypicture block w-full";

    if (data?.url) {
      if (type === "external") {
        srcset = data?.url;
      } else {
        srcset = `
          ${data?.url}?width=768 768w,
          ${data?.url}?width=1024 1024w,
          ${data?.url}?width=1140 1140w,
          ${data?.url}?width=1280 1280w,
          ${data?.url}?width=1440 1440w,
          ${data?.url}1920w,
        `;
      }
    }

    if (desktop?.data?.url) {
      if (desktop?.type === "external") {
        srcsetDesktop = desktop?.data?.url;
      } else {
        srcsetDesktop = `
          ${desktop?.data?.url}?width=768 768w,
          ${desktop?.data?.url}?width=1024 1024w,
          ${desktop?.data?.url}?width=1140 1140w,
          ${desktop?.data?.url}?width=1280 1280w,
          ${desktop?.data?.url}?width=1440 1440w,
          ${desktop?.data?.url}1920w,
        `;
      }
    }

    switch (breakpoint) {
      case "desktop":
        breakpointRem = "64rem";
        ar = "--ar-lzimg-desktop";
        break;
      case "laptop":
        breakpointRem = "71.25rem";
        ar = "--ar-lzimg-laptop";
        break;
      case "widescreen":
        breakpointRem = "80rem";
        ar = "--ar-lzimg-widescreen";
        break;
      case "extrawide":
        breakpointRem = "90rem";
        ar = "--ar-lzimg-extrawide";
        break;
      default:
        breakpointRem = "48rem";
        ar = "--ar-lzimg-tablet";
        break;
    }

    const styleVars = {
      "--ar-lzimg-mobile": aspectRatio,
      "--aspect-ratio": aspectRatio || "auto",
      "--aspect-ratio-desktop": aspectRatioDesktop || "auto",
      [ar]: aspectRatioDesktop,
    } as React.CSSProperties;

    return data?.url ? (
      <picture className={pictureClasses} style={styleVars}>
        {srcsetDesktop && (
          <source
            srcSet={srcsetDesktop}
            media={`(min-width: ${breakpointRem})`}
          />
        )}

        <HydrogenImage
          ref={ref}
          data={data}
          sizes={srcset}
          aspectRatio={undefined} // See above why it's undefined
          width={width}
          className={`object-cover ${className ? className : ""}`}
          decoding="sync"
          style={{ aspectRatio: "auto" }}
          srcSetOptions={
            isStatic && isPxWidth
              ? {
                  intervals: 1,
                  startingWidth: Number(width) * 3,
                  incrementSize: Number(width) * 3,
                  placeholderWidth: Number(width) * 3,
                }
              : {
                  intervals: 8,
                  startingWidth: 200,
                  incrementSize: 400,
                  placeholderWidth: 100,
                }
          }
          {...props}
        />
      </picture>
    ) : (
      <div
        ref={ref}
        className={`lazypicture-placeholder relative overflow-hidden bg-white ${
          className ? className : ""
        }`}
        style={{
          ...styleVars,
          width: isPxWidth ? `${width}px` : width || "100%",
        }}
      >
        {withLoadingAnimation && <div className="loading-shimmer opacity-60" />}
      </div>
    );
  },
);

Image.displayName = "Image";
