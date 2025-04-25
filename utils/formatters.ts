import { format, formatDistanceToNow } from 'date-fns';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices';

/**
 * Transforms technical fuel type codes into more user-friendly,
 * locally-familiar names for display in the Philippines context.
 *
 * For example, "RON 91" becomes "Unleaded" as it's commonly referred to in the Philippines,
 * while higher RON values are typically referred to as "Premium"
 *
 * @param fuelType The technical fuel type code
 * @returns User-friendly fuel type name
 */
export function formatFuelType(fuelType: FuelType): string {
  switch (fuelType) {
    case 'RON 91':
      return 'Unleaded';
    case 'RON 95':
      return 'Premium (95)';
    case 'RON 97':
      return 'Premium (97)';
    case 'RON 100':
      return 'Premium (100)';
    default:
      return fuelType; // Keep Diesel and Diesel Plus as is
  }
}

/**
 * Formats a distance in kilometers to a human-readable string
 * @param distanceKm The distance in kilometers
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

/**
 * Formats a price in Philippine Peso
 * @param price The price to format
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  return `₱${price.toFixed(2)}`;
}

/**
 * Formats a date in a human-readable format
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy');
}

/**
 * Formats a date as relative time (e.g., "2 days ago")
 * @param date The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Formats a percentage value
 * @param value The percentage value
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(0)}%`;
}

/**
 * Formats operating hours from a JSON object
 * @param hours Operating hours object
 * @returns Formatted hours string
 */
export function formatOperatingHours(hours: any): string {
  if (!hours) return 'No operating hours available';

  if (hours.is24Hours) return 'Open 24 hours';

  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  // Check if all weekdays have the same hours
  const allSame = days.every(
    (day) =>
      hours[day]?.open === hours.Monday?.open &&
      hours[day]?.close === hours.Monday?.close
  );

  if (allSame && hours.Monday) {
    return `Daily: ${hours.Monday.open} - ${hours.Monday.close}`;
  }

  // Otherwise, list each day
  return days
    .filter((day) => hours[day])
    .map(
      (day) => `${day.slice(0, 3)}: ${hours[day].open} - ${hours[day].close}`
    )
    .join(', ');
}

/**
 * Formats a confidence score as a human-readable string
 * @param score The confidence score (0-100)
 * @returns Human-readable confidence string
 */
export function formatConfidenceScore(score: number): string {
  if (score >= 90) return 'Very High';
  if (score >= 70) return 'High';
  if (score >= 50) return 'Medium';
  if (score >= 30) return 'Low';
  return 'Very Low';
}

/**
 * Returns a color based on confidence score
 * @param score The confidence score (0-100)
 * @returns Color string
 */
export function getConfidenceColor(score: number): string {
  if (score >= 90) return '#4caf50'; // Green
  if (score >= 70) return '#8bc34a'; // Light Green
  if (score >= 50) return '#ffeb3b'; // Yellow
  if (score >= 30) return '#ff9800'; // Orange
  return '#f44336'; // Red
}

/**
 * Returns a color based on price comparison
 * @param price The current price
 * @param averagePrice The average price to compare against
 * @returns Color string
 */
export function getPriceComparisonColor(
  price: number,
  averagePrice: number
): string {
  if (price < averagePrice * 0.95) return '#4caf50'; // Green (5% below average)
  if (price > averagePrice * 1.05) return '#f44336'; // Red (5% above average)
  return '#ffeb3b'; // Yellow (within 5% of average)
}
