import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";

const PAGE_SIZE = 20;

interface Station {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
  // add other station properties as needed
}

interface StationsResponse {
  stations: Station[];
  totalCount: number;
}

export function useStations() {
  return useInfiniteQuery({
    queryKey: ["adminStations"],
    queryFn: async ({ pageParam }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("gas_stations")
        .select("*", { count: "exact" })
        .range(from, to)
        .order("name", { ascending: true });

      if (error) throw error;

      return {
        stations: data as Station[],
        totalCount: count || 0,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: StationsResponse, allPages) => {
      const totalFetched = allPages.length * PAGE_SIZE;
      return totalFetched < lastPage.totalCount ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
