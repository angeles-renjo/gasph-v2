import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '../utils/queryKeys';
import { defaultQueryOptions } from '../utils/queryOptions';
import { InfiniteData } from '@tanstack/react-query';

const PAGE_SIZE = 20;

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

// Add searchTerm parameter
export function useStations(searchTerm?: string) {
  // Define the specific query key type based on queryKeys.ts
  type StationsQueryKey = ReturnType<typeof queryKeys.admin.stations.list>;

  return useInfiniteQuery<
    StationsResponse,
    Error,
    InfiniteData<StationsResponse>,
    StationsQueryKey, // Use the specific query key type
    number
  >({
    // Pass searchTerm to queryKey function
    queryKey: queryKeys.admin.stations.list(searchTerm),
    queryFn: async ({ pageParam = 0 }) => {
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
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: StationsResponse, allPages) => {
      const totalFetched = allPages.length * PAGE_SIZE;
      return totalFetched < lastPage.totalCount ? allPages.length : undefined;
    },
    ...defaultQueryOptions.admin.stations,
  });
}

// Export types for use in other files
export type { GasStation, StationsResponse };
