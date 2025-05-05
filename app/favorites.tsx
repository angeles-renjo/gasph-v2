import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useFavoriteStationPrices } from '@/hooks/queries/stations/useFavoriteStationPrices';
import { useLocationStore } from '@/hooks/stores/useLocationStore'; // Import location store
import { BestPriceCard } from '@/components/price/BestPriceCard';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import theme from '@/styles/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button'; // Import Button
import { openDeviceLocationSettings } from '@/utils/locationUtils'; // Import utility

export default function FavoritesScreen() {
  const router = useRouter();
  // Get permission status
  const permissionDenied = useLocationStore((state) => state.permissionDenied);
  const refreshLocation = useLocationStore((state) => state.refreshLocation); // For potential retry button

  const {
    data: favoriteStations,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useFavoriteStationPrices();

  const handleRefresh = async () => {
    await refetch();
  };

  const navigateToStation = (stationId: string) => {
    router.push(`/station/${stationId}`);
  };

  // --- Reusable Permission Denied Component (similar to home.tsx but full screen) ---
  const renderPermissionDenied = () => (
    <View style={styles.fullScreenMessageContainer}>
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
        GasPH needs your location to show distances to your favorite stations.
      </Text>
      <View style={styles.fallbackButtonContainer}>
        <Button
          title='Enable Location'
          onPress={openDeviceLocationSettings}
          variant='primary'
          style={styles.fallbackButton}
        />
        {/* Optional: Add a retry button if needed */}
        {/* <Button
          title='Try Again'
          onPress={refreshLocation}
          variant='outline'
          style={styles.fallbackButton}
        /> */}
      </View>
    </View>
  );
  // --- End Permission Denied Component ---

  const renderContent = () => {
    // Check permission denied first
    if (permissionDenied) {
      return renderPermissionDenied();
    }

    // Then check loading state
    if (isLoading) {
      return <LoadingIndicator message='Loading favorite stations...' />;
    }

    if (isError) {
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
          icon='heart'
          onAction={{
            label: 'Explore Stations',
            onPress: () => router.push('/explore'),
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
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Favorite Stations',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <FontAwesome5
                name='arrow-left'
                size={18}
                color={theme.Colors.darkGray}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <StatusBar backgroundColor={theme.Colors.white} barStyle='dark-content' />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.light.background,
  },
  listContent: {
    padding: theme.Spacing.md,
    paddingTop: theme.Spacing.sm,
  },
  backButton: {
    padding: theme.Spacing.sm,
  },
  // Styles for the full-screen permission denied message
  fullScreenMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.xl,
    backgroundColor: theme.Colors.light.background,
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
    alignItems: 'center', // Center button(s)
  },
  fallbackButton: {
    width: '80%', // Make button slightly narrower
    marginBottom: theme.Spacing.md,
  },
});
