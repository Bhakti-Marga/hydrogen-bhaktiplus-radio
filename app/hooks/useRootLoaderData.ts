import { useMatches } from "react-router";

import type { loader } from "~/root";

export type RootLoaderData = Awaited<ReturnType<typeof loader>>;

export type RootLoaderDataWithUrl = RootLoaderData & {
  layoutUrl?: string;
  url?: string;
};

export function useRootLoaderData(): RootLoaderDataWithUrl {
  const [root, layout, child] = useMatches();
  const rootData = root?.data as RootLoaderData | undefined;
  const layoutData = layout?.data as { url?: string } | undefined;
  const childData = child?.data as { url?: string } | undefined;

  return {
    ...rootData,
    layoutUrl: layoutData?.url,
    url: childData?.url || layoutData?.url,
  } as RootLoaderDataWithUrl;
}
