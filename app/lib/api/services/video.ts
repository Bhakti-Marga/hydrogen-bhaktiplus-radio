import { ApiClient } from "../client";
import { VideoStandaloneDto, WatchNextResponseDto, UserAuthParams } from "../types";

export class VideoService extends ApiClient {
  async getById(videoId: number | string): Promise<VideoStandaloneDto> {
    const response = await this.get<VideoStandaloneDto>(`/video/${videoId}`);
    return response.data;
  }

  async getWatchNext(
    videoId: number | string,
    userAuth?: UserAuthParams,
    limit: number = 8
  ): Promise<WatchNextResponseDto> {
    const response = await this.get<WatchNextResponseDto>(
      `/video/${videoId}/watch-next`,
      { limit },
      userAuth
    );
    return response.data;
  }
}
