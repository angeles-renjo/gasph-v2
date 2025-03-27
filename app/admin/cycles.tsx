import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePriceCycles } from "@/hooks/queries/prices/usePriceCycles";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { Button } from "@/components/ui/Button";
import { CreateCycleModal } from "@/components/admin/CreateCycleModal";
import { PriceCycleCard } from "@/components/admin/PriceCycleCard";
import type { PriceCycle } from "@/hooks/queries/prices/usePriceCycles";

export default function CyclesScreen() {
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const {
    cycles,
    isLoading,
    error,
    refetch,
    createCycle,
    isCreating,
    archiveCycle,
    isArchiving,
  } = usePriceCycles(true); // true to include archived cycles

  const handleCreateCycle = async (
    startDate: Date,
    endDate: Date
  ): Promise<PriceCycle> => {
    try {
      const result = await createCycle({ startDate, endDate });
      setShowCreateModal(false);
      return result;
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create price cycle");
      throw error;
    }
  };

  const handleArchiveCycle = async (cycleId: string) => {
    try {
      await archiveCycle(cycleId);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to archive cycle");
    }
  };

  if (error) {
    return (
      <ErrorDisplay message="Failed to load price cycles" onRetry={refetch} />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <Button
          title="Create New Cycle"
          onPress={() => setShowCreateModal(true)}
          variant="primary"
        />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#2a9d8f"
          />
        }
        contentContainerStyle={styles.content}
      >
        {cycles?.map((cycle) => (
          <PriceCycleCard
            key={cycle.id}
            cycle={cycle}
            onArchive={() => handleArchiveCycle(cycle.id)}
            isArchiving={isArchiving}
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
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  content: {
    padding: 16,
  },
});
