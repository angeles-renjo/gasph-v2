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
  // Explicitly select existing columns
  const columnsToSelect =
    'id, doe_import_date, created_at, cycle_number, status';
  const query = supabase
    .from('price_reporting_cycles')
    .select(columnsToSelect)
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
// Removed startDate and endDate from variables
interface CreateCycleVariables {} // Now empty

async function createPriceCycle(
  // Removed startDate and endDate parameters
  variables: CreateCycleVariables // Keep variables object for consistency, even if empty
): Promise<PriceCycle> {
  // Get the next cycle number
  const { data: maxCycleData, error: maxCycleError } = await supabase
    .from('price_reporting_cycles')
    .select('cycle_number')
    .order('cycle_number', { ascending: false })
    .limit(1)
    .single();

  // Allow PGRST116 (No rows found) - means this is the first cycle
  if (maxCycleError && maxCycleError.code !== 'PGRST116') {
    +console.error(
      '[createPriceCycle] Error fetching max cycle number:',
      maxCycleError
    );
    throw maxCycleError;
  }
  // Changed to console.log for non-error message
  +console.log(
    '[createPriceCycle] Max cycle number fetched successfully (or first cycle). Next number calculation...'
  );
  const nextCycleNumber = (maxCycleData?.cycle_number || 0) + 1;

  // Insert the new cycle (status defaults to 'active' via trigger/default)
  // Changed to console.log for non-error message
  +console.log(
    `[createPriceCycle] Attempting to insert new cycle #${nextCycleNumber}...`
  );
  const { data, error } = await supabase
    .from('price_reporting_cycles')
    .insert({
      // Removed start_date and end_date
      cycle_number: nextCycleNumber,
      // status: 'active', // Rely on trigger/default if possible
    })
    .select()
    .single();

  if (error) {
    +console.error('[createPriceCycle] Error inserting new cycle:', error);
    throw error;
  }
  if (!data) {
    +console.error(
      '[createPriceCycle] Failed to create cycle, no data returned from insert.'
    );
    throw new Error('Failed to create cycle, no data returned.');
  }

  // Changed to console.log for non-error message
  +console.log(
    `[createPriceCycle] Cycle #${nextCycleNumber} created successfully.`
  );
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
      // Invalidate specific list queries that might be active
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.list({ showArchived: true }), // Invalidate the key used by CyclesScreen
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.list({ showArchived: false }), // Invalidate the key for non-archived view (likely used elsewhere)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.list(), // Invalidate base key too
      });
      // Invalidate active cycle query
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.active(), // Keep this invalidation
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
  +console.log(
    `[updateCycleStatus] Attempting to update cycle ${cycleId} to status: ${status}`
  );
  if (status === 'active') {
    // Special logic for activation: deactivate others first
    +console.log(
      `[updateCycleStatus] Activating cycle ${cycleId}, first deactivating other active cycles...`
    );
    const { error: deactivateError } = await supabase
      .from('price_reporting_cycles')
      .update({ status: 'completed' }) // Set others to completed
      .neq('id', cycleId)
      .eq('status', 'active');

    if (deactivateError) {
      +console.error(
        `[updateCycleStatus] Error deactivating other cycles while activating ${cycleId}:`,
        deactivateError
      );
      throw deactivateError;
    }
    +console.log(
      `[updateCycleStatus] Deactivation of other cycles successful (or none to deactivate).`
    );
  }

  // Update the target cycle's status
  +console.log(
    `[updateCycleStatus] Updating target cycle ${cycleId} status to ${status}...`
  );
  const { error } = await supabase
    .from('price_reporting_cycles')
    .update({ status })
    .eq('id', cycleId);

  if (error) {
    +console.error(
      `[updateCycleStatus] Error updating cycle ${cycleId} to status ${status}:`,
      error
    );
    throw error;
  }
  +console.log(
    `[updateCycleStatus] Successfully updated cycle ${cycleId} to status ${status}.`
  );
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
      // Invalidate specific list queries that might be active
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.list({ showArchived: true }), // Invalidate the key used by CyclesScreen
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.list({ showArchived: false }), // Invalidate the key for non-archived view
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.list(), // Invalidate base key too
      });
      // Invalidate active cycle query
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices.cycles.active(), // Keep this invalidation
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
