import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { TouchableCard } from '@/components/ui/Card';
import { formatPrice, formatDistance } from '@/utils/formatters';

export interface BestPriceCardProps {
  stationId: string;
  stationName: string;
  stationBrand: string;
  fuelType: string;
  price: number;
  distance: number;
  city: string;
}

export function BestPriceCard({
  stationId,
  stationName,
  stationBrand,
  fuelType,
  price,
  distance,
  city,
}: BestPriceCardProps) {
  const router = useRouter();

  const navigateToStation = () => {
    router.push(`/station/${stationId}`);
  };

  return (
    <TouchableCard
      style={styles.card}
      variant='elevated'
      onPress={navigateToStation}
    >
      <View style={styles.priceRow}>
        <View style={styles.fuelTypeContainer}>
          <Text style={styles.fuelType}>{fuelType}</Text>
        </View>
        <Text style={styles.price}>{formatPrice(price)}</Text>
      </View>

      <View style={styles.stationRow}>
        <Text style={styles.stationName} numberOfLines={1}>
          {stationName}
        </Text>
        <Text style={styles.stationBrand}>{stationBrand}</Text>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <FontAwesome5 name='map-marker-alt' size={14} color='#666' />
          <Text style={styles.infoText}>{city}</Text>
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
    marginBottom: 8,
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
});
