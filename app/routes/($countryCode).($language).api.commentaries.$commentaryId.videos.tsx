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
    const videoData = await userScopedMediaApi.commentaries.getVideos(commentaryId);

    return {
      videoGroups: videoData.videoGroups,
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch commentary videos:", error);
    return data(
      {
        videoGroups: null,
        error: "Failed to fetch commentary videos",
      },
      { status: 500 },
    );
  }
}
