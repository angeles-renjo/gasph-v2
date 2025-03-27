import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";
import { queryKeys } from "../utils/queryKeys";

interface ImportStationData {
  name: string;
  brand: string;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  amenities: Record<string, boolean>;
  operating_hours: Record<string, string>;
  status: "active";
}

interface GasStation extends ImportStationData {
  id: string;
  created_at: string;
  updated_at: string;
}

export function useImportStationsMutation() {
  const queryClient = useQueryClient();

  return useMutation<GasStation[], Error, ImportStationData[]>({
    mutationFn: async (stations) => {
      const { data, error } = await supabase
        .from("gas_stations")
        .upsert(
          stations.map((station) => ({
            ...station,
            status: "active",
            amenities: station.amenities || {},
            operating_hours: station.operating_hours || {},
          })),
          {
            onConflict: "name,address",
            ignoreDuplicates: true,
          }
        )
        .select();

      if (error) throw error;
      return data as GasStation[];
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.stations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.stats.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stations.all,
      });
    },
    onError: (error) => {
      console.error("Station import failed:", error);
      // You might want to handle this error in the UI component
    },
  });
}
