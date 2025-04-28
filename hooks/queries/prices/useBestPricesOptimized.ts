import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryKeys';
import { defaultQueryOptions } from '../utils/queryOptions';
import type { LocationData } from '@/hooks/useLocation';
import { useNearbyStations } from '../stations/useNearbyStations';
import type { GasStation } from '../stations/useNearbyStations';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';
import { useIsFocused } from '@react-navigation/native';

// Import helpers from the utility file
import {
  fetchCommunityPrices,
  fetchDoePrices,
  createPotentialPricePoints,
  processSpecificFuelType,
  processAllFuelTypes,
  calculateStats,
} from './bestPricesUtils';

// Import types and values from the original hook
import type {
  FuelType,
  CommunityPriceInfo,
  DoePriceInfo,
  PotentialPricePoint,
  BestPrice,
  UseBestPricesOptions,
} from './useBestPrices';

import { ALL_FUEL_TYPES } from './useBestPrices';

export { ALL_FUEL_TYPES };

// --- Constants ---
const DEFAULT_MAX_DISTANCE = 15;
const RESULT_LIMIT = 10;

/**
 * Optimized version of useBestPrices that:
 * 1. Uses the subscribed option to disable queries when screen is not focused
 * 2. Implements server-side filtering to reduce client-side processing
 * 3. Uses memoization to avoid unnecessary recalculations
 */
export function useBestPricesOptimized({
  fuelType,
  maxDistance = DEFAULT_MAX_DISTANCE,
  enabled = true,
  providedLocation,
}: UseBestPricesOptions = {}) {
  const location = providedLocation;
  // Get default fuel type from preferences store
  const defaultFuelTypeFromStore = usePreferencesStore(
    (state) => state.defaultFuelType
  );
  // Use the prop if provided, otherwise use the stored preference
  const effectiveFuelType = fuelType ?? defaultFuelTypeFromStore;

  // Get screen focus state
  const isFocused = useIsFocused();

  // For 30km queries, we need to be more careful with the data volume
  const isLargeDistance = maxDistance >= 25;

  const {
    data: nearbyStations,
    isLoading: isLoadingStations,
    error: stationsError,
  } = useNearbyStations({
    radiusKm: maxDistance,
    enabled: !!location && enabled && isFocused, // Only enabled when screen is focused
    providedLocation: location,
    // Apply a limit for large distances to prevent excessive data fetching
    limit: isLargeDistance ? 500 : undefined,
  });

  const isQueryEnabled =
    !!location &&
    !location.isDefaultLocation && // Only enable if we have a real location
    enabled &&
    isFocused && // Only enabled when screen is focused
    !isLoadingStations &&
    !!nearbyStations &&
    nearbyStations.length > 0;

  return useQuery({
    queryKey: queryKeys.prices.best.list({
      location,
      fuelType: effectiveFuelType ?? undefined, // Pass undefined instead of null
      maxDistance,
      stationCount: nearbyStations?.length ?? 0, // Add dependency on station count
    }),
    queryFn: async (): Promise<{ prices: BestPrice[]; stats: any | null }> => {
      if (!isQueryEnabled || !nearbyStations) {
        // Check isQueryEnabled guard
        return { prices: [], stats: null };
      }

      try {
        const nearbyStationIds = nearbyStations.map((s) => s.id);
        const nearbyStationsMap = new Map<string, GasStation>(
          nearbyStations.map((s) => [s.id, s])
        );

        // Fetch based on the effective fuel type (prop or preference)
        const fuelTypesToFetch = effectiveFuelType
          ? [effectiveFuelType]
          : ALL_FUEL_TYPES;

        // Use Promise.all for parallel fetching
        const [communityPriceMap, doePriceMap] = await Promise.all([
          fetchCommunityPrices(
            nearbyStationIds,
            effectiveFuelType ?? undefined
          ), // Pass undefined instead of null
          fetchDoePrices(nearbyStationIds, fuelTypesToFetch),
        ]);

        // Create potential price points
        const potentialPricePoints = createPotentialPricePoints(
          nearbyStationsMap,
          communityPriceMap,
          doePriceMap,
          fuelTypesToFetch
        );

        // Process based on the effective fuel type
        const finalBestPrices = effectiveFuelType
          ? processSpecificFuelType(potentialPricePoints, effectiveFuelType)
          : processAllFuelTypes(potentialPricePoints);

        // Limit results and calculate stats
        const limitedBestPrices = finalBestPrices.slice(0, RESULT_LIMIT);
        const stats = calculateStats(limitedBestPrices);

        return { prices: limitedBestPrices, stats };
      } catch (error) {
        console.error('Error fetching/processing best prices:', error);
        throw error; // Let react-query handle the error state
      }
    },
    ...defaultQueryOptions.prices.best,
    enabled: isQueryEnabled, // Use the calculated enabled state
    // Add subscribed option to disable query when screen is not focused
    subscribed: isFocused,
  });
}
