import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { PriceCard } from '@/components/price/PriceCard';
import { Card } from '@/components/ui/Card';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useStationFuelTypePrices } from '@/hooks/queries/stations/useStationFuelTypePrices'; // Import the hook
import { useAuth } from '@/hooks/useAuth'; // Import useAuth to check user ID

export default function CommunityPricesScreen() {
  // Get stationId and fuelType from route params
  const { stationId, fuelType, stationName } = useLocalSearchParams<{
    stationId: string;
    fuelType: string;
    stationName?: string; // Optional: Pass station name for display
  }>();

  // --- DEBUG LOG 1: Check received parameters ---
  console.log('[CommunityPricesScreen] Received Params:', {
    stationId,
    fuelType,
    stationName,
  });

  const { user } = useAuth(); // Get current user

  // Use the actual query hook
  const {
    data: prices,
    isLoading,
    isError,
    error,
    refetch,
  } = useStationFuelTypePrices(stationId, fuelType);

  // --- DEBUG LOG 2: Check hook results ---
  console.log('[CommunityPricesScreen] Hook Data:', {
    prices,
    isLoading,
    isError,
    error,
  });

  if (!stationId || !fuelType) {
    // Added check earlier, but good to keep just in case
    return <ErrorDisplay message='Station ID or Fuel Type missing.' />;
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: `${stationName ? stationName + ' - ' : ''}${fuelType} Reports`,
        }}
      />
      <View style={styles.header}>
        <Text style={styles.title}>
          Community Reports for {fuelType}
          {stationName && <Text> at {stationName}</Text>}
        </Text>
      </View>

      {isLoading && (
        <LoadingIndicator message={`Loading ${fuelType} reports...`} />
      )}

      {isError && (
        <ErrorDisplay
          message={
            error instanceof Error
              ? error.message
              : 'Failed to load price reports.'
          }
          onRetry={refetch}
        />
      )}

      {!isLoading &&
        !isError &&
        (!prices || prices.length === 0) && ( // Check !prices as well
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No community reports found for {fuelType} at this station yet.
            </Text>
          </Card>
        )}

      {!isLoading &&
        !isError &&
        prices && // Check prices exists before mapping
        prices.length > 0 &&
        prices.map((price) => (
          <View key={price.id ?? Math.random()} style={styles.cardContainer}>
            {/* Use random key if id is somehow null */}
            {/* Removed stray whitespace causing warning */}
            <PriceCard
              id={price.id}
              station_id={stationId} // Use stationId from params
              fuel_type={fuelType} // Use fuelType from params
              price={price.price}
              reported_at={price.reported_at}
              source='community'
              username={price.username}
              user_id={price.user_id}
              confirmations_count={price.confirmations_count}
              cycle_id={price.cycle_id}
              isOwnReport={user ? price.user_id === user.id : false} // Check against logged-in user
            />
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  cardContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyCard: {
    margin: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
