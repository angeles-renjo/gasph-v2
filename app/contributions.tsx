import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router'; // Import Stack for header title
import { Card } from '@/components/ui/Card'; // Re-use Card component
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { useUserContributions } from '@/hooks/queries/users/useUserContributions';
import { formatRelativeTime } from '@/utils/formatters';
import { Colors, Spacing, Typography, BorderRadius } from '@/styles/theme';

// Define the structure of a contribution locally (matching profile.tsx)
interface UserContribution {
  id: string;
  fuel_type: string;
  price: number;
  reported_at: string;
  station_id: string;
  station_name: string;
  station_brand: string;
  station_city: string;
  confirmations_count: number;
  confidence_score: number;
  cycle_id: string;
}

export default function ContributionsScreen() {
  const {
    data: contributions,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useUserContributions(); // Call without arguments to fetch all (or pass {} if needed)

  const renderContributionItem = ({ item }: { item: UserContribution }) => (
    <Card style={styles.contributionCard}>
      <View style={styles.contributionHeader}>
        <Text style={styles.stationName} numberOfLines={1}>
          {item.station_name ?? 'Unknown Station'}
        </Text>
        <Text style={styles.contributionDate} numberOfLines={1}>
          {formatRelativeTime(item.reported_at)}
        </Text>
      </View>
      <View style={styles.contributionDetails}>
        <View style={styles.priceContainer}>
          <Text style={styles.fuelType}>{item.fuel_type}</Text>
          <Text style={styles.price}>₱{item.price.toFixed(2)}</Text>
        </View>
        <Text style={styles.confirmations}>
          {item.confirmations_count}
          {item.confirmations_count === 1 ? 'confirmation' : 'confirmations'}
        </Text>
      </View>
    </Card>
  );

  if (isLoading) {
    return <LoadingIndicator fullScreen message='Loading contributions...' />;
  }

  if (isError) {
    return (
      <ErrorDisplay
        fullScreen
        message={error?.message || 'Failed to load contributions.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Set Screen Title using Expo Router Stack */}
      <Stack.Screen options={{ title: 'My Contributions' }} />

      {contributions && contributions.length > 0 ? (
        <FlatList
          data={contributions}
          renderItem={renderContributionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={refetch}
        />
      ) : (
        <EmptyState
          title='No Contributions Yet'
          message="You haven't reported any fuel prices."
          icon='list-alt' // Use a relevant icon
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray2,
  },
  listContent: {
    padding: Spacing.lg,
  },
  contributionCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stationName: {
    fontSize: Typography.fontSizeLarge,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.darkGray,
    flex: 1,
    marginRight: Spacing.sm,
  },
  contributionDate: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
    textAlign: 'right',
  },
  contributionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fuelType: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
    marginRight: Spacing.xs,
    textTransform: 'uppercase',
  },
  price: {
    fontSize: Typography.fontSizeXLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.primary,
  },
  confirmations: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
    marginLeft: Spacing.sm,
  },
});
