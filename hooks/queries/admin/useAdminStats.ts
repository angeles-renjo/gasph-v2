import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";
import { queryKeys } from "../utils/queryKeys";
import { defaultQueryOptions } from "../utils/queryOptions";

interface AdminStats {
  stationsCount: number;
  activeCyclesCount: number;
  usersCount: number;
  lastImportDate: string | null;
}

export function useAdminStats() {
  return useQuery<AdminStats, Error>({
    queryKey: queryKeys.admin.stats.all(),
    queryFn: async (): Promise<AdminStats> => {
      // Get stations count
      const { count: stationsCount, error: stationsError } = await supabase
        .from("gas_stations")
        .select("*", { count: "exact", head: true });

      if (stationsError) throw stationsError;

      // Get active cycles count
      const { count: activeCyclesCount, error: cyclesError } = await supabase
        .from("price_reporting_cycles")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      if (cyclesError) throw cyclesError;

      // Get users count
      const { count: usersCount, error: usersError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      // Get last import date
      const { data: lastImport, error: importError } = await supabase
        .from("gas_stations")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (importError && importError.code !== "PGRST116") throw importError;

      return {
        stationsCount: stationsCount || 0,
        activeCyclesCount: activeCyclesCount || 0,
        usersCount: usersCount || 0,
        lastImportDate: lastImport?.created_at || null,
      };
    },
    ...defaultQueryOptions.admin.stats,
  });
}
