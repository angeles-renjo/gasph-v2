import { createFocusAwareQueryHook } from '@/hooks/queries/utils/createFocusAwareHooks';
import { useNearbyStations } from './useNearbyStations';
import { useStationDetails } from './useStationDetails';
import { useFavoriteStations } from './useFavoriteStations';
import { useStationFuelTypePrices } from './useStationFuelTypePrices';
import { useStationDoePrice } from './useStationDoePrice';
import { useIsFocused } from '@react-navigation/native';
import { useRefreshOnFocus } from '@/lib/react-query-native';
import type { FuelType } from '../prices/useBestPrices';

/**
 * This file demonstrates how to create focus-aware versions of station hooks
 *
 * Focus-aware hooks:
 * 1. Only run queries when the screen is focused
 * 2. Automatically refresh data when the screen is focused again
 * 3. Disable queries when the screen is not focused to save resources
 */

// Create focus-aware version of hook that accepts a single options object
export const useFocusAwareNearbyStations =
  createFocusAwareQueryHook(useNearbyStations);

// Create custom focus-aware versions for hooks that accept a single parameter
export function useFocusAwareStationDetails(stationId: string | null) {
  const isFocused = useIsFocused();

  const result = useStationDetails(stationId);

  // Add refresh on focus behavior
  if (result.refetch) {
    useRefreshOnFocus(result.refetch);
  }

  return result;
}

export function useFocusAwareFavoriteStations(userId: string | undefined) {
  const isFocused = useIsFocused();

  const result = useFavoriteStations(userId);

  // Add refresh on focus behavior
  if (
    result.favoriteStationIds &&
    'refetch' in result &&
    typeof result.refetch === 'function'
  ) {
    // Type assertion to ensure TypeScript knows refetch returns a Promise
    const refetch = result.refetch as () => Promise<unknown>;
    useRefreshOnFocus(refetch);
  }

  return result;
}

// Create custom focus-aware versions for hooks that accept multiple parameters
export function useFocusAwareStationFuelTypePrices(
  stationId: string | null,
  fuelType: string | null
) {
  const isFocused = useIsFocused();

  const result = useStationFuelTypePrices(stationId, fuelType);

  // Add refresh on focus behavior
  if (result.refetch) {
    useRefreshOnFocus(result.refetch);
  }

  return result;
}

export function useFocusAwareStationDoePrice(
  stationId: string | null | undefined,
  fuelType: FuelType | null | undefined
) {
  const isFocused = useIsFocused();

  const result = useStationDoePrice(stationId, fuelType);

  // Add refresh on focus behavior
  if (result.refetch) {
    useRefreshOnFocus(result.refetch);
  }

  return result;
}

/**
 * Example usage:
 *
 * // Instead of:
 * const { data: nearbyStations } = useNearbyStations({ radiusKm: 5 });
 *
 * // Use:
 * const { data: nearbyStations } = useFocusAwareNearbyStations({ radiusKm: 5 });
 *
 * This will automatically:
 * - Only run the query when the screen is focused
 * - Refresh the data when the screen is focused again
 * - Disable the query when the screen is not focused
 */
