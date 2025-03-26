import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";
import { GasStation } from "@/constants/gasStations";

interface ImportStationData {
  name: string;
  brand: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  amenities: Record<string, boolean>;
  operating_hours: Record<string, any>;
}

export function useImportStationsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stations: ImportStationData[]) => {
      const { data, error } = await supabase
        .from("gas_stations")
        .upsert(stations, {
          onConflict: "address",
          ignoreDuplicates: true,
        })
        .select();

      if (error) throw error;
      return data as GasStation[];
    },
    onSuccess: () => {
      // Invalidate and refetch stations query
      queryClient.invalidateQueries({ queryKey: ["adminStations"] });
    },
  });
}
