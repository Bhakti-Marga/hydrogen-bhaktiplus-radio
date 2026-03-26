import { AppLoadContext } from "react-router";
import { HERO_METAOBJECT_TYPE, HERO_QUERY } from "./Hero.query";
import { HeroSchema } from "./Hero.types";
import { Image as ImageType } from "~/lib/types";
import { getShopifyLocaleForTranslations } from "~/lib/locale";

interface HeroLoaderOptions {
  /** Language code for localized content (e.g., 'en', 'de') */
  language?: string;
  /** Country code for localized content (e.g., 'us', 'de') */
  country?: string;
}

/**
 * Server side utility to fetch the hero metaobject.
 * 
 * @param context - App context
 * @param handle - Metaobject handle
 * @param options - Optional locale settings (language/country) for @inContext directive
 */
export async function heroLoader(
  context: AppLoadContext,
  handle: string,
  options?: HeroLoaderOptions,
): Promise<HeroSchema> {
  const { storefront } = context;

  const schema: HeroSchema = {
    title: "",
    description: "",
    backgroundImage: undefined,
    backgroundColor: "",
    buttonLink: "",
  };

  // Get Shopify locale - handles special cases like pt-PT, zh-CN
  const inputLanguage = options?.language || storefront.i18n.language;
  const shopifyLocale = getShopifyLocaleForTranslations(inputLanguage);

  const { metaobject, errors } = await storefront.query(HERO_QUERY, {
    variables: {
      handle: {
        handle,
        type: HERO_METAOBJECT_TYPE,
      },
      // Pass locale for @inContext directive
      // Uses shopifyLocale which handles special cases (pt-PT, zh-CN) that need specific country
      language: shopifyLocale.language,
      country: shopifyLocale.country || (options?.country?.toUpperCase() as typeof storefront.i18n.country) || storefront.i18n.country,
    },
  });

  if (errors != undefined) {
    throw errors;
  }

  if (metaobject) {
    metaobject.fields.forEach((field) => {
      switch (field.key) {
        case "title":
          schema.title = field.value ?? "";
          break;
        case "description":
          schema.description = field.value as string;
          break;
        case "image":
          if (field.reference && 'image' in field.reference && field.reference.image) {
            schema.backgroundImage = field.reference.image as unknown as ImageType;
          }
          break;
        case "background_color":
          schema.backgroundColor = field.value as string;
          break;
        case "button_link":
          schema.buttonLink = field.value as string;
          break;
        case "button_text":
          schema.buttonText = field.value as string;
          break;
        case "horizontal_alignment":
          schema.horizontalAlignment = field.value as
            | "left"
            | "center"
            | "right";
          break;
        case "vertical_alignment":
          schema.verticalAlignment = field.value as "top" | "center" | "bottom";
          break;
        case "full_width":
          schema.fullWidth = field.value === "true";
          break;
        case "content_width":
          schema.contentWidth = field.value as "small" | "medium" | "large";
          break;
        default:
          break;
      }
    });
  }

  return schema;
}
