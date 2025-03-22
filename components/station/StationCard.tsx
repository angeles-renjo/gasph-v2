import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { TouchableCard } from '@/components/ui/Card';
import { formatDistance } from '@/utils/formatters';
import { Database } from '@/utils/supabase/types';

type GasStation = Database['public']['Tables']['gas_stations']['Row'] & {
  distance?: number;
  activePrices?: {
    fuel_type: string;
    price: number;
  }[];
};

interface StationCardProps {
  station: GasStation;
}

export function StationCard({ station }: StationCardProps) {
  const router = useRouter();

  const navigateToStation = () => {
    router.push(`/station/${station.id}`);
  };

  // Convert JSON amenities to array of strings
  const amenities = station.amenities
    ? Object.keys(station.amenities as Record<string, boolean>)
        .filter((key) => (station.amenities as Record<string, boolean>)[key])
        .slice(0, 3)
    : [];

  return (
    <TouchableCard
      style={styles.card}
      variant='elevated'
      onPress={navigateToStation}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.stationName} numberOfLines={1}>
            {station.name}
          </Text>
          <Text style={styles.stationBrand}>{station.brand}</Text>
        </View>

        {station.distance !== undefined && (
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceText}>
              {formatDistance(station.distance)}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.address} numberOfLines={2}>
        {station.address}, {station.city}
      </Text>

      {amenities.length > 0 && (
        <View style={styles.amenitiesContainer}>
          {amenities.map((amenity, index) => (
            <View key={amenity} style={styles.amenityBadge}>
              <Text style={styles.amenityText}>
                {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
              </Text>
            </View>
          ))}

          {Object.keys(station.amenities as Record<string, boolean>).length >
            3 && (
            <View style={styles.amenityBadge}>
              <Text style={styles.amenityText}>
                +
                {Object.keys(station.amenities as Record<string, boolean>)
                  .length - 3}{' '}
                more
              </Text>
            </View>
          )}
        </View>
      )}

      {station.activePrices && station.activePrices.length > 0 && (
        <View style={styles.pricesContainer}>
          {station.activePrices.map((price, index) => (
            <View key={`${price.fuel_type}-${index}`} style={styles.priceItem}>
              <Text style={styles.fuelType}>{price.fuel_type}</Text>
              <Text style={styles.price}>₱{price.price.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToStation}
        >
          <FontAwesome5 name='info-circle' size={14} color='#2a9d8f' />
          <Text style={styles.buttonText}>Details</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: '85%',
  },
  stationBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  distanceContainer: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  amenityBadge: {
    backgroundColor: '#e6f7f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  amenityText: {
    fontSize: 12,
    color: '#2a9d8f',
    fontWeight: '500',
  },
  pricesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 6,
  },
  fuelType: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  price: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2a9d8f',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  buttonText: {
    color: '#2a9d8f',
    fontWeight: '500',
    marginLeft: 6,
    fontSize: 14,
  },
});
