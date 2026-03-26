import { Suspense } from "react";
import { Await } from "react-router";

import { CardSkeletonList, Container, Image, MobileSlideshow } from "~/components";
import { SizeOptions } from "~/lib/types/general.types";
import { isPromise } from "~/lib/utils";

import { PlatformFeaturesSchema, PlatformFeature } from "./PlatformFeatures.schema";
import { RichText } from "@shopify/hydrogen";

interface PlatformFeaturesProps {
  topPadding?: SizeOptions;
  bottomPadding?: SizeOptions;
  topMargin?: SizeOptions;
  bottomMargin?: SizeOptions;
  schema?: Promise<PlatformFeaturesSchema | null> | PlatformFeaturesSchema | null;
}

export function PlatformFeatures({ topPadding, bottomPadding, topMargin, bottomMargin, schema }: PlatformFeaturesProps) {
  return isPromise(schema) ? (
    <Suspense
      fallback={
        <Container topPadding={topPadding} bottomPadding={bottomPadding} topMargin={topMargin} bottomMargin={bottomMargin}>
          <CardSkeletonList count={4} />
        </Container>
      }
    >
      <Await resolve={schema}>
        {(schema) => <Section topPadding={topPadding} bottomPadding={bottomPadding} topMargin={topMargin} bottomMargin={bottomMargin} schema={schema} />}
      </Await>
    </Suspense>
  ) : (
    <Section topPadding={topPadding} bottomPadding={bottomPadding} topMargin={topMargin} bottomMargin={bottomMargin} schema={schema} />
  );
}

function Section({ topPadding, bottomPadding, topMargin, bottomMargin, schema }: PlatformFeaturesProps) {
  if (!schema) {
    return null;
  }

  const { features, title } = schema as PlatformFeaturesSchema;

  return (
    <section className="platform-features">
      <Container topPadding={topPadding} bottomPadding={bottomPadding} topMargin={topMargin} bottomMargin={bottomMargin}>
        <h2 className="text-left h2-md text-white mb-16">{title}</h2>
        <MobileSlideshow gap={8}>
          {features?.map((feature, index) => (
            <MobileSlideshow.Slide key={index}>
              <FeatureCard feature={feature} />
            </MobileSlideshow.Slide>
          ))}
        </MobileSlideshow>
      </Container>
    </section>
  );
}

function FeatureCard({ feature }: { feature: PlatformFeature }) {
  if (!feature) {
    return null;
  }

  // Transform "28 languages" to "28+ languages" in the title
  const displayTitle = feature?.title ? feature.title.replace(/28 languages/gi, '28+ languages') : '';

  return (
    <div className="platform-feature relative text-left flex flex-col items-start px-24 pt-24 pb-[86px] rounded-lg shadow-md bg-gradient-to-b from-[#242099] to-[#061566]">
      {feature.image && (
        <div className="platform-feature__icon size-[80px] rounded-lg absolute bottom-16 right-16 flex items-end justify-end">
          <Image
            data={feature.image}
            className="w-full h-auto object-contain"
            pictureClasses="flex items-end justify-end"
          />
        </div>
      )}
      <h3 className="text-white mb-sp-1 font-700">{displayTitle}</h3>
      {feature.description && (
        <RichText className="text-grey-dark text-14 opacity-80" data={feature.description} />
      )}
    </div>
  );
}

export default PlatformFeatures;
