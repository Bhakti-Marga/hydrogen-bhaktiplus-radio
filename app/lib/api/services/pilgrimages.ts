import { Pilgrimage, VideoGroup } from "~/lib/types";
import { ApiClient } from "../client";
import {
  PilgrimageDto,
  PilgrimagesLatestReleasesResponseDto,
  PaginationParams,
  FilterParams,
  SerieVideosResponseDto,
  SeriesSummaryResponseDto,
  PilgrimageSlugAwareResponse,
  SeriesFeaturedVideoResponseDto,
  UserAuthParams,
} from "../types";
import { getProcessedParams } from "../utils";

export class PilgrimagesService extends ApiClient {
  async getFeatured(): Promise<{ featured: Pilgrimage }> {
    const response = await this.get<PilgrimageDto>("/pilgrimages/featured");
    return { featured: response.data };
  }

  async getList(
    params?: PaginationParams & FilterParams,
  ): Promise<{ pilgrimages: Pilgrimage[] }> {
    const processedParams = getProcessedParams(params);

    const response = await this.get<{ pilgrimages: PilgrimageDto[] }>(
      "/pilgrimages",
      processedParams,
    );
    return { pilgrimages: response.data?.pilgrimages ?? [] };
  }

  async getLatestReleases(
    params?: PaginationParams & FilterParams,
  ): Promise<{ latestReleases: Pilgrimage[] }> {
    const response = await this.get<PilgrimagesLatestReleasesResponseDto>(
      "/pilgrimages/latest-releases",
      params,
    );
    return { latestReleases: response.data?.latestReleases ?? [] };
  }

  async getById(id: string): Promise<{ pilgrimage: Pilgrimage }> {
    const response = await this.get<PilgrimageDto>(`/pilgrimages/${id}`);
    return { pilgrimage: response.data };
  }

  async getBySlug(slug: string): Promise<{ pilgrimage: Pilgrimage | null; canonicalSlug: string | null }> {
    const response = await this.get<PilgrimageSlugAwareResponse>(
      `/pilgrimages/by-slug/${slug}`,
    );

    if (!response.data) {
      // Only return null for 404s, throw for actual server errors
      if (response.error?.status === 404) {
        return { pilgrimage: null, canonicalSlug: null };
      }
      throw new Error(response.error?.message || "Failed to fetch pilgrimage");
    }

    return {
      pilgrimage: response.data.data,
      canonicalSlug: response.data.canonicalSlug
    };
  }

  async getVideos(
    pilgrimageId: number | string,
  ): Promise<{ videoGroups: VideoGroup[] }> {
    const response = await this.get<{ videoGroups: VideoGroup[] }>(
      `/pilgrimages/${pilgrimageId}/videos`,
    );
    return response.data || { videoGroups: null };
  }

  async getSeriesSummary(
    pilgrimageId: number | string,
  ): Promise<SeriesSummaryResponseDto> {
    const response = await this.get<SeriesSummaryResponseDto>(
      `/pilgrimages/${pilgrimageId}/series-summary`,
    );
    return (
      response.data || {
        groupName: null,
        groupNamePlural: null,
        groupCount: 0,
        videoCount: 0,
        totalVideoDurationSeconds: 0,
      }
    );
  }

  /**
   * Get the series featured video (next video to watch) for a pilgrimage.
   * Returns the appropriate video based on user's watch progress in the series.
   *
   * API endpoint: GET /pilgrimages/{pilgrimageId}/next-video
   */
  async getSeriesFeaturedVideo(
    pilgrimageId: number | string,
    userAuth?: UserAuthParams,
  ): Promise<SeriesFeaturedVideoResponseDto | null> {
    const response = await this.get<SeriesFeaturedVideoResponseDto>(
      `/pilgrimages/${pilgrimageId}/next-video`,
      {},
      userAuth,
    );
    return response.data || null;
  }
}
