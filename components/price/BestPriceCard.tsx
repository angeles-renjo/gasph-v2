import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { TouchableCard } from '@/components/ui/Card';
import { formatPrice, formatDistance } from '@/utils/formatters';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme';
import { DOEPriceDisplay } from './DOEPriceDisplay';
import type { BestPrice } from '@/hooks/queries/prices/useBestPrices';

// Get screen dimensions for responsive layout
const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 350;
const isLargeScreen = screenWidth > 400;

// Props extends from BestPrice type
export interface BestPriceCardProps
  extends Pick<
    BestPrice,
    | 'id'
    | 'name'
    | 'brand'
    | 'fuel_type'
    | 'price'
    | 'distance'
    | 'city'
    | 'confirmations_count'
    | 'min_price'
    | 'common_price'
    | 'max_price'
    | 'week_of'
    | 'source_type'
  > {
  isLowestPrice?: boolean;
}

export function BestPriceCard({
  id,
  name,
  brand,
  fuel_type,
  price,
  distance = 0,
  city,
  confirmations_count = 0,
  min_price = null,
  common_price = null,
  max_price = null,
  source_type = null,
  isLowestPrice = false,
}: BestPriceCardProps) {
  const router = useRouter();

  const navigateToStation = () => {
    router.push(`/station/${id}`);
  };

  const openDirections = () => {
    // This would open directions in a maps app
    console.log(`Opening directions to station ${id}`);
  };

  // Calculate if this price is below average (for highlighting)
  const isBelowAverage = common_price && price && price < common_price;

  return (
    <TouchableCard
      style={styles.card}
      variant='elevated'
      onPress={navigateToStation}
    >
      {/* Price Section - Most visually prominent */}
      <View style={styles.priceSection}>
        <View style={styles.fuelTypeContainer}>
          <Text style={styles.fuelType}>{fuel_type ?? 'Unknown Fuel'}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{price ? formatPrice(price) : '--'}</Text>
          {isLowestPrice && (
            <View style={styles.savingsBadge}>
              <FontAwesome5
                name='arrow-down'
                size={10}
                color={Colors.success}
                style={styles.savingsIcon}
              />
              <Text style={styles.savingsBadgeText}>Best Value</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content Container - Adaptive layout based on screen size */}
      <View
        style={[
          styles.contentContainer,
          isLargeScreen ? styles.wideLayout : styles.standardLayout,
        ]}
      >
        {/* Station Details */}
        <View style={styles.stationSection}>
          <Text style={styles.stationName} numberOfLines={1}>
            {name ?? 'Unknown Station'}
          </Text>
          <Text style={styles.stationBrand}>
            {brand ?? 'Unknown Brand'} • {city ?? 'Unknown City'}
          </Text>
        </View>

        {/* Metrics Section */}
        <View style={styles.metricsSection}>
          <View style={styles.metricItem}>
            <FontAwesome5
              name='map-marker-alt'
              size={14}
              color={Colors.textGray}
            />
            <Text style={styles.metricText}>{formatDistance(distance)}</Text>
          </View>
          <View style={styles.metricItem}>
            <FontAwesome5
              name='check-circle'
              size={14}
              color={Colors.textGray}
            />
            {/* Apply fix here */}
            <Text style={styles.metricText}>
              {`${confirmations_count}`}{' '}
              {/* Explicitly convert number to string */}
              {confirmations_count === 1 ? ' confirmation' : ' confirmations'}
            </Text>
          </View>
        </View>
      </View>

      {/* DOE Price Comparison - When available - Ensure 0 is not rendered directly */}
      {min_price !== null && common_price !== null && max_price !== null ? (
        <DOEPriceDisplay
          min_price={min_price}
          common_price={common_price}
          max_price={max_price}
          source_type={source_type}
        />
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToStation}
          activeOpacity={0.7}
        >
          <FontAwesome5 name='info-circle' size={16} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={openDirections}
          activeOpacity={0.7}
        >
          <FontAwesome5 name='directions' size={16} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </TouchableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: Spacing.sm,
    padding: isSmallScreen ? Spacing.md : Spacing.xl,
    borderRadius: BorderRadius.lg,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGray,
  },
  fuelTypeContainer: {
    backgroundColor: Colors.primaryLightTint,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg_xl,
    alignSelf: 'flex-start',
  },
  fuelType: {
    fontSize: isSmallScreen
      ? Typography.fontSizeSmall
      : Typography.fontSizeMedium,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.primary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: isSmallScreen
      ? Typography.fontSizeXLarge
      : Typography.fontSizeXXLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.primary,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLightTint,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxxs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xxs,
  },
  savingsIcon: {
    marginRight: 3,
  },
  savingsBadgeText: {
    fontSize: Typography.fontSizeXXSmall,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.success,
  },

  // Content container - adaptive based on screen size
  contentContainer: {
    marginBottom: Spacing.md,
  },
  standardLayout: {
    flexDirection: 'column',
  },
  wideLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Station section
  stationSection: {
    marginBottom: isLargeScreen ? 0 : Spacing.sm,
    width: isLargeScreen ? '60%' : '100%',
  },
  stationName: {
    fontSize: Typography.fontSizeLarge,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.darkGray,
    marginBottom: Spacing.xxxs,
  },
  stationBrand: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
  },

  // Metrics section
  metricsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: isLargeScreen ? 'flex-end' : 'flex-start',
    width: isLargeScreen ? '40%' : '100%',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginBottom: isSmallScreen ? Spacing.xs : 0,
    backgroundColor: Colors.lightGray2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.md,
  },
  metricText: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeightMedium,
  },

  // Action section
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.dividerGray,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.lightGray2,
    minHeight: 44,
    minWidth: 44,
    flex: 1,
    marginHorizontal: Spacing.xxs,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeightMedium,
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSizeSmall,
  },
});
