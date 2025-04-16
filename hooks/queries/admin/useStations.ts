import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '../utils/queryKeys';
import { defaultQueryOptions } from '../utils/queryOptions';
import { InfiniteData, QueryFunctionContext } from '@tanstack/react-query'; // Import QueryFunctionContext

const PAGE_SIZE = 20;

// Define GasStation interface locally or import if shared
interface GasStation {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  amenities: Record<string, boolean>;
  operating_hours: Record<string, string>;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface StationsResponse {
  stations: GasStation[];
  totalCount: number;
}

// Extracted query function for fetching a page of admin stations
export const fetchAdminStationsPage = async ({
  pageParam = 0,
  queryKey,
}: QueryFunctionContext<
  ReturnType<typeof queryKeys.admin.stations.list>,
  number // Type of pageParam
>): Promise<StationsResponse> => {
  // Extract searchTerm from the queryKey (structure: ['admin', 'stations', 'list', { searchTerm: string }])
  const [_1, _2, _3, params] = queryKey;
  const searchTerm = params?.searchTerm;

  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('gas_stations')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('name', { ascending: true });

  // Conditionally add search filter
  if (searchTerm && searchTerm.trim()) {
    const cleanedSearchTerm = searchTerm.trim();
    const ilikePattern = `%${cleanedSearchTerm}%`;
    query = query.or(
      `name.ilike.${ilikePattern},brand.ilike.${ilikePattern},city.ilike.${ilikePattern},address.ilike.${ilikePattern}`
    );
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    stations: data as GasStation[],
    totalCount: count || 0,
  };
};

// Hook for fetching paginated admin stations
export function useStations(searchTerm?: string) {
  // Define the specific query key type based on queryKeys.ts
  type StationsQueryKey = ReturnType<typeof queryKeys.admin.stations.list>;

  return useInfiniteQuery<
    StationsResponse,
    Error,
    InfiniteData<StationsResponse>, // Data type
    StationsQueryKey, // QueryKey type
    number // PageParam type
  >({
    queryKey: queryKeys.admin.stations.list(searchTerm), // Pass searchTerm to queryKey function
    queryFn: fetchAdminStationsPage, // Use the extracted function
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Correctly calculate the next page parameter based on fetched items
      const totalFetched = allPages.reduce(
        (sum, page) => sum + page.stations.length,
        0
      );
      return totalFetched < lastPage.totalCount ? allPages.length : undefined;
    },
    ...defaultQueryOptions.admin.stations, // Apply default options if available
  });
}

// Export types for use in other files if needed elsewhere
export type { GasStation, StationsResponse };
