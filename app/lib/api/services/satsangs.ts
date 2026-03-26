import { ApiClient } from "../client";
import { Satsang, SatsangCategory, SatsangSubcategory } from "~/lib/types";
import {
  SatsangFeaturedResponseDto,
  SatsangsListResponseDto,
  SatsangsLatestReleasesResponseDto,
  WeekSatsangsResponseDto,
  DailySatsangDto,
  DailySatsangResponseDto,
  CategoriesResponseDto,
  SubCategoriesResponseDto,
  SatsangDto,
  FilterParams,
  PaginationParams,
} from "../types";
import { getProcessedParams } from "../utils";

export class SatsangsService extends ApiClient {
  async getFeatured(): Promise<{ featured: Satsang }> {
    const response = await this.get<SatsangFeaturedResponseDto>(
      "/satsangs/featured",
    );
    return { featured: response.data?.featured ?? null };
  }

  async getList(
    params?: PaginationParams & FilterParams,
  ): Promise<{ satsangs: Satsang[]; total: number; offset: number; limit: number }> {
    const processedParams = getProcessedParams(params);

    const response = await this.get<SatsangsListResponseDto>(
      "/satsangs",
      processedParams,
    );

    return {
      satsangs: response.data?.satsangs ?? [],
      total: response.data?.total ?? 0,
      offset: response.data?.offset ?? 0,
      limit: response.data?.limit ?? 0,
    };
  }

  async getLatestReleases(
    params?: PaginationParams & FilterParams,
  ): Promise<{ latestReleases: Satsang[] }> {
    const response = await this.get<SatsangsLatestReleasesResponseDto>(
      "/satsangs/latest-releases",
      params,
    );

    return { latestReleases: response.data?.latestReleases ?? [] };
  }

  async getCategories(): Promise<{ categories: SatsangCategory[] }> {
    const response = await this.get<CategoriesResponseDto>(
      "/meta/satsangs/categories",
    );
    return { categories: response.data?.categories ?? [] };
  }

  async getSubcategories(
    categoryId: number,
  ): Promise<{ subcategories: SatsangSubcategory[]; otherTopicIds: number[] }> {
    const response = await this.get<SubCategoriesResponseDto>(
      `/meta/satsangs/categories/${categoryId}/subcategories`,
    );
    return {
      subcategories: response.data?.subcategories ?? [],
      otherTopicIds: response.data?.otherTopicIds ?? [],
    };
  }

  /**
   * Gets daily satsang assignments for the week containing the provided date.
   * @param date - The date in YYYY-MM-DD format (returns satsangs for the week containing this date)
   */
  async getWeekly(
    date: string,
  ): Promise<{ dailySatsangs: DailySatsangDto[]; total: number }> {
    const response = await this.get<WeekSatsangsResponseDto>(
      `/satsangs/week/${date}`,
    );
    return {
      dailySatsangs: response.data?.dailySatsangs ?? [],
      total: response.data?.total ?? 0,
    };
  }

  /**
   * Gets the daily satsang for a specific date.
   * @param date - The date in YYYY-MM-DD format (UTC)
   */
  async getDaily(
    date: string,
  ): Promise<{ satsang: SatsangDto | null }> {
    const response = await this.get<DailySatsangResponseDto>(
      `/satsangs/daily/${date}`,
    );
    return {
      satsang: response.data?.satsang ?? null,
    };
  }
}
