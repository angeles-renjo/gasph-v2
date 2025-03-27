import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "../utils/queryKeys";
import {
  defaultQueryOptions,
  defaultMutationOptions,
} from "../utils/queryOptions";

// Simplified interface with only the fields we need
interface ActivePriceReport {
  id: string;
  station_id: string;
  fuel_type: string;
  price: number;
  user_id: string;
  reported_at: string;
  expires_at: string;
  cycle_id: string;
  station_name: string;
  station_brand: string;
  station_city: string;
  station_latitude: number;
  station_longitude: number;
  reporter_username: string;
  confirmations_count: number;
}

interface ConfirmPriceVariables {
  reportId: string;
  stationId: string;
}

interface ConfirmPriceContext {
  previousBestPrices?: unknown;
  previousStationDetails?: unknown;
}

export function usePriceConfirmation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, stationId }: ConfirmPriceVariables) => {
      if (!user) {
        throw new Error("User must be logged in to confirm prices");
      }

      const { data, error } = await supabase.rpc("confirm_price_report", {
        p_report_id: reportId,
        p_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },

    onMutate: async ({ reportId, stationId }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.prices.best.all(),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.prices.confirmations.detail(reportId, user?.id),
      });

      const previousBestPrices = queryClient.getQueryData(
        queryKeys.prices.best.all()
      );
      const previousStationDetails = queryClient.getQueryData([
        "stationDetails",
        stationId,
      ]);

      // Simplified update focusing only on confirmations_count
      queryClient.setQueriesData(
        { queryKey: queryKeys.prices.best.all() },
        (old: any) => {
          if (!old?.prices) return old;
          return {
            ...old,
            prices: old.prices.map((price: ActivePriceReport) =>
              price.id === reportId
                ? {
                    ...price,
                    confirmations_count: price.confirmations_count + 1,
                  }
                : price
            ),
          };
        }
      );

      queryClient.setQueryData(
        queryKeys.prices.confirmations.detail(reportId, user?.id),
        true
      );

      return {
        previousBestPrices,
        previousStationDetails,
      } as ConfirmPriceContext;
    },

    onError: (err, { reportId }, context) => {
      if (context?.previousBestPrices) {
        queryClient.setQueryData(
          queryKeys.prices.best.all(),
          context.previousBestPrices
        );
      }
      queryClient.setQueryData(
        queryKeys.prices.confirmations.detail(reportId, user?.id),
        false
      );

      Alert.alert(
        "Confirmation Failed",
        "Unable to confirm price. Please try again later."
      );
    },

    onSettled: (_, __, { reportId, stationId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.best.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.confirmations.detail(reportId, user?.id),
      });
      queryClient.invalidateQueries({
        queryKey: ["stationDetails", stationId],
      });
    },

    ...defaultMutationOptions.prices.confirmations,
  });
}

export function useHasConfirmedPrice(reportId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.prices.confirmations.detail(reportId, user?.id),
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from("price_confirmations")
        .select("id")
        .eq("report_id", reportId)
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found"
        throw error;
      }

      return !!data;
    },
    ...defaultQueryOptions.prices.confirmations,
    enabled: !!user && !!reportId,
  });
}
