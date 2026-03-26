// /meta/locales-supported

import { ApiClient } from "../client";
import { LocalesSupportedResponseDto } from "../types";

export class LocaleService extends ApiClient {
  async getLocalesSupported(): Promise<LocalesSupportedResponseDto> {
    const response = await this.get<LocalesSupportedResponseDto>(
      "/meta/locales-supported",
    );

    if (!response.data || response.error) {
      console.error(
        "[LocaleService] Failed to fetch supported locales:",
        response.error,
      );
      throw new Error(
        response.error?.message || "Failed to fetch supported locales from Media API",
      );
    }

    return response.data;
  }

  async getActive() {
    const response = await this.get("/meta/active-locale");
    return response.data;
  }

  async setActive(locale: string) {
    /* const response = await this.post("/meta/active-locale", { locale });
        return response.data; */
  }
}
