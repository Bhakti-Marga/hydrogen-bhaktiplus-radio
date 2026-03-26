import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { userScopedMediaApiContext, userContext } from "~/lib/middleware";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { pilgrimageId } = params;

  if (!pilgrimageId) {
    return data({ error: "Pilgrimage ID is required" }, { status: 400 });
  }

  try {
    const userScopedMediaApi = context.get(userScopedMediaApiContext);
    const user = context.get(userContext);
    const userAuth = user?.email ? { email: user.email } : undefined;

    const seriesFeaturedVideo =
      await userScopedMediaApi.pilgrimages.getSeriesFeaturedVideo(
        pilgrimageId,
        userAuth,
      );

    return {
      ...seriesFeaturedVideo,
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch pilgrimage series featured video:", error);
    return data(
      {
        video: null,
        marker: null,
        progressSeconds: null,
        videoIndex: 0,
        totalVideos: 0,
        error: "Failed to fetch pilgrimage series featured video",
      },
      { status: 500 },
    );
  }
}
