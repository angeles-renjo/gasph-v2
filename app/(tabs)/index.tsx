import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useBestPrices, FuelType } from '@/hooks/useBestPrices';
import { useLocation } from '@/hooks/useLocation';
import { BestPriceCard } from '@/components/price/BestPriceCard';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';

const FUEL_TYPES: FuelType[] = [
  'Diesel',
  'RON 91',
  'RON 95',
  'RON 97',
  'RON 100',
];

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
  const [maxDistance, setMaxDistance] = useState(15); // Default to 15 km

  const {
    data: prices,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useBestPrices({
    fuelType: selectedFuelType,
    maxDistance,
    enabled: !!location,
  });

  const handleFuelTypeSelect = (fuelType: FuelType | undefined) => {
    setSelectedFuelType(fuelType === selectedFuelType ? undefined : fuelType);
  };

  const handleDistanceChange = (distance: number) => {
    setMaxDistance(distance);
  };

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  // Location permission denied or error fallback
  if (locationError) {
    return (
      <SafeAreaView style={styles.fullScreenContainer}>
        <View style={styles.fallbackContainer}>
          <FontAwesome5 name='map-marker-alt' size={60} color='#cccccc' />
          <Text style={styles.fallbackTitle}>Location Access Required</Text>
          <Text style={styles.fallbackMessage}>
            GasPH needs your location to find the best fuel prices near you.
            Without location access, we can't show you personalized price
            recommendations.
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
      <View style={styles.header}>
        <Text style={styles.title}>Best Fuel Prices Near You</Text>
        {location && (
          <View style={styles.locationContainer}>
            <FontAwesome5 name='map-marker-alt' size={16} color='#2a9d8f' />
            <Text style={styles.locationText}>Your Area</Text>
          </View>
        )}
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fuelTypeFilters}
        >
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
        </ScrollView>

        <View style={styles.distanceFilterContainer}>
          <Text style={styles.distanceLabel}>Distance</Text>
          <View style={styles.distanceOptions}>
            {[5, 15, 30].map((distance) => (
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
      </View>

      {isLoading ? (
        <LoadingIndicator message='Finding best prices...' />
      ) : prices && prices.length > 0 ? (
        <FlatList
          data={prices}
          keyExtractor={(item) => `${item.station_id}-${item.fuel_type}`}
          renderItem={({ item }) => (
            <BestPriceCard
              stationId={item.station_id}
              stationName={item.station_name}
              stationBrand={item.station_brand}
              fuelType={item.fuel_type}
              price={item.price}
              distance={item.distance || 0}
              city={item.city}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      ) : (
        <EmptyState
          title='No Prices Found'
          message={
            selectedFuelType
              ? `No ${selectedFuelType} prices found within ${maxDistance} km. Try expanding your search or checking another fuel type.`
              : `No fuel prices found within ${maxDistance} km. Try expanding your search distance.`
          }
          icon='gas-pump'
          actionLabel='Reset Filters'
          onAction={() => {
            setSelectedFuelType(undefined);
            setMaxDistance(15);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  fallbackMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  fallbackButtonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  fallbackButton: {
    marginBottom: 12,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  fuelTypeFilters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#2a9d8f',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterChipText: {
    color: '#fff',
    fontWeight: '500',
  },
  distanceFilterContainer: {
    paddingHorizontal: 16,
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  distanceOptions: {
    flexDirection: 'row',
  },
  distanceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeDistanceChip: {
    backgroundColor: '#f4a261',
  },
  distanceChipText: {
    fontSize: 14,
    color: '#666',
  },
  activeDistanceChipText: {
    color: '#fff',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
});
