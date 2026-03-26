/**
 * Platform types
 * ------------------------------------------------------------
 * Types that are used in the platform, they currently come
 * directly from API DTOs, but this is setup as an abstraction
 * layer in case we need to change the API or the data model.
 *
 * App should never access API types directly, only use these types.
 */

import {
  CategoryDto,
  LocationDto,
  SatsangDto,
  VideoDto,
  SearchQueryResponseDto,
  WatchHistoryResponseDto,
  SearchHistoryResponseDto,
  CommentaryDto,
  LiveDto,
  PilgrimageDto,
  TalkDto,
  SubCategoryDto,
  SearchHistoryItemDto,
  SearchResultDto,
  SearchTrendingItemDto,
  ContentDto,
  VideoPartDto,
  SeriesSummaryResponseDto,
  VideoGroupDto,
} from "../api/types";

export type Content = ContentDto;

export type SatsangCategory = CategoryDto;

export type SatsangSubcategory = SubCategoryDto;

export type Satsang = SatsangDto;

export type Commentary = CommentaryDto;

export type Pilgrimage = PilgrimageDto;

export type Talk = TalkDto;

export type Live = LiveDto;

export type Location = LocationDto;

export type SearchResult = SearchQueryResponseDto;

export type SearchResultItem = SearchResultDto;

export type SearchHistory = SearchHistoryResponseDto;

export type WatchHistoryEntry = WatchHistoryResponseDto;

export type SearchHistoryItem = SearchHistoryItemDto;

export type SearchTrendingItem = SearchTrendingItemDto;

export type VideoPart = VideoPartDto;

export type SeriesSummary = SeriesSummaryResponseDto;

export type Video = VideoDto;

export type VideoGroup = VideoGroupDto;

export type ContentType =
  | "pilgrimage"
  | "commentary"
  | "satsang"
  | "talk"
  | "live"
  | "video"
  | "livestream";

export type ContentTypeId = 1 | 2 | 3 | 5 | 6;


