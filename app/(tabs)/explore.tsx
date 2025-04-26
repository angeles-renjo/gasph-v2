import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
// Removed FlashList import
import { useNearbyStations } from '@/hooks/queries/stations/useNearbyStations';
import { useLocationStore } from '@/hooks/stores/useLocationStore'; // Use Zustand store
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore'; // Import preferences store
import { FuelType } from '@/hooks/queries/prices/useBestPrices'; // Import FuelType type
import { StationCard } from '@/components/station/StationCard';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { Database } from '@/utils/supabase/types';
import { styles } from '@/styles/screens/ExploreScreen.styles';
import { Colors } from '@/styles/theme';

type GasStation = Database['public']['Tables']['gas_stations']['Row'] & {
  distance?: number;
};

const POPULAR_BRANDS = [
  'Shell',
  'Petron',
  'Caltex',
  'Phoenix',
  'Seaoil',
  'CleanFuel',
];

const FUEL_TYPES: FuelType[] = [
  'Diesel',
  'RON 91',
  'RON 95',
  'RON 97',
  'RON 100',
  'Diesel Plus',
];

/**
 * ExploreScreen component provides a user interface for exploring nearby gas stations.
 * It fetches location data and displays stations within a specified radius.
 * Users can search for stations by name, brand, or address, and filter results by popular brands.
 * The screen handles location errors and displays a loading indicator while fetching data.
 * It manages user permissions and shows notifications when using a default location.
 * The component also allows refreshing the station list and shows an empty state if no stations are found.
 */

export default function ExploreScreen() {
  // Get state and actions from Zustand store using individual selectors to prevent re-renders
  const getLocationWithFallback = useLocationStore(
    (state) => state.getLocationWithFallback
  );
  const locationLoading = useLocationStore((state) => state.loading);
  const locationError = useLocationStore((state) => state.error);
  const permissionDenied = useLocationStore((state) => state.permissionDenied);

  const locationData = getLocationWithFallback();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [filteredStations, setFilteredStations] = useState<GasStation[]>([]);
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);

  // Get default fuel type from preferences store
  const defaultFuelTypeFromStore = usePreferencesStore(
    (state) => state.defaultFuelType
  );

  // Use local state for the fuel type filter, initialized with the preference
  const [selectedFuelType, setSelectedFuelType] = useState<
    FuelType | undefined
  >(defaultFuelTypeFromStore ?? undefined);

  // Update local state when preference changes
  useEffect(() => {
    setSelectedFuelType(defaultFuelTypeFromStore ?? undefined);
  }, [defaultFuelTypeFromStore]);

  const {
    data: stations,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useNearbyStations({
    radiusKm: 15,
    enabled: true,
    providedLocation: locationData,
  });

  // Update notification banner when using default location
  useEffect(() => {
    setUsingDefaultLocation(!!locationData.isDefaultLocation);
  }, [locationData.isDefaultLocation]);

  // Filter stations based on search query, selected brand, and fuel type
  useEffect(() => {
    if (!stations) {
      setFilteredStations([]);
      return;
    }

    // Ensure stations is iterable before spreading
    let filtered = Array.isArray(stations) ? [...stations] : [];

    // Apply brand filter
    if (selectedBrand) {
      filtered = filtered.filter(
        (station) => station.brand.toLowerCase() === selectedBrand.toLowerCase()
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (station) =>
          station.name.toLowerCase().includes(query) ||
          station.brand.toLowerCase().includes(query) ||
          station.address.toLowerCase().includes(query) ||
          station.city.toLowerCase().includes(query)
      );
    }

    // Apply fuel type filter if selected
    // Note: This is a simplified filter since we don't have fuel type data in the station objects
    // In a real implementation, you would filter based on available fuel types at each station
    if (selectedFuelType) {
      // This is a placeholder - in a real app, you would filter based on stations that offer this fuel type
      // For now, we're not actually filtering by fuel type since we don't have that data
      console.log(`Filtering for fuel type: ${selectedFuelType}`);
      // filtered = filtered.filter(station => station.availableFuelTypes?.includes(selectedFuelType));
    }

    setFilteredStations(filtered);
  }, [stations, searchQuery, selectedBrand, selectedFuelType]); // Added selectedFuelType dependency

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(selectedBrand === brand ? null : brand);
  };

  const handleFuelTypeSelect = (fuelType: FuelType) => {
    // If selecting the same type, clear it (set to undefined)
    setSelectedFuelType(selectedFuelType === fuelType ? undefined : fuelType);
  };

  if (locationLoading) {
    return (
      <LoadingIndicator fullScreen message='Getting location information...' />
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        fullScreen
        message='There was an error loading station data. Please try again.'
        onRetry={refetch}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {usingDefaultLocation && (
          <View style={styles.defaultLocationBanner}>
            <FontAwesome5
              name='info-circle'
              size={16}
              color='#fff'
              style={styles.bannerIcon}
            />
            <Text style={styles.bannerText}>
              Using Metro Manila as default location. Enable location for better
              results.
            </Text>
            <TouchableOpacity
              style={styles.bannerButton}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }}
            >
              <Text style={styles.bannerButtonText}>Enable</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <FontAwesome5
              name='search'
              size={16}
              color='#999'
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder='Search stations, brands, or addresses'
              placeholderTextColor={Colors.placeholderGray} // Add prop here
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode='while-editing' // Rely on this for iOS clear button
            />
            {/* Removed custom TouchableOpacity clear button to avoid duplication on iOS */}
          </View>
        </View>

        {/* Brand Filter */}
        <View style={styles.brandFilterContainer}>
          <Text style={styles.filterLabel}>Brand:</Text>
          <FlatList
            horizontal
            data={POPULAR_BRANDS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.brandChip,
                  selectedBrand === item && styles.selectedBrandChip,
                ]}
                onPress={() => handleBrandSelect(item)}
              >
                <Text
                  style={[
                    styles.brandChipText,
                    selectedBrand === item && styles.selectedBrandChipText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandList}
          />
        </View>

        {/* Fuel Type Filter */}
        <View style={styles.brandFilterContainer}>
          <Text style={styles.filterLabel}>Fuel Type:</Text>
          <FlatList
            horizontal
            data={FUEL_TYPES}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.brandChip,
                  selectedFuelType === item && styles.selectedBrandChip,
                ]}
                onPress={() => handleFuelTypeSelect(item)}
              >
                <Text
                  style={[
                    styles.brandChipText,
                    selectedFuelType === item && styles.selectedBrandChipText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandList}
          />
        </View>

        {isLoading ? (
          <LoadingIndicator message='Finding stations near you...' />
        ) : filteredStations.length > 0 ? (
          <FlatList
            data={filteredStations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <StationCard station={item} />}
            // Removed estimatedItemSize
            contentContainerStyle={styles.stationList}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
          />
        ) : (
          <EmptyState
            title='No Stations Found'
            message={
              searchQuery || selectedBrand || selectedFuelType
                ? "We couldn't find any stations matching your filters. Try a different search or clear your filters."
                : "We couldn't find any gas stations near you. Try increasing the search radius."
            }
            icon='gas-pump'
            actionLabel={
              searchQuery || selectedBrand || selectedFuelType
                ? 'Clear Filters'
                : undefined
            }
            onAction={
              searchQuery || selectedBrand || selectedFuelType
                ? () => {
                    setSearchQuery('');
                    setSelectedBrand(null);
                    setSelectedFuelType(undefined);
                  }
                : undefined
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
