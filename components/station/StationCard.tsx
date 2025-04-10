import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { TouchableCard } from '@/components/ui/Card';
import { formatDistance } from '@/utils/formatters';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme'; // Import theme constants
import { Database } from '@/utils/supabase/types';

// Helper function to format amenity names for display
const formatAmenityName = (name: string): string => {
  const words = name.split('_');
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Simple mapping for amenity icons
const amenityIconMap: { [key: string]: string } = {
  convenience_store: 'store',
  restroom: 'restroom',
  car_wash: 'car', // Use 'car' icon as a free alternative
  atm: 'money-bill-wave',
  air_water: 'gas-pump', // Or perhaps 'air-freshener'? Choose best fit
  // Add more mappings as needed
};

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

  // Get all amenities with a true value
  const trueAmenities = station.amenities
    ? Object.entries(station.amenities as Record<string, boolean>)
        .filter(([, value]) => value)
        .map(([key]) => key)
    : [];
  const trueAmenitiesCount = trueAmenities.length;

  // Get the first 3 available amenities to display icons for
  const amenitiesToDisplay = trueAmenities.slice(0, 3);

  return (
    <TouchableCard
      style={styles.card}
      variant='elevated'
      onPress={navigateToStation}
    >
      <View style={styles.header}>
        {/* Apply flex: 1 to this container */}
        <View style={styles.nameAndBrandContainer}>
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

      {amenitiesToDisplay.length > 0 && (
        <View style={styles.amenitiesContainer}>
          {amenitiesToDisplay.map((amenity) => (
            <View key={amenity} style={styles.amenityBadge}>
              {amenityIconMap[amenity] ? ( // Changed && to ?
                <FontAwesome5
                  name={amenityIconMap[amenity]}
                  size={Typography.fontSizeSmall} // Match text size
                  color={Colors.primary}
                  style={styles.amenityIcon}
                />
              ) : (
                // Fallback to text if icon is not defined
                <Text style={styles.amenityText}>
                  {formatAmenityName(amenity)}
                </Text>
              )}
            </View>
          ))}

          {/* Show '+X more' only if there are more than 3 TRUE amenities */}
          {trueAmenitiesCount > 3 && (
            <View style={styles.amenityBadge}>
              <Text style={styles.amenityText}>
                +{trueAmenitiesCount - 3} more
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
          <FontAwesome5 name='info-circle' size={14} color={Colors.primary} />
          <Text style={styles.buttonText}>Details</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome5 name='directions' size={14} color={Colors.primary} />
          <Text style={styles.buttonText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </TouchableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: Spacing.sm, // Use theme spacing
    padding: Spacing.lg_xl, // Increase padding (from xl: 16 to lg_xl: 20)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm, // Slightly increase margin below header
  },
  nameAndBrandContainer: {
    flex: 1, // Allow this container to take available space
    marginRight: Spacing.sm, // Add some margin before the distance
  },
  stationName: {
    fontSize: Typography.fontSizeXLarge, // Make name larger
    fontWeight: Typography.fontWeightBold, // Make name bolder
    color: Colors.darkGray, // Use theme color
    marginBottom: Spacing.xxs, // Reduce space below name
    // Removed width: '85%' to allow natural expansion
  },
  stationBrand: {
    fontSize: Typography.fontSizeSmall, // Make brand smaller
    color: Colors.textGray, // Use theme color
    // Removed marginBottom: Spacing.xs
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryLightTint, // Use theme color
    paddingHorizontal: Spacing.sm, // Use theme spacing
    paddingVertical: Spacing.xxs, // Use theme spacing
    borderRadius: BorderRadius.lg, // Use theme border radius
    marginRight: Spacing.xs, // Use theme spacing
    marginBottom: Spacing.xs, // Use theme spacing
  },
  amenityIcon: {
    marginRight: Spacing.xxs, // Add space between icon and text
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
    marginTop: Spacing.sm, // Add margin above buttons
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray2, // Add background
    paddingVertical: Spacing.sm, // Increase vertical padding
    paddingHorizontal: Spacing.md, // Keep horizontal padding
    borderRadius: BorderRadius.md, // Add border radius
    flex: 1, // Allow buttons to share space
    justifyContent: 'center', // Center content
    marginHorizontal: Spacing.xs, // Add horizontal margin between buttons
  },
  buttonText: {
    color: Colors.primary, // Use theme color
    fontWeight: Typography.fontWeightMedium, // Use theme typography
    marginLeft: Spacing.xs, // Use theme spacing
    fontSize: Typography.fontSizeMedium, // Use theme typography
  },
});
