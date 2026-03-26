import { ScrollFade } from "~/components/ScrollFade";
import { DetailsProps } from "./Details.types";

export function Details({ title, descriptionHtml, info }: DetailsProps) {
  if (!title && !descriptionHtml && !info) return null;

  return (
    <div className="px-12 tablet:px-24 desktop:px-60">
      <div className="grid grid-cols-12 gap-24 tablet:gap-24 items-start tablet:items-center">
        <ScrollFade className="col-span-12 tablet:col-span-6 max-h-[60cqh]">
          {title && (
            <h2 className="h2-lg uppercase mb-24 text-white">
              {title}
            </h2>
          )}
          <div className="body-b2 opacity-80 text-white grid gap-24">
            {descriptionHtml && (
              <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
            )}
          </div>
        </ScrollFade>
        <div className="col-span-12 tablet:col-span-6 tablet:justify-end flex min-w-0">
          {info && (
            <div className="grid grid-cols-2 gap-16 tablet:gap-32 pr-0 tablet:pr-64 text-white mt-24 tablet:mt-0">
              {info?.map((item, idx) => (
                <div key={idx}>
                  {item.label && (
                    <h3 className="h2-sm leading-8">
                      {item.label}
                    </h3>
                  )}
                  {item.value && (
                    <div className="body-b2">
                      {item.value.map((value, idx) => (
                        <p key={idx}>{value}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
