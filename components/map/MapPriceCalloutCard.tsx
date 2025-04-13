import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GasStation } from '@/hooks/queries/stations/useNearbyStations';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices';
import { PriceCardProps } from '@/components/price/PriceCard'; // Import PriceCardProps for community price type
import { formatPrice } from '@/utils/formatters';
import theme, { Colors, Spacing, Typography } from '@/styles/theme';
// Removed data fetching imports and duplicate React/RN imports

// Define expected DOE price structure (adjust if needed based on actual view output)
interface DoePriceData {
  common_price: number | null;
  min_price: number | null;
  max_price: number | null;
  source_type: string | null;
}

interface MapPriceCalloutCardProps {
  station: GasStation;
  fuelType: FuelType | null;
  // Add props for fetched data
  communityPrice: PriceCardProps | undefined | null; // Result from useStationFuelTypePrices (first item)
  doePrice: DoePriceData | undefined | null; // Result from useQuery on doe_price_view
  isLoading: boolean;
  error: Error | null; // Accept generic Error or null
}

export function MapPriceCalloutCard({
  station,
  fuelType,
  // Destructure new props
  communityPrice,
  doePrice,
  isLoading,
  error, // Receive error prop
}: MapPriceCalloutCardProps) {
  // Removed internal data fetching hooks

  const hasError = !!error; // Use the error prop directly

  // Log received props
  console.log(
    `[MapPriceCalloutCard] Rendering for station: ${station.id}`,
    `Fuel: ${fuelType}`,
    `CommunityPrice: ${JSON.stringify(communityPrice)}`,
    `DOEPrice: ${JSON.stringify(doePrice)}`,
    `IsLoading: ${isLoading}`,
    `HasError: ${hasError}`
  );

  return (
    <View style={styles.calloutContainer}>
      <Text style={styles.calloutTitle} numberOfLines={1}>
        {station.name}
      </Text>
      <Text style={styles.calloutBrand}>{station.brand}</Text>

      {fuelType && (
        <View style={styles.priceContainer}>
          <Text style={styles.fuelTypeText}>{`${fuelType}: `}</Text>
          {isLoading && (
            <ActivityIndicator size='small' color={Colors.primary} />
          )}
          {hasError && !isLoading && (
            <Text style={styles.errorText}>Error</Text>
          )}
          {!isLoading && !hasError && (
            <>
              {communityPrice?.price !== null &&
              communityPrice?.price !== undefined ? (
                // Display Community Price
                <Text style={styles.priceText}>
                  {formatPrice(communityPrice.price)}
                </Text>
              ) : doePrice?.common_price !== null &&
                doePrice?.common_price !== undefined ? (
                // Display DOE Common Price
                <Text style={styles.priceText}>
                  {formatPrice(doePrice.common_price)}
                  <Text style={styles.sourceText}>(DOE)</Text>
                </Text>
              ) : doePrice?.min_price !== null &&
                doePrice?.min_price !== undefined &&
                doePrice?.max_price !== null &&
                doePrice?.max_price !== undefined ? (
                // Display DOE Price Range
                <Text style={styles.priceText}>
                  {formatPrice(doePrice.min_price)} -{' '}
                  {formatPrice(doePrice.max_price)}{' '}
                  <Text style={styles.sourceText}>(DOE Range)</Text>
                </Text>
              ) : (
                // No price data found from either source
                <Text style={styles.errorText}>No data</Text>
              )}
            </>
          )}
        </View>
      )}
      {/* Removed View Details button for compactness */}
    </View>
  );
}

// Combine and adapt styles from StationMapView and BestPriceCard
const styles = StyleSheet.create({
  calloutContainer: {
    padding: Spacing.md, // Use theme spacing
    // width: 200, // Remove fixed width to test default sizing
    alignItems: 'center',
  },
  calloutTitle: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
    color: Colors.darkGray, // Use theme color
    marginBottom: Spacing.xxs, // Use theme spacing
    textAlign: 'center',
  },
  calloutBrand: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    color: Colors.textGray, // Use theme color
    marginBottom: Spacing.sm, // Use theme spacing
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center price info
    marginTop: Spacing.xs, // Use theme spacing
  },
  fuelTypeText: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    color: Colors.textGray, // Use theme color
  },
  priceText: {
    fontSize: Typography.fontSizeLarge, // Use theme typography
    fontWeight: Typography.fontWeightBold, // Use theme typography
    color: Colors.primary, // Use theme color
    marginLeft: Spacing.xs, // Use theme spacing
  },
  errorText: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    fontStyle: 'italic',
    color: Colors.error, // Use theme color
    marginLeft: Spacing.xs, // Use theme spacing
  },
  sourceText: {
    fontSize: 10, // Keep small
    color: Colors.textGray, // Use theme color
    fontStyle: 'italic',
    marginLeft: Spacing.xxs, // Use theme spacing
  },
});
