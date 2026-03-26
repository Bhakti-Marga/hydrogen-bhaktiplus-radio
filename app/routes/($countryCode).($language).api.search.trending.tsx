import { data, LoaderFunctionArgs } from "react-router";
import { SearchTrendingItem } from "~/lib/types";
import { userScopedMediaApiContext } from "~/lib/middleware";

export async function loader({ context }: LoaderFunctionArgs) {
  try {
    // Get userScopedMediaApi with correct regionId
    const userScopedMediaApi = context.get(userScopedMediaApiContext);
    const { trending } = await userScopedMediaApi.search.getTrendingSearches();
    return { trending: (trending ?? []) as SearchTrendingItem[], error: null };
  } catch (error) {
    console.error("Failed to fetch trending searches:", error);
    return data(
      { trending: [], error: "Failed to fetch trending searches" },
      { status: 500 },
    );
  }
}
