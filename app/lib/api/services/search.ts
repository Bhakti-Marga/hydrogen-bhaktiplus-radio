import { ApiClient } from "../client";
import {
  SearchQueryResponseDto,
  SearchHistoryResponseDto,
  SearchTrendingResponseDto,
  UserAuthParams,
} from "../types";

export class SearchService extends ApiClient {
  async search(query: string, userAuth?: UserAuthParams): Promise<SearchQueryResponseDto> {
    const response = await this.post<SearchQueryResponseDto>(
      "/search/query",
      null,
      {
        q: query,
      },
      userAuth,
    );
    return response.data;
  }

  async getHistory(userAuth: UserAuthParams): Promise<SearchHistoryResponseDto> {
    const response = await this.get<SearchHistoryResponseDto>(
      "/search/history",
      {},
      userAuth,
    );

    return response.data;
  }

  async clearHistory(userAuth: UserAuthParams): Promise<void> {
    const response = await this.delete<void>("/search/history", {}, userAuth);
    return response.data;
  }

  async getTrendingSearches(): Promise<SearchTrendingResponseDto> {
    const response = await this.get<SearchTrendingResponseDto>(
      "/search/trending",
    );
    return response.data;
  }
}
