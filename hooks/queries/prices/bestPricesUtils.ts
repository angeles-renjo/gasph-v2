import { supabase } from '@/utils/supabase/supabase';
// Import GasStation type directly
import type { GasStation } from '../stations/useNearbyStations';
import type {
  // StationInfo, // Removed
  CommunityPriceInfo,
  DoePriceInfo,
  PotentialPricePoint, // This will now extend GasStation in useBestPrices.ts
  BestPrice, // This will now extend GasStation in useBestPrices.ts
  FuelType,
} from './useBestPrices';

/** Fetches community prices for given station IDs and optional fuel type */
export async function fetchCommunityPrices(
  stationIds: string[],
  fuelType?: FuelType
): Promise<Map<string, CommunityPriceInfo>> {
  if (stationIds.length === 0) return new Map();

  try {
    // For large datasets, we need to chunk the station IDs to prevent query size issues
    // Supabase has limits on the number of items in an 'in' clause
    const CHUNK_SIZE = 100;
    const chunks = [];

    for (let i = 0; i < stationIds.length; i += CHUNK_SIZE) {
      chunks.push(stationIds.slice(i, i + CHUNK_SIZE));
    }

    // Process each chunk and combine results
    const map = new Map<string, CommunityPriceInfo>();

    await Promise.all(
      chunks.map(async (chunk) => {
        let query = supabase
          .from('active_price_reports')
          .select(
            `id, station_id, fuel_type, price, user_id, reported_at, cycle_id,
             reporter_username, confirmations_count, confidence_score`
          )
          .in('station_id', chunk);

        if (fuelType) query = query.eq('fuel_type', fuelType);

        const { data, error } = await query;
        if (error) {
          console.error('Error fetching community prices chunk:', error);
          return; // Continue with other chunks even if one fails
        }

        data?.forEach((cp) => {
          // Key uses station_id from the report data
          const key = `${cp.station_id}_${cp.fuel_type}`;
          if (!map.has(key)) map.set(key, cp as CommunityPriceInfo);
        });
      })
    );

    return map;
  } catch (error) {
    console.error('Error in fetchCommunityPrices:', error);
    // Return empty map instead of throwing to allow partial data display
    return new Map();
  }
}

/** Fetches DOE prices for given station IDs and fuel types */
export async function fetchDoePrices(
  stationIds: string[],
  fuelTypes: FuelType[]
): Promise<Map<string, DoePriceInfo>> {
  if (stationIds.length === 0 || fuelTypes.length === 0) return new Map();

  try {
    // For large datasets, we need to chunk the station IDs to prevent query size issues
    const CHUNK_SIZE = 100;
    const chunks = [];

    for (let i = 0; i < stationIds.length; i += CHUNK_SIZE) {
      chunks.push(stationIds.slice(i, i + CHUNK_SIZE));
    }

    // Process each chunk and combine results
    const map = new Map<string, DoePriceInfo>();

    await Promise.all(
      chunks.map(async (chunk) => {
        const { data, error } = await supabase
          .from('doe_price_view')
          .select(
            'gas_station_id, fuel_type, min_price, common_price, max_price, week_of, source_type'
          )
          .in('gas_station_id', chunk);

        if (error) {
          console.error('Error fetching DOE prices chunk:', error);
          return; // Continue with other chunks even if one fails
        }

        data?.forEach((dp) => {
          if (!dp.gas_station_id || !dp.fuel_type) return; // Skip if essential keys are missing

          // Filter by fuel types if needed
          if (
            fuelTypes.length > 0 &&
            !fuelTypes.some(
              (ft) => ft.toUpperCase() === dp.fuel_type.toUpperCase()
            )
          ) {
            return; // Skip if fuel type doesn't match any in the requested list
          }

          // Normalize fuel_type to uppercase for consistent key matching
          const key = `${dp.gas_station_id}_${dp.fuel_type.toUpperCase()}`;
          const currentEntry = map.get(key);
          const newEntryHasPrice =
            dp.min_price !== null ||
            dp.common_price !== null ||
            dp.max_price !== null;
          const currentEntryHasPrice =
            currentEntry &&
            (currentEntry.min_price !== null ||
              currentEntry.common_price !== null ||
              currentEntry.max_price !== null);

          // Set if:
          // 1. No current entry exists OR
          // 2. New entry has prices and current entry does not OR
          // 3. Both have prices (let the last one processed win, assuming view order is consistent)
          if (!currentEntry || (newEntryHasPrice && !currentEntryHasPrice)) {
            map.set(key, {
              min_price: dp.min_price,
              common_price: dp.common_price,
              max_price: dp.max_price,
              week_of: dp.week_of,
              source_type: dp.source_type,
            });
          }
        });
      })
    );

    return map;
  } catch (error) {
    console.error('Error in fetchDoePrices:', error);
    // Return empty map instead of throwing to allow partial data display
    return new Map();
  }
}

/** Combines station, community, and DOE data into potential price points */
// Now accepts GasStation map
export function createPotentialPricePoints(
  nearbyStationsMap: Map<string, GasStation>, // Changed type
  communityPriceMap: Map<string, CommunityPriceInfo>,
  doePriceMap: Map<string, DoePriceInfo>,
  fuelTypesToConsider: FuelType[]
): PotentialPricePoint[] {
  const points: PotentialPricePoint[] = [];
  nearbyStationsMap.forEach((stationInfo, stationId) => {
    // stationId is GasStation.id
    fuelTypesToConsider.forEach((ft) => {
      // Use uppercase fuel type for map lookups
      const communityKey = `${stationId}_${ft}`; // Assume community prices use title case key
      const doeKey = `${stationId}_${ft.toUpperCase()}`; // Use uppercase for DOE lookup

      const communityPrice = communityPriceMap.get(communityKey) || null;
      const doePrice = doePriceMap.get(doeKey) || null; // Lookup using uppercase key

      // // Log DOE lookup specifically for Diesel - REMOVED
      // if (ft === 'Diesel') {
      //   console.log(
      //     `[bestPricesUtils] DOE Lookup for Diesel: Key='${doeKey}', Found=`,
      //     doePrice
      //   );
      // }

      if (communityPrice || doePrice) {
        // Spread GasStation properties directly
        points.push({
          ...stationInfo, // Includes id, name, brand, city, lat, lon, distance?
          fuel_type: ft,
          community_price: communityPrice,
          doe_price: doePrice,
        });
      }
    });
  });
  return points;
}

/** Gets the effective price (community or valid DOE min) for sorting */
export function getEffectivePrice(point: PotentialPricePoint): number {
  return (
    point.community_price?.price ??
    (point.doe_price?.min_price ? point.doe_price.min_price : Infinity)
  );
}

/** Gets the secondary sort price (valid DOE min) */
export function getDoeMinSortPrice(point: PotentialPricePoint): number {
  return point.doe_price?.min_price ? point.doe_price.min_price : Infinity;
}

/** Sort function for PotentialPricePoint items */
// Uses distance property from GasStation type
export function sortPotentialPricePoints(
  a: PotentialPricePoint,
  b: PotentialPricePoint
): number {
  const priceA = getEffectivePrice(a);
  const priceB = getEffectivePrice(b);
  const doeMinA = getDoeMinSortPrice(a);
  const doeMinB = getDoeMinSortPrice(b);

  if (priceA !== priceB) return priceA - priceB;
  if (doeMinA !== doeMinB) return doeMinA - doeMinB;
  // Use distance directly, ensure it's not undefined (should be set by useNearbyStations)
  return (a.distance ?? Infinity) - (b.distance ?? Infinity);
}

/** Maps a PotentialPricePoint to the final BestPrice structure */
// Adapts to GasStation properties
export function mapToBestPrice(p: PotentialPricePoint): BestPrice {
  const communityDefaults = {
    // id is now part of GasStation, use community id only if available
    // id: `${p.id}-${p.fuel_type}-doe`, // Use p.id from GasStation
    user_id: undefined,
    reported_at: undefined,
    cycle_id: undefined,
    reporter_username: undefined,
    confirmations_count: undefined,
    confidence_score: undefined,
  };
  // // Log incoming DOE price for Diesel before mapping - REMOVED
  // if (p.fuel_type === 'Diesel') {
  //   console.log(
  //     `[bestPricesUtils] Mapping BestPrice for Diesel (Station ID: ${p.id}): Incoming doe_price=`,
  //     p.doe_price
  //   );
  // }
  return {
    ...p, // Spreads GasStation props (id, name, brand, city, lat, lon, distance?) and fuel_type
    // Ensure the primary 'id' remains the station ID from 'p'.
    // Map community fields explicitly, excluding the community report 'id' from overwriting the station 'id'.
    price: p.community_price?.price ?? null,
    user_id: p.community_price?.user_id,
    reported_at: p.community_price?.reported_at,
    // community_report_id: p.community_price?.id, // Optionally add if needed elsewhere
    cycle_id: p.community_price?.cycle_id,
    reporter_username: p.community_price?.reporter_username,
    confirmations_count: p.community_price?.confirmations_count,
    confidence_score: p.community_price?.confidence_score,
    // DOE Info remains the same
    min_price: p.doe_price?.min_price,
    common_price: p.doe_price?.common_price,
    max_price: p.doe_price?.max_price,
    week_of: p.doe_price?.week_of,
    source_type: p.doe_price?.source_type,
  };
}

/** Processes potential points for a specific fuel type */
export function processSpecificFuelType(
  potentialPoints: PotentialPricePoint[],
  fuelType: FuelType
): BestPrice[] {
  const filteredPoints = potentialPoints.filter(
    (p) => p.fuel_type === fuelType
  );
  filteredPoints.sort(sortPotentialPricePoints);
  return filteredPoints.map(mapToBestPrice);
}

/** Processes potential points for "All Fuel Types" - Modified to return all points */
export function processAllFuelTypes(
  potentialPoints: PotentialPricePoint[]
): BestPrice[] {
  // Simply sort all potential points globally by price/distance
  potentialPoints.sort(sortPotentialPricePoints);
  // Map all sorted points to the BestPrice structure
  return potentialPoints.map(mapToBestPrice);
}

/** Calculates summary statistics */
export function calculateStats(prices: BestPrice[]): any | null {
  if (!prices.length) return null;
  return {
    count: prices.length,
    lowestPrice: prices[0]?.price ?? prices[0]?.min_price ?? null,
  };
}
