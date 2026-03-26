import { Image } from "~/lib/types";

export interface PlatformFeature {
  image: Image;
  title: string;
  description: string;
}

export interface PlatformFeaturesSchema {
  title: string;
  features: PlatformFeature[];
}
