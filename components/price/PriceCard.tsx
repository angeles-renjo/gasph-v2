import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Card } from "@/components/ui/Card";
import { FontAwesome5 } from "@expo/vector-icons";
import { formatPrice, formatRelativeTime } from "@/utils/formatters";
import {
  usePriceConfirmation,
  useHasConfirmedPrice,
} from "@/hooks/queries/prices/usePriceConfirmation";
import { useAuth } from "@/hooks/useAuth";

export interface PriceCardProps {
  id: string;
  station_id: string;
  fuel_type: string;
  price: number;
  reported_at: string;
  confirmations_count: number;
  cycle_id: string;
  source?: "community" | "official";
  username?: string;
  user_id?: string;
  isOwnReport?: boolean;
}

export function PriceCard({
  id,
  station_id,
  fuel_type,
  price,
  reported_at,
  confirmations_count = 0,
  source = "community",
  username,
  user_id,
  isOwnReport = false,
}: PriceCardProps) {
  const isCommunity = source === "community";
  const relativeTime = formatRelativeTime(reported_at);
  const { user } = useAuth();

  // Use the mutation hook
  const { mutate: confirmPrice, isPending: isConfirming } =
    usePriceConfirmation();

  // Use the query hook to check confirmation status
  const { data: hasConfirmed } = useHasConfirmedPrice(id);

  const handleConfirmPrice = () => {
    if (!id || !station_id) return;

    confirmPrice(
      { reportId: id, stationId: station_id },
      {
        onError: (error) => {
          console.error("Error confirming price:", error);
        },
      }
    );
  };

  const renderConfirmationContent = () => {
    // If user has already confirmed or it's their own report
    if (hasConfirmed || isOwnReport) {
      return (
        <View style={styles.confirmationsContainer}>
          <Text style={styles.confirmationsLabel}>Confirmations</Text>
          <Text style={styles.confirmationsCount}>
            {confirmations_count}{" "}
            {confirmations_count === 1 ? "Confirmation" : "Confirmations"}
          </Text>
          {isOwnReport && <Text style={styles.ownReportTag}>Your report</Text>}
        </View>
      );
    }

    // If user hasn't confirmed and is not the report owner
    if (user && !isOwnReport) {
      return isConfirming ? (
        <ActivityIndicator size="small" color="#2a9d8f" />
      ) : (
        <View style={styles.confirmationsContainer}>
          <TouchableOpacity
            onPress={handleConfirmPrice}
            style={styles.confirmButton}
            disabled={isConfirming}
          >
            <FontAwesome5 name="check-circle" size={16} color="#2a9d8f" />
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>

          <Text style={styles.confirmationsCount}>
            {confirmations_count}{" "}
            {confirmations_count === 1 ? "Confirmation" : "Confirmations"}
          </Text>
        </View>
      );
    }

    // Fallback to just showing confirmation count
    return (
      <View style={styles.confirmationsContainer}>
        <Text style={styles.confirmationsLabel}>Confirmations</Text>
        <Text style={styles.confirmationsCount}>
          {confirmations_count}{" "}
          {confirmations_count === 1 ? "Confirmation" : "Confirmations"}
        </Text>
      </View>
    );
  };

  return (
    <Card variant="outline" style={styles.card}>
      <View style={styles.priceContainer}>
        <Text style={styles.fuelType}>{fuel_type}</Text>
        <Text style={styles.price}>{formatPrice(price)}</Text>
      </View>

      <View style={styles.sourceContainer}>
        <Text style={styles.sourceLabel}>
          {isCommunity ? "Community Report" : "DOE Official Price"}
        </Text>
        <Text style={styles.dateLabel}>{relativeTime}</Text>
      </View>

      {isCommunity && (
        <>
          <View style={styles.divider} />

          <View style={styles.detailsContainer}>
            <View style={styles.userContainer}>
              <Text style={styles.userLabel}>Reported by</Text>
              <Text style={styles.username}>{username || "Anonymous"}</Text>
            </View>

            {renderConfirmationContent()}
          </View>
        </>
      )}
    </Card>
  );
}

// Styles remain the same...

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    padding: 12,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fuelType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2a9d8f",
  },
  sourceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sourceLabel: {
    fontSize: 14,
    color: "#666",
  },
  dateLabel: {
    fontSize: 14,
    color: "#999",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userContainer: {
    alignItems: "center",
  },
  userLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  username: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  confirmationsContainer: {
    alignItems: "center",
  },
  confirmationsLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  confirmButtonText: {
    fontSize: 12,
    color: "#2a9d8f",
    marginLeft: 4,
  },
  confirmationsCount: {
    fontSize: 12,
    color: "#666",
  },
  ownReportTag: {
    fontSize: 10,
    color: "#2a9d8f",
    fontStyle: "italic",
    marginTop: 2,
  },
});
