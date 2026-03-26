import { Image } from "~/lib/types";
import { SizeOptions } from "~/lib/types/general.types";
import { ComponentType } from "react";

export interface HeroSchema {
  tags?: { label: string; bgColor: string; textColor: string }[];
  title: string;
  titleSize?: "h1-md" | "h1-lg" | "h1-sm";
  descriptionSize?: "body-b1" | "body-b2";
  titleUppercase?: boolean;
  description?: string;
  backgroundImage?: Image;
  backgroundColor?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonShowArrow?: boolean;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  horizontalAlignment?: "left" | "center" | "right";
  verticalAlignment?: "top" | "center" | "bottom";
  fullWidth?: boolean;
  contentWidth?: "small" | "medium" | "large";
}

export interface HeroProps {
  schema: HeroSchema | Promise<HeroSchema>;
  topPadding?: SizeOptions;
  bottomPadding?: SizeOptions;
  topMargin?: SizeOptions;
  bottomMargin?: SizeOptions;
  button?: React.ReactNode;
  secondaryButton?: React.ReactNode;
  height?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  overflow?: boolean;
  imageCover?: boolean;
  showLiveStreamBadge?: boolean;
  showDescription?: boolean;
  /**
   * The secondary content component to show in the hero
   * When provided, this component will be rendered instead of the default hero content
   */
  SecondaryContent?: ComponentType<any>;
  /**
   * Props to pass to the SecondaryContent component
   */
  secondaryContentProps?: Record<string, unknown>;
  showSecondaryContent?: boolean;
  onSecondaryContentClose?: () => void;
  handleNegativeMargin?: boolean;
  handleNegativeMarginSecondaryContent?: boolean;
}
