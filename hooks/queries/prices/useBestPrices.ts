import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '../utils/queryKeys';
import { defaultQueryOptions } from '../utils/queryOptions';
import type { LocationData } from '@/hooks/useLocation';
import { calculateDistance } from '@/lib/geo';
import { Tables } from '@/utils/supabase/types'; // Import Tables type

export type FuelType =
  | 'Diesel'
  | 'RON 91'
  | 'RON 95'
  | 'RON 97'
  | 'RON 100'
  | 'Diesel Plus';

// Define what we select from the view
interface PriceReportSelect {
  id: string;
  station_id: string;
  fuel_type: string;
  price: number;
  user_id: string;
  reported_at: string;
  // expires_at: string; // Removed
  cycle_id: string;
  station_name: string;
  station_brand: string;
  station_city: string;
  station_latitude: number;
  station_longitude: number;
  reporter_username: string;
  confirmations_count: number;
  confidence_score: number;
}

// Define DOE Price structure based on doe_price_view, including source_type
type DoePriceData = Pick<
  Tables<'doe_price_view'>,
  'min_price' | 'common_price' | 'max_price' | 'week_of' | 'source_type'
>;

// Extend BestPrice to include optional DOE data and source_type
interface BestPrice extends PriceReportSelect, Partial<DoePriceData> {
  distance?: number;
  // doe_benchmark_price is removed, replaced by specific min/common/max
}

export interface UseBestPricesOptions {
  fuelType?: FuelType;
  maxDistance?: number;
  enabled?: boolean;
  providedLocation?: LocationData;
}

export function useBestPrices({
  fuelType,
  maxDistance = 15,
  enabled = true,
  providedLocation,
}: UseBestPricesOptions = {}) {
  const location = providedLocation;

  // Define the type for the DOE data map
  type DoePriceMap = Map<string, DoePriceData>; // Key: "stationId_fuelType"

  return useQuery({
    queryKey: queryKeys.prices.best.list({
      location,
      fuelType,
      maxDistance,
    }),
    queryFn: async () => {
      try {
        if (!location) {
          throw new Error('Location not available');
        }

        let query = supabase.from('active_price_reports').select(
          `
            id,
            station_id,
            fuel_type,
            price,
            user_id,
            reported_at,
            cycle_id,
            station_name,
            station_brand,
            station_city,
            station_latitude,
            station_longitude,
            reporter_username,
            confirmations_count,
            confidence_score
          `
        );

        // Only add the fuel type filter if one is specified for community prices
        if (fuelType) {
          query = query.eq('fuel_type', fuelType);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (!data) {
          return { prices: [], stats: null };
        }

        // Extract unique station IDs and fuel types from community reports
        const stationIds = [...new Set(data.map((r) => r.station_id))];
        const fuelTypes = fuelType
          ? [fuelType] // Only the specified one if provided
          : [...new Set(data.map((r) => r.fuel_type))]; // All unique types found otherwise

        // Fetch DOE prices for the relevant stations and fuel types
        // Assuming we want the latest DOE data for each station/fuel combo
        // A more robust implementation might filter by current cycle or week_of
        let doeQuery = supabase
          .from('doe_price_view')
          .select(
            'gas_station_id, fuel_type, min_price, common_price, max_price, week_of, source_type' // Add source_type
          )
          .in('gas_station_id', stationIds)
          .in('fuel_type', fuelTypes);
        // Ideally, add ordering by week_of desc and potentially distinct on station/fuel

        const { data: doeData, error: doeError } = await doeQuery;

        if (doeError) {
          console.error('Error fetching DOE prices:', doeError);
          // Decide how to handle: throw, or continue without DOE data?
          // For now, let's continue but log the error.
        }

        // Create a map for easy lookup: key="stationId_fuelType", value=DoePriceData
        const doePriceMap: DoePriceMap = new Map();
        if (doeData) {
          // Assuming we get multiple entries per station/fuel, we might want the latest 'week_of'
          // For simplicity now, just take the first one found (needs refinement based on actual data/needs)
          doeData.forEach((doe) => {
            const key = `${doe.gas_station_id}_${doe.fuel_type}`;
            if (!doePriceMap.has(key) && doe.gas_station_id && doe.fuel_type) {
              // Ensure key parts are not null
              doePriceMap.set(key, {
                min_price: doe.min_price,
                common_price: doe.common_price,
                max_price: doe.max_price,
                week_of: doe.week_of,
                source_type: doe.source_type, // Include source_type
              });
            }
          });
        }

        // 1. Calculate distance, filter by maxDistance, and merge DOE data
        const reportsWithDistanceAndDoe = (data as PriceReportSelect[])
          .map((report): BestPrice | null => {
            // Return BestPrice or null if filtered out
            const distance = calculateDistance(location, {
              latitude: report.station_latitude,
              longitude: report.station_longitude,
            });

            // Filter out reports beyond maxDistance or with invalid distance
            if (isNaN(distance) || distance > maxDistance) {
              return null;
            }

            const doeKey = `${report.station_id}_${report.fuel_type}`;
            const matchingDoeData = doePriceMap.get(doeKey);

            return {
              ...report,
              distance,
              min_price: matchingDoeData?.min_price ?? null,
              common_price: matchingDoeData?.common_price ?? null,
              max_price: matchingDoeData?.max_price ?? null,
              week_of: matchingDoeData?.week_of ?? null,
              source_type: matchingDoeData?.source_type ?? null, // Include source_type
            };
          })
          .filter((report): report is BestPrice => report !== null); // Remove null entries

        let finalBestPrices: BestPrice[];

        if (fuelType) {
          // Scenario 1: Specific Fuel Type Selected
          // We already filtered community prices by fuelType.
          // We fetched DOE data only for this fuelType.
          // The reportsWithDistanceAndDoe contains reports for the specific fuel type, augmented with DOE data.
          // Sort by community price first, then distance.
          reportsWithDistanceAndDoe.sort((a, b) => {
            if (a.price !== b.price) {
              return a.price - b.price;
            }
            return (a.distance ?? Infinity) - (b.distance ?? Infinity);
          });
          finalBestPrices = reportsWithDistanceAndDoe;
        } else {
          // Scenario 2: "All Fuel Types" Selected
          // Find the single cheapest option (fuel type) per station.
          // 1. Group reports by station_id
          const reportsByStation = reportsWithDistanceAndDoe.reduce<
            Record<string, BestPrice[]>
          >((acc, report) => {
            if (!acc[report.station_id]) {
              acc[report.station_id] = [];
            }
            acc[report.station_id].push(report);
            return acc;
          }, {});

          // 2. For each station, find the cheapest fuel type
          const cheapestOptionPerStation: BestPrice[] = Object.values(
            reportsByStation
          )
            .map((stationReports) => {
              if (!stationReports || stationReports.length === 0) {
                return null; // Should not happen if reportsByStation is built correctly
              }

              // Find the best option within this station's reports
              let bestOptionForStation: BestPrice | null = null;

              for (const report of stationReports) {
                if (!bestOptionForStation) {
                  bestOptionForStation = report;
                  continue;
                }

                // Comparison Logic:
                // Priority 1: Community Price (lower is better)
                // Priority 2: DOE Min Price (lower is better, used if community prices are equal or one is missing)
                // Priority 3: Distance (lower is better, as tie-breaker)

                const currentBestPrice = bestOptionForStation.price ?? Infinity;
                const candidatePrice = report.price ?? Infinity;
                const currentBestDoeMin =
                  bestOptionForStation.min_price ?? Infinity;
                const candidateDoeMin = report.min_price ?? Infinity;

                let candidateIsBetter = false;

                if (candidatePrice < currentBestPrice) {
                  candidateIsBetter = true;
                } else if (candidatePrice === currentBestPrice) {
                  // If community prices are equal (or both missing), compare DOE min
                  if (candidateDoeMin < currentBestDoeMin) {
                    candidateIsBetter = true;
                  } else if (candidateDoeMin === currentBestDoeMin) {
                    // If DOE min are also equal, compare distance
                    if (
                      (report.distance ?? Infinity) <
                      (bestOptionForStation.distance ?? Infinity)
                    ) {
                      candidateIsBetter = true;
                    }
                  }
                } else if (
                  currentBestPrice === Infinity &&
                  candidatePrice === Infinity
                ) {
                  // If NEITHER has community price, compare DOE min directly
                  if (candidateDoeMin < currentBestDoeMin) {
                    candidateIsBetter = true;
                  } else if (candidateDoeMin === currentBestDoeMin) {
                    // If DOE min are also equal, compare distance
                    if (
                      (report.distance ?? Infinity) <
                      (bestOptionForStation.distance ?? Infinity)
                    ) {
                      candidateIsBetter = true;
                    }
                  }
                }
                // Implicit else: candidatePrice > currentBestPrice - candidate is not better

                if (candidateIsBetter) {
                  bestOptionForStation = report;
                }
              }
              return bestOptionForStation; // Return the single best option found for this station
            })
            .filter((report): report is BestPrice => report !== null); // Filter out any nulls

          // 3. Sort the final list (cheapest option per station) by the determined best price
          //    (using the same comparison logic as above for sorting)
          cheapestOptionPerStation.sort((a, b) => {
            const priceA = a.price ?? Infinity;
            const priceB = b.price ?? Infinity;
            const doeMinA = a.min_price ?? Infinity;
            const doeMinB = b.min_price ?? Infinity;

            if (priceA !== priceB) return priceA - priceB;
            if (doeMinA !== doeMinB) return doeMinA - doeMinB;
            return (a.distance ?? Infinity) - (b.distance ?? Infinity);
          });

          finalBestPrices = cheapestOptionPerStation;
        }

        // Calculate stats based on the final list
        const stats = finalBestPrices.length
          ? {
              count: finalBestPrices.length, // Count of best prices found (one per fuel type if 'All', or all for specific type)
              averagePrice:
                finalBestPrices.reduce((sum, p) => sum + p.price, 0) /
                finalBestPrices.length,
              lowestPrice: finalBestPrices[0]?.price,
              highestPrice: finalBestPrices[finalBestPrices.length - 1]?.price,
            }
          : null;

        return {
          prices: finalBestPrices, // Return the list of best prices per fuel type (or all for specific type)
          stats,
        };
      } catch (error) {
        console.error('Error fetching best prices:', error);
        throw error;
      }
    },
    ...defaultQueryOptions.prices.best,
    enabled: Boolean(location && enabled),
  });
}

// Export types for consumers
export type { BestPrice };
