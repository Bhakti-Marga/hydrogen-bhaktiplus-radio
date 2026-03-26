import { ApiClient } from "../client";
import {
  WatchHistoryResponseDto,
  WatchHistoryUpsertRequest,
  WatchHistoryEntryDto,
  VideoProgressResponseDto,
  VideoProgressEntryDto,
  SubscriptionInfo,
  UserAuthParams,
  PurchasesResponseDto,
  UserPreferencesDto,
  UserPreferencesResponseDto,
  UserPreferencesUpdateResponseDto,
} from "../types";

export class UserService extends ApiClient {
  async getWatchHistory(userAuth: UserAuthParams): Promise<WatchHistoryResponseDto> {
    const response = await this.get<WatchHistoryResponseDto>(
      "/user/watch-history",
      {
        status: "completed",
      },
      userAuth,
    );
    return { watchHistory: response.data?.watchHistory ?? [] };
  }

  async getInProgressVideos(userAuth: UserAuthParams): Promise<{
    inProgressVideos: WatchHistoryEntryDto[];
  }> {
    const response = await this.get<WatchHistoryResponseDto>(
      "/user/watch-history",
      {
        status: "in-progress",
      },
      userAuth,
    );
    return { inProgressVideos: response.data?.watchHistory ?? [] };
  }

  /**
   * Get video progress entries for the user.
   * Uses the condensed /user/video-progress endpoint instead of /user/watch-history.
   *
   * @param userAuth - User identification
   * @param videoIds - Optional list of video IDs to filter by. If omitted, returns all progress entries.
   */
  async getVideoProgress(
    userAuth: UserAuthParams,
    videoIds?: number[],
  ): Promise<VideoProgressEntryDto[]> {
    const params: Record<string, any> = {};
    if (videoIds && videoIds.length > 0) {
      params.videoIds = videoIds;
    }
    const response = await this.get<VideoProgressResponseDto>(
      "/user/video-progress",
      params,
      userAuth,
    );
    return response.data?.progress ?? [];
  }

  async updateWatchHistory(data: WatchHistoryUpsertRequest, userAuth: UserAuthParams): Promise<void> {
    await this.post("/user/watch-history", data, {}, userAuth);
  }

  async clearWatchHistory(userAuth: UserAuthParams): Promise<void> {
    await this.delete("/user/watch-history", {}, userAuth);
  }

  async getVideoStatuses(userAuth: UserAuthParams): Promise<{ videoStatuses: WatchHistoryEntryDto[] }> {
    const response = await this.get<WatchHistoryEntryDto[]>("/videos/statuses", {}, userAuth);
    return { videoStatuses: response.data ?? [] };
  }

  async getSubscriptionTier(
    userAuth: UserAuthParams,
  ): Promise<{ subscriptionTier: string }> {
    try {
      const response = await this.get<{ subscriptionTier: string }>(
        "/user/subscription-tier",
        {},
        userAuth,
      );

      if (response?.error?.status === 404) {
        return { subscriptionTier: "unsubscribed" };
      } else if (response?.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      return { subscriptionTier: "unsubscribed" };
    }
  }

  async getUserProfile(
    userAuth: UserAuthParams,
  ): Promise<SubscriptionInfo> {
    console.log('🟡 [UserService.getUserProfile] Called with:', {
      email: userAuth.email,
      subscriptionTier: userAuth.subscriptionTier,
    });

    const response = await this.get<SubscriptionInfo>(
      "/user/profile",
      {},
      userAuth,
    );

    console.log('🟡 [UserService.getUserProfile] Raw response:', {
      data: response.data,
      error: response.error,
    });

    // Handle null as unsubscribed for core fields, pass through new fields as-is
    const result: SubscriptionInfo = {
      // Core fields with defaults
      subscriptionTier: response.data?.subscriptionTier || "unsubscribed",
      subscriptionBillingPeriod: response.data?.subscriptionBillingPeriod || null,
      ppv: response.data?.ppv || [],
      videosInProgressCount: response.data?.videosInProgressCount || 0,
      // New fields from 2025-12-16 backend update - pass through as-is (nullable)
      userId: response.data?.userId,
      email: response.data?.email,
      preferredLanguage: response.data?.preferredLanguage,
      preferredAudioLanguage: response.data?.preferredAudioLanguage,
      preferredSubtitleLanguage: response.data?.preferredSubtitleLanguage,
      isPayingCustomer: response.data?.isPayingCustomer,
      // Backend returns shopifyCustomerIdActive, map to shopifyCustomerId for frontend
      shopifyCustomerId: (response.data as any)?.shopifyCustomerIdActive ?? response.data?.shopifyCustomerId,
      firstMembershipDateStart: response.data?.firstMembershipDateStart,
      lastMembershipDateExpired: response.data?.lastMembershipDateExpired,
      lastLoginDate: response.data?.lastLoginDate,
      shopifySubscriptionContractId: response.data?.shopifySubscriptionContractId,
      appstleMembershipId: response.data?.appstleMembershipId,
      // Region fields from 2025-12-18 backend update
      stampedRegionId: response.data?.stampedRegionId,
      stampedRegionName: response.data?.stampedRegionName,
      stampedShopId: response.data?.stampedShopId,
      stampedCountryCode: response.data?.stampedCountryCode,
      stampedCountryCodeSource: response.data?.stampedCountryCodeSource,
      stampedCountryCodeUpdatedAt: response.data?.stampedCountryCodeUpdatedAt,
      userSelectCountryCode: response.data?.userSelectCountryCode,
      userSelectCountryCodeUpdatedAt: response.data?.userSelectCountryCodeUpdatedAt,
    };

    console.log('🟡 [UserService.getUserProfile] Returning:', result);

    return result;
  }

  /**
     * Persist user's country/region selection.
     * Called when a logged-in user selects a country from the CountrySelector.
     */
  async selectRegion(
    email: string,
    countryCode: string,
  ): Promise<{
    status: string;
    userId: number;
    userSelectCountryCode: string;
    userSelectCountryCodeUpdatedAt: string;
  } | null> {
    console.log('🌍 [UserService.selectRegion] Called with:', { email, countryCode });

    const response = await this.post<{
      status: string;
      userId: number;
      userSelectCountryCode: string;
      userSelectCountryCodeUpdatedAt: string;
    }>(
      "/user/select-region",
      { email, countryCode },
      {},
    );

    if (response.error) {
      console.error('🌍 [UserService.selectRegion] Error:', response.error);
      return null;
    }

    console.log('🌍 [UserService.selectRegion] Success:', response.data);
    return response.data;
  }

  async getPurchases(
    userAuth: UserAuthParams,
  ): Promise<PurchasesResponseDto> {
    const response = await this.get<PurchasesResponseDto>(
      "/user/purchases",
      {},
      userAuth,
    );
    return response.data ?? { purchases: [] };
  }

  /**
   * Get user preferences from the API.
   * Returns preferences for language, audio, subtitles, player settings, and notifications.
   */
  async getPreferences(
    userAuth: UserAuthParams,
  ): Promise<UserPreferencesResponseDto | null> {
    console.log('⚙️ [UserService.getPreferences] Called with:', {
      email: userAuth.email,
      userId: userAuth.userId,
    });

    const response = await this.get<UserPreferencesResponseDto>(
      "/user/preferences",
      {},
      userAuth,
    );

    if (response.error) {
      console.error('⚙️ [UserService.getPreferences] Error:', response.error);
      return null;
    }

    console.log('⚙️ [UserService.getPreferences] Success:', response.data);
    return response.data;
  }

  /**
   * Update user preferences via the API.
   * Only sends the fields that are being updated.
   */
  async updatePreferences(
    userAuth: UserAuthParams,
    preferences: Partial<UserPreferencesDto>,
  ): Promise<UserPreferencesUpdateResponseDto | null> {
    console.log('⚙️ [UserService.updatePreferences] Called with:', {
      email: userAuth.email,
      userId: userAuth.userId,
      preferences,
    });

    const response = await this.put<UserPreferencesUpdateResponseDto>(
      "/user/preferences",
      preferences,
      {},
      userAuth,
    );

    if (response.error) {
      console.error('⚙️ [UserService.updatePreferences] Error:', response.error);
      return null;
    }

    console.log('⚙️ [UserService.updatePreferences] Success:', response.data);
    return response.data;
  }
}
