import { format } from "date-fns";

import { Content } from "~/lib/types";

import { Details } from "./Details";
import { useMemo } from "react";

export const ContentDetails: React.FC<{
  content: Content;
}> = ({ content }) => {
  const { title, descriptionHtml } = content;
  const info = useMemo(() => {
    const info = [];

    if (content?.startDate) {
      info.push({
        label: "Date",
        value: [format(content.startDate, "dd MMMM yyyy")],
      });
    }

    if (content?.location?.location) {
      info.push({
        label: "Location",
        value: [
          [content?.location?.city, content?.location?.country].join(", "),
        ],
      });
    }

    // if (content?.startDate) {
    //   info.push({
    //     label: "Time",
    //     value: [format(content.startDate, "HH:mm")],
    //   });
    // }

    return info;
  }, [content]);

  return <Details title={title} descriptionHtml={descriptionHtml} info={info} />;
};
