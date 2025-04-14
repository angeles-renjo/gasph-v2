import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '../utils/queryKeys';
import { defaultQueryOptions } from '../utils/queryOptions';
import type { GasStation } from './useNearbyStations'; // Reuse the updated GasStation type
import type { FuelType } from '../prices/useBestPrices'; // Import FuelType

/**
 * Fetches all active gas stations along with the price for a specific fuel type
 * from the active price report, if available.
 *
 * @param fuelType The fuel type to fetch the price for. If null, prices won't be joined.
 */
export function useStationsWithPrices(fuelType: FuelType | null) {
  // Define a query key that includes the fuel type for proper caching
  const stationsWithPricesQueryKey = queryKeys.stations.listWithPrice(
    fuelType ?? 'none' // Use 'none' or similar if fuelType is null
  );

  return useQuery({
    queryKey: stationsWithPricesQueryKey,
    queryFn: async (): Promise<GasStation[]> => {
      // Base query selects all columns from gas_stations and the price from the joined report
      // The join is conditional based on fuelType being provided
      let query = supabase
        .from('gas_stations')
        .select(
          `
          *,
          active_price_reports (
            price
          )
        `
        )
        .eq('status', 'active');

      // If a fuelType is provided, filter the joined active_price_reports
      if (fuelType) {
        query = query.eq('active_price_reports.fuel_type', fuelType);
      } else {
        // If no fuelType, ensure we don't accidentally filter by it
        // This might require adjusting the select if Supabase errors on filtering a non-existent join column
        // A safer approach might be to conditionally add the join/select, but let's try this first.
        // Re-selecting without the join filter if fuelType is null.
        // NOTE: Supabase might fetch the join regardless, returning nulls if the inner condition isn't met.
        // Let's refine the select to handle the null fuelType case more explicitly.

        // Revised approach: Always join, but the price will only populate if the fuel type matches.
        // The select needs to correctly handle the potentially empty array from the join.
        query = supabase
          .from('gas_stations')
          .select(
            `
            id, name, brand, address, city, province, latitude, longitude, amenities, operating_hours, status, created_at, updated_at,
            active_price_reports!left ( price ) 
          `
          )
          .eq('status', 'active');
        // Apply the fuel_type filter only if fuelType is not null
        if (fuelType) {
          query = query.eq('active_price_reports.fuel_type', fuelType);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching stations with prices:', error);
        throw new Error(
          error.message || 'Failed to fetch stations with prices'
        );
      }

      // Process data: Extract the price from the nested structure
      const processedData = (data || []).map((station: any) => {
        // The join returns an array, potentially empty or with one item
        const priceReport = station.active_price_reports?.[0];
        return {
          ...station,
          active_price_reports: undefined, // Remove the nested structure
          price: priceReport?.price ?? null, // Extract price or set to null
        } as GasStation; // Cast to the updated GasStation type
      });

      return processedData;
    },
    // Use general list options or define specific ones if needed
    ...(defaultQueryOptions.stations.list ?? {}),
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    enabled: !!fuelType, // Only enable the query if a fuelType is provided
  });
}

// Need to add the 'listWithPrice' key to queryKeys
// This should be done in hooks/queries/utils/queryKeys.ts
