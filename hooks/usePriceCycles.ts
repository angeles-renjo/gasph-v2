// hooks/usePriceCycles.ts
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { Alert } from 'react-native';

export type PriceCycle = {
  id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  status: 'active' | 'completed' | 'archived';
  doe_import_date: string | null;
  created_at: string;
};

export function usePriceCycles(includeArchived = false) {
  const queryClient = useQueryClient();

  // Fetch all price cycles
  const cyclesQuery = useQuery({
    queryKey: ['priceCycles', includeArchived],
    queryFn: async () => {
      let query = supabase
        .from('price_reporting_cycles')
        .select('*')
        .order('cycle_number', { ascending: false });

      if (!includeArchived) {
        query = query.neq('status', 'archived');
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as PriceCycle[];
    },
  });

  // Get current active cycle
  const activeCycleQuery = useQuery({
    queryKey: ['activePriceCycle'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_reporting_cycles')
        .select('*')
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data as PriceCycle | null;
    },
  });

  // Get next cycle number
  const nextCycleNumberQuery = useQuery({
    queryKey: ['nextCycleNumber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_reporting_cycles')
        .select('cycle_number')
        .order('cycle_number', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return (data?.cycle_number || 0) + 1;
    },
  });

  // Create a new cycle
  const createCycleMutation = useMutation({
    mutationFn: async ({
      startDate,
      endDate,
    }: {
      startDate: Date;
      endDate: Date;
    }) => {
      const nextCycleNumber = nextCycleNumberQuery.data || 1;

      const { data, error } = await supabase
        .from('price_reporting_cycles')
        .insert({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          status: 'active',
          cycle_number: nextCycleNumber,
        })
        .select()
        .single();

      if (error) throw error;

      return data as PriceCycle;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['priceCycles'] });
      queryClient.invalidateQueries({ queryKey: ['activePriceCycle'] });
      queryClient.invalidateQueries({ queryKey: ['nextCycleNumber'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create price cycle');
    },
  });

  // Archive a cycle
  const archiveCycleMutation = useMutation({
    mutationFn: async (cycleId: string) => {
      const { error } = await supabase
        .from('price_reporting_cycles')
        .update({ status: 'archived' })
        .eq('id', cycleId);

      if (error) throw error;

      return cycleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceCycles'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to archive cycle');
    },
  });

  // Activate a cycle
  const activateCycleMutation = useMutation({
    mutationFn: async (cycleId: string) => {
      const { error } = await supabase
        .from('price_reporting_cycles')
        .update({ status: 'active', is_active: true })
        .eq('id', cycleId);

      if (error) throw error;

      return cycleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceCycles'] });
      queryClient.invalidateQueries({ queryKey: ['activePriceCycle'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to activate cycle');
    },
  });

  return {
    cycles: cyclesQuery.data || [],
    activeCycle: activeCycleQuery.data,
    nextCycleNumber: nextCycleNumberQuery.data || 1,
    isLoading: cyclesQuery.isLoading || activeCycleQuery.isLoading,
    isRefetching: cyclesQuery.isRefetching,
    error: cyclesQuery.error || activeCycleQuery.error,
    refetch: () => {
      cyclesQuery.refetch();
      activeCycleQuery.refetch();
      nextCycleNumberQuery.refetch();
    },
    createCycle: createCycleMutation.mutate,
    isCreating: createCycleMutation.isPending,
    archiveCycle: archiveCycleMutation.mutate,
    isArchiving: archiveCycleMutation.isPending,
    activateCycle: activateCycleMutation.mutate,
    isActivating: activateCycleMutation.isPending,
  };
}
