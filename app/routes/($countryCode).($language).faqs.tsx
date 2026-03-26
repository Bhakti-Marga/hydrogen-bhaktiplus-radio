import { type LoaderFunctionArgs, useLoaderData, type MetaFunction } from "react-router";
import { Faqs, faqsLoader } from "~/sections";
import { localeContext } from "~/lib/middleware";

const FAQ_HANDLES = [
  "homepage-faqs",
  "account-settings",
  "pay-for-bhakti",
  "problems-with-the-account",
  "problems-with-invoicing",
  "problems-with-viewing",
  "profile",
  "features-and-settings",
  "watch-options",
];

export const meta: MetaFunction = () => {
  return [{ title: "FAQ - Bhakti+" }];
};

export async function loader(args: LoaderFunctionArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return { ...deferredData, ...criticalData };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({ context }: LoaderFunctionArgs) {
  // Get determined locale from middleware (includes user preferences, not just URL)
  const determinedLocale = context.get(localeContext);
  const localeOptions = { language: determinedLocale.language, country: determinedLocale.countryCode };

  // Load all FAQ sections in parallel
  const faqSections = await Promise.all(
    FAQ_HANDLES.map((handle) => faqsLoader(context, handle, localeOptions))
  );

  return {
    faqSections,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({ context }: LoaderFunctionArgs) {
  // No deferred data needed for FAQ page currently
  return {};
}

export default function FaqsPage() {
  const { faqSections } = useLoaderData<typeof loader>();

  return (
    <div className="faqs-page">
      {faqSections.map((faqsSchema, index) => (
        <Faqs
          key={index}
          bottomMargin={index === faqSections.length - 1 ? "lg" : "md"}
          bottomPadding={index === faqSections.length - 1 ? "lg" : undefined}
          topPadding={index === 0 ? "xl" : undefined}
          schema={faqsSchema}
          layout="stacked"
        />
      ))}
    </div>
  );
}
