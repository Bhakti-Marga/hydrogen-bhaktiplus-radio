/**
 * Geolocation utilities using Oxygen headers
 *
 * In production, Shopify Oxygen provides the oxygen-buyer-country header
 * with the user's country code based on their IP address.
 */

export interface GeoLocationResult {
  countryCode: string | null;
  source: 'header' | 'fallback';
}

/**
 * Get geolocation for a request using Oxygen headers
 *
 * @param request - Incoming request
 * @returns Geolocation result with country code from oxygen-buyer-country header
 */
export function getRequestGeolocation(request: Request): GeoLocationResult {
  const oxygenCountry = request.headers.get('oxygen-buyer-country');

  if (oxygenCountry) {
    return {
      countryCode: oxygenCountry.toLowerCase(),
      source: 'header',
    };
  }

  // No geolocation available
  return {
    countryCode: null,
    source: 'fallback',
  };
}
