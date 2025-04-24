import { useState, useEffect } from 'react'; // Add useEffect back
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
import { Link, useRouter } from 'expo-router'; // Import useRouter
import { useBestPrices, FuelType } from '@/hooks/queries/prices/useBestPrices';
import { useLocationStore } from '@/hooks/stores/useLocationStore'; // Use Zustand store
import { BestPriceCard } from '@/components/price/BestPriceCard';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { FilterControlBubble } from '@/components/ui/FilterControlBubble'; // Import the new component
import theme from '@/styles/theme';
import { formatDistance } from '@/utils/formatters'; // Import formatDistance
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore'; // Import preferences store

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
  // Get state and actions from Zustand store using individual selectors to prevent re-renders
  const location = useLocationStore((state) => state.location);
  const locationLoading = useLocationStore((state) => state.loading);
  const locationError = useLocationStore((state) => state.error);
  const refreshLocation = useLocationStore((state) => state.refreshLocation);

  // Get default fuel type from preferences store
  const defaultFuelTypeFromStore = usePreferencesStore(
    (state) => state.defaultFuelType
  );

  const [selectedFuelType, setSelectedFuelType] = useState<
    FuelType | undefined
  >(defaultFuelTypeFromStore ?? undefined); // Initialize with preference, fallback to undefined if null
  const [maxDistance, setMaxDistance] = useState<DistanceOption>(15);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null); // Add state for selected card ID
  const router = useRouter(); // Get router instance

  // Log the location being used for the query removed
  // console.log('[BestPricesScreen] Location passed to useBestPrices:', location);

  const { data, isLoading, error, refetch, isRefetching } = useBestPrices({
    fuelType: selectedFuelType,
    maxDistance,
    enabled: !!location,
    providedLocation: location || undefined,
  });

  // Effect to select the first card when data loads and nothing is selected
  useEffect(() => {
    if (data?.prices && data.prices.length > 0 && selectedCardId === null) {
      setSelectedCardId(data.prices[0].id);
    }
    // Reset selection if filters change and the selected card is no longer visible?
    // For now, let's keep it simple and only select the first on initial load/data change when nothing is selected.
    // Dependency array includes data and selectedCardId to re-evaluate when they change.
  }, [data, selectedCardId]);

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
            onPress={refreshLocation} // Use refresh action from store
            variant='outline'
            style={styles.fallbackButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );

  const renderStatsHeader = () => {
    // Ensure data and prices exist
    if (!data?.stats || !data.prices || data.prices.length === 0) return null;

    // Find the nearest station from the current list
    const nearestStation = data.prices.reduce(
      (nearest, current) => {
        // Handle potential undefined distance
        const currentDistance = current.distance ?? Infinity;
        const nearestDistance = nearest?.distance ?? Infinity;
        return currentDistance < nearestDistance ? current : nearest;
      },
      data.prices[0] // Start with the first item as initial nearest
    );

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {/* Display Nearest Station - Make it pressable */}
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
            // Fallback or hide if no nearest station found (shouldn't happen if prices exist)
            <View style={styles.statItem} /> // Render an empty item to maintain layout
          )}

          {/* Display Best Price */}
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
          const lowestPrice = data?.stats?.lowestPrice;
          const isSelected = item.id === selectedCardId; // Check if this card is selected

          const handlePress = () => {
            setSelectedCardId(isSelected ? null : item.id); // Select or deselect on press
            router.push(`/station/${item.id}`); // Navigate on press
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
              isLowestPrice={
                lowestPrice !== null &&
                item.price !== null &&
                item.price === lowestPrice
              }
              isSelected={isSelected} // Pass the selection state
              onPress={handlePress} // Pass the press handler
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
      {/* Ensure 'top' edge is included */}
      <StatusBar backgroundColor={theme.Colors.white} barStyle='dark-content' />
      {/* Filter Bubble - Placed at the top of the layout */}
      <FilterControlBubble
        selectedFuelType={selectedFuelType}
        onFuelTypeSelect={handleFuelTypeSelect}
        fuelTypes={FUEL_TYPES}
        selectedDistance={maxDistance}
        onDistanceSelect={handleDistanceChange}
        distanceOptions={DISTANCE_OPTIONS}
      />
      <Link href='/faq'>FAQ</Link>
      <Link href='/location-test'>Test Location</Link>
      {/* Main content - Renders below the filter bubble */}
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

  // Removed old filter styles (filterContainer, filterSection, etc.)

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
    paddingTop: theme.Spacing.md, // Keep padding top for list content
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
