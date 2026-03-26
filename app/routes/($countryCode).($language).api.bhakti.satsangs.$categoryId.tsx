import type { LoaderFunctionArgs } from "react-router";
import { userScopedMediaApiContext } from "~/lib/middleware";

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const { categoryId } = params;
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit")) || 100;

  // Get userScopedMediaApi with correct regionId
  const userScopedMediaApi = context.get(userScopedMediaApiContext);

  const { satsangs } = await userScopedMediaApi.satsangs.getList({
    limit,
    categoryId: Number(categoryId),
  });

  return { satsangs };
}
