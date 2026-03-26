import { Commentary, VideoGroup } from "~/lib/types";
import { ApiClient } from "../client";
import {
  CommentaryDto,
  CommentariesLatestReleasesResponseDto,
  PaginationParams,
  FilterParams,
  SerieVideosResponseDto,
  SeriesSummaryResponseDto,
  CommentarySlugAwareResponse,
  SeriesFeaturedVideoResponseDto,
  UserAuthParams,
} from "../types";
import { getProcessedParams } from "../utils";

export class CommentariesService extends ApiClient {
  async getFeatured(): Promise<{ featured: Commentary }> {
    const response = await this.get<CommentaryDto>("/commentaries/featured");
    return { featured: response.data };
  }

  async getList(
    params?: PaginationParams & FilterParams,
  ): Promise<{ commentaries: Commentary[] }> {
    const processedParams = getProcessedParams(params);

    const response = await this.get<{ commentaries: CommentaryDto[] }>(
      "/commentaries",
      processedParams,
    );
    return { commentaries: response.data?.commentaries ?? [] };
  }

  async getLatestReleases(
    params?: PaginationParams & FilterParams,
  ): Promise<{ latestReleases: Commentary[] }> {
    const response = await this.get<CommentariesLatestReleasesResponseDto>(
      "/commentaries/latest-releases",
      params,
    );
    return { latestReleases: response.data?.latestReleases ?? [] };
  }

  async getById(id: string): Promise<{ commentary: Commentary }> {
    const response = await this.get<CommentaryDto>(`/commentaries/${id}`);
    return { commentary: response.data };
  }

  async getBySlug(slug: string): Promise<{ commentary: Commentary | null; canonicalSlug: string | null }> {
    const response = await this.get<CommentarySlugAwareResponse>(
      `/commentaries/by-slug/${slug}`,
    );

    if (!response.data) {
      // Only return null for 404s, throw for actual server errors
      if (response.error?.status === 404) {
        return { commentary: null, canonicalSlug: null };
      }
      throw new Error(response.error?.message || "Failed to fetch commentary");
    }

    return {
      commentary: response.data.data,
      canonicalSlug: response.data.canonicalSlug
    };
  }

  async getVideos(
    commentaryId: number | string,
  ): Promise<{ videoGroups: VideoGroup[] }> {
    const response = await this.get<{ videoGroups: VideoGroup[] }>(
      `/commentaries/${commentaryId}/videos`,
    );
    return response.data || { videoGroups: null };
  }

  async getSeriesSummary(
    commentaryId: number | string,
  ): Promise<SeriesSummaryResponseDto> {
    const response = await this.get<SeriesSummaryResponseDto>(
      `/commentaries/${commentaryId}/series-summary`,
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
   * Get the series featured video (next video to watch) for a commentary.
   * Returns the appropriate video based on user's watch progress in the series.
   *
   * API endpoint: GET /commentaries/{commentaryId}/next-video
   */
  async getSeriesFeaturedVideo(
    commentaryId: number | string,
    userAuth?: UserAuthParams,
  ): Promise<SeriesFeaturedVideoResponseDto | null> {
    const response = await this.get<SeriesFeaturedVideoResponseDto>(
      `/commentaries/${commentaryId}/next-video`,
      {},
      userAuth,
    );
    return response.data || null;
  }
}
