import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '../utils/queryKeys';
import type { FuelType } from '../prices/useBestPrices';

// Define the expected return type for the DOE price query
type DoePriceData = {
  common_price: number | null;
  min_price: number | null;
  max_price: number | null;
  source_type: string | null;
} | null; // Can be null if no data found

export const useStationDoePrice = (
  stationId: string | null | undefined,
  fuelType: FuelType | null | undefined
) => {
  return useQuery<DoePriceData, Error>({
    queryKey: queryKeys.stations.doePrice(stationId ?? '', fuelType ?? ''),
    queryFn: async (): Promise<DoePriceData> => {
      if (!stationId || !fuelType) return null; // Return null if inputs are invalid

      // Assuming fuelType is like 'diesel', 'gasoline_95' etc.
      // Adjust if your DB expects different format (e.g., uppercase)
      const dbFuelType = fuelType.toUpperCase(); // Adjust if needed

      const { data, error } = await supabase
        .from('doe_price_view')
        .select('common_price, min_price, max_price, source_type')
        .eq('gas_station_id', stationId)
        .eq('fuel_type', dbFuelType)
        .maybeSingle(); // Use maybeSingle to handle 0 or 1 row

      if (error) {
        console.error('Error fetching DOE price view:', error);
        throw error;
      }
      return data; // Returns the single row object or null
    },
    enabled: !!stationId && !!fuelType, // Only run query if both IDs are provided
    staleTime: 60 * 60 * 1000, // Cache for 1 hour (adjust as needed)
    gcTime: 90 * 60 * 1000, // Garbage collect after 90 minutes
  });
};
