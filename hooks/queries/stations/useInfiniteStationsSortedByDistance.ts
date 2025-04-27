import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { Database } from '@/utils/supabase/types';
import { queryKeys } from '../utils/queryKeys';
import { LocationData } from '@/hooks/stores/useLocationStore'; // Assuming LocationData type exists

// Define the structure of the data returned by the Supabase function
// Adjust based on the actual columns returned by your function
export type StationWithDistance =
  Database['public']['Tables']['gas_stations']['Row'] & {
    distance_meters: number;
  };

interface UseInfiniteStationsProps {
  location: LocationData | null; // User's current location
  searchTerm?: string;
  brandFilter?: string | string[]; // Can be a single brand or array of brands
  pageSize?: number;
  enabled?: boolean; // Control whether the query runs
}

const fetchStations = async ({
  pageParam = 1, // pageParam comes from getNextPageParam
  location,
  searchTerm,
  brandFilter,
  pageSize = 20,
}: {
  pageParam?: number;
  location: LocationData;
  searchTerm?: string;
  brandFilter?: string | string[];
  pageSize?: number;
}): Promise<{ stations: StationWithDistance[]; nextPage: number | null }> => {
  if (!location?.latitude || !location?.longitude) {
    throw new Error('Location coordinates are required to fetch stations.');
  }

  const { data, error } = await supabase.rpc(
    'get_stations_sorted_by_distance',
    {
      user_lat: location.latitude,
      user_lon: location.longitude,
      search_term: searchTerm || null, // Pass null if empty/undefined
      brand_filters: brandFilter || null, // Pass null if empty/undefined - note the plural name
      page_num: pageParam,
      page_size: pageSize,
    }
  );

  if (error) {
    console.error('Error fetching stations:', error);
    throw new Error(`Failed to fetch stations: ${error.message}`);
  }

  // Ensure data is an array before checking length
  const stations = Array.isArray(data) ? (data as StationWithDistance[]) : [];
  const nextPage = stations.length === pageSize ? pageParam + 1 : null;

  return { stations, nextPage };
};

export const useInfiniteStationsSortedByDistance = ({
  location,
  searchTerm,
  brandFilter,
  pageSize = 20,
  enabled = true,
}: UseInfiniteStationsProps) => {
  return useInfiniteQuery({
    queryKey: queryKeys.stations.listInfinite({
      location: location
        ? `${location.latitude},${location.longitude}`
        : 'default', // Use a stable key part
      searchTerm,
      brandFilter,
      // fuelTypeFilter, // Add later if needed
    }),
    queryFn: ({ pageParam }) =>
      fetchStations({
        pageParam,
        location: location!, // Assert non-null as enabled depends on it
        searchTerm,
        brandFilter,
        pageSize,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1, // Start fetching from page 1
    enabled: enabled && !!location?.latitude && !!location?.longitude, // Only run if enabled and location is available
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection time
  });
};
