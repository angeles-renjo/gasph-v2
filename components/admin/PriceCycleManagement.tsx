import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { supabase } from '@/utils/supabase/supabase';
import { Button } from '@/components/ui/Button';
import { PriceCycleCard } from '@/components/admin/PriceCycleCard';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { formatDate } from '@/utils/formatters';

export function PriceCycleManagement() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [creatingCycle, setCreatingCycle] = useState(false);

  const fetchCycles = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = supabase
        .from('price_reporting_cycles')
        .select('*')
        .order('cycle_number', { ascending: false });

      if (!showArchived) {
        query.neq('status', 'archived');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setCycles(data || []);
    } catch (err: any) {
      console.error('Error fetching price cycles:', err);
      setError(err.message || 'Failed to load price cycles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, [showArchived]);

  const createNewCycle = async () => {
    try {
      setCreatingCycle(true);

      // Set dates for new cycle
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // 1 week cycle

      // Get the next cycle number
      const { data: maxCycleData, error: maxCycleError } = await supabase
        .from('price_reporting_cycles')
        .select('cycle_number')
        .order('cycle_number', { ascending: false })
        .limit(1)
        .single();

      if (maxCycleError && maxCycleError.code !== 'PGRST116') {
        throw maxCycleError;
      }

      const nextCycleNumber = (maxCycleData?.cycle_number || 0) + 1;

      // Create new cycle
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

      Alert.alert(
        'Success',
        `New price cycle #${nextCycleNumber} created successfully.`
      );
      fetchCycles();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create price cycle');
    } finally {
      setCreatingCycle(false);
    }
  };

  const archiveCycle = async (cycleId: string) => {
    try {
      Alert.alert(
        'Archive Cycle',
        'Are you sure you want to archive this cycle? This will make its data less visible in the app.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Archive',
            style: 'destructive',
            onPress: async () => {
              const { error } = await supabase
                .from('price_reporting_cycles')
                .update({ status: 'archived' })
                .eq('id', cycleId);

              if (error) throw error;

              Alert.alert('Success', 'Cycle archived successfully.');
              fetchCycles();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to archive cycle');
    }
  };

  const activateCycle = async (cycleId: string) => {
    try {
      Alert.alert(
        'Activate Cycle',
        'Activating this cycle will set all other cycles to inactive. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate',
            onPress: async () => {
              const { error } = await supabase
                .from('price_reporting_cycles')
                .update({ is_active: true, status: 'active' })
                .eq('id', cycleId);

              if (error) throw error;

              Alert.alert('Success', 'Cycle activated successfully.');
              fetchCycles();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to activate cycle');
    }
  };

  if (loading && cycles.length === 0) {
    return <LoadingIndicator message='Loading price cycles...' />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchCycles} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Price Reporting Cycles</Text>
        <Button
          title='Create New Cycle'
          onPress={createNewCycle}
          loading={creatingCycle}
        />
      </View>

      <View style={styles.filterContainer}>
        <Button
          title={showArchived ? 'Hide Archived' : 'Show Archived'}
          variant='outline'
          size='small'
          onPress={() => setShowArchived(!showArchived)}
        />
      </View>

      <FlatList
        data={cycles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PriceCycleCard
            cycle={item}
            onArchive={item.status === 'completed' ? archiveCycle : undefined}
            onActivate={item.status === 'completed' ? activateCycle : undefined}
          />
        )}
        refreshing={loading}
        onRefresh={fetchCycles}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No price cycles found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
});
