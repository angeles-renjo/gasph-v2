const openAppSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { useLocation } from '@/hooks/useLocation';
import { StationCard } from '@/components/station/StationCard';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { Database } from '@/utils/supabase/types';
import { Button } from '@/components/ui/Button';
import theme, {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from '@/styles/theme'; // Import theme constants

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

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * ExploreScreen component provides a user interface for exploring nearby gas stations.
 * It fetches location data and displays stations within a specified radius.
 * Users can search for stations by name, brand, or address, and filter results by popular brands.
 * The screen handles location errors and displays a loading indicator while fetching data.
 * It manages user permissions and shows notifications when using a default location.
 * The component also allows refreshing the station list and shows an empty state if no stations are found.
 */

/*******  954ba215-9b9a-4676-9e28-0a5d8331f29e  *******/
export default function ExploreScreen() {
  const {
    getLocationWithFallback,
    loading: locationLoading,
    error: locationError,
    permissionDenied,
    refreshLocation,
  } = useLocation();

  const locationData = getLocationWithFallback();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [filteredStations, setFilteredStations] = useState<GasStation[]>([]);
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);

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

  // Filter stations based on search query and selected brand
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

    setFilteredStations(filtered);
  }, [stations, searchQuery, selectedBrand]);

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(selectedBrand === brand ? null : brand);
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

        <View style={styles.brandFilterContainer}>
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
              searchQuery || selectedBrand
                ? "We couldn't find any stations matching your filters. Try a different search or clear your filters."
                : "We couldn't find any gas stations near you. Try increasing the search radius."
            }
            icon='gas-pump'
            actionLabel={
              searchQuery || selectedBrand ? 'Clear Filters' : undefined
            }
            onAction={
              searchQuery || selectedBrand
                ? () => {
                    setSearchQuery('');
                    setSelectedBrand(null);
                  }
                : undefined
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray2, // Use theme color
  },
  defaultLocationBanner: {
    backgroundColor: Colors.secondary, // Use theme color (secondary or warning)
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm, // Use theme spacing
    paddingHorizontal: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  bannerIcon: {
    marginRight: Spacing.sm, // Use theme spacing
  },
  bannerText: {
    flex: 1,
    color: Colors.white, // Use theme color
    fontSize: Typography.fontSizeSmall, // Use theme typography
  },
  bannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Keep semi-transparent white
    paddingVertical: Spacing.xxs, // Use theme spacing
    paddingHorizontal: Spacing.sm, // Use theme spacing
    borderRadius: BorderRadius.sm, // Use theme border radius
    marginLeft: Spacing.sm, // Use theme spacing
  },
  bannerButtonText: {
    color: Colors.white, // Use theme color
    fontSize: Typography.fontSizeSmall, // Use theme typography
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
  },
  searchContainer: {
    backgroundColor: Colors.white, // Use theme color
    padding: Spacing.xl, // Use theme spacing
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGray, // Use theme color
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.inputPaddingHorizontal, // Use theme spacing
    borderRadius: BorderRadius.xl, // Make more rounded
    borderWidth: 3,
    borderColor: Colors.dividerGray, // Use subtle border color
  },
  searchIcon: {
    marginRight: Spacing.sm, // Use theme spacing
    color: Colors.iconGray, // Use specific icon color
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md, // Use theme spacing
    fontSize: Typography.fontSizeLarge, // Use theme typography
    color: Colors.darkGray, // Use theme color
    // placeholderTextColor is a TextInput prop, not a style
  },
  brandFilterContainer: {
    backgroundColor: Colors.white, // Use theme color
    paddingVertical: Spacing.inputPaddingHorizontal, // Use theme spacing
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGray, // Use theme color
  },
  brandList: {
    paddingHorizontal: Spacing.xl, // Use theme spacing
  },
  brandChip: {
    paddingHorizontal: Spacing.inputPaddingHorizontal, // Use theme spacing
    paddingVertical: Spacing.xs, // Use theme spacing
    borderRadius: BorderRadius.round, // Make pill-shaped
    backgroundColor: 'transparent', // Remove background fill for unselected
    marginRight: Spacing.md, // Increase space between chips
    borderWidth: 1, // Keep border
    borderColor: Colors.mediumGray, // Use a slightly darker border for unselected
  },
  selectedBrandChip: {
    backgroundColor: Colors.primaryLightTint, // Use light tint for selected background
    borderColor: Colors.primary, // Keep primary border for selected
  },
  brandChipText: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    color: Colors.textGray, // Use theme color for unselected text
  },
  selectedBrandChipText: {
    color: Colors.primary, // Use primary color for selected text
    fontWeight: Typography.fontWeightMedium, // Use theme typography
  },
  stationList: {
    padding: Spacing.xl, // Use theme spacing
  },
});
