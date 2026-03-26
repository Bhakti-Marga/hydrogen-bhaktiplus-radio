import { Talk } from "~/lib/types";
import { ApiClient } from "../client";
import {
  TalkDto,
  TalkFeaturedResponseDto,
  TalksListResponseDto,
  TalksLatestReleasesResponseDto,
  TalkSubCategoryGroupsResponseDto,
  PaginationParams,
  FilterParams,
} from "../types";
import { getProcessedParams } from "../utils";

export class TalksService extends ApiClient {
  async getFeatured(): Promise<{ featured: Talk }> {
    const response = await this.get<TalkFeaturedResponseDto>("/talks/featured");
    return { featured: response.data?.featured ?? null };
  }

  async getList(
    params?: PaginationParams & FilterParams,
  ): Promise<{ talks: Talk[]; total: number; offset: number; limit: number }> {
    const processedParams = getProcessedParams(params);

    const response = await this.get<TalksListResponseDto>(
      "/talks",
      processedParams,
    );

    return {
      talks: response.data?.talks ?? [],
      total: response.data?.total ?? 0,
      offset: response.data?.offset ?? 0,
      limit: response.data?.limit ?? 0,
    };
  }

  async getLatestReleases(
    params?: PaginationParams & FilterParams,
  ): Promise<{ latestReleases: Talk[] }> {
    const processedParams = getProcessedParams(params);

    const response = await this.get<TalksLatestReleasesResponseDto>(
      "/talks/latest-releases",
      processedParams,
    );
    return { latestReleases: response.data?.latestReleases ?? [] };
  }

  async getByCategory(
    categoryId: number,
    params?: PaginationParams & FilterParams,
  ): Promise<{ subcategories: any[] }> {
    const response = await this.get<TalkSubCategoryGroupsResponseDto>(
      `/talks/by-category/${categoryId}`,
      params,
    );
    return { subcategories: response.data?.subcategories ?? [] };
  }

  async getById(id: string): Promise<{ talk: Talk }> {
    const response = await this.get<TalkDto>(`/talks/${id}`);
    return { talk: response.data };
  }

  async getBySlug(slug: string): Promise<{ talk: Talk | null }> {
    const response = await this.get<TalkDto>(`/talks/slug/${slug}`);
    
    if (!response.data) {
      // Only return null for 404s, throw for actual server errors
      if (response.error?.status === 404) {
        return { talk: null };
      }
      throw new Error(response.error?.message || "Failed to fetch talk");
    }
    
    return { talk: response.data };
  }
}
