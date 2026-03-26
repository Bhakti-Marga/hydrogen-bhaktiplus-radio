import type { LoaderFunctionArgs } from "react-router";
import { userScopedMediaApiContext } from "~/lib/middleware";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = parseInt(url.searchParams.get("limit") || "27", 10);
  const desc = url.searchParams.get("desc") !== "false"; // defaults to true (descending)

  // Get userScopedMediaApi with correct regionId
  const userScopedMediaApi = context.get(userScopedMediaApiContext);

  try {
    const response = await userScopedMediaApi.satsangs.getList({
      limit: Math.min(limit, 100), // Cap at API maximum
      offset,
      sortBy: "publishedAt",
      desc,
    });

    return {
      satsangs: response.satsangs,
      total: response.total,
      offset: response.offset,
      limit: response.limit,
    };
  } catch (error) {
    console.error("Failed to fetch satsangs:", error);
    return Response.json(
      { error: "Failed to fetch satsangs" },
      { status: 500 }
    );
  }
}
