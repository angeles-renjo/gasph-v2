import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '../utils/queryKeys';
import { defaultQueryOptions } from '../utils/queryOptions';
import type { GasStation } from './useNearbyStations'; // Reuse the GasStation type

/**
 * Fetches all active gas stations from the database.
 */
export function useAllStations() {
  // Define the query key for fetching all stations
  // It should be distinct from the general 'list' key if that exists elsewhere
  const allStationsQueryKey = [
    ...queryKeys.stations.all,
    'all-active',
  ] as const;

  return useQuery({
    queryKey: allStationsQueryKey, // Use the defined key
    queryFn: async (): Promise<GasStation[]> => {
      const { data, error } = await supabase
        .from('gas_stations')
        .select('*')
        .eq('status', 'active'); // Only select active stations

      if (error) {
        console.error('Error fetching all stations:', error);
        throw new Error(error.message || 'Failed to fetch all stations');
      }

      // No distance calculation or filtering needed here
      return (data || []) as GasStation[];
    },
    // Use general list options or define specific ones if needed
    // Since defaultQueryOptions.stations.all doesn't exist, let's use list options for now
    // or remove if no defaults are applicable
    ...(defaultQueryOptions.stations.list ?? {}), // Use list options or empty object
    staleTime: 5 * 60 * 1000, // Example: Keep data fresh for 5 minutes (can override defaults)
  });
}
