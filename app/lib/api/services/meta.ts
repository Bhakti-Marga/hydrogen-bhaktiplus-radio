import { ApiClient } from "../client";
import { ContentLanguagesResponseDto, ContentNewStatusResponseDto } from "../types";

export class MetaService extends ApiClient {
  /**
   * Get content language availability data for the Content Availability page.
   * Returns summary statistics and per-item language details for all content types.
   */
  async getContentLanguages(): Promise<ContentLanguagesResponseDto> {
    const response = await this.get<ContentLanguagesResponseDto>(
      "/meta/content-languages"
    );
    return response.data;
  }

  /**
   * Get new/upcoming content status for each content type.
   * Used to show NEW badge in the header navigation.
   */
  async getContentNewStatus(): Promise<ContentNewStatusResponseDto> {
    const response = await this.get<ContentNewStatusResponseDto>(
      "/meta/content/new"
    );
    return response.data;
  }
}

