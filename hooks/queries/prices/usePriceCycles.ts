import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";
import { queryKeys } from "../utils/queryKeys";
import { defaultQueryOptions } from "../utils/queryOptions";
import { Alert } from "react-native";

export interface PriceCycle {
  id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  status: "active" | "completed" | "archived";
  doe_import_date?: string;
  created_at: string;
}

interface CreatePriceCycleParams {
  startDate: Date;
  endDate: Date;
}

export function usePriceCycles(includeArchived = false) {
  const queryClient = useQueryClient();

  // Fetch all price cycles
  const cyclesQuery = useQuery({
    queryKey: [...queryKeys.prices.cycles.list(), { includeArchived }],
    queryFn: async () => {
      let query = supabase
        .from("price_reporting_cycles")
        .select("*")
        .order("cycle_number", { ascending: false });

      if (!includeArchived) {
        query = query.neq("status", "archived");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PriceCycle[];
    },
    ...defaultQueryOptions.prices,
  });

  // Get current active cycle
  const activeCycleQuery = useQuery({
    queryKey: queryKeys.prices.cycles.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_reporting_cycles")
        .select("*")
        .eq("status", "active")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as PriceCycle | null;
    },
    ...defaultQueryOptions.prices,
  });

  // Get next cycle number
  const nextCycleNumberQuery = useQuery({
    queryKey: queryKeys.prices.cycles.nextNumber(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_reporting_cycles")
        .select("cycle_number")
        .order("cycle_number", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return (data?.cycle_number || 0) + 1;
    },
    ...defaultQueryOptions.prices,
  });

  // Create cycle mutation
  const createCycleMutation = useMutation({
    mutationFn: async ({
      startDate,
      endDate,
    }: CreatePriceCycleParams): Promise<PriceCycle> => {
      const nextCycleNumber = nextCycleNumberQuery.data || 1;

      const { data, error } = await supabase
        .from("price_reporting_cycles")
        .insert({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "active",
          cycle_number: nextCycleNumber,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PriceCycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.all(),
      });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create price cycle");
    },
  });

  // Archive cycle mutation
  const archiveCycleMutation = useMutation({
    mutationFn: async (cycleId: string): Promise<string> => {
      const { error } = await supabase
        .from("price_reporting_cycles")
        .update({ status: "archived" })
        .eq("id", cycleId);

      if (error) throw error;
      return cycleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.all(),
      });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to archive cycle");
    },
  });

  // Activate cycle mutation
  const activateCycleMutation = useMutation({
    mutationFn: async (cycleId: string): Promise<string> => {
      const { error } = await supabase
        .from("price_reporting_cycles")
        .update({ status: "active" })
        .eq("id", cycleId);

      if (error) throw error;
      return cycleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.all(),
      });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to activate cycle");
    },
  });

  return {
    // Query Results
    cycles: cyclesQuery.data || [],
    activeCycle: activeCycleQuery.data,
    nextCycleNumber: nextCycleNumberQuery.data || 1,

    // Loading States
    isLoading: cyclesQuery.isLoading || activeCycleQuery.isLoading,
    isRefetching: cyclesQuery.isRefetching,

    // Error State
    error: cyclesQuery.error || activeCycleQuery.error,

    // Refetch Function
    refetch: () => {
      cyclesQuery.refetch();
      activeCycleQuery.refetch();
      nextCycleNumberQuery.refetch();
    },

    // Mutations and their states
    createCycle: createCycleMutation.mutateAsync,
    isCreating: createCycleMutation.isPending,
    archiveCycle: archiveCycleMutation.mutateAsync,
    isArchiving: archiveCycleMutation.isPending,
    activateCycle: activateCycleMutation.mutateAsync,
    isActivating: activateCycleMutation.isPending,
  };
}
