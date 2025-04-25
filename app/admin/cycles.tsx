import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  usePriceCycles,
  useCreatePriceCycleMutation, // Import mutation hook
  useUpdatePriceCycleStatusMutation, // Import mutation hook
} from '@/hooks/queries/prices/usePriceCycles';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Button } from '@/components/ui/Button';
import { CreateCycleModal } from '@/components/admin/CreateCycleModal';
import { PriceCycleCard } from '@/components/admin/PriceCycleCard';
import type { PriceCycle } from '@/hooks/queries/prices/usePriceCycles';

export default function CyclesScreen() {
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  // Fetch cycles query
  const {
    data: cycles, // Rename data to cycles
    isLoading: isLoadingCycles, // Rename isLoading
    error,
    refetch,
  } = usePriceCycles({ showArchived: true }); // Pass object

  // Create cycle mutation
  const { mutateAsync: createCycleMutate, isPending: isCreating } =
    useCreatePriceCycleMutation();

  // Update cycle status mutation
  const { mutateAsync: updateStatusMutate, isPending: isUpdatingStatus } =
    useUpdatePriceCycleStatusMutation();

  // Removed startDate and endDate parameters
  const handleCreateCycle = async (): Promise<PriceCycle> => {
    try {
      // Use the mutation function - call without arguments
      const result = await createCycleMutate({}); // Pass empty object
      setShowCreateModal(false);
      return result;
    } catch (error: any) {
      // Error handled by mutation hook's onError, just rethrow
      // Just rethrow to complete the Promise rejection
      throw error;
    }
  };

  const handleArchiveCycle = async (cycleId: string) => {
    console.log(`[CyclesScreen] handleArchiveCycle called for ID: ${cycleId}`); // Add log
    try {
      // Use the update status mutation
      await updateStatusMutate({ cycleId, status: 'archived' });
    } catch (error: any) {
      // Error handled by mutation hook's onError
      // Alert.alert('Error', error.message || 'Failed to archive cycle');
    }
  };

  if (error) {
    return (
      <ErrorDisplay message='Failed to load price cycles' onRetry={refetch} />
    );
  }
  const handleActivateCycle = async (cycleId: string) => {
    try {
      // Use the update status mutation
      await updateStatusMutate({ cycleId, status: 'active' });
    } catch (error: any) {
      // Error handled by mutation hook's onError
      // Alert.alert('Error', error.message || 'Failed to activate cycle');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Button
          title='Create New Cycle'
          onPress={() => setShowCreateModal(true)}
          variant='primary'
          disabled={isCreating || isUpdatingStatus} // Disable if any mutation is pending
        />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isLoadingCycles} // Use renamed state
            onRefresh={refetch}
            tintColor='#2a9d8f'
          />
        }
        contentContainerStyle={styles.content}
      >
        {cycles?.map((cycle) => (
          <PriceCycleCard
            key={cycle.id}
            cycle={cycle}
            onArchive={
              cycle.status === 'completed'
                ? () => handleArchiveCycle(cycle.id)
                : undefined
            }
            onActivate={
              cycle.status === 'completed'
                ? () => handleActivateCycle(cycle.id)
                : undefined
            }
            // Pass the generic updating status
            isActivating={isUpdatingStatus}
            isArchiving={isUpdatingStatus}
          />
        ))}
      </ScrollView>

      <CreateCycleModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCycle}
        loading={isCreating}
        nextCycleNumber={
          Math.max(...(cycles?.map((c) => c.cycle_number) || [0])) + 1
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  content: {
    padding: 16,
  },
});
