import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { userScopedMediaApiContext } from "~/lib/middleware";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { pilgrimageId } = params;

  if (!pilgrimageId) {
    return data({ error: "Pilgrimage ID is required" }, { status: 400 });
  }

  try {
    // Get userScopedMediaApi with correct regionId
    const userScopedMediaApi = context.get(userScopedMediaApiContext);
    const videoData = await userScopedMediaApi.pilgrimages.getVideos(pilgrimageId);
    return {
      videoGroups: videoData.videoGroups,
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch pilgrimage videos:", error);
    return data(
      {
        videoGroups: null,
        error: "Failed to fetch pilgrimage videos",
      },
      { status: 500 },
    );
  }
}
