import { ApiConfig, ApiError, ApiResponse, BaseQueryParams, UserAuthParams } from "./types";

export class ApiClient {
  protected config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private getHeaders(): HeadersInit {
    return {
      "x-api-key": this.config.apiKey,
      "Content-Type": "application/json",
    };
  }

  private buildUrl(path: string, params?: Record<string, any>, userAuth?: UserAuthParams): string {
    const url = new URL(path, this.config.baseUrl);

    // Add default params
    const defaultParams: BaseQueryParams & { _includeUnpublishedContent?: boolean } = {
      api_version: this.config.apiVersion,
      locale: this.config.locale,
      country_code: this.config.countryCode,
      region_id: this.config.regionId,
    };

    // Add unpublished content flag if enabled (for staging previews)
    if (this.config.includeUnpublishedContent) {
      defaultParams._includeUnpublishedContent = true;
    }

    // Use email for user identification
    if (userAuth?.email) {
      console.log('[Media API] Adding email to query params:', {
        email: userAuth.email,
      });
      defaultParams.email = userAuth.email;
    }

    if (userAuth?.subscriptionTier) {
      defaultParams.subscriptionTier = userAuth.subscriptionTier;
    }

    // Merge default params with provided params
    const queryParams = { ...defaultParams, ...params };

    // Add all params to URL
    // Note: URLSearchParams.append() handles URL encoding automatically
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Handle array parameters (like subscriptionTier filter)
        if (Array.isArray(value)) {
          value.forEach((item) => {
            url.searchParams.append(key, item.toString());
          });
        } else {
          url.searchParams.append(key, value.toString());
        }
      }
    });

    return url.toString();
  }

  protected async request<T>(
    path: string,
    options: RequestInit = {},
    params?: Record<string, any>,
    userAuth?: UserAuthParams,
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const method = options.method || 'GET';

    try {
      const url = this.buildUrl(path, params, userAuth);

      // TODO: this can potentially leak shp_customer_id. remove before goign to prod
      // or figureo ut PII scrubbing strategy
      console.log(`[Media API] ${method} ${url} - Starting...`);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        // Try to get error response body
        // Read as text first to avoid creating unused stream branches from clone()
        const text = await response.text();
        let errorBody;
        try {
          errorBody = JSON.parse(text);
        } catch {
          errorBody = text;
        }

        console.error(`[Media API] ${method} ${path} - Failed (${response.status}) - ${duration}ms`);
        console.error(`[Media API] Error response:`, JSON.stringify(errorBody, null, 2));

        const error: ApiError = {
          message: response.statusText,
          status: response.status,
        };
        return { data: null as unknown as T, error };
      }

      const data = (await response.json()) as T;
      console.log(`[Media API] ${method} ${path} - Success (${response.status}) - ${duration}ms`);
      console.log('[Media API] Response data:', data);

      return { data };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`[Media API] ${method} ${path} - Error - ${duration}ms`, error);

      const apiError: ApiError = {
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: 500,
      };
      return { data: null as unknown as T, error: apiError };
    }
  }

  protected async get<T>(
    path: string,
    params?: Record<string, any>,
    userAuth?: UserAuthParams,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "GET" }, params, userAuth);
  }

  protected async post<T>(
    path: string,
    body?: any,
    params?: Record<string, any>,
    userAuth?: UserAuthParams,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      path,
      {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      },
      params,
      userAuth,
    );
  }

  protected async put<T>(
    path: string,
    body: any,
    params?: Record<string, any>,
    userAuth?: UserAuthParams,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      path,
      { method: "PUT", body: JSON.stringify(body) },
      params,
      userAuth,
    );
  }

  protected async delete<T>(
    path: string,
    params?: Record<string, any>,
    userAuth?: UserAuthParams,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: "DELETE" }, params, userAuth);
  }
}
