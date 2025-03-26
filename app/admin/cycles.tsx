import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  usePriceCycles,
  useCreatePriceCycle,
} from "@/hooks/queries/admin/usePriceCycles";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { Button } from "@/components/ui/Button";
import { CreateCycleModal } from "@/components/admin/CreateCycleModal";
import { PriceCycleCard } from "@/components/admin/PriceCycleCard";

export default function CyclesScreen() {
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const { data: cycles, isLoading, error, refetch } = usePriceCycles();

  const createCycleMutation = useCreatePriceCycle();

  const handleCreateCycle = async (startDate: Date, endDate: Date) => {
    try {
      const nextCycleNumber =
        Math.max(...(cycles?.map((c) => c.cycle_number) || [0])) + 1;

      await createCycleMutation.mutateAsync({
        startDate,
        endDate,
        cycleNumber: nextCycleNumber,
      });

      setShowCreateModal(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create price cycle");
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
            onArchive={async () => {
              // Implement archive functionality
            }}
          />
        ))}
      </ScrollView>

      <CreateCycleModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCycle}
        loading={createCycleMutation.isPending}
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
