import { Suspense, useState } from "react";
import { Await } from "react-router";
import { Accordion, CardSkeletonList, Container, Image } from "~/components";
import { Link } from "~/components/Link/Link";
import { useTranslations } from "~/contexts/TranslationsProvider";
import { SizeOptions } from "~/lib/types/general.types";
import { isPromise } from "~/lib/utils/general";
import { FaqsSchema } from "./Faqs.schema";
import { RichText } from "@shopify/hydrogen";

import imageBackground from "~/assets/images/faq-bg.png";

interface FaqsProps {
  schema: Promise<FaqsSchema | null> | FaqsSchema | null;
  topPadding?: SizeOptions;
  bottomPadding?: SizeOptions;
  topMargin?: SizeOptions;
  bottomMargin?: SizeOptions;
  withImageBackground?: boolean;
  layout?: "grid" | "stacked";
  showMoreLink?: boolean;
}

export function Faqs({
  topPadding,
  bottomPadding,
  topMargin,
  bottomMargin,
  schema,
  withImageBackground,
  layout = "grid",
  showMoreLink = false,
}: FaqsProps) {
  return isPromise(schema) ? (
    <Suspense
      fallback={
        <Container topPadding={topPadding} bottomPadding={bottomPadding} topMargin={topMargin} bottomMargin={bottomMargin}>
          <CardSkeletonList count={2} />
        </Container>
      }
    >
      <Await resolve={schema}>
        {(schema) => (
          <Section
            schema={schema}
            topPadding={topPadding}
            bottomPadding={bottomPadding}
            topMargin={topMargin}
            bottomMargin={bottomMargin}
            withImageBackground={withImageBackground}
            layout={layout}
            showMoreLink={showMoreLink}
          />
        )}
      </Await>
    </Suspense>
  ) : (
    <Section
      schema={schema}
      topPadding={topPadding}
      bottomPadding={bottomPadding}
      topMargin={topMargin}
      bottomMargin={bottomMargin}
      withImageBackground={withImageBackground}
      layout={layout}
      showMoreLink={showMoreLink}
    />
  );
}

function Section({
  topPadding,
  bottomPadding,
  topMargin,
  bottomMargin,
  schema,
  withImageBackground,
  layout,
  showMoreLink,
}: FaqsProps) {
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const { strings } = useTranslations();

  const { title, faqs } = schema as FaqsSchema;

  const handleAccordionToggle = (clickedIndex: number) => {
    setOpenAccordion(openAccordion === clickedIndex ? null : clickedIndex);
  };

  return (
    <section className="faqs px-4 relative tablet:px-8 desktop:px-16">
      <Container topPadding={topPadding} bottomPadding={bottomPadding} topMargin={topMargin} bottomMargin={bottomMargin}>
        <div
          className={`faqs__container grid gap-24 ${layout === "grid" ? "grid-cols-1 tablet:grid-cols-12" : "max-w-3xl"
            }`}
        >
          <div
            className={`faqs__container__col ${layout === "grid" ? "tablet:col-span-4 tablet:max-w-xs" : ""
              }`}
          >
            {title && <h2 className="faqs__title text-white h1-sm">{title}</h2>}
            {showMoreLink && (
              <Link
                href="/faqs"
                className="faqs__more-link text-gold body-b3 mt-16 inline-block underline"
              >
                {strings.faqs_check_more}
              </Link>
            )}
          </div>
          <div
            className={`faqs__container__col ${layout === "grid" ? "tablet:col-span-8" : ""
              }`}
          >
            <div className="faqs__content bg-white rounded-lg py-16 shadow">
              {faqs.map((faq, index) => (
                <Accordion
                  key={index}
                  index={index}
                  defaultOpen={false}
                  showChevron={true}
                  forceClose={openAccordion !== null && openAccordion !== index}
                  onToggle={handleAccordionToggle}
                  header={faq.question}
                  body={<RichText data={faq.answer} />}
                  headerClasses="p-24 body-b1 text-left"
                  headerOpenClasses="bg-grey-light"
                  bodyClasses="pb-24 px-24 bg-grey-light body-b4 text-brand/80"
                />
              ))}
            </div>
          </div>
        </div>
      </Container>
      {withImageBackground && (
        <div className="faqs__bg absolute top-0 left-0 w-full h-[782px] -z-10">
          <Image
            data={{ url: imageBackground, altText: "BhaktiMarga" }}
            type="external"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </section>
  );
}
