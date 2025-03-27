import React, { useState } from "react";

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Linking,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useBestPrices, FuelType } from "@/hooks/queries/prices/useBestPrices";
import { useLocation } from "@/hooks/useLocation";
import { BestPriceCard } from "@/components/price/BestPriceCard";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/Button";

const FUEL_TYPES: FuelType[] = [
  "Diesel",
  "RON 91",
  "RON 95",
  "RON 97",
  "RON 100",
];

const DISTANCE_OPTIONS = [5, 15, 30] as const;
type DistanceOption = (typeof DISTANCE_OPTIONS)[number];

export default function BestPricesScreen() {
  const {
    location,
    loading: locationLoading,
    error: locationError,
    refreshLocation,
  } = useLocation();

  const [selectedFuelType, setSelectedFuelType] = useState<
    FuelType | undefined
  >();
  const [maxDistance, setMaxDistance] = useState<DistanceOption>(15);

  // Update the useBestPrices call
  const { data, isLoading, error, refetch, isRefetching } = useBestPrices({
    fuelType: selectedFuelType,
    maxDistance,
    enabled: !!location,
    providedLocation: location || undefined, // Convert null to undefined
  });

  const handleFuelTypeSelect = (fuelType: FuelType | undefined) => {
    setSelectedFuelType(fuelType === selectedFuelType ? undefined : fuelType);
  };

  const handleDistanceChange = (distance: DistanceOption) => {
    setMaxDistance(distance);
  };

  const openAppSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const renderLocationError = () => (
    <SafeAreaView style={styles.fullScreenContainer}>
      <View style={styles.fallbackContainer}>
        <FontAwesome5 name="map-marker-alt" size={60} color="#cccccc" />
        <Text style={styles.fallbackTitle}>Location Access Required</Text>
        <Text style={styles.fallbackMessage}>
          GasPH needs your location to find the best fuel prices near you.
          Without location access, we can't show you personalized price
          recommendations.
        </Text>
        <View style={styles.fallbackButtonContainer}>
          <Button
            title="Enable Location"
            onPress={openAppSettings}
            variant="primary"
            style={styles.fallbackButton}
          />
          <Button
            title="Try Again"
            onPress={refreshLocation}
            variant="outline"
            style={styles.fallbackButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fuelTypeFilters}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            !selectedFuelType && styles.activeFilterChip,
          ]}
          onPress={() => handleFuelTypeSelect(undefined)}
        >
          <Text
            style={[
              styles.filterChipText,
              !selectedFuelType && styles.activeFilterChipText,
            ]}
          >
            All Types
          </Text>
        </TouchableOpacity>

        {FUEL_TYPES.map((fuelType) => (
          <TouchableOpacity
            key={fuelType}
            style={[
              styles.filterChip,
              selectedFuelType === fuelType && styles.activeFilterChip,
            ]}
            onPress={() => handleFuelTypeSelect(fuelType)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFuelType === fuelType && styles.activeFilterChipText,
              ]}
            >
              {fuelType}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.distanceFilterContainer}>
        <Text style={styles.distanceLabel}>Distance</Text>
        <View style={styles.distanceOptions}>
          {DISTANCE_OPTIONS.map((distance) => (
            <TouchableOpacity
              key={distance}
              style={[
                styles.distanceChip,
                maxDistance === distance && styles.activeDistanceChip,
              ]}
              onPress={() => handleDistanceChange(distance)}
            >
              <Text
                style={[
                  styles.distanceChipText,
                  maxDistance === distance && styles.activeDistanceChipText,
                ]}
              >
                {distance} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator message="Finding best prices..." />;
    }

    if (!data?.prices.length) {
      return (
        <EmptyState
          title="No Prices Found"
          message={
            selectedFuelType
              ? `No ${selectedFuelType} prices found within ${maxDistance} km. Try expanding your search or checking another fuel type.`
              : `No fuel prices found within ${maxDistance} km. Try expanding your search distance.`
          }
          icon="gas-pump"
          actionLabel="Reset Filters"
          onAction={() => {
            setSelectedFuelType(undefined);
            setMaxDistance(15);
          }}
        />
      );
    }

    return (
      // Update the FlatList renderItem
      <FlatList
        data={data.prices}
        keyExtractor={(item) => `${item.station_id}-${item.fuel_type}`}
        renderItem={({ item }) => (
          <BestPriceCard
            station_id={item.station_id}
            station_name={item.station_name}
            station_brand={item.station_brand}
            fuel_type={item.fuel_type}
            price={item.price}
            distance={item.distance}
            station_city={item.station_city}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          data.stats && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsLabel}>
                Found {data.stats.count} stations
              </Text>
              {data.stats.lowestPrice && (
                <Text style={styles.statsPrice}>
                  Lowest: ₱{data.stats.lowestPrice.toFixed(2)}
                </Text>
              )}
            </View>
          )
        }
      />
    );
  };

  if (locationError) {
    return renderLocationError();
  }

  if (locationLoading) {
    return <LoadingIndicator fullScreen message="Getting your location..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        fullScreen
        message="There was an error loading price data. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Best Fuel Prices Near You</Text>
        {location && (
          <View style={styles.locationContainer}>
            <FontAwesome5 name="map-marker-alt" size={16} color="#2a9d8f" />
            <Text style={styles.locationText}>Your Area</Text>
            {data?.stats && (
              <Text style={styles.statsText}>
                • Avg: ₱{data.stats.averagePrice.toFixed(2)}
              </Text>
            )}
          </View>
        )}
      </View>

      {renderFilters()}
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  fallbackMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  fallbackButtonContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },
  fallbackButton: {
    marginBottom: 12,
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  statsText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  filterContainer: {
    backgroundColor: "#fff",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  fuelTypeFilters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: "#2a9d8f",
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
  },
  activeFilterChipText: {
    color: "#fff",
    fontWeight: "500",
  },
  distanceFilterContainer: {
    paddingHorizontal: 16,
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  distanceOptions: {
    flexDirection: "row",
  },
  distanceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  activeDistanceChip: {
    backgroundColor: "#f4a261",
  },
  distanceChipText: {
    fontSize: 14,
    color: "#666",
  },
  activeDistanceChipText: {
    color: "#fff",
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
  },
  statsContainer: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  statsPrice: {
    fontSize: 14,
    color: "#2a9d8f",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
  },
});
