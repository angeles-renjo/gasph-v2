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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import {
  useInfiniteStationsSortedByDistance,
  StationWithDistance,
} from '@/hooks/queries/stations/useInfiniteStationsSortedByDistance';
import { useLocationStore } from '@/hooks/stores/useLocationStore';
import { StationCard } from '@/components/station/StationCard';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { styles } from '@/styles/screens/ExploreScreen.styles';
import { Colors } from '@/styles/theme';

const POPULAR_BRANDS = [
  'Shell',
  'Petron',
  'Caltex',
  'Phoenix',
  'Seaoil',
  'CleanFuel',
];

/**
 * ExploreScreen component provides a user interface for exploring gas stations.
 * It fetches location data and displays stations sorted by distance.
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
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);

  // Use the infinite query hook with filters
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteStationsSortedByDistance({
    location: locationData,
    searchTerm: searchQuery,
    brandFilter:
      selectedBrands.size > 0 ? Array.from(selectedBrands) : undefined,
    enabled: !locationLoading,
  });

  // Update notification banner when using default location
  useEffect(() => {
    setUsingDefaultLocation(!!locationData.isDefaultLocation);
  }, [locationData.isDefaultLocation]);

  // Flatten the pages of stations data for rendering
  const stations = useMemo(() => {
    return data?.pages.flatMap((page) => page.stations) || [];
  }, [data]);

  const handleBrandSelect = (brand: string) => {
    setSelectedBrands((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(brand)) {
        newSet.delete(brand); // Deselect if already selected
      } else {
        newSet.add(brand); // Select if not selected
      }
      return newSet;
    });
  };

  // Handle end reached for infinite scrolling
  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBrands(new Set());
  };

  if (locationLoading) {
    return (
      <LoadingIndicator fullScreen message='Getting location information...' />
    );
  }

  if (isError && error) {
    return (
      <ErrorDisplay
        fullScreen
        message='There was an error loading station data. Please try again.'
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
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
              placeholderTextColor={Colors.placeholderGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode='while-editing'
            />
          </View>
        </View>

        {/* Brand Filter */}
        <View style={styles.brandFilterContainer}>
          <Text style={styles.filterLabel}>Brand</Text>
          <FlatList
            horizontal
            data={POPULAR_BRANDS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.brandChip,
                  selectedBrands.has(item) && styles.selectedBrandChip,
                ]}
                onPress={() => handleBrandSelect(item)}
              >
                <Text
                  style={[
                    styles.brandChipText,
                    selectedBrands.has(item) && styles.selectedBrandChipText,
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

        {isLoading && !data ? (
          <LoadingIndicator message='Finding stations near you...' />
        ) : stations.length > 0 ? (
          <FlatList
            data={stations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StationCard
                station={item}
                isFavorite={false} // You can implement favorite functionality if needed
              />
            )}
            contentContainerStyle={styles.stationList}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size='small' color={Colors.primary} />
                  <Text style={styles.loadingMoreText}>
                    Loading more stations...
                  </Text>
                </View>
              ) : null
            }
          />
        ) : (
          <EmptyState
            title='No Stations Found'
            message={
              searchQuery || selectedBrands.size > 0
                ? "We couldn't find any stations matching your filters. Try a different search or clear your filters."
                : "We couldn't find any gas stations. Try adjusting your search criteria."
            }
            icon='gas-pump'
            actionLabel={
              searchQuery || selectedBrands.size > 0
                ? 'Clear Filters'
                : undefined
            }
            onAction={
              searchQuery || selectedBrands.size > 0 ? clearFilters : undefined
            }
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
