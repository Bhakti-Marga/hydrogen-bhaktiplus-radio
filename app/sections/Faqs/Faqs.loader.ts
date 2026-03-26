import { AppLoadContext } from "react-router";
import { FaqsSchema, Faq } from "./Faqs.schema";
import { FAQS_METAOBJECT_TYPE, FAQS_QUERY } from "./Faqs.query";
import { getShopifyLocaleForTranslations } from "~/lib/locale";
import type { MetaobjectFragment } from "../../../storefrontapi.generated";

type MetaobjectField = MetaobjectFragment["fields"][number];
type MetaobjectNode = NonNullable<
  MetaobjectFragment["fields"][number]["references"]
>["nodes"][number];
type MetaobjectWithFields = Extract<
  MetaobjectNode,
  { fields: Array<MetaobjectField> }
>;

interface FaqsLoaderOptions {
  /** Language code for localized content (e.g., 'en', 'de') */
  language?: string;
  /** Country code for localized content (e.g., 'us', 'de') */
  country?: string;
}

/**
 * Server side utility to fetch the faqs metaobject.
 * 
 * @param context - App context
 * @param handle - Metaobject handle
 * @param options - Optional locale settings (language/country) for @inContext directive
 */
export async function faqsLoader(
  context: AppLoadContext,
  handle: string,
  options?: FaqsLoaderOptions,
): Promise<FaqsSchema> {
  const { storefront } = context;

  // Get Shopify locale - handles special cases like pt-PT, zh-CN
  const inputLanguage = options?.language || storefront.i18n.language;
  const shopifyLocale = getShopifyLocaleForTranslations(inputLanguage);

  const finalLanguage = shopifyLocale.language;
  const finalCountry = shopifyLocale.country || (options?.country?.toUpperCase() as typeof storefront.i18n.country) || storefront.i18n.country;
  
  console.log('[faqsLoader] DEBUG:');
  console.log('  handle:', handle);
  console.log('  options.language:', options?.language);
  console.log('  options.country:', options?.country);
  console.log('  inputLanguage:', inputLanguage);
  console.log('  shopifyLocale.language:', shopifyLocale.language);
  console.log('  shopifyLocale.country:', shopifyLocale.country);
  console.log('  FINAL -> language:', finalLanguage, 'country:', finalCountry);

  const schema: FaqsSchema = {
    title: "",
    faqs: [],
  };

  const { metaobject, errors } = await storefront.query(FAQS_QUERY, {
    variables: {
      handle: {
        handle,
        type: FAQS_METAOBJECT_TYPE,
      },
      // Pass locale for @inContext directive
      // Uses shopifyLocale which handles special cases (pt-PT, zh-CN) that need specific country
      language: finalLanguage,
      country: finalCountry,
    },
  });

  if (errors != undefined) {
    throw errors;
  }

  if (metaobject) {
    const faqs: Faq[] = [];

    metaobject.fields.forEach((field: MetaobjectField) => {
      switch (field.key) {
        case "title":
          schema.title = field.value ?? "";
          break;
        case "faqs":
          field.references?.nodes?.forEach((node: MetaobjectNode) => {
            if ("fields" in node) {
              const faq: Faq = {
                question: "",
                answer: "",
              };
              node.fields.forEach((field: MetaobjectField) => {
                switch (field.key) {
                  case "question":
                    faq.question = field.value ?? "";
                    break;
                  case "answer":
                    faq.answer = field.value ?? "";
                    break;
                }
              });
              faqs.push(faq);
            }
          });
          break;
        default:
          break;
      }
    });

    schema.faqs = faqs;
  }

  return schema;
}
