import { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Button } from '@/components/ui/Button';
import { PriceCycleCard } from '@/components/admin/PriceCycleCard';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState'; // Import EmptyState
import { Colors, Typography, Spacing } from '@/styles/theme'; // Import theme constants
import {
  usePriceCycles,
  useCreatePriceCycleMutation,
  useUpdatePriceCycleStatusMutation,
} from '@/hooks/queries/prices/usePriceCycles'; // Import the new hooks

export function PriceCycleManagement() {
  const [showArchived, setShowArchived] = useState(false);

  // Use React Query hook to fetch cycles
  const {
    data: cycles,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching, // Use isRefetching for pull-to-refresh indicator
  } = usePriceCycles({ showArchived });

  // Use React Query mutation hooks
  const createCycleMutation = useCreatePriceCycleMutation();
  const updateStatusMutation = useUpdatePriceCycleStatusMutation();

  // Handlers now call the mutation hooks
  const handleCreateNewCycle = () => {
    // Simple date logic for now, could be moved to hook or made configurable
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    createCycleMutation.mutate({ startDate, endDate });
  };

  const handleArchive = (cycleId: string) => {
    updateStatusMutation.mutate({ cycleId, status: 'archived' });
  };

  const handleActivate = (cycleId: string) => {
    updateStatusMutation.mutate({ cycleId, status: 'active' });
  };

  // Loading state from useQuery
  if (isLoading) {
    return <LoadingIndicator message='Loading price cycles...' />;
  }

  // Error state from useQuery
  if (isError) {
    return (
      <ErrorDisplay
        message={error?.message || 'Failed to load price cycles'}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Price Reporting Cycles</Text>
        <Button
          title='Create New Cycle'
          onPress={handleCreateNewCycle}
          loading={createCycleMutation.isPending} // Use mutation pending state
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
        data={cycles || []} // Use data from useQuery, default to empty array
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PriceCycleCard
            cycle={item}
            // Pass mutation functions directly if needed, or handle within card
            // For simplicity, passing handlers that call mutate
            onArchive={item.status === 'completed' ? handleArchive : undefined} // Only allow archiving completed
            onActivate={
              item.status === 'completed' ? handleActivate : undefined
            } // Only allow activating completed
            // Check specific mutation based on ID and status being updated
            isArchiving={
              updateStatusMutation.isPending &&
              updateStatusMutation.variables?.cycleId === item.id &&
              updateStatusMutation.variables?.status === 'archived'
            }
            isActivating={
              updateStatusMutation.isPending &&
              updateStatusMutation.variables?.cycleId === item.id &&
              updateStatusMutation.variables?.status === 'active'
            }
          />
        )}
        refreshing={isRefetching} // Use isRefetching for pull-to-refresh
        onRefresh={refetch} // Use refetch from useQuery
        ListEmptyComponent={
          <EmptyState // Use EmptyState component
            message='No price cycles found.'
            onAction={{ label: 'Refresh', onPress: refetch }}
          />
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
    marginBottom: Spacing.xl, // Use theme spacing
    paddingHorizontal: Spacing.xl, // Use theme spacing
    paddingVertical: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  title: {
    fontSize: Typography.fontSizeXLarge, // Use theme typography
    fontWeight: Typography.fontWeightBold, // Use theme typography
    color: Colors.darkGray, // Use theme color
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.xl, // Use theme spacing
    marginBottom: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  emptyText: {
    textAlign: 'center',
    padding: Spacing.lg_xl, // Use theme spacing
    color: Colors.textGray, // Use theme color
    fontSize: Typography.fontSizeMedium, // Added font size for consistency
  },
});
