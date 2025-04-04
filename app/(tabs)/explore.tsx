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
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode='while-editing'
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <FontAwesome5 name='times-circle' size={16} color='#999' />
              </TouchableOpacity>
            )}
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
    backgroundColor: '#f5f5f5',
  },
  defaultLocationBanner: {
    backgroundColor: '#e76f51',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bannerIcon: {
    marginRight: 8,
  },
  bannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
  },
  bannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  bannerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  brandFilterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  brandList: {
    paddingHorizontal: 16,
  },
  brandChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedBrandChip: {
    backgroundColor: '#2a9d8f',
  },
  brandChipText: {
    fontSize: 14,
    color: '#666',
  },
  selectedBrandChipText: {
    color: '#fff',
    fontWeight: '500',
  },
  stationList: {
    padding: 16,
  },
});
