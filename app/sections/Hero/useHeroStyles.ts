import { useMemo } from "react";

import { HeroProps, HeroSchema } from "./Hero.types";

export function useHeroStyles(props: HeroProps) {
  const { schema, height } = props;
  const { horizontalAlignment, verticalAlignment, contentWidth } =
    schema as HeroSchema;

  const horizontalAlignmentClassNames = useMemo(() => {
    switch (horizontalAlignment) {
      case "left":
        return "justify-start text-left";
      case "center":
        return "justify-center text-center";
      case "right":
        return "justify-end text-right";
      default:
        return "justify-center text-center";
    }
  }, [horizontalAlignment]);

  const verticalAlignmentClassNames = useMemo(() => {
    switch (verticalAlignment) {
      case "top":
        return "items-start";
      case "center":
        return "items-center";
      case "bottom":
        return "items-end";
    }
  }, [verticalAlignment]);

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

  const heightClassNames = useMemo(() => {
    switch (height) {
      case "sm":
        return "h-[400px]";
      case "md":
        return "h-[600px]";
      case "lg":
        return "h-[800px]";
      case "xl":
        return "h-[1000px]";
      case "2xl":
        return "h-[1200px]";
      default:
        return "";
    }
  }, [height]);

  const paddingClassNames = useMemo(() => {
    switch (height) {
      case "sm":
        return "py-40";
      case "md":
        return "py-64";
      case "lg":
        return "py-80";
      case "xl":
        return "py-96";
      case "2xl":
        return "py-128";
      case "3xl":
        return "py-[192px]";
      case "4xl":
        return "py-[256px]";
      case "5xl":
        return "py-[320px]";
    }
  }, [height]);

  return {
    horizontalAlignmentClassNames,
    verticalAlignmentClassNames,
    contentWidthClassNames,
    heightClassNames,
    paddingClassNames,
  };
}
