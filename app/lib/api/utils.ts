import { BaseQueryParams, FilterParams, PaginationParams } from "./types";

export function getProcessedParams(params?: FilterParams & PaginationParams) {
  if (!params) {
    return {};
  }

  const processedParams: Record<string, any> = { ...params };

  if (params.categoryId) {
    processedParams["Filters.categoryId"] = params.categoryId;
    delete processedParams.categoryId;
  }

  if (params.subscriptionTier) {
    processedParams["Filters.subscriptionTier"] = params.subscriptionTier;
    delete processedParams.subscriptionTier;
  }

  if (params.topicId !== undefined) {
    processedParams["Filters.topicId"] = params.topicId;
    delete processedParams.topicId;
  }

  return processedParams;
}
