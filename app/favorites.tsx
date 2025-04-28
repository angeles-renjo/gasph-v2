import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useFavoriteStationPrices } from '@/hooks/queries/stations/useFavoriteStationPrices';
import { BestPriceCard } from '@/components/price/BestPriceCard';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import theme from '@/styles/theme';
import { FontAwesome5 } from '@expo/vector-icons';

export default function FavoritesScreen() {
  const router = useRouter();
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

  const renderContent = () => {
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
    </SafeAreaView>
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
});
