import { data, LoaderFunctionArgs } from "react-router";
import { SearchResultItem } from "~/lib/types";
import { userScopedMediaApiContext, userContext, subscriptionTierContext } from "~/lib/middleware";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query) {
    return { results: [] };
  }

  try {
    // Get authenticated user data AND userScopedMediaApi with correct regionId
    const userScopedMediaApi = context.get(userScopedMediaApiContext);
    const user = context.get(userContext);
    const subscriptionTier = context.get(subscriptionTierContext);

    // Build userAuth object for authenticated API calls
    const userAuth = user?.email ? {
      email: user.email,
      subscriptionTier,
    } : undefined;

    const response = await userScopedMediaApi.search.search(query, userAuth);
    const { results } = response;

    return { results: results as SearchResultItem[], error: null };
  } catch (error) {
    console.error("Search query error:", error);
    return data({ results: [], error: "Search failed" }, { status: 500 });
  }
}
