import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { TouchableCard } from '@/components/ui/Card';
import { formatPrice, formatDistance } from '@/utils/formatters';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme'; // Import theme constants
import { DOEPriceDisplay } from './DOEPriceDisplay'; // Import the new component
import type { BestPrice } from '@/hooks/queries/prices/useBestPrices';

// Props now extends from our BestPrice type
export interface BestPriceCardProps
  extends Pick<
    // Use properties from BestPrice (which extends GasStation)
    BestPrice,
    | 'id' // Changed from station_id
    | 'name' // Changed from station_name
    | 'brand' // Changed from station_brand
    | 'fuel_type'
    | 'price'
    | 'distance'
    | 'city' // Changed from station_city
    | 'confirmations_count'
    // DOE fields
    | 'min_price'
    | 'common_price'
    | 'max_price'
    | 'week_of' // Optional: might be useful for context later
    | 'source_type' // Add source_type
  > {}

// Removed formatSourceTypeLabel helper function

export function BestPriceCard({
  id, // Changed from station_id
  name, // Changed from station_name
  brand, // Changed from station_brand
  fuel_type,
  price,
  distance = 0, // Keep distance, assuming it's correctly passed or defaulted
  city, // Changed from station_city
  confirmations_count = 0,
  // Destructure new DOE props, providing defaults (null)
  min_price = null,
  common_price = null,
  max_price = null,
  source_type = null, // Destructure source_type
}: BestPriceCardProps) {
  const router = useRouter();

  const navigateToStation = () => {
    router.push(`/station/${id}`); // Use id here
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
        {/* Display community price or placeholder */}
        <Text style={styles.price}>{price ? formatPrice(price) : '--'}</Text>
      </View>

      {/* Use the extracted DOEPriceDisplay component */}
      <DOEPriceDisplay
        min_price={min_price}
        common_price={common_price}
        max_price={max_price}
        source_type={source_type}
      />

      <View style={styles.stationRow}>
        <Text style={styles.stationName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.stationBrand}>{brand}</Text>
      </View>
      {/* Add Confirmation display back */}
      <View style={styles.confirmationRow}>
        <FontAwesome5 name='check-circle' size={14} color='#666' />
        <Text style={styles.confirmationText}>
          {confirmations_count}
          <Text> </Text> {/* Explicit Text for space */}
          {confirmations_count === 1 ? 'confirmation' : 'confirmations'}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <FontAwesome5 name='map-marker-alt' size={14} color='#666' />
          <Text style={styles.infoText}>
            {city}
            <Text> </Text> {/* Explicit Text for space */}
          </Text>
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
    marginVertical: Spacing.sm, // Use theme spacing
    padding: Spacing.xl, // Use theme spacing
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm, // Use theme spacing
  },
  fuelTypeContainer: {
    backgroundColor: Colors.primaryLightTint, // Use theme color
    paddingHorizontal: Spacing.md, // Use theme spacing
    paddingVertical: Spacing.xxs, // Use theme spacing
    borderRadius: BorderRadius.lg_xl, // Use theme border radius
  },
  fuelType: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
    color: Colors.primary, // Use theme color
  },
  price: {
    fontSize: Typography.fontSizeXXLarge, // Use theme typography
    fontWeight: Typography.fontWeightBold, // Use theme typography
    color: Colors.primary, // Use theme color
  },
  // Removed styles related to DOE display as they are now in DOEPriceDisplay.tsx
  // doeContainer, doeInfoRow, doeLabel, doeTypeBadge, doeTypeBadgeText, doeTableRow, doeTableCell, doeTableHeader, doeTableValue
  stationRow: {
    marginBottom: Spacing.xxs, // Use theme spacing
  },
  stationName: {
    fontSize: Typography.fontSizeLarge, // Use theme typography
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
    color: Colors.darkGray, // Use theme color
    marginBottom: Spacing.xxxs, // Use theme spacing
  },
  stationBrand: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
  },
  doeBenchmarkRow: {
    // Note: This style seems unused in the component logic, keeping for now
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: Spacing.xxs, // Use theme spacing
    marginBottom: Spacing.sm, // Use theme spacing
  },
  doeBenchmarkLabel: {
    // Note: This style seems unused
    fontSize: Typography.fontSizeSmallMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
    marginRight: Spacing.xxs, // Use theme spacing
  },
  doeBenchmarkText: {
    // Note: This style seems unused
    fontSize: Typography.fontSizeSmallMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
    fontWeight: Typography.fontWeightMedium, // Use theme typography
  },
  confirmationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xxs, // Use theme spacing
    marginBottom: Spacing.sm, // Use theme spacing
  },
  confirmationText: {
    fontSize: Typography.fontSizeSmallMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
    marginLeft: Spacing.xs, // Use theme spacing
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
    marginLeft: Spacing.xs, // Use theme spacing
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.dividerGray, // Use theme color
    paddingTop: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm, // Use theme spacing
    paddingHorizontal: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  buttonText: {
    color: Colors.primary, // Use theme color
    fontWeight: Typography.fontWeightMedium, // Use theme typography
    marginLeft: Spacing.xs, // Use theme spacing
  },
  reporterRow: {
    // Note: This style seems unused
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm, // Use theme spacing
    borderTopWidth: 1,
    borderTopColor: Colors.dividerGray, // Use theme color
    paddingTop: Spacing.sm, // Use theme spacing
  },
  reporterLabel: {
    // Note: This style seems unused
    fontSize: Typography.fontSizeSmall, // Use theme typography
    color: Colors.textGray, // Use theme color
    marginRight: Spacing.xxs, // Use theme spacing
  },
  reporterName: {
    // Note: This style seems unused
    fontSize: Typography.fontSizeSmall, // Use theme typography
    fontWeight: Typography.fontWeightMedium, // Use theme typography
    color: Colors.darkGray, // Use theme color
  },
});
