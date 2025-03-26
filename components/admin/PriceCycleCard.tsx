import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils/formatters";

interface PriceCycleCardProps {
  cycle: {
    id: string;
    cycle_number: number;
    start_date: string;
    end_date: string;
    status: "active" | "archived";
  };
  onArchive?: (id: string) => Promise<void>;
}

export function PriceCycleCard({ cycle, onArchive }: PriceCycleCardProps) {
  const handleArchive = async () => {
    Alert.alert(
      "Archive Cycle",
      "Are you sure you want to archive this price cycle?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              if (onArchive) {
                await onArchive(cycle.id);
              }
            } catch (error) {
              Alert.alert("Error", "Failed to archive price cycle");
            }
          },
        },
      ]
    );
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cycle #{cycle.cycle_number}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            cycle.status === "archived" && styles.archivedBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              cycle.status === "archived" && styles.archivedText,
            ]}
          >
            {cycle.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.dates}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Start Date</Text>
          <Text style={styles.dateValue}>{formatDate(cycle.start_date)}</Text>
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>End Date</Text>
          <Text style={styles.dateValue}>{formatDate(cycle.end_date)}</Text>
        </View>
      </View>

      {cycle.status === "active" && onArchive && (
        <Button
          title="Archive Cycle"
          onPress={handleArchive}
          variant="outline"
          style={styles.archiveButton}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    backgroundColor: "#e6f7f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  archivedBadge: {
    backgroundColor: "#f5f5f5",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2a9d8f",
  },
  archivedText: {
    color: "#666",
  },
  dates: {
    flexDirection: "row",
    marginBottom: 16,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  archiveButton: {
    marginTop: 8,
  },
});
