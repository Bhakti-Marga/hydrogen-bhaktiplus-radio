import { Live } from "~/lib/types";
import { ApiClient } from "../client";
import {
  LiveDto,
  LivesListResponseDto,
  LivesLatestReleasesResponseDto,
 PaginationParams, FilterParams } from "../types";
import { getProcessedParams } from "../utils";

export class LivesService extends ApiClient {
  /**
   * Get the featured live. If FEATURED_LIVE_OVERRIDE_ID env var is set,
   * fetches that specific live instead of using the API's featured endpoint.
   */
  async getFeatured(): Promise<{ featured: Live }> {
    // Check for staging override
    const overrideId = this.config.featuredLiveOverrideId;
    if (overrideId) {
      console.log(`[LivesService] Using featured live override: ${overrideId}`);
      const live = await this.getById(overrideId);
      return { featured: live };
    }

    const response = await this.get<{ featured: LiveDto }>("/lives/featured");
    return { featured: response.data?.featured ?? null };
    //return { featured: null };
  }

  /**
   * Get a specific live by ID
   */
  async getById(liveId: string | number): Promise<Live> {
    const response = await this.get<LiveDto>(`/lives/${liveId}`);
    return response.data ?? null;
  }

  async getList(
    params?: PaginationParams & FilterParams,
  ): Promise<{ lives: Live[] }> {
    const processedParams = getProcessedParams(params);

    const response = await this.get<{ lives: LiveDto[] }>(
      "/lives",
      processedParams,
    );
    return { lives: response.data?.lives ?? [] };
  }

  async getLatestReleases(
    params?: PaginationParams & FilterParams,
  ): Promise<{ latestReleases: Live[] }> {
    const response = await this.get<LivesLatestReleasesResponseDto>(
      "/lives/latest-releases",
      params,
    );
    return { latestReleases: response.data?.latestReleases ?? [] };
  }
}
