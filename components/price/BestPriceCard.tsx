import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { TouchableCard } from '@/components/ui/Card';
import { formatPrice, formatDistance } from '@/utils/formatters';
import type { BestPrice } from '@/hooks/queries/prices/useBestPrices';

// Props now extends from our BestPrice type
export interface BestPriceCardProps
  extends Pick<
    BestPrice,
    | 'station_id'
    | 'station_name'
    | 'station_brand'
    | 'fuel_type'
    | 'price'
    | 'distance'
    | 'station_city'
    // Removed doe_benchmark_price
    // | 'doe_benchmark_price'
    // Remove confirmations_count as it's no longer consistently available
    // | 'confirmations_count'
  > {}

export function BestPriceCard({
  station_id,
  station_name,
  station_brand,
  fuel_type,
  price,
  distance = 0,
  station_city,
}: // doe_benchmark_price, // Removed prop
// confirmations_count = 0, // Remove confirmations_count prop
BestPriceCardProps) {
  const router = useRouter();

  const navigateToStation = () => {
    router.push(`/station/${station_id}`);
  };

  return (
    <TouchableCard
      style={styles.card}
      variant='elevated'
      onPress={navigateToStation}
    >
      <View style={styles.priceRow}>
        <View style={styles.fuelTypeContainer}>
          <Text style={styles.fuelType}>{fuel_type}</Text>
        </View>
        <Text style={styles.price}>{formatPrice(price)}</Text>
      </View>

      {/* Removed DOE Benchmark Price Display */}

      <View style={styles.stationRow}>
        <Text style={styles.stationName} numberOfLines={1}>
          {station_name}
        </Text>
        <Text style={styles.stationBrand}>{station_brand}</Text>
      </View>

      {/* Confirmation display removed */}

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <FontAwesome5 name='map-marker-alt' size={14} color='#666' />
          <Text style={styles.infoText}>{station_city}</Text>
        </View>

        <View style={styles.infoItem}>
          <FontAwesome5 name='route' size={14} color='#666' />
          <Text style={styles.infoText}>{formatDistance(distance)}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.directionButton}
          onPress={navigateToStation}
        >
          <FontAwesome5 name='info-circle' size={14} color='#2a9d8f' />
          <Text style={styles.buttonText}>Details</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.directionButton}>
          <FontAwesome5 name='directions' size={14} color='#2a9d8f' />
          <Text style={styles.buttonText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </TouchableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fuelTypeContainer: {
    backgroundColor: '#e6f7f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fuelType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2a9d8f',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2a9d8f',
  },
  stationRow: {
    marginBottom: 4, // Reduced margin
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  stationBrand: {
    fontSize: 14,
    color: '#666',
  },
  doeBenchmarkRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align to the start
    alignItems: 'center',
    marginTop: 4, // Space below main price
    marginBottom: 8, // Space above station info
  },
  doeBenchmarkLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 4,
  },
  doeBenchmarkText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  // Removed duplicate style definitions below
  // Confirmation styles removed
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: '#2a9d8f',
    fontWeight: '500',
    marginLeft: 6,
  },
  reporterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  reporterLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  reporterName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
});
