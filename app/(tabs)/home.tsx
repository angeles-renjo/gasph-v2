import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFavoriteStationPrices } from '@/hooks/queries/stations/useFavoriteStationPrices';
import { useLocationStore } from '@/hooks/stores/useLocationStore'; // Needed for location error handling
import { BestPriceCard } from '@/components/price/BestPriceCard';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import theme from '@/styles/theme';
import { openDeviceLocationSettings } from '@/utils/locationUtils'; // For location error button
import { Button } from '@/components/ui/Button'; // For location error button
import { FontAwesome5 } from '@expo/vector-icons'; // For location error icon

export default function HomeScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();
  const {
    data: favoriteStations,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useFavoriteStationPrices();

  // Get location status for error handling
  const locationError = useLocationStore((state) => state.error);
  const locationLoading = useLocationStore((state) => state.loading);
  const refreshLocation = useLocationStore((state) => state.refreshLocation);

  const navigateToStation = (stationId: string) => {
    router.push(`/station/${stationId}`);
  };

  // --- Location Error Handling (Similar to BestPricesScreen) ---
  const renderLocationError = () => (
    <View style={styles.fullScreenContainer}>
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
          GasPH needs your location to calculate distances to your favorite
          stations.
        </Text>
        <View style={styles.fallbackButtonContainer}>
          <Button
            title='Enable Location'
            onPress={openDeviceLocationSettings} // Use utility function
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
    </View>
  );
  // --- End Location Error Handling ---

  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator message='Loading favorite stations...' />;
    }

    if (isError && !locationError) {
      // Handle general data fetching errors (not location specific)
      return (
        <ErrorDisplay
          fullScreen
          message='Could not load favorite stations. Please try again.'
          onRetry={refetch}
        />
      );
    }

    if (!favoriteStations || favoriteStations.length === 0) {
      return (
        <EmptyState
          title='No Favorite Stations'
          message='Add stations to your favorites from the Explore or Map tabs to see them here.'
          icon='heart' // Use a heart icon for favorites
          onAction={{
            label: 'Explore Stations',
            onPress: () => router.push('/explore'), // Navigate to explore tab
          }}
        />
      );
    }

    return (
      <View>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Favorite Stations</Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/favorites')}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <PagerView
          style={styles.pagerView}
          initialPage={0}
          pageMargin={10}
          onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
        >
          {favoriteStations.map((item) => {
            // Provide fallbacks for potentially null values expected as strings by BestPriceCard
            const name = item.name ?? 'Unknown Station';
            const brand = item.brand ?? 'Unknown Brand';
            const city = item.city ?? 'Unknown City';
            // BestPriceCard expects fuel_type as FuelType, handle null case
            const fuel_type = item.fuel_type ?? 'Diesel';

            // BestPriceCard expects distance/confirmations as number | undefined, handle null
            const distance = item.distance ?? undefined;
            const confirmations_count = item.confirmations_count ?? 0;

            return (
              <View key={item.id} collapsable={false}>
                <BestPriceCard
                  id={item.id}
                  name={name}
                  brand={brand}
                  fuel_type={fuel_type}
                  price={item.price}
                  distance={distance}
                  city={city}
                  confirmations_count={confirmations_count}
                  // Pass DOE price data
                  min_price={item.min_price}
                  common_price={item.common_price}
                  max_price={item.max_price}
                  source_type={item.source_type}
                  isLowestPrice={false}
                  isSelected={false}
                  onPress={() => navigateToStation(item.id)}
                />
              </View>
            );
          })}
        </PagerView>

        <View style={styles.pagerIndicator}>
          {favoriteStations.map((_, index) => (
            <View
              key={index}
              style={[
                styles.pagerDot,
                {
                  backgroundColor: theme.Colors.primary,
                  opacity: currentPage === index ? 1 : 0.5,
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  // Prioritize showing location loading/error first
  if (locationLoading) {
    return <LoadingIndicator fullScreen message='Getting your location...' />;
  }

  if (locationError) {
    return renderLocationError();
  }

  // If location is fine, render the main content or its loading/error states
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar backgroundColor={theme.Colors.white} barStyle='dark-content' />
      {renderContent()}
    </SafeAreaView>
  );
}

// Reuse styles from BestPricesScreen where applicable, adjust as needed
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.light.background,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: theme.Colors.light.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.md,
    marginBottom: theme.Spacing.md,
  },
  headerTitle: {
    fontSize: theme.Typography.fontSizeXXLarge,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.darkGray,
  },
  viewAllButton: {
    padding: theme.Spacing.sm,
  },
  viewAllText: {
    color: theme.Colors.primary,
    fontWeight: theme.Typography.fontWeightMedium,
    fontSize: theme.Typography.fontSizeMedium,
  },
  pagerView: {
    height: 220,
    marginBottom: theme.Spacing.sm,
  },
  pagerIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.md,
  },
  pagerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    opacity: 0.5,
  },
  listContent: {
    padding: theme.Spacing.md,
    paddingTop: theme.Spacing.sm,
  },
  // --- Fallback Styles (Copied from BestPricesScreen) ---
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
