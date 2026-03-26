# Endpoint Summary

## BM_MediaPlatformAPI

- `GET` `/test-otel`

## Commentaries

- `GET` `/commentaries/featured`
- `GET` `/commentaries/latest-releases`
- `GET` `/commentaries`
- `GET` `/commentaries/{commentaryId}/videos`
- `GET` `/commentaries/{commentaryId}/series-summary`

## Lives

- `GET` `/lives/featured`
- `GET` `/lives`
- `GET` `/lives/latest-releases`

## Meta

- `GET` `/meta/satsangs/categories`
- `GET` `/meta/satsangs/categories/{categoryId}/subcategories`
- `GET` `/meta/locales-supported`

## Pilgrimages

- `GET` `/pilgrimages/featured`
- `GET` `/pilgrimages`
- `GET` `/pilgrimages/latest-releases`
- `GET` `/pilgrimages/{pilgrimageId}/videos`
- `GET` `/pilgrimages/{pilgrimageId}/series-summary`

## Player

- `GET` `/player/{videoId}`

## Satsangs

- `GET` `/satsangs/featured`
- `GET` `/satsangs`
- `GET` `/satsangs/latest-releases`
- `GET` `/satsangs/by-subcategory-for/{categoryId}`

## Search

- `POST` `/search/query`
- `GET` `/search/history`
- `DELETE` `/search/history`
- `GET` `/search/trending`

## Talks

- `GET` `/talks/featured`
- `GET` `/talks/latest-releases`
- `GET` `/talks`
- `GET` `/talks/by-category/{categoryId}`

## User

- `GET` `/user/watch-history`
- `DELETE` `/user/watch-history`
- `POST` `/user/watch-history`
- `GET` `/user/subscription-info`

# Endpoint Details

## BM_MediaPlatformAPI

### `GET` `/test-otel`

_No parameters._

**Responses:**

- **200**: OK

## Commentaries

### `GET` `/commentaries/featured`

**Parameters:**

- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → FeaturedSerieResponseDto \ OK
  Example:

```json
{
  "featured": {
    "contentId": 123,
    "title": "string",
    "thumbnailUrl": "string",
    "thumbnailUrlVertical": "string",
    "shopifyProductId": "string",
    "shopifyVariantId": "string",
    "subscriptionTiers": ["string"],
    "location": {
      "id": "<value>",
      "countryCode": "<value>",
      "country": "<value>",
      "city": "<value>",
      "location": "<value>"
    },
    "description": "string",
    "isLiveContent": true,
    "isUpcoming": true,
    "videoCount": 123,
    "startDate": "2023-01-01T00:00:00Z",
    "endDate": "2023-01-01T00:00:00Z",
    "totalVideoDurationSeconds": 123
  }
}
```

### `GET` `/commentaries/latest-releases`

**Parameters:**

- `limit` (query, integer (int32), optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → LatestReleasesContentSeriesResponseDto \ OK
  Example:

```json
{
  "latestReleases": [
    {
      "contentId": 123,
      "title": "string",
      "thumbnailUrl": "string",
      "thumbnailUrlVertical": "string",
      "shopifyProductId": "string",
      "shopifyVariantId": "string",
      "subscriptionTiers": ["<value>"],
      "location": "<value>",
      "description": "string",
      "isLiveContent": true,
      "isUpcoming": true,
      "videoCount": 123,
      "startDate": "2023-01-01T00:00:00Z",
      "endDate": "2023-01-01T00:00:00Z",
      "totalVideoDurationSeconds": 123
    }
  ]
}
```

### `GET` `/commentaries`

**Parameters:**

- `limit` (query, integer (int32), optional):
- `sortBy` (query, string, optional):
- `desc` (query, boolean, optional):
- `Filters.categoryId` (query, integer (int64), optional):
- `Filters.subscriptionTier` (query, string[], optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → CommentariesListResponseDto \ OK
  Example:

```json
{
  "commentaries": [
    {
      "contentId": 123,
      "title": "string",
      "thumbnailUrl": "string",
      "thumbnailUrlVertical": "string",
      "shopifyProductId": "string",
      "shopifyVariantId": "string",
      "subscriptionTiers": ["<value>"],
      "location": "<value>",
      "description": "string",
      "isLiveContent": true,
      "isUpcoming": true,
      "videoCount": 123,
      "startDate": "2023-01-01T00:00:00Z",
      "endDate": "2023-01-01T00:00:00Z",
      "totalVideoDurationSeconds": 123
    }
  ]
}
```

### `GET` `/commentaries/{commentaryId}/videos`

**Parameters:**

- `commentaryId` (path, integer (int64), required):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → SerieVideosResponseDto \ OK
  Example:

```json
{
  "videoGroups": [
    {
      "id": 123,
      "order": 123,
      "name": "string",
      "parts": ["<value>"]
    }
  ]
}
```

### `GET` `/commentaries/{commentaryId}/series-summary`

**Parameters:**

- `commentaryId` (path, integer (int64), required):

**Responses:**

- **200**: application/json → SeriesSummaryResponseDto \ OK
  Example:

```json
{
  "groupName": "string",
  "groupNamePlural": "string",
  "groupCount": 123,
  "videoCount": 123,
  "totalVideoDurationSeconds": 123,
  "startDate": "2023-01-01T00:00:00Z",
  "endDate": "2023-01-01T00:00:00Z",
  "location": "string"
}
```

## Lives

### `GET` `/lives/featured`

**Parameters:**

- `country_code` (query, string, optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')

**Responses:**

- **200**: application/json → ContentSingleFeaturedResponseDto \ OK
  Example:

```json
{
  "featured": {
    "contentId": 123,
    "title": "string",
    "bannerImageUrl": "string",
    "thumbnailUrl": "string",
    "thumbnailUrlVertical": "string",
    "location": {
      "id": "<value>",
      "countryCode": "<value>",
      "country": "<value>",
      "city": "<value>",
      "location": "<value>"
    },
    "description": "string",
    "isLiveContent": true,
    "publishedAt": "2023-01-01T00:00:00Z",
    "startDate": "2023-01-01T00:00:00Z",
    "endDate": "2023-01-01T00:00:00Z",
    "subscriptionTiers": ["string"],
    "categories": ["<value>"],
    "video": {
      "videoId": "<value>",
      "title": "<value>",
      "description": "<value>",
      "durationSeconds": "<value>",
      "chapters": "<value>"
    }
  }
}
```

### `GET` `/lives`

**Parameters:**

- `limit` (query, integer (int32), optional):
- `sortBy` (query, string, optional):
- `desc` (query, boolean, optional):
- `Filters.categoryId` (query, integer (int64), optional):
- `Filters.subscriptionTier` (query, string[], optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → LiveListResponseDto \ OK
  Example:

```json
{
  "lives": [
    {
      "contentId": 123,
      "title": "string",
      "bannerImageUrl": "string",
      "thumbnailUrl": "string",
      "thumbnailUrlVertical": "string",
      "location": "<value>",
      "description": "string",
      "isLiveContent": true,
      "publishedAt": "2023-01-01T00:00:00Z",
      "startDate": "2023-01-01T00:00:00Z",
      "endDate": "2023-01-01T00:00:00Z",
      "subscriptionTiers": ["<value>"],
      "categories": ["<value>"],
      "video": "<value>"
    }
  ]
}
```

### `GET` `/lives/latest-releases`

**Parameters:**

- `limit` (query, integer (int32), optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → LatestReleasesContentSingleResponseDto \ OK
  Example:

```json
{
  "latestReleases": [
    {
      "contentId": 123,
      "title": "string",
      "bannerImageUrl": "string",
      "thumbnailUrl": "string",
      "thumbnailUrlVertical": "string",
      "location": "<value>",
      "description": "string",
      "isLiveContent": true,
      "publishedAt": "2023-01-01T00:00:00Z",
      "startDate": "2023-01-01T00:00:00Z",
      "endDate": "2023-01-01T00:00:00Z",
      "subscriptionTiers": ["<value>"],
      "categories": ["<value>"],
      "video": "<value>"
    }
  ]
}
```

## Meta

### `GET` `/meta/satsangs/categories`

**Parameters:**

- `country_code` (query, string, optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')

**Responses:**

- **200**: application/json → CategoriesResponseDto \ OK
  Example:

```json
{
  "categories": [
    {
      "id": 123,
      "slug": "string",
      "name": "string",
      "description": "string",
      "thumbnailUrl": "string",
      "videoCount": 123
    }
  ]
}
```

### `GET` `/meta/satsangs/categories/{categoryId}/subcategories`

**Parameters:**

- `categoryId` (path, integer (int64), required):

**Responses:**

- **200**: application/json → SubCategoriesResponseDto \ OK
  Example:

```json
{
  "subcategories": [
    {
      "id": 123,
      "name": "string",
      "count": 123
    }
  ]
}
```

### `GET` `/meta/locales-supported`

_No parameters._

**Responses:**

- **200**: application/json → LocalesResponseDto \ OK
  Example:

```json
{
  "locales": [
    {
      "localeCode": "string",
      "name": "string"
    }
  ]
}
```

## Pilgrimages

### `GET` `/pilgrimages/featured`

**Parameters:**

- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → FeaturedSerieResponseDto \ OK
  Example:

```json
{
  "featured": {
    "contentId": 123,
    "title": "string",
    "thumbnailUrl": "string",
    "thumbnailUrlVertical": "string",
    "shopifyProductId": "string",
    "shopifyVariantId": "string",
    "subscriptionTiers": ["string"],
    "location": {
      "id": "<value>",
      "countryCode": "<value>",
      "country": "<value>",
      "city": "<value>",
      "location": "<value>"
    },
    "description": "string",
    "isLiveContent": true,
    "isUpcoming": true,
    "videoCount": 123,
    "startDate": "2023-01-01T00:00:00Z",
    "endDate": "2023-01-01T00:00:00Z",
    "totalVideoDurationSeconds": 123
  }
}
```

### `GET` `/pilgrimages`

**Parameters:**

- `limit` (query, integer (int32), optional):
- `sortBy` (query, string, optional):
- `desc` (query, boolean, optional):
- `Filters.categoryId` (query, integer (int64), optional):
- `Filters.subscriptionTier` (query, string[], optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → PilgrimageListResponseDto \ OK
  Example:

```json
{
  "pilgrimages": [
    {
      "contentId": 123,
      "title": "string",
      "thumbnailUrl": "string",
      "thumbnailUrlVertical": "string",
      "shopifyProductId": "string",
      "shopifyVariantId": "string",
      "subscriptionTiers": ["<value>"],
      "location": "<value>",
      "description": "string",
      "isLiveContent": true,
      "isUpcoming": true,
      "videoCount": 123,
      "startDate": "2023-01-01T00:00:00Z",
      "endDate": "2023-01-01T00:00:00Z",
      "totalVideoDurationSeconds": 123
    }
  ]
}
```

### `GET` `/pilgrimages/latest-releases`

**Parameters:**

- `limit` (query, integer (int32), optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → LatestReleasesContentSeriesResponseDto \ OK
  Example:

```json
{
  "latestReleases": [
    {
      "contentId": 123,
      "title": "string",
      "thumbnailUrl": "string",
      "thumbnailUrlVertical": "string",
      "shopifyProductId": "string",
      "shopifyVariantId": "string",
      "subscriptionTiers": ["<value>"],
      "location": "<value>",
      "description": "string",
      "isLiveContent": true,
      "isUpcoming": true,
      "videoCount": 123,
      "startDate": "2023-01-01T00:00:00Z",
      "endDate": "2023-01-01T00:00:00Z",
      "totalVideoDurationSeconds": 123
    }
  ]
}
```

### `GET` `/pilgrimages/{pilgrimageId}/videos`

**Parameters:**

- `pilgrimageId` (path, integer (int64), required):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → SerieVideosResponseDto \ OK
  Example:

```json
{
  "videoGroups": [
    {
      "id": 123,
      "order": 123,
      "name": "string",
      "parts": ["<value>"]
    }
  ]
}
```

### `GET` `/pilgrimages/{pilgrimageId}/series-summary`

**Parameters:**

- `pilgrimageId` (path, integer (int64), required):

**Responses:**

- **200**: application/json → SeriesSummaryResponseDto \ OK
  Example:

```json
{
  "groupName": "string",
  "groupNamePlural": "string",
  "groupCount": 123,
  "videoCount": 123,
  "totalVideoDurationSeconds": 123,
  "startDate": "2023-01-01T00:00:00Z",
  "endDate": "2023-01-01T00:00:00Z",
  "location": "string"
}
```

## Player

### `GET` `/player/{videoId}`

**Parameters:**

- `videoId` (path, integer (int64), required):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → PlayerVideoDto \ OK
  Example:

```json
{
  "id": 123,
  "mamId": 123,
  "title": "string",
  "bannerUrl": "string",
  "thumbnail": "string",
  "contentTypeId": 123,
  "category": "string",
  "country": "string",
  "hlsUrl": "string",
  "vodId": 123,
  "vodStartOffset": 123,
  "vodEndOffset": 123,
  "subtitlesVttLinks": "string",
  "nextVideo": {
    "autoSecond": 123,
    "title": "string",
    "url": "string",
    "thumbnailUrl": "string"
  },
  "chapters": [
    {
      "id": 123,
      "title": "string",
      "startOffset": 123,
      "endOffset": 123,
      "thumbnailUrl": "string"
    }
  ]
}
```

## Satsangs

### `GET` `/satsangs/featured`

**Parameters:**

- `country_code` (query, string, optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')

**Responses:**

- **200**: application/json → ContentSingleFeaturedResponseDto \ OK
  Example:

```json
{
  "featured": {
    "contentId": 123,
    "title": "string",
    "bannerImageUrl": "string",
    "thumbnailUrl": "string",
    "thumbnailUrlVertical": "string",
    "location": {
      "id": "<value>",
      "countryCode": "<value>",
      "country": "<value>",
      "city": "<value>",
      "location": "<value>"
    },
    "description": "string",
    "isLiveContent": true,
    "publishedAt": "2023-01-01T00:00:00Z",
    "startDate": "2023-01-01T00:00:00Z",
    "endDate": "2023-01-01T00:00:00Z",
    "subscriptionTiers": ["string"],
    "categories": ["<value>"],
    "video": {
      "videoId": "<value>",
      "title": "<value>",
      "description": "<value>",
      "durationSeconds": "<value>",
      "chapters": "<value>"
    }
  }
}
```

### `GET` `/satsangs`

**Parameters:**

- `limit` (query, integer (int32), optional):
- `sortBy` (query, string, optional):
- `desc` (query, boolean, optional):
- `Filters.categoryId` (query, integer (int64), optional):
- `Filters.subscriptionTier` (query, string[], optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → SatsangsListResponseDto \ OK
  Example:

```json
{
  "satsangs": [
    {
      "contentId": 123,
      "title": "string",
      "bannerImageUrl": "string",
      "thumbnailUrl": "string",
      "thumbnailUrlVertical": "string",
      "location": "<value>",
      "description": "string",
      "isLiveContent": true,
      "publishedAt": "2023-01-01T00:00:00Z",
      "startDate": "2023-01-01T00:00:00Z",
      "endDate": "2023-01-01T00:00:00Z",
      "subscriptionTiers": ["<value>"],
      "categories": ["<value>"],
      "video": "<value>"
    }
  ]
}
```

### `GET` `/satsangs/latest-releases`

**Parameters:**

- `limit` (query, integer (int32), optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → LatestReleasesContentSingleResponseDto \ OK
  Example:

```json
{
  "latestReleases": [
    {
      "contentId": 123,
      "title": "string",
      "bannerImageUrl": "string",
      "thumbnailUrl": "string",
      "thumbnailUrlVertical": "string",
      "location": "<value>",
      "description": "string",
      "isLiveContent": true,
      "publishedAt": "2023-01-01T00:00:00Z",
      "startDate": "2023-01-01T00:00:00Z",
      "endDate": "2023-01-01T00:00:00Z",
      "subscriptionTiers": ["<value>"],
      "categories": ["<value>"],
      "video": "<value>"
    }
  ]
}
```

### `GET` `/satsangs/by-subcategory-for/{categoryId}`

**Parameters:**

- `categoryId` (path, integer (int64), required):
- `country_code` (query, string, optional):
- `limit` (query, integer (int32), optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')

**Responses:**

- **200**: application/json → SubCategoryGroupsResponseDto \ OK
  Example:

```json
{
  "subcategories": [
    {
      "id": 123,
      "name": "string",
      "count": 123,
      "contents": ["<value>"]
    }
  ]
}
```

## Search

### `POST` `/search/query`

**Parameters:**

- `q` (query, string, optional):
- `subscriptionTier` (query, string, optional):
- `shp_customer_id` (query, string, optional):
- `country_code` (query, string, optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')

**Responses:**

- **200**: application/json → SearchQueryResponseDto \ OK
  Example:

```json
{
  "searchId": "string",
  "results": [
    {
      "contentId": "string",
      "contentType": "string",
      "videoId": 123,
      "title": "string",
      "thumbnailUrl": "string",
      "subscriptionTier": "string",
      "highlight": "string",
      "startOffsetSeconds": 123
    }
  ]
}
```

### `GET` `/search/history`

**Parameters:**

- `shp_customer_id` (query, string, optional):
- `country_code` (query, string, optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')

**Responses:**

- **200**: application/json → SearchHistoryResponseDto \ OK
  Example:

```json
{
  "history": [
    {
      "query": "string"
    }
  ]
}
```

### `DELETE` `/search/history`

**Parameters:**

- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: OK

### `GET` `/search/trending`

**Parameters:**

- `country_code` (query, string, optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `api_version` (query, string, optional):
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → SearchTrendingResponseDto \ OK
  Example:

```json
{
  "trending": [
    {
      "contentId": 123,
      "title": "string",
      "videoId": 123,
      "thumbnailUrl": "string"
    }
  ]
}
```

## Talks

### `GET` `/talks/featured`

**Parameters:**

- `country_code` (query, string, optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')

**Responses:**

- **200**: application/json → ContentSingleFeaturedResponseDto \ OK
  Example:

```json
{
  "featured": {
    "contentId": 123,
    "title": "string",
    "bannerImageUrl": "string",
    "thumbnailUrl": "string",
    "thumbnailUrlVertical": "string",
    "location": {
      "id": "<value>",
      "countryCode": "<value>",
      "country": "<value>",
      "city": "<value>",
      "location": "<value>"
    },
    "description": "string",
    "isLiveContent": true,
    "publishedAt": "2023-01-01T00:00:00Z",
    "startDate": "2023-01-01T00:00:00Z",
    "endDate": "2023-01-01T00:00:00Z",
    "subscriptionTiers": ["string"],
    "categories": ["<value>"],
    "video": {
      "videoId": "<value>",
      "title": "<value>",
      "description": "<value>",
      "durationSeconds": "<value>",
      "chapters": "<value>"
    }
  }
}
```

### `GET` `/talks/latest-releases`

**Parameters:**

- `limit` (query, integer (int32), optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → LatestReleasesContentSingleResponseDto \ OK
  Example:

```json
{
  "latestReleases": [
    {
      "contentId": 123,
      "title": "string",
      "bannerImageUrl": "string",
      "thumbnailUrl": "string",
      "thumbnailUrlVertical": "string",
      "location": "<value>",
      "description": "string",
      "isLiveContent": true,
      "publishedAt": "2023-01-01T00:00:00Z",
      "startDate": "2023-01-01T00:00:00Z",
      "endDate": "2023-01-01T00:00:00Z",
      "subscriptionTiers": ["<value>"],
      "categories": ["<value>"],
      "video": "<value>"
    }
  ]
}
```

### `GET` `/talks`

**Parameters:**

- `limit` (query, integer (int32), optional):
- `sortBy` (query, string, optional):
- `desc` (query, boolean, optional):
- `Filters.categoryId` (query, integer (int64), optional):
- `Filters.subscriptionTier` (query, string[], optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → TalksListResponseDto \ OK
  Example:

```json
{
  "talks": [
    {
      "contentId": 123,
      "title": "string",
      "bannerImageUrl": "string",
      "thumbnailUrl": "string",
      "thumbnailUrlVertical": "string",
      "location": "<value>",
      "description": "string",
      "isLiveContent": true,
      "publishedAt": "2023-01-01T00:00:00Z",
      "startDate": "2023-01-01T00:00:00Z",
      "endDate": "2023-01-01T00:00:00Z",
      "subscriptionTiers": ["<value>"],
      "categories": ["<value>"],
      "video": "<value>"
    }
  ]
}
```

### `GET` `/talks/by-category/{categoryId}`

**Parameters:**

- `categoryId` (path, integer (int64), required):
- `country_code` (query, string, optional):
- `limit` (query, integer (int32), optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')

**Responses:**

- **200**: application/json → SubCategoryGroupsResponseDto \ OK
  Example:

```json
{
  "subcategories": [
    {
      "id": 123,
      "name": "string",
      "count": 123,
      "contents": ["<value>"]
    }
  ]
}
```

## User

### `GET` `/user/watch-history`

**Parameters:**

- `status` (query, string, optional):
- `contentTypeId` (query, integer (int64), optional):
- `shp_customer_id` (query, string, optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: application/json → WatchHistoryResponseDto \ OK
  Example:

```json
{
  "watchHistory": [
    {
      "videoId": 123,
      "status": "string",
      "progressSeconds": 123,
      "totalSeconds": 123,
      "thumbnailUrl": "string",
      "title": "string"
    }
  ]
}
```

### `DELETE` `/user/watch-history`

**Parameters:**

- `shp_customer_id` (query, string, optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Responses:**

- **200**: OK

### `POST` `/user/watch-history`

**Parameters:**

- `shp_customer_id` (query, string, optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')
- `country_code` (query, string, optional):

**Request Body:**

- application/json → WatchHistoryUpsertRequest

**Responses:**

- **200**: OK

### `GET` `/user/subscription-info`

**Parameters:**

- `shp_customer_id` (query, string, optional):
- `country_code` (query, string, optional):
- `api_version` (query, string, required); default: `latest`:
- `locale` (query, string, required); e.g. `en-US`: A BCP-47 culture identifier (e.g. 'en-US')

**Responses:**

- **200**: application/json → SubscriptionInfo \ OK
  Example:

```json
{
  "subscriptionTier": "string",
  "ppv": [null]
}
```

# Schema Summaries

#### `CategoriesResponseDto`

| Field        | Type       | Nullable | Description |
| ------------ | ---------- | -------- | ----------- |
| `categories` | Category[] | True     |             |

#### `CommentariesListResponseDto`

| Field          | Type            | Nullable | Description |
| -------------- | --------------- | -------- | ----------- |
| `commentaries` | ContentSeries[] | True     |             |

#### `ContentSingleFeaturedResponseDto`

| Field      | Type              | Nullable | Description |
| ---------- | ----------------- | -------- | ----------- |
| `featured` | ContentSingleLess | False    |             |

#### `FeaturedSerieResponseDto`

| Field      | Type          | Nullable | Description |
| ---------- | ------------- | -------- | ----------- |
| `featured` | ContentSeries | False    |             |

#### `LatestReleasesContentSeriesResponseDto`

| Field            | Type            | Nullable | Description |
| ---------------- | --------------- | -------- | ----------- |
| `latestReleases` | ContentSeries[] | True     |             |

#### `LatestReleasesContentSingleResponseDto`

| Field            | Type                | Nullable | Description |
| ---------------- | ------------------- | -------- | ----------- |
| `latestReleases` | ContentSingleLess[] | True     |             |

#### `LiveListResponseDto`

| Field   | Type                | Nullable | Description |
| ------- | ------------------- | -------- | ----------- |
| `lives` | ContentSingleLess[] | True     |             |

#### `LocalesResponseDto`

| Field     | Type        | Nullable | Description |
| --------- | ----------- | -------- | ----------- |
| `locales` | LocaleDto[] | True     |             |

#### `PilgrimageListResponseDto`

| Field         | Type            | Nullable | Description |
| ------------- | --------------- | -------- | ----------- |
| `pilgrimages` | ContentSeries[] | True     |             |

#### `PlayerVideoDto`

| Field               | Type            | Nullable | Description |
| ------------------- | --------------- | -------- | ----------- |
| `id`                | integer (int64) | False    |             |
| `mamId`             | integer (int64) | True     |             |
| `title`             | string          | True     |             |
| `bannerUrl`         | string          | True     |             |
| `thumbnail`         | string          | True     |             |
| `contentTypeId`     | integer (int64) | False    |             |
| `category`          | string          | True     |             |
| `country`           | string          | True     |             |
| `hlsUrl`            | string          | True     |             |
| `vodId`             | integer (int64) | True     |             |
| `vodStartOffset`    | integer (int64) | True     |             |
| `vodEndOffset`      | integer (int64) | True     |             |
| `subtitlesVttLinks` | string          | True     |             |
| `nextVideo`         | NextVideoDto    | False    |             |
| `chapters`          | ChapterDto[]    | True     |             |

#### `SatsangsListResponseDto`

| Field      | Type                | Nullable | Description |
| ---------- | ------------------- | -------- | ----------- |
| `satsangs` | ContentSingleLess[] | True     |             |

#### `SearchHistoryResponseDto`

| Field     | Type                | Nullable | Description |
| --------- | ------------------- | -------- | ----------- |
| `history` | SearchHistoryItem[] | True     |             |

#### `SearchQueryResponseDto`

| Field      | Type           | Nullable | Description |
| ---------- | -------------- | -------- | ----------- |
| `searchId` | string         | True     |             |
| `results`  | SearchResult[] | True     |             |

#### `SearchTrendingResponseDto`

| Field      | Type                    | Nullable | Description |
| ---------- | ----------------------- | -------- | ----------- |
| `trending` | SearchTrendingItemDto[] | True     |             |

#### `SerieVideosResponseDto`

| Field         | Type            | Nullable | Description |
| ------------- | --------------- | -------- | ----------- |
| `videoGroups` | VideoGroupDto[] | True     |             |

#### `SeriesSummaryResponseDto`

| Field                       | Type    | Nullable | Description |
| --------------------------- | ------- | -------- | ----------- |
| `groupName`                 | string  | True     |             |
| `groupNamePlural`           | string  | True     |             |
| `groupCount`                | integer | False    |             |
| `videoCount`                | integer | False    |             |
| `totalVideoDurationSeconds` | integer | False    |             |
| `startDate`                 | string  | True     |             |
| `endDate`                   | string  | True     |             |
| `location`                  | string  | True     |             |

#### `SubCategoriesResponseDto`

| Field           | Type             | Nullable | Description |
| --------------- | ---------------- | -------- | ----------- |
| `subcategories` | SubCategoryDto[] | True     |             |

#### `SubCategoryGroupsResponseDto`

| Field           | Type                  | Nullable | Description |
| --------------- | --------------------- | -------- | ----------- |
| `subcategories` | SubCategoryGroupDto[] | True     |             |

#### `SubscriptionInfo`

| Field              | Type   | Nullable | Description |
| ------------------ | ------ | -------- | ----------- |
| `subscriptionTier` | string | True     |             |
| `ppv`              | any[]  | True     |             |

#### `TalksListResponseDto`

| Field   | Type                | Nullable | Description |
| ------- | ------------------- | -------- | ----------- |
| `talks` | ContentSingleLess[] | True     |             |

#### `WatchHistoryResponseDto`

| Field          | Type                | Nullable | Description |
| -------------- | ------------------- | -------- | ----------- |
| `watchHistory` | WatchHistoryEntry[] | True     |             |

#### `WatchHistoryUpsertRequest`

| Field             | Type            | Nullable | Description |
| ----------------- | --------------- | -------- | ----------- |
| `videoId`         | integer (int64) | False    |             |
| `progressSeconds` | integer (int32) | False    |             |
| `status`          | string          | True     |             |

#### `Category`

| Field          | Type            | Nullable | Description |
| -------------- | --------------- | -------- | ----------- |
| `id`           | integer (int32) | False    |             |
| `slug`         | string          | True     |             |
| `name`         | string          | True     |             |
| `description`  | string          | True     |             |
| `thumbnailUrl` | string          | True     |             |
| `videoCount`   | integer (int32) | False    |             |

#### `ChapterDto`

| Field          | Type            | Nullable | Description |
| -------------- | --------------- | -------- | ----------- |
| `id`           | integer (int64) | False    |             |
| `title`        | string          | True     |             |
| `startOffset`  | integer (int64) | False    |             |
| `endOffset`    | integer (int64) | False    |             |
| `thumbnailUrl` | string          | True     |             |

#### `ContentSeries`

| Field                       | Type               | Nullable | Description |
| --------------------------- | ------------------ | -------- | ----------- |
| `contentId`                 | integer (int64)    | False    |             |
| `title`                     | string             | True     |             |
| `thumbnailUrl`              | string             | True     |             |
| `thumbnailUrlVertical`      | string             | True     |             |
| `shopifyProductId`          | string             | True     |             |
| `shopifyVariantId`          | string             | True     |             |
| `subscriptionTiers`         | string[]           | True     |             |
| `location`                  | LocationDto        | False    |             |
| `description`               | string             | True     |             |
| `isLiveContent`             | boolean            | False    |             |
| `isUpcoming`                | boolean            | False    |             |
| `videoCount`                | integer (int32)    | False    |             |
| `startDate`                 | string (date-time) | True     |             |
| `endDate`                   | string (date-time) | True     |             |
| `totalVideoDurationSeconds` | integer (int32)    | False    |             |

#### `ContentSingleCategory`

| Field  | Type            | Nullable | Description |
| ------ | --------------- | -------- | ----------- |
| `id`   | integer (int64) | False    |             |
| `name` | string          | True     |             |

#### `ContentSingleLess`

| Field                  | Type                    | Nullable | Description |
| ---------------------- | ----------------------- | -------- | ----------- |
| `contentId`            | integer (int64)         | False    |             |
| `title`                | string                  | True     |             |
| `bannerImageUrl`       | string                  | True     |             |
| `thumbnailUrl`         | string                  | True     |             |
| `thumbnailUrlVertical` | string                  | True     |             |
| `location`             | LocationDto             | False    |             |
| `description`          | string                  | True     |             |
| `isLiveContent`        | boolean                 | False    |             |
| `publishedAt`          | string (date-time)      | False    |             |
| `startDate`            | string (date-time)      | True     |             |
| `endDate`              | string (date-time)      | True     |             |
| `subscriptionTiers`    | string[]                | True     |             |
| `categories`           | ContentSingleCategory[] | True     |             |
| `video`                | VideoLess               | False    |             |

#### `LocaleDto`

| Field        | Type   | Nullable | Description |
| ------------ | ------ | -------- | ----------- |
| `localeCode` | string | True     |             |
| `name`       | string | True     |             |

#### `LocationDto`

| Field         | Type            | Nullable | Description |
| ------------- | --------------- | -------- | ----------- |
| `id`          | integer (int64) | False    |             |
| `countryCode` | string          | True     |             |
| `country`     | string          | True     |             |
| `city`        | string          | True     |             |
| `location`    | string          | True     |             |

#### `NextVideoDto`

| Field          | Type            | Nullable | Description |
| -------------- | --------------- | -------- | ----------- |
| `autoSecond`   | integer (int32) | False    |             |
| `title`        | string          | True     |             |
| `url`          | string          | True     |             |
| `thumbnailUrl` | string          | True     |             |

#### `SearchHistoryItem`

| Field   | Type   | Nullable | Description |
| ------- | ------ | -------- | ----------- |
| `query` | string | True     |             |

#### `SearchResult`

| Field                | Type            | Nullable | Description |
| -------------------- | --------------- | -------- | ----------- |
| `contentId`          | string          | True     |             |
| `contentType`        | string          | True     |             |
| `videoId`            | integer (int64) | False    |             |
| `title`              | string          | True     |             |
| `thumbnailUrl`       | string          | True     |             |
| `subscriptionTier`   | string          | True     |             |
| `highlight`          | string          | True     |             |
| `startOffsetSeconds` | integer (int32) | False    |             |

#### `SearchTrendingItemDto`

| Field          | Type            | Nullable | Description |
| -------------- | --------------- | -------- | ----------- |
| `contentId`    | integer (int64) | False    |             |
| `title`        | string          | True     |             |
| `videoId`      | integer (int64) | False    |             |
| `thumbnailUrl` | string          | True     |             |

#### `SubCategoryDto`

| Field   | Type            | Nullable | Description |
| ------- | --------------- | -------- | ----------- |
| `id`    | integer (int64) | True     |             |
| `name`  | string          | True     |             |
| `count` | integer (int64) | False    |             |

#### `SubCategoryGroupDto`

| Field      | Type                | Nullable | Description |
| ---------- | ------------------- | -------- | ----------- |
| `id`       | integer (int64)     | True     |             |
| `name`     | string              | True     |             |
| `count`    | integer (int64)     | False    |             |
| `contents` | ContentSingleLess[] | True     |             |

#### `VideoGroupDto`

| Field   | Type            | Nullable | Description |
| ------- | --------------- | -------- | ----------- |
| `id`    | integer (int64) | True     |             |
| `order` | integer (int32) | True     |             |
| `name`  | string          | True     |             |
| `parts` | VideoPart[]     | True     |             |

#### `VideoLess`

| Field             | Type            | Nullable | Description |
| ----------------- | --------------- | -------- | ----------- |
| `videoId`         | integer (int64) | False    |             |
| `title`           | string          | True     |             |
| `description`     | string          | True     |             |
| `durationSeconds` | integer (int32) | False    |             |
| `chapters`        | ChapterDto[]    | True     |             |

#### `VideoPart`

| Field      | Type            | Nullable | Description |
| ---------- | --------------- | -------- | ----------- |
| `day`      | integer (int32) | True     |             |
| `part`     | integer (int32) | True     |             |
| `partName` | string          | True     |             |
| `video`    | VideoLess       | False    |             |

#### `WatchHistoryEntry`

| Field             | Type            | Nullable | Description |
| ----------------- | --------------- | -------- | ----------- |
| `videoId`         | integer (int64) | True     |             |
| `status`          | string          | True     |             |
| `progressSeconds` | integer (int64) | False    |             |
| `totalSeconds`    | integer (int64) | False    |             |
| `thumbnailUrl`    | string          | True     |             |
| `title`           | string          | True     |             |
