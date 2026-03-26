import { Image as ImageType } from "@shopify/hydrogen-react";

import { SatsangCategory, Live, Commentary, Pilgrimage } from "../types";

export type AspectRatio = `${number}/${number}`;

export type ImageSrc = string;

export type SizeOptions = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface ContainerSettings {
  topPadding?: SizeOptions;
  bottomPadding?: SizeOptions;
  topMargin?: SizeOptions;
  bottomMargin?: SizeOptions;
  fullWidth?: boolean;
}

export interface SiteHeaderData {
  nav: {
    lives: Promise<Live[]>;
    satsangsCategories: Promise<SatsangCategory[]>;
    commentaries: Promise<Commentary[]>;
    pilgrimages: Promise<Pilgrimage[]>;
  };
}

export interface Image {
  altText?: string;
  aspectRatio?: number;
  directory?: string;
  filename?: string;
  format?: string;
  height?: number;
  id?: string;
  previewSrc?: string;
  size?: number;
  url: string;
  type?: string;
  width?: number;
}

export interface UITag {
  label: string;
  bgColor: string;
  textColor: string;
}

export type BadgeType = "supporter" | "premium";

export interface Badge {
  type: BadgeType;
  text: string;
  backgroundColor?: "gold" | "purple";
  borderColor?: "gold" | "purple";
  textColor?: "gold" | "purple";
}
