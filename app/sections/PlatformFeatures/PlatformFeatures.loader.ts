import { AppLoadContext } from "react-router";
import { Image } from "~/lib/types";
import {
  PlatformFeaturesSchema,
  PlatformFeature,
} from "./PlatformFeatures.schema";
import {
  PLATFORM_FEATURES_METAOBJECT_TYPE,
  PLATFORM_FEATURES_QUERY,
} from "./PlatformFeatures.query";
import { getShopifyLocaleForTranslations } from "~/lib/locale";
import type { MetaobjectFragment } from "../../../storefrontapi.generated";

type MetaobjectField = MetaobjectFragment["fields"][number];

interface PlatformFeaturesLoaderOptions {
  /** Language code for localized content (e.g., 'en', 'de') */
  language?: string;
  /** Country code for localized content (e.g., 'us', 'de') */
  country?: string;
}

/**
 * Server side utility to fetch the platform features metaobject.
 * 
 * @param context - App context
 * @param handle - Metaobject handle
 * @param options - Optional locale settings (language/country) for @inContext directive
 */
export async function platformFeaturesLoader(
  context: AppLoadContext,
  handle: string,
  options?: PlatformFeaturesLoaderOptions,
): Promise<PlatformFeaturesSchema> {
  const { storefront } = context;

  const schema: PlatformFeaturesSchema = {
    title: "",
    features: [],
  };

  // Get Shopify locale - handles special cases like pt-PT, zh-CN
  const inputLanguage = options?.language || storefront.i18n.language;
  const shopifyLocale = getShopifyLocaleForTranslations(inputLanguage);

  const { metaobject, errors } = await storefront.query(
    PLATFORM_FEATURES_QUERY,
    {
      variables: {
        handle: {
          handle,
          type: PLATFORM_FEATURES_METAOBJECT_TYPE,
        },
        // Pass locale for @inContext directive
        // Uses shopifyLocale which handles special cases (pt-PT, zh-CN) that need specific country
        language: shopifyLocale.language,
        country: shopifyLocale.country || (options?.country?.toUpperCase() as typeof storefront.i18n.country) || storefront.i18n.country,
      },
    },
  );

  if (errors != undefined) {
    throw errors;
  }

  if (metaobject) {
    const features: PlatformFeature[] = [];

    metaobject.fields.forEach((field: MetaobjectField) => {
      switch (field.key) {
        case "title":
          schema.title = field.value ?? "";
          break;
        case "features":
          field.references?.nodes?.forEach((node) => {
            const feature: PlatformFeature = {
              title: "",
              description: "",
              image: {
                url: "",
                altText: "",
              } as unknown as Image,
            };
            // Type guard: only process if node has fields property
            if (node && 'fields' in node && node.fields) {
              node.fields.forEach((nodeField: MetaobjectField) => {
                switch (nodeField.key) {
                  case "title":
                    feature.title = nodeField.value ?? "";
                    break;
                  case "description":
                    feature.description = nodeField.value ?? "";
                    break;
                  case "icon":
                    // Type guard: check if reference has image property
                    if (nodeField.reference && 'image' in nodeField.reference && nodeField.reference.image) {
                      feature.image = nodeField.reference.image as unknown as Image;
                    }
                    break;
                }
              });
            }
            features.push(feature);
          });

          break;
        default:
          break;
      }
    });

    schema.features = features;
  }

  return schema;
}
