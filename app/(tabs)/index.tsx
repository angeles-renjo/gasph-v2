import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBestPrices, FuelType } from '@/hooks/queries/prices/useBestPrices';
import { useLocationStore } from '@/hooks/stores/useLocationStore'; // Use Zustand store
import { BestPriceCard } from '@/components/price/BestPriceCard';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { FilterControlBubble } from '@/components/ui/FilterControlBubble';
import { formatDistance } from '@/utils/formatters';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';
import theme from '@/styles/theme';

import { styles } from '@/styles/screens/index/BestPriceScreen.styles';

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

const openAppSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};

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
  const location = useLocationStore((state) => state.location);
  const locationLoading = useLocationStore((state) => state.loading);
  const locationError = useLocationStore((state) => state.error);
  const refreshLocation = useLocationStore((state) => state.refreshLocation);

  const defaultFuelTypeFromStore = usePreferencesStore(
    (state) => state.defaultFuelType
  );

  const [selectedFuelType, setSelectedFuelType] = useState<
    FuelType | undefined
  >(defaultFuelTypeFromStore ?? undefined);

  useEffect(() => {
    setSelectedFuelType(defaultFuelTypeFromStore ?? undefined);
  }, [defaultFuelTypeFromStore]);
  const [maxDistance, setMaxDistance] = useState<DistanceOption>(15);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const router = useRouter();

  const { data, isLoading, error, refetch, isRefetching } = useBestPrices({
    fuelType: selectedFuelType,
    maxDistance,
    enabled: !!location, // Only enable the query if we have a location
    providedLocation: location || undefined,
  });

  useEffect(() => {
    // Only select the first card if data is not loading, data exists, and no card is currently selected
    if (
      !isLoading &&
      data?.prices &&
      data.prices.length > 0 &&
      selectedCardId === null
    ) {
      setSelectedCardId(data.prices[0].id);
    }
  }, [data, isLoading, selectedCardId]); // Added isLoading to dependencies

  const handleFuelTypeSelect = (fuelType: FuelType | undefined) => {
    const newValue = fuelType === selectedFuelType ? undefined : fuelType;
    setSelectedFuelType(newValue);
  };

  const handleDistanceChange = (distance: DistanceOption) => {
    setMaxDistance(distance);
  };

  const handleRefresh = async () => {
    await refreshLocation();
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

  const renderStatsHeader = () => {
    if (!data?.stats || !data.prices || data.prices.length === 0) return null;

    const nearestStation = data.prices.reduce((nearest, current) => {
      const currentDistance = current.distance ?? Infinity;
      const nearestDistance = nearest?.distance ?? Infinity;
      return currentDistance < nearestDistance ? current : nearest;
    }, data.prices[0]);

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {nearestStation && nearestStation.distance != null ? (
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push(`/station/${nearestStation.id}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.statLabel}>Nearest Station</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {nearestStation.name} ({formatDistance(nearestStation.distance)}
                )
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.statItem} />
          )}

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

  // --- Conditional Renders ---

  // Handle location permission/error first
  // This check now handles locationError which includes permissionDenied scenario
  if (locationError) {
    return renderLocationError();
  }

  // Handle initial location loading
  // Show full screen loader ONLY if location is loading AND we don't have a location yet
  if (locationLoading && !location) {
    console.log('[BestPricesScreen] Showing full screen location loader');
    return <LoadingIndicator fullScreen message='Getting your location...' />;
  }

  // Handle initial station data loading
  // Show full screen loader if location is available (or defaulted) AND
  // station data is LOADING AND we DON'T have data yet (first fetch)
  const isInitialStationLoading = isLoading && !data;

  if (isInitialStationLoading) {
    console.log('[BestPricesScreen] Showing full screen station data loader');
    return (
      <LoadingIndicator
        fullScreen
        message={`Finding best prices for ${
          selectedFuelType || 'any fuel type'
        } within ${maxDistance} km...`}
      />
    );
  }

  // Handle station data error AFTER initial loading
  // Show error if data is NOT loading (neither initial nor refetching) but there's an error
  if (error && !isLoading && !isRefetching) {
    console.log('[BestPricesScreen] Showing station data error');
    return (
      <ErrorDisplay
        fullScreen
        message='There was an error loading price data. Please try again.'
        onRetry={refetch}
      />
    );
  }

  // --- Render Content ---
  // If we reach here, location is available/defaulted, and initial data load/error is handled.
  // The FlatList itself will handle the empty state via ListEmptyComponent
  // and background refetching via RefreshControl.

  // Ensure we have location data before rendering the main view (should be true based on checks above)
  if (!location) {
    console.warn(
      'BestPricesScreen: Rendering list view but location is unexpectedly null.'
    );
    return (
      <View style={styles.fullScreenContainer}>
        <ErrorDisplay
          fullScreen
          title='Initialization Error'
          message='Could not initialize price list. Please restart the app.'
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={theme.Colors.white} barStyle='dark-content' />
      <FilterControlBubble
        selectedFuelType={selectedFuelType}
        onFuelTypeSelect={handleFuelTypeSelect}
        fuelTypes={FUEL_TYPES}
        selectedDistance={maxDistance}
        onDistanceSelect={handleDistanceChange}
        distanceOptions={DISTANCE_OPTIONS}
      />
      <FlatList
        data={data?.prices || []} // Pass empty array if data.prices is undefined (shouldn't happen here)
        keyExtractor={(item) => `${item.id}-${item.fuel_type}`}
        renderItem={({ item }) => {
          const lowestPrice = data?.stats?.lowestPrice;
          const isSelected = item.id === selectedCardId;

          const handlePress = () => {
            setSelectedCardId(isSelected ? null : item.id);
            // Navigate *after* potentially setting selected card id
            router.push(`/station/${item.id}`);
          };

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
              week_of={item.week_of}
              isLowestPrice={
                lowestPrice !== null &&
                item.price !== null &&
                item.price === lowestPrice
              }
              isSelected={isSelected}
              onPress={handlePress}
              latitude={item.latitude}
              longitude={item.longitude}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        // RefreshControl shows background loading indicator
        refreshControl={
          <RefreshControl
            refreshing={isRefetching} // Use isRefetching here for background pull-to-refresh
            onRefresh={handleRefresh}
            colors={[theme.Colors.primary]}
            tintColor={theme.Colors.primary}
          />
        }
        ListHeaderComponent={data?.prices?.length ? renderStatsHeader() : null}
        // ListEmptyComponent only shows if data?.prices || [] is empty *after* loading is done
        ListEmptyComponent={
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
            onSecondaryAction={{
              label: 'Try Again',
              onPress: handleRefresh, // Use handleRefresh which includes location + data refetch
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
