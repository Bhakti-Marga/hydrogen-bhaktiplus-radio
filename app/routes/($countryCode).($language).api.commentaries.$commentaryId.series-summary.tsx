import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { userScopedMediaApiContext } from "~/lib/middleware";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { commentaryId } = params;

  if (!commentaryId) {
    return data({ error: "Commentary ID is required" }, { status: 400 });
  }

  try {
    // Get userScopedMediaApi with correct regionId
    const userScopedMediaApi = context.get(userScopedMediaApiContext);
    const seriesSummary = await userScopedMediaApi.commentaries.getSeriesSummary(
      commentaryId,
    );

    return {
      ...seriesSummary,
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch commentary series summary:", error);
    return data(
      {
        groupName: null,
        groupNamePlural: null,
        groupCount: 0,
        videoCount: 0,
        totalVideoDurationSeconds: 0,
        error: "Failed to fetch commentary series summary",
      },
      { status: 500 },
    );
  }
}
