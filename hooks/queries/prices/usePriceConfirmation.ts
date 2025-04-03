import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '../utils/queryKeys';
import {
  defaultQueryOptions,
  defaultMutationOptions,
} from '../utils/queryOptions';
import { Tables } from '@/utils/supabase/types'; // Import generated types

// Use generated type for reference if needed, but not strictly required for optimistic update logic now
type ActivePriceReport = Tables<'active_price_reports'>;

interface ConfirmPriceVariables {
  reportId: string;
  stationId: string;
}

interface ConfirmPriceContext {
  previousBestPrices?: unknown;
  // previousStationDetails removed
}

export function usePriceConfirmation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, stationId }: ConfirmPriceVariables) => {
      if (!user) {
        throw new Error('User must be logged in to confirm prices');
      }

      const { data, error } = await supabase.rpc('confirm_price_report', {
        p_report_id: reportId,
        p_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },

    // Note: We still keep the optimistic update for better UX
    onMutate: async ({ reportId, stationId }) => {
      // Cancel any outgoing refetches to avoid them overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.prices.best.all(),
      });
      // await queryClient.cancelQueries({ // Keep cancellation for consistency? Or remove if not updating? Let's keep it for now.
      //   queryKey: queryKeys.stations.detail(stationId),
      // });
      await queryClient.cancelQueries({
        queryKey: queryKeys.prices.confirmations.detail(reportId, user?.id), // Keep this cancellation
      });

      // Save the previous values for rollback if needed
      const previousBestPrices = queryClient.getQueryData(
        queryKeys.prices.best.all()
      );
      // Remove fetching previous station details
      // const previousStationDetails = queryClient.getQueryData(
      //   queryKeys.stations.detail(stationId)
      // );

      // Optimistically update the best prices list if it exists in cache
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
                    // Handle potential null with ?? 0 before incrementing
                    confirmations_count: (price.confirmations_count ?? 0) + 1,
                  }
                : price
            ),
          };
        }
      );

      // --- Remove optimistic update for station details ---
      // queryClient.setQueryData(
      //   queryKeys.stations.detail(stationId),
      //   (old: any) => {
      //     // ... logic removed ...
      //   }
      // );
      // --- End removal ---

      // Optimistically update the user's confirmation status
      queryClient.setQueryData(
        queryKeys.prices.confirmations.detail(reportId, user?.id),
        true
      );

      // Return context without previousStationDetails
      return {
        previousBestPrices,
      } as ConfirmPriceContext;
    },

    // Handle successful mutation
    onSuccess: (_, { reportId, stationId }) => {
      // Explicitly set the user's confirmation status to true
      queryClient.setQueryData(
        queryKeys.prices.confirmations.detail(reportId, user?.id),
        true
      );

      // Invalidate queries to ensure all UI components update properly
      queryClient.invalidateQueries({
        queryKey: queryKeys.stations.detail(stationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.best.all(),
      });
    },

    // Handle errors
    onError: (err, { reportId, stationId }, context) => {
      // Revert optimistic updates
      if (context?.previousBestPrices) {
        queryClient.setQueryData(
          queryKeys.prices.best.all(),
          context.previousBestPrices
        );
      }

      // Remove rollback for station details
      // if (context?.previousStationDetails) {
      //   queryClient.setQueryData(
      //     queryKeys.stations.detail(stationId),
      //     context.previousStationDetails
      //   );
      // }

      // Reset confirmation status
      queryClient.setQueryData(
        queryKeys.prices.confirmations.detail(reportId, user?.id),
        false
      );

      Alert.alert(
        'Confirmation Failed',
        'Unable to confirm price. Please try again later.'
      );
    },

    // Regardless of success or error, make sure all queries have fresh data
    onSettled: (_, __, { reportId, stationId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.best.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.confirmations.detail(reportId, user?.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stations.detail(stationId),
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
        .from('price_confirmations')
        .select('id')
        .eq('report_id', reportId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found"
        throw error;
      }

      return !!data;
    },
    ...defaultQueryOptions.prices.confirmations,
    // Ensure this query doesn't cache results for too long
    staleTime: 0,
    enabled: !!user && !!reportId,
  });
}
