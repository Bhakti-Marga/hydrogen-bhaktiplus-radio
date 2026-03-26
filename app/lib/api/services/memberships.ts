import { ApiClient } from "../client";
import { MembershipListResponseDto } from "../types";

export class MembershipsService extends ApiClient {
  /**
   * Get all available membership plans with pricing information.
   * Pricing is localized based on the country_code configured in ApiConfig.
   */
  async getMemberships(): Promise<MembershipListResponseDto> {
    const response = await this.get<MembershipListResponseDto>("/memberships");

    return {
      memberships: response.data?.memberships ?? [],
      currencyCode: response.data?.currencyCode ?? "EUR",
      regionId: response.data?.regionId ?? 1,
    };
  }
}
