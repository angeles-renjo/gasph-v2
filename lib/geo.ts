// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

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
 * @returns Object with min and max lat/lng
 */
export function getBoundingBox(
  center: Coordinates,
  radiusKm: number
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  // Earth's radius in km
  const R = EARTH_RADIUS_KM;

  // angular distance in radians on a great circle
  const radDist = radiusKm / R;

  const lat = toRadians(center.latitude);
  const lng = toRadians(center.longitude);

  const minLat = lat - radDist;
  const maxLat = lat + radDist;

  // longitude gets smaller when we approach the poles
  // for simplicity, we use a constant delta lng for the bounding box
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
