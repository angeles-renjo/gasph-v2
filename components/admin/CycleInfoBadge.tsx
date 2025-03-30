// components/admin/CycleInfoBadge.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { formatDate } from "@/utils/formatters";

interface CycleInfoBadgeProps {
  cycleNumber: number;
  status: "active" | "completed" | "archived";
  compact?: boolean;
  showDates?: boolean;
  startDate?: string;
  endDate?: string;
}

export function CycleInfoBadge({
  cycleNumber,
  status,
  compact = false,
  showDates = false,
  startDate,
  endDate,
}: CycleInfoBadgeProps) {
  // Get appropriate icon and colors based on status
  const getStatusInfo = () => {
    switch (status) {
      case "active":
        return {
          icon: "play-circle",
          color: "#2a9d8f",
          bgColor: "#e6f7f5",
        };
      case "completed":
        return {
          icon: "check-circle",
          color: "#4caf50",
          bgColor: "#e8f5e9",
        };
      case "archived":
        return {
          icon: "archive",
          color: "#9e9e9e",
          bgColor: "#f5f5f5",
        };
      default:
        return {
          icon: "circle",
          color: "#666",
          bgColor: "#f0f0f0",
        };
    }
  };

  const { icon, color, bgColor } = getStatusInfo();

  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor: bgColor }]}>
        <FontAwesome5 name={icon} size={12} color={color} style={styles.icon} />
        <Text style={[styles.compactText, { color }]}>
          Cycle #{cycleNumber}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <FontAwesome5 name={icon} size={14} color={color} style={styles.icon} />
        <Text style={[styles.cycleNumber, { color }]}>
          Cycle #{cycleNumber}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: color }]}>
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
      </View>

      {showDates && startDate && endDate && (
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {formatDate(startDate)} - {formatDate(endDate)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  compactBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  compactText: {
    fontSize: 12,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 6,
  },
  cycleNumber: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  dateContainer: {
    marginTop: 6,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
  },
});
