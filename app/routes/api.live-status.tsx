import type { LoaderFunctionArgs } from "react-router";
import { userScopedMediaApiContext } from "~/lib/middleware";

export async function loader({ context }: LoaderFunctionArgs) {
  // Get userScopedMediaApi from middleware context
  const userScopedMediaApi = context.get(userScopedMediaApiContext);
  const status = await userScopedMediaApi.liveStatus.getCurrentLiveStatus();

  return {
    status,
    timestamp: new Date().toISOString(),
  };
}
