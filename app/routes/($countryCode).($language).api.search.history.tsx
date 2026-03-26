import { data, LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { SearchHistoryItem } from "~/lib/types";
import { userScopedMediaApiContext, userContext, subscriptionTierContext } from "~/lib/middleware";

export async function loader({ context }: LoaderFunctionArgs) {
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

    // Only fetch history if we have user auth, otherwise return empty
    if (!userAuth) {
      return { history: [] as SearchHistoryItem[], error: null };
    }
    const { history } = await userScopedMediaApi.search.getHistory(userAuth);
    return { history: history as SearchHistoryItem[], error: null };
  } catch (error) {
    console.error("Failed to fetch search history:", error);
    return data(
      { history: [], error: "Failed to fetch search history" },
      { status: 500 },
    );
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const method = request.method;

  if (method === "DELETE") {
    try {
      // Get userScopedMediaApi for clearing history
      const userScopedMediaApi = context.get(userScopedMediaApiContext);
      const user = context.get(userContext);
      const subscriptionTier = context.get(subscriptionTierContext);

      const userAuth = user?.email ? {
        email: user.email,
        subscriptionTier,
      } : undefined;

      if (!userAuth) {
        return data({ error: "Authentication required" }, { status: 401 });
      }

      await userScopedMediaApi.search.clearHistory(userAuth);
      return { success: true };
    } catch (error) {
      console.error("Failed to clear search history:", error);
      return data({ error: "Failed to clear search history" }, { status: 500 });
    }
  }

  return data({ error: "Method not allowed" }, { status: 405 });
}
