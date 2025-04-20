import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryKeys';
import { defaultQueryOptions } from '../utils/queryOptions';
import type { LocationData } from '@/hooks/useLocation';
// Import useNearbyStations and its return type
import { useNearbyStations } from '../stations/useNearbyStations';
import type { GasStation } from '../stations/useNearbyStations'; // Now exported
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore'; // Import preferences store

// Import helpers from the utility file
import {
  fetchCommunityPrices,
  fetchDoePrices,
  createPotentialPricePoints,
  processSpecificFuelType,
  processAllFuelTypes,
  calculateStats,
} from './bestPricesUtils';

// --- Constants ---
const DEFAULT_MAX_DISTANCE = 15;
const RESULT_LIMIT = 10;
export const ALL_FUEL_TYPES: FuelType[] = [
  // Add export keyword
  'Diesel',
  'RON 91',
  'RON 95',
  'RON 97',
  'RON 100',
  'Diesel Plus',
];

// --- Type Definitions ---
export type FuelType =
  | 'Diesel'
  | 'RON 91'
  | 'RON 95'
  | 'RON 97'
  | 'RON 100'
  | 'Diesel Plus';

export interface CommunityPriceInfo {
  id: string; // Report ID
  price: number;
  user_id: string;
  reported_at: string;
  cycle_id: string;
  reporter_username: string;
  confirmations_count: number;
  confidence_score: number;
}

export interface DoePriceInfo {
  min_price: number | null;
  common_price: number | null;
  max_price: number | null;
  week_of: string | null;
  source_type: string | null;
}

// PotentialPricePoint now extends GasStation
export interface PotentialPricePoint extends GasStation {
  fuel_type: FuelType;
  community_price: CommunityPriceInfo | null;
  doe_price: DoePriceInfo | null;
}

// BestPrice now extends GasStation
// It includes all GasStation properties (id, name, brand, city, lat, lon, distance?)
// It includes nullable community price and optional other community fields
// It includes optional DOE fields
export interface BestPrice
  extends GasStation, // Use GasStation type directly
    Partial<Omit<CommunityPriceInfo, 'price' | 'id'>>, // Omit price and id (id comes from GasStation)
    Partial<DoePriceInfo> {
  fuel_type: FuelType;
  price: number | null; // Community price (nullable)
  // Ensure 'id' from GasStation is the primary one, community 'id' might be different (report id)
  // We might need a separate field like 'community_report_id' if needed
}

export interface UseBestPricesOptions {
  fuelType?: FuelType;
  maxDistance?: number;
  enabled?: boolean;
  providedLocation?: LocationData;
}

// --- Main Hook ---
export function useBestPrices({
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

  const {
    data: nearbyStations,
    isLoading: isLoadingStations,
    error: stationsError,
  } = useNearbyStations({
    radiusKm: maxDistance,
    enabled: !!location && enabled,
    providedLocation: location,
  });

  const isQueryEnabled =
    !!location &&
    !location.isDefaultLocation && // Only enable if we have a real location
    enabled &&
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
        const [communityPriceMap, doePriceMap] = await Promise.all([
          fetchCommunityPrices(
            nearbyStationIds,
            effectiveFuelType ?? undefined
          ), // Pass undefined instead of null
          fetchDoePrices(nearbyStationIds, fuelTypesToFetch),
        ]);

        const potentialPricePoints = createPotentialPricePoints(
          nearbyStationsMap,
          communityPriceMap,
          doePriceMap,
          fuelTypesToFetch
        );

        let finalBestPrices: BestPrice[];
        // Process based on the effective fuel type
        if (effectiveFuelType) {
          finalBestPrices = processSpecificFuelType(
            potentialPricePoints,
            effectiveFuelType
          );
        } else {
          finalBestPrices = processAllFuelTypes(potentialPricePoints);
        }

        const limitedBestPrices = finalBestPrices.slice(0, RESULT_LIMIT);
        const stats = calculateStats(limitedBestPrices);

        return { prices: limitedBestPrices, stats };
      } catch (error) {
        // Simplified error handling: Log and rethrow
        console.error('Error fetching/processing best prices:', error);
        throw error; // Let react-query handle the error state
      }
    },
    ...defaultQueryOptions.prices.best,
    enabled: isQueryEnabled, // Use the calculated enabled state
  });
}
