import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";

export function usePriceCycles() {
  return useQuery({
    queryKey: ["priceCycles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_reporting_cycles")
        .select("*")
        .order("cycle_number", { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useCurrentPriceCycle() {
  return useQuery({
    queryKey: ["currentPriceCycle"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_reporting_cycles")
        .select("*")
        .eq("status", "active")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useCreatePriceCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      startDate,
      endDate,
      cycleNumber,
    }: {
      startDate: Date;
      endDate: Date;
      cycleNumber: number;
    }) => {
      const { data, error } = await supabase
        .from("price_reporting_cycles")
        .insert({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          status: "active",
          cycle_number: cycleNumber,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["priceCycles"] });
      queryClient.invalidateQueries({ queryKey: ["currentPriceCycle"] });
    },
  });
}
