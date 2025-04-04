import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '../utils/queryKeys';
import {
  defaultQueryOptions,
  defaultMutationOptions,
} from '../utils/queryOptions';
import { Tables } from '@/utils/supabase/types';

export type PriceCycle = Tables<'price_reporting_cycles'>;

// --- Query Hook ---

interface UsePriceCyclesParams {
  showArchived?: boolean;
}

async function fetchPriceCycles({
  showArchived = false,
}: UsePriceCyclesParams): Promise<PriceCycle[]> {
  const query = supabase
    .from('price_reporting_cycles')
    .select('*')
    .order('cycle_number', { ascending: false });

  if (!showArchived) {
    query.neq('status', 'archived');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching price cycles:', error);
    throw new Error(error.message || 'Failed to load price cycles');
  }

  return data || [];
}

export function usePriceCycles({ showArchived = false }: UsePriceCyclesParams) {
  return useQuery({
    queryKey: queryKeys.prices.cycles.list({ showArchived }), // Include filter in key
    queryFn: () => fetchPriceCycles({ showArchived }),
    ...defaultQueryOptions.prices.cycles,
  });
}

// --- Mutation Hooks ---

// == Create Cycle ==
interface CreateCycleVariables {
  startDate: Date;
  endDate: Date;
}

async function createPriceCycle({
  startDate,
  endDate,
}: CreateCycleVariables): Promise<PriceCycle> {
  // Get the next cycle number
  const { data: maxCycleData, error: maxCycleError } = await supabase
    .from('price_reporting_cycles')
    .select('cycle_number')
    .order('cycle_number', { ascending: false })
    .limit(1)
    .single();

  // Allow PGRST116 (No rows found) - means this is the first cycle
  if (maxCycleError && maxCycleError.code !== 'PGRST116') {
    throw maxCycleError;
  }
  const nextCycleNumber = (maxCycleData?.cycle_number || 0) + 1;

  // Insert the new cycle (status defaults to 'active' via trigger/default)
  const { data, error } = await supabase
    .from('price_reporting_cycles')
    .insert({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      cycle_number: nextCycleNumber,
      // status: 'active', // Rely on trigger/default if possible
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create cycle, no data returned.');

  return data;
}

export function useCreatePriceCycleMutation() {
  const queryClient = useQueryClient();
  return useMutation<PriceCycle, Error, CreateCycleVariables>({
    mutationFn: createPriceCycle,
    onSuccess: (newCycle) => {
      Alert.alert(
        'Success',
        `New price cycle #${newCycle.cycle_number} created successfully.`
      );
      // Invalidate all cycle lists to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.list(),
      });
      // Potentially invalidate active cycle query if one exists
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.active(),
      });
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to create price cycle');
    },
    ...defaultMutationOptions.prices.cycles,
  });
}

// == Update Cycle Status (Activate/Archive) ==
interface UpdateCycleStatusVariables {
  cycleId: string;
  status: 'active' | 'archived'; // Only allow activating or archiving via this hook
}

async function updateCycleStatus({
  cycleId,
  status,
}: UpdateCycleStatusVariables): Promise<void> {
  if (status === 'active') {
    // Special logic for activation: deactivate others first
    const { error: deactivateError } = await supabase
      .from('price_reporting_cycles')
      .update({ status: 'completed' }) // Set others to completed
      .neq('id', cycleId)
      .eq('status', 'active');

    if (deactivateError) throw deactivateError;
  }

  // Update the target cycle's status
  const { error } = await supabase
    .from('price_reporting_cycles')
    .update({ status })
    .eq('id', cycleId);

  if (error) throw error;
}

export function useUpdatePriceCycleStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, UpdateCycleStatusVariables>({
    mutationFn: updateCycleStatus,
    onSuccess: (_, variables) => {
      Alert.alert(
        'Success',
        `Cycle successfully ${
          variables.status === 'active' ? 'activated' : 'archived'
        }.`
      );
      // Invalidate all cycle lists and active cycle query
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.list(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.active(),
      });
    },
    onError: (error, variables) => {
      Alert.alert(
        'Error',
        error.message ||
          `Failed to ${
            variables.status === 'active' ? 'activate' : 'archive'
          } cycle`
      );
    },
    ...defaultMutationOptions.prices.cycles,
  });
}
