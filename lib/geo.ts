// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;
import Constants from 'expo-constants'; // Import expo-constants

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Converts degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates the distance between two points using the Haversine formula
 * @param point1 First coordinates
 * @param point2 Second coordinates
 * @returns Distance in kilometers
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const lat1 = point1.latitude;
  const lon1 = point1.longitude;
  const lat2 = point2.latitude;
  const lon2 = point2.longitude;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return distance;
}

/**
 * Creates a bounding box for a given center point and radius
 * Useful for database queries to find nearby stations
 * @param center The center coordinates
 * @param radiusKm Radius in kilometers
 * @param optimizeForLargeRadius Whether to optimize the bounding box for large radius values
 * @returns Object with min and max lat/lng
 */
export function getBoundingBox(
  center: Coordinates,
  radiusKm: number,
  optimizeForLargeRadius: boolean = false
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  // Earth's radius in km
  const R = EARTH_RADIUS_KM;

  // For large radius values (like 30km), we can use a slightly smaller bounding box
  // to reduce the initial data volume, then filter more precisely later
  const adjustedRadius =
    optimizeForLargeRadius && radiusKm >= 25
      ? radiusKm * 0.9 // Use 90% of the radius for the initial query
      : radiusKm;

  // angular distance in radians on a great circle
  const radDist = adjustedRadius / R;

  const lat = toRadians(center.latitude);
  const lng = toRadians(center.longitude);

  const minLat = lat - radDist;
  const maxLat = lat + radDist;

  // Properly account for longitude changes at different latitudes
  // This is more accurate than the previous approach, especially for larger distances
  // cos(lat) factor adjusts for the fact that longitude lines get closer at higher latitudes
  const deltaLng = Math.asin(Math.sin(radDist) / Math.cos(lat));

  const minLng = lng - deltaLng;
  const maxLng = lng + deltaLng;

  // Convert back to degrees
  return {
    minLat: (minLat * 180) / Math.PI,
    maxLat: (maxLat * 180) / Math.PI,
    minLng: (minLng * 180) / Math.PI,
    maxLng: (maxLng * 180) / Math.PI,
  };
}

/**
 * Gets a human-readable distance string
 * @param distanceKm Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    // Show in meters if less than 1 km
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }

  // Show in kilometers with one decimal place
  return `${distanceKm.toFixed(1)} km`;
}

// --- NEW REVERSE GEOCODING FUNCTION ---

export interface AddressComponents {
  formattedAddress: string | null;
  streetAddress: string | null; // Combination of street number and route
  city: string | null;
  province: string | null;
  country: string | null;
}

/**
 * Performs reverse geocoding using Google Maps API
 * @param coords Coordinates (latitude, longitude)
 * @returns Promise resolving to AddressComponents or null if not found
 */
export async function reverseGeocode(
  coords: Coordinates
): Promise<AddressComponents | null> {
  // Access the key exposed via app.config.js extra field
  const apiKey = Constants.expoConfig?.extra?.googleApiKey;

  if (!apiKey) {
    const errorMessage =
      'Google API Key (googleApiKey) is not configured in app.config.js extra field.';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const latlng = `${coords.latitude},${coords.longitude}`;
  // Restrict results for better accuracy in PH
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&key=${apiKey}&result_type=street_address|locality|political&language=en&region=ph`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Reverse Geocoding HTTP error! Status: ${response.status}`
      );
    }
    const data = await response.json();

    if (data.status === 'ZERO_RESULTS') {
      console.warn(
        'Reverse Geocoding: No results found for coordinates:',
        coords
      );
      return null;
    }

    if (data.status !== 'OK') {
      console.error(
        'Reverse Geocoding API error:',
        data.status,
        data.error_message
      );
      throw new Error(`Reverse Geocoding API error: ${data.status}`);
    }

    // Find the most relevant result (often the first one)
    const result = data.results?.[0];
    if (!result) {
      console.warn('Reverse Geocoding: OK status but no results array found.');
      return null;
    }

    const components: AddressComponents = {
      formattedAddress: result.formatted_address || null,
      streetAddress: null,
      city: null,
      province: null,
      country: null,
    };

    let streetNumber = '';
    let route = '';

    // Extract components
    result.address_components.forEach((component: any) => {
      const types = component.types;
      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
      } else if (types.includes('locality')) {
        // 'locality' usually corresponds to the city in PH context
        components.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        // 'administrative_area_level_1' usually corresponds to the province or region in PH
        components.province = component.long_name;
      } else if (types.includes('country')) {
        components.country = component.long_name;
      }
      // Consider 'administrative_area_level_2' if needed for municipalities/cities within provinces
    });

    // Combine street number and route for a basic street address
    if (streetNumber || route) {
      components.streetAddress = `${streetNumber} ${route}`.trim();
    }

    // Fallback logic: If city/province weren't found directly, try parsing formatted_address
    // This is less reliable but can be a backup.
    if (
      (!components.city || !components.province) &&
      components.formattedAddress
    ) {
      const parts = components.formattedAddress.split(', ');
      // Example: "123 Rizal St, Legazpi City, Albay, Philippines"
      if (parts.length >= 3) {
        if (!components.city) {
          // Guess city is the third part from the end
          components.city = parts[parts.length - 3];
        }
        if (!components.province) {
          // Guess province is the second part from the end
          components.province = parts[parts.length - 2];
        }
      }
    }

    return components;
  } catch (error) {
    console.error('Error during reverse geocoding:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
