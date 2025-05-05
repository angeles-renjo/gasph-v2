import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '../utils/queryKeys';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';
import { useLocationStore } from '@/hooks/stores/useLocationStore';
import {
  defaultQueryOptions,
  defaultMutationOptions,
} from '../utils/queryOptions';
import { Tables } from '@/utils/supabase/types';

// Use generated type for reference if needed
type ActivePriceReport = Tables<'active_price_reports'>;

interface ConfirmPriceVariables {
  reportId: string;
  stationId: string;
  fuelType?: string; // Added to optimize invalidation
}

interface ConfirmPriceContext {
  previousBestPrices?: unknown;
  previousConfirmationStatus?: boolean;
}

/**
 * Optimized version of usePriceConfirmation that:
 * 1. Uses more targeted query invalidation
 * 2. Implements better optimistic updates
 * 3. Reduces unnecessary refetches
 */
export function usePriceConfirmationOptimized() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Get necessary state for invalidating the favorites prices query
  const defaultFuelType = usePreferencesStore.getState().defaultFuelType;
  const location = useLocationStore.getState().location;

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

    // Optimistic update
    onMutate: async ({ reportId, stationId, fuelType }) => {
      // Create an array of queries to cancel
      const queriesToCancel = [
        // Only cancel the specific best prices query if we have a fuel type
        fuelType
          ? queryKeys.prices.best.list({
              fuelType,
              location,
            })
          : queryKeys.prices.best.all(),
        // Always cancel the confirmation status query
        queryKeys.prices.confirmations.detail(reportId, user?.id),
      ];

      // Cancel all queries in parallel
      await Promise.all(
        queriesToCancel.map((queryKey) =>
          queryClient.cancelQueries({ queryKey })
        )
      );

      // Save the previous values for rollback if needed
      const previousBestPrices = queryClient.getQueryData(
        fuelType
          ? queryKeys.prices.best.list({
              fuelType,
              location,
            })
          : queryKeys.prices.best.all()
      );

      const previousConfirmationStatus = queryClient.getQueryData(
        queryKeys.prices.confirmations.detail(reportId, user?.id)
      );

      // Optimistically update the user's confirmation status
      queryClient.setQueryData(
        queryKeys.prices.confirmations.detail(reportId, user?.id),
        true
      );

      // Return context for potential rollback
      return {
        previousBestPrices,
        previousConfirmationStatus,
      } as ConfirmPriceContext;
    },

    // Handle successful mutation
    onSuccess: (_, { reportId, stationId, fuelType }) => {
      // Explicitly set the user's confirmation status to true
      queryClient.setQueryData(
        queryKeys.prices.confirmations.detail(reportId, user?.id),
        true
      );

      // Create an array of queries to invalidate
      const queriesToInvalidate = [
        // Only invalidate the specific station detail
        queryKeys.stations.detail(stationId),
        // Only invalidate the specific best prices query if we have a fuel type
        fuelType
          ? queryKeys.prices.best.list({
              fuelType,
              location,
            })
          : queryKeys.prices.best.all(),
      ];

      // Invalidate all queries in parallel
      queriesToInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({
          queryKey,
        });
      });

      // If user has favorites, invalidate favorite prices separately
      // (using any to avoid TypeScript errors with complex query keys)
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: ['stations', 'favorites', 'prices'] as any,
          predicate: (query) => {
            // Only invalidate queries for this user
            const key = query.queryKey as any[];
            return key[3] === user.id;
          },
        });
      }
    },

    // Handle errors
    onError: (err, { reportId }, context) => {
      // Show error alert
      Alert.alert(
        'Confirmation Failed',
        'Unable to confirm price. Please try again later.'
      );

      // Revert optimistic updates if we have context
      if (context) {
        // Revert confirmation status
        queryClient.setQueryData(
          queryKeys.prices.confirmations.detail(reportId, user?.id),
          context.previousConfirmationStatus ?? false
        );

        // Revert best prices if we have them
        if (context.previousBestPrices) {
          queryClient.setQueryData(
            queryKeys.prices.best.all(),
            context.previousBestPrices
          );
        }
      }
    },

    // We don't need onSettled anymore since we handle invalidation in onSuccess
    // and rollback in onError

    ...defaultMutationOptions.prices.confirmations,
  });
}

/**
 * Optimized version of useHasConfirmedPrice that:
 * 1. Uses staleTime: 0 to ensure fresh data
 * 2. Uses the subscribed option to disable when screen is not focused
 */
export function useHasConfirmedPriceOptimized(reportId: string) {
  const { user } = useAuth();
  const { useIsFocused } = require('@react-navigation/native');
  const isFocused = useIsFocused();

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
    enabled: !!user && !!reportId && isFocused,
    // Add subscribed option to disable query when screen is not focused
    subscribed: isFocused,
  });
}
