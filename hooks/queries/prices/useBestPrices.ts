import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '../utils/queryKeys';
import { defaultQueryOptions } from '../utils/queryOptions';
import type { LocationData } from '@/hooks/useLocation';
import { calculateDistance } from '@/lib/geo';

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
  expires_at: string;
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

// Extend with distance property
interface BestPrice extends PriceReportSelect {
  distance?: number;
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

        let query = supabase
          .from('active_price_reports')
          .select(
            `
            id,
            station_id,
            fuel_type,
            price,
            user_id,
            reported_at,
            expires_at,
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
          )
          .order('price', { ascending: true });

        // Only add the fuel type filter if one is specified
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

        // 1. Calculate distance and filter
        const reportsWithDistance = (data as PriceReportSelect[])
          .map((report) => ({
            ...report,
            distance: calculateDistance(location, {
              latitude: report.station_latitude,
              longitude: report.station_longitude,
            }),
          }))
          .filter((report) => {
            const distance = report.distance as number;
            return !isNaN(distance) && distance <= maxDistance;
          });

        let finalBestPrices: BestPrice[];

        if (fuelType) {
          // If a specific fuel type is selected, just sort the filtered reports by price
          reportsWithDistance.sort((a, b) => {
            if (a.price !== b.price) {
              return a.price - b.price;
            }
            return (a.distance ?? Infinity) - (b.distance ?? Infinity);
          });
          finalBestPrices = reportsWithDistance; // Use all reports for the specific fuel type
        } else {
          // If "All Types" is selected, find the best price for EACH fuel type
          // 1. Group by fuel_type
          const reportsByFuelType = reportsWithDistance.reduce<
            Record<string, BestPrice[]>
          >((acc, report) => {
            if (!acc[report.fuel_type]) {
              acc[report.fuel_type] = [];
            }
            acc[report.fuel_type].push(report);
            return acc;
          }, {});

          // 2. Select the best report (lowest price) for each fuel type
          const bestPricePerFuelType: BestPrice[] = Object.values(
            reportsByFuelType
          )
            .map((fuelTypeReports) => {
              // Sort reports within the fuel type group by price (ascending), then distance
              fuelTypeReports.sort((a, b) => {
                if (a.price !== b.price) {
                  return a.price - b.price;
                }
                return (a.distance ?? Infinity) - (b.distance ?? Infinity);
              });
              return fuelTypeReports[0]; // The first one is the best for this fuel type
            })
            .filter((report): report is BestPrice => !!report); // Filter out any undefined cases

          // 3. Sort the final list (containing best price for each fuel type) by price
          bestPricePerFuelType.sort((a, b) => a.price - b.price);
          finalBestPrices = bestPricePerFuelType;
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
