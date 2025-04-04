import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { TouchableCard } from '@/components/ui/Card';
import { formatDistance } from '@/utils/formatters';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme'; // Import theme constants
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
    marginVertical: Spacing.sm, // Use theme spacing
    padding: Spacing.xl, // Use theme spacing
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs, // Use theme spacing
  },
  stationName: {
    fontSize: Typography.fontSizeLarge, // Use theme typography
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
    color: Colors.darkGray, // Use theme color
    width: '85%', // Keep width constraint
  },
  stationBrand: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
    marginBottom: Spacing.xs, // Use theme spacing
  },
  distanceContainer: {
    backgroundColor: Colors.lightGray2, // Use theme color
    paddingHorizontal: Spacing.sm, // Use theme spacing
    paddingVertical: Spacing.xxs, // Use theme spacing
    borderRadius: BorderRadius.lg, // Use theme border radius
  },
  distanceText: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    fontWeight: Typography.fontWeightMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
  },
  address: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
    marginBottom: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  amenityBadge: {
    backgroundColor: Colors.primaryLightTint, // Use theme color
    paddingHorizontal: Spacing.sm, // Use theme spacing
    paddingVertical: Spacing.xxs, // Use theme spacing
    borderRadius: BorderRadius.lg, // Use theme border radius
    marginRight: Spacing.xs, // Use theme spacing
    marginBottom: Spacing.xs, // Use theme spacing
  },
  amenityText: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    color: Colors.primary, // Use theme color
    fontWeight: Typography.fontWeightMedium, // Use theme typography
  },
  pricesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray2, // Use theme color
    paddingHorizontal: Spacing.sm, // Use theme spacing
    paddingVertical: Spacing.xxs, // Use theme spacing
    borderRadius: BorderRadius.lg, // Use theme border radius
    marginRight: Spacing.sm, // Use theme spacing
    marginBottom: Spacing.xs, // Use theme spacing
  },
  fuelType: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    color: Colors.textGray, // Use theme color
    marginRight: Spacing.xxs, // Use theme spacing
  },
  price: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    fontWeight: Typography.fontWeightBold, // Use theme typography
    color: Colors.primary, // Use theme color
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.dividerGray, // Use theme color
    paddingTop: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs, // Use theme spacing
    paddingHorizontal: Spacing.md, // Use theme spacing
  },
  buttonText: {
    color: Colors.primary, // Use theme color
    fontWeight: Typography.fontWeightMedium, // Use theme typography
    marginLeft: Spacing.xs, // Use theme spacing
    fontSize: Typography.fontSizeMedium, // Use theme typography
  },
});
