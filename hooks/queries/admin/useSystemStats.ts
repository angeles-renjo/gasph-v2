import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";

export function useSystemStats() {
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const [stations, users, reports] = await Promise.all([
        supabase
          .from("gas_stations")
          .select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("user_price_reports")
          .select("*", { count: "exact", head: true }),
      ]);

      if (stations.error) throw stations.error;
      if (users.error) throw users.error;
      if (reports.error) throw reports.error;

      return {
        stationCount: stations.count || 0,
        userCount: users.count || 0,
        priceReportCount: reports.count || 0,
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
