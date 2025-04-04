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
  let query = supabase
    .from('active_price_reports')
    .select(
      `id, station_id, fuel_type, price, user_id, reported_at, cycle_id,
       reporter_username, confirmations_count, confidence_score`
    )
    .in('station_id', stationIds); // Use station_id here as it's the column name
  if (fuelType) query = query.eq('fuel_type', fuelType);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching community prices:', error);
    throw error;
  }

  const map = new Map<string, CommunityPriceInfo>();
  data?.forEach((cp) => {
    // Key uses station_id from the report data
    const key = `${cp.station_id}_${cp.fuel_type}`;
    if (!map.has(key)) map.set(key, cp as CommunityPriceInfo);
  });
  return map;
}

/** Fetches DOE prices for given station IDs and fuel types */
export async function fetchDoePrices(
  stationIds: string[],
  fuelTypes: FuelType[]
): Promise<Map<string, DoePriceInfo>> {
  if (stationIds.length === 0 || fuelTypes.length === 0) return new Map();
  const { data, error } = await supabase
    .from('doe_price_view')
    .select(
      'gas_station_id, fuel_type, min_price, common_price, max_price, week_of, source_type'
    )
    .in('gas_station_id', stationIds); // Use gas_station_id here

  // Filter fuel types *after* fetching if necessary, or adjust query if possible
  // For simplicity, keeping the .in('fuel_type', fuelTypes) for now
  // .in('fuel_type', fuelTypes); // This might need adjustment based on exact needs

  if (error) {
    console.error('Error fetching DOE prices:', error);
    return new Map(); // Return empty map on error
  }
  // console.log('[bestPricesUtils] Raw DOE Data:', data); // Log raw data - REMOVED

  const map = new Map<string, DoePriceInfo>();
  data?.forEach((dp) => {
    if (!dp.gas_station_id || !dp.fuel_type) return; // Skip if essential keys are missing

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
    // 3. Both have prices (let the last one processed win, assuming view order is consistent, e.g., specific then general)
    //    OR if we want to explicitly prioritize non-nulls, we could add more checks here.
    //    Let's stick with prioritizing if the current one is null.
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
  // console.log('[bestPricesUtils] Processed DOE Price Map:', map); // Log processed map - REMOVED
  return map;
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
