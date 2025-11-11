const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_API_BASE = 'https://api.mapbox.com';

export interface GeocodingResult {
  place_name: string;
  center: [number, number]; // [lng, lat]
  text: string;
  context?: Array<{
    id: string;
    text: string;
  }>;
}

export interface GeocodeResponse {
  features: GeocodingResult[];
}

/**
 * Convert an address string to coordinates using Mapbox Geocoding API
 * @param query - Address or place name to search
 * @param options - Optional search parameters
 * @returns Array of geocoding results
 */
export async function geocodeAddress(
  query: string,
  options?: {
    limit?: number;
    proximity?: [number, number]; // [lng, lat]
    types?: string; // e.g., 'address', 'place', 'poi'
  }
): Promise<GeocodingResult[]> {
  if (!query.trim()) {
    return [];
  }

  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    limit: (options?.limit || 5).toString(),
  });

  if (options?.proximity) {
    params.append('proximity', options.proximity.join(','));
  }

  if (options?.types) {
    params.append('types', options.types);
  }

  try {
    const response = await fetch(
      `${MAPBOX_API_BASE}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data: GeocodeResponse = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

/**
 * Convert coordinates to an address using Mapbox Reverse Geocoding API
 * @param lng - Longitude
 * @param lat - Latitude
 * @returns The formatted address
 */
export async function reverseGeocode(
  lng: number,
  lat: number
): Promise<string> {
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
  });

  try {
    const response = await fetch(
      `${MAPBOX_API_BASE}/geocoding/v5/mapbox.places/${lng},${lat}.json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const data: GeocodeResponse = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`; // Fallback to coordinates
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`; // Fallback to coordinates
  }
}

/**
 * Search for places with autocomplete suggestions
 * @param query - Search term
 * @param options - Optional search parameters
 * @returns Array of place suggestions
 */
export async function searchPlaces(
  query: string,
  options?: {
    limit?: number;
    proximity?: [number, number]; // [lng, lat]
    types?: string;
    bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  }
): Promise<GeocodingResult[]> {
  if (!query.trim()) {
    return [];
  }

  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    limit: (options?.limit || 10).toString(),
    autocomplete: 'true',
  });

  if (options?.proximity) {
    params.append('proximity', options.proximity.join(','));
  }

  if (options?.types) {
    params.append('types', options.types);
  }

  if (options?.bbox) {
    params.append('bbox', options.bbox.join(','));
  }

  try {
    const response = await fetch(
      `${MAPBOX_API_BASE}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Place search failed: ${response.statusText}`);
    }

    const data: GeocodeResponse = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Place search error:', error);
    throw error;
  }
}

/**
 * Get the Mapbox token for use in map components
 */
export function getMapboxToken(): string {
  return MAPBOX_TOKEN;
}

/**
 * Get Mapbox tile layer URL for use with Leaflet
 * @param style - Mapbox style (streets-v12, satellite-v9, outdoors-v12, etc.)
 */
export function getMapboxTileUrl(style: string = 'streets-v12'): string {
  return `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;
}

/**
 * Get attribution string for Mapbox maps
 */
export function getMapboxAttribution(): string {
  return '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
}
