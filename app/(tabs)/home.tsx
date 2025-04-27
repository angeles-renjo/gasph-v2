import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
} from 'react-native';
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

  const handleRefresh = async () => {
    await refetch();
  };

  const navigateToStation = (stationId: string) => {
    router.push(`/station/${stationId}`);
  };

  // --- Location Error Handling (Similar to BestPricesScreen) ---
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
    </SafeAreaView>
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
      <FlatList
        data={favoriteStations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          // Provide fallbacks for potentially null values expected as strings by BestPriceCard
          const name = item.name ?? 'Unknown Station';
          const brand = item.brand ?? 'Unknown Brand';
          const city = item.city ?? 'Unknown City';
          // BestPriceCard expects fuel_type as FuelType, handle null case
          const fuel_type = item.fuel_type ?? 'Diesel'; // Default to Diesel or handle differently?

          // BestPriceCard expects distance/confirmations as number | undefined, handle null
          const distance = item.distance ?? undefined;
          const confirmations_count = item.confirmations_count ?? 0; // Default to 0 confirmations

          return (
            <BestPriceCard
              id={item.id}
              name={name}
              brand={brand}
              fuel_type={fuel_type} // Use the handled fuel_type
              price={item.price} // Price can be null, BestPriceCard should handle this
              distance={distance} // Use the handled distance
              city={city}
              confirmations_count={confirmations_count} // Use the handled count
              // Pass null/false for props not relevant to favorites
              min_price={null}
              common_price={null}
              max_price={null}
              source_type={null}
              isLowestPrice={false}
              isSelected={false} // Selection not implemented here yet
              onPress={() => navigateToStation(item.id)} // Navigate on press
            />
          ); // Add missing semicolon
        }} // Add missing closing brace for renderItem
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[theme.Colors.primary]}
            tintColor={theme.Colors.primary}
          />
        }
        ListHeaderComponent={
          <Text style={styles.headerTitle}>Favorite Stations</Text>
        }
        showsVerticalScrollIndicator={false}
      />
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
  headerTitle: {
    fontSize: theme.Typography.fontSizeXXLarge,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.darkGray,
    marginBottom: theme.Spacing.lg,
    paddingHorizontal: theme.Spacing.md, // Add some horizontal padding
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
