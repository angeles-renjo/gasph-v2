import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useBestPrices, FuelType } from '@/hooks/queries/prices/useBestPrices';
import { useLocation } from '@/hooks/useLocation';
import { BestPriceCard } from '@/components/price/BestPriceCard';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import theme from '@/styles/theme';

const FUEL_TYPES: FuelType[] = [
  'Diesel',
  'RON 91',
  'RON 95',
  'RON 97',
  'RON 100',
  'Diesel Plus',
];

const DISTANCE_OPTIONS = [5, 15, 30] as const;
type DistanceOption = (typeof DISTANCE_OPTIONS)[number];

// Get screen dimensions for responsive layout
const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 350;
const isLargeScreen = screenWidth > 400;

// Helper function for empty state message
const getEmptyStateMessage = (
  selectedFuelType: FuelType | undefined,
  maxDistance: DistanceOption
): string => {
  return selectedFuelType
    ? `No ${selectedFuelType} prices found within ${maxDistance} km. Try expanding your search or checking another fuel type.`
    : `No fuel prices found within ${maxDistance} km. Try expanding your search distance.`;
};

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
  // Removed scrollY state again

  const { data, isLoading, error, refetch, isRefetching } = useBestPrices({
    fuelType: selectedFuelType,
    maxDistance,
    enabled: !!location,
    providedLocation: location || undefined,
  });

  const handleFuelTypeSelect = (fuelType: FuelType | undefined) => {
    setSelectedFuelType(fuelType === selectedFuelType ? undefined : fuelType);
  };

  const handleDistanceChange = (distance: DistanceOption) => {
    setMaxDistance(distance);
  };

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const renderLocationError = () => (
    <SafeAreaView style={styles.fullScreenContainer}>
      <StatusBar backgroundColor={theme.Colors.white} barStyle='dark-content' />
      <View style={styles.fallbackContainer}>
        <View style={styles.iconContainer}>
          <FontAwesome5
            name='map-marker-alt'
            size={64}
            color={theme.Colors.primary}
            style={styles.fallbackIcon}
          />
        </View>
        <Text style={styles.fallbackTitle}>Location Access Required</Text>
        <Text style={styles.fallbackMessage}>
          GasPH needs your location to find the best fuel prices near you.
        </Text>
        <View style={styles.fallbackButtonContainer}>
          <Button
            title='Enable Location'
            onPress={openAppSettings}
            variant='primary'
            style={styles.fallbackButton}
          />
          <Button
            title='Try Again'
            onPress={refreshLocation}
            variant='outline'
            style={styles.fallbackButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );

  // Modernized fuel type filters
  const renderFuelTypeFilters = () => (
    <View style={styles.filterSection}>
      <View style={styles.filterLabelContainer}>
        <FontAwesome5 name='gas-pump' size={14} color={theme.Colors.primary} />
        <Text style={styles.filterLabel}>Fuel Type</Text>
      </View>
      <View style={styles.chipContainer}>
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
      </View>
    </View>
  );

  // Modernized distance filters
  const renderDistanceFilters = () => (
    <View style={styles.filterSection}>
      <View style={styles.filterLabelContainer}>
        <FontAwesome5 name='route' size={14} color={theme.Colors.primary} />
        <Text style={styles.filterLabel}>Distance</Text>
      </View>
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
  );

  // Modernized stats dashboard
  const renderStatsHeader = () => {
    if (!data?.stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Stations Found</Text>
            <Text style={styles.statValue}>{data.stats.count}</Text>
          </View>

          {data.stats.lowestPrice != null && (
            <View style={[styles.statItem, styles.statItemHighlight]}>
              <Text style={styles.statLabelHighlight}>Best Price</Text>
              <Text style={styles.statValueHighlight}>
                ₱{data.stats.lowestPrice.toFixed(2)}
              </Text>
            </View>
          )}

          {data.stats.averagePrice != null && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average Price</Text>
              <Text style={styles.statValue}>
                ₱{data.stats.averagePrice.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator message='Finding best prices...' />;
    }

    if (!data?.prices.length) {
      return (
        <EmptyState
          title='No Prices Found'
          message={getEmptyStateMessage(selectedFuelType, maxDistance)}
          icon='gas-pump'
          onAction={{
            label: 'Reset Filters',
            onPress: () => {
              setSelectedFuelType(undefined);
              setMaxDistance(15);
            },
          }}
        />
      );
    }

    return (
      <FlatList
        data={data.prices}
        keyExtractor={(item) => `${item.id}-${item.fuel_type}`}
        renderItem={({ item }) => {
          const lowestPrice = data?.stats?.lowestPrice; // Use lowest price from stats
          return (
            <BestPriceCard
              id={item.id}
              name={item.name}
              brand={item.brand}
              fuel_type={item.fuel_type}
              price={item.price}
              distance={item.distance}
              city={item.city}
              confirmations_count={item.confirmations_count}
              min_price={item.min_price}
              common_price={item.common_price}
              max_price={item.max_price}
              source_type={item.source_type}
              isLowestPrice={
                lowestPrice !== null &&
                item.price !== null && // Add null check for item.price
                item.price === lowestPrice
              }
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[theme.Colors.primary]}
            tintColor={theme.Colors.primary}
          />
        }
        ListHeaderComponent={renderStatsHeader()}
        showsVerticalScrollIndicator={false}
        // Removed scrollEventThrottle and onScroll again
      />
    );
  };

  if (locationError) {
    return renderLocationError();
  }

  if (locationLoading) {
    return <LoadingIndicator fullScreen message='Getting your location...' />;
  }

  if (error) {
    return (
      <ErrorDisplay
        fullScreen
        message='There was an error loading price data. Please try again.'
        onRetry={refetch}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar backgroundColor={theme.Colors.white} barStyle='dark-content' />

      {/* filters */}
      <View style={styles.filterContainer}>
        {renderFuelTypeFilters()}
        {renderDistanceFilters()}
      </View>

      {/* Main content */}
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.light.background,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: theme.Colors.light.background,
  },

  // Removed header styles again

  // Enhanced filter styles
  filterContainer: {
    backgroundColor: theme.Colors.white,
    paddingHorizontal: isSmallScreen ? theme.Spacing.md : theme.Spacing.xl,
    paddingTop: theme.Spacing.sm,
    paddingBottom: theme.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.dividerGray,
    shadowColor: theme.Colors.black,
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
    zIndex: 5,
  },
  filterSection: {
    marginBottom: theme.Spacing.md,
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.Spacing.xs,
  },
  filterLabel: {
    fontSize: theme.Typography.fontSizeSmall,
    fontWeight: theme.Typography.fontWeightMedium,
    color: theme.Colors.primary,
    marginLeft: theme.Spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.BorderRadius.md,
    backgroundColor: theme.Colors.lightGray2,
    marginRight: theme.Spacing.xs,
    marginBottom: theme.Spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterChip: {
    backgroundColor: theme.Colors.primaryLightTint,
    borderColor: theme.Colors.primary,
  },
  filterChipText: {
    fontSize: theme.Typography.fontSizeSmall,
    color: theme.Colors.textGray,
    fontWeight: theme.Typography.fontWeightRegular,
  },
  activeFilterChipText: {
    color: theme.Colors.primary,
    fontWeight: theme.Typography.fontWeightMedium,
  },
  distanceOptions: {
    flexDirection: 'row',
  },
  distanceChip: {
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.BorderRadius.md,
    backgroundColor: theme.Colors.lightGray2,
    marginRight: theme.Spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeDistanceChip: {
    backgroundColor: theme.Colors.primaryLightTint,
    borderColor: theme.Colors.primary,
  },
  distanceChipText: {
    fontSize: theme.Typography.fontSizeSmall,
    color: theme.Colors.textGray,
    fontWeight: theme.Typography.fontWeightRegular,
  },
  activeDistanceChipText: {
    color: theme.Colors.primary,
    fontWeight: theme.Typography.fontWeightMedium,
  },

  // Enhanced stats styles
  statsContainer: {
    backgroundColor: theme.Colors.white,
    marginBottom: theme.Spacing.md,
    borderRadius: theme.BorderRadius.lg,
    padding: isSmallScreen ? theme.Spacing.md : theme.Spacing.xl,
    elevation: 2,
    shadowColor: theme.Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statsRow: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isSmallScreen ? 'flex-start' : 'center',
  },
  statItem: {
    alignItems: isSmallScreen ? 'flex-start' : 'center',
    flex: isSmallScreen ? 0 : 1,
    marginBottom: isSmallScreen ? theme.Spacing.md : 0,
    padding: theme.Spacing.md,
    borderRadius: theme.BorderRadius.md,
  },
  statItemHighlight: {
    backgroundColor: theme.Colors.primaryLightTint,
    borderWidth: 1,
    borderColor: theme.Colors.primary,
  },
  statLabel: {
    fontSize: theme.Typography.fontSizeSmall,
    color: theme.Colors.textGray,
    marginBottom: theme.Spacing.xxs,
    fontWeight: theme.Typography.fontWeightMedium,
  },
  statLabelHighlight: {
    fontSize: theme.Typography.fontSizeSmall,
    color: theme.Colors.primary,
    marginBottom: theme.Spacing.xxs,
    fontWeight: theme.Typography.fontWeightMedium,
  },
  statValue: {
    fontSize: isSmallScreen
      ? theme.Typography.fontSizeLarge
      : theme.Typography.fontSizeXLarge,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.darkGray,
  },
  statValueHighlight: {
    fontSize: isSmallScreen
      ? theme.Typography.fontSizeLarge
      : theme.Typography.fontSizeXLarge,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.primary,
  },

  // Enhanced list styles
  listContent: {
    padding: isSmallScreen ? theme.Spacing.md : theme.Spacing.xl,
    paddingTop: theme.Spacing.md,
  },

  // Enhanced fallback styles
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.xxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.Colors.primaryLightTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.xl,
    shadowColor: theme.Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  fallbackIcon: {
    opacity: 0.9,
  },
  fallbackTitle: {
    fontSize: theme.Typography.fontSizeXLarge,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.darkGray,
    marginBottom: theme.Spacing.md,
    textAlign: 'center',
  },
  fallbackMessage: {
    fontSize: theme.Typography.fontSizeMedium,
    color: theme.Colors.textGray,
    textAlign: 'center',
    marginBottom: theme.Spacing.xl,
    lineHeight: 22,
  },
  fallbackButtonContainer: {
    width: '100%',
  },
  fallbackButton: {
    marginBottom: theme.Spacing.md,
  },
});
