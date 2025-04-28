import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFavoriteStationPrices } from '@/hooks/queries/stations/useFavoriteStationPrices';
import { useLocationStore } from '@/hooks/stores/useLocationStore'; // Needed for location error handling
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';
import { BestPriceCard } from '@/components/price/BestPriceCard';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import theme from '@/styles/theme';
import { openDeviceLocationSettings } from '@/utils/locationUtils'; // For location error button
import { Button } from '@/components/ui/Button'; // For location error button
import { FontAwesome5 } from '@expo/vector-icons'; // For location error icon
import FAQAccordionItem from '@/components/faq/FAQAccordionItem';
import { useUserContributions } from '@/hooks/queries/users/useUserContributions';
import { useUserProfile } from '@/hooks/queries/users/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import ContributionsCard from '@/components/contributions/ContributionsCard';

export default function HomeScreen() {
  // Get user profile for welcome message
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
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

  // Debug logs to check prerequisites for favorite stations
  const location = useLocationStore((state) => state.location);
  const defaultFuelType = usePreferencesStore((state) => state.defaultFuelType);

  // Fetch user contributions data
  const { data: userContributions = [] } = useUserContributions();

  // Calculate confirmations and price reports
  const confirmationsCount = userContributions.reduce((count, contribution) => {
    return count + (contribution.confirmations_count || 0);
  }, 0);

  const priceReportsCount = userContributions.length;

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

    // Show welcome section, contributions, and FAQ regardless of favorites
    return (
      <ScrollView style={styles.scrollContainer}>
        {/* Welcome Section */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            Hi, {userProfile?.username || user?.email?.split('@')[0] || 'there'}
            !
          </Text>
          <Text style={styles.sloganText}>
            Find the best fuel prices near you
          </Text>
        </View>

        {/* Conditionally render favorites, empty state, or prerequisites missing message */}
        {!user?.id ? (
          <EmptyState
            title='Sign In Required'
            message='Please sign in to see your favorite stations.'
            icon='user' // Use a user icon for sign in
            onAction={{
              label: 'Sign In',
              onPress: () => router.push('/auth/sign-in'), // Navigate to sign in screen
            }}
          />
        ) : !location ? (
          <EmptyState
            title='Location Access Required'
            message='GasPH needs your location to show favorite stations with distances.'
            icon='map-marker-alt' // Use a location icon
            onAction={{
              label: 'Enable Location',
              onPress: openDeviceLocationSettings, // Open location settings
            }}
          />
        ) : !defaultFuelType ? (
          <EmptyState
            title='Fuel Type Preference Required'
            message='Please set your preferred fuel type in your profile settings.'
            icon='gas-pump' // Use a gas pump icon
            onAction={{
              label: 'Go to Profile',
              onPress: () => router.push('/profile'), // Navigate to profile screen
            }}
          />
        ) : !favoriteStations || favoriteStations.length === 0 ? (
          <EmptyState
            title='No Favorite Stations'
            message='Add stations to your favorites from the Explore or Map tabs to see them here.'
            icon='heart' // Use a heart icon for favorites
            onAction={{
              label: 'Explore Stations',
              onPress: () => router.push('/explore'), // Navigate to explore tab
            }}
          />
        ) : (
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
        )}

        {/* Your Contributions Section */}
        <ContributionsCard
          confirmations={confirmationsCount}
          priceReports={priceReportsCount}
        />

        {/* FAQ Section */}
        <View style={styles.faqContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>FAQ</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/faq')}
            >
              <Text style={styles.viewAllText}>See More {'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.faqItemContainer}>
            <FAQAccordionItem
              item={{
                question: 'How are prices verified?',
                answer:
                  'Prices are verified through user confirmations and our moderation team.',
              }}
            />
          </View>

          <View style={styles.faqItemContainer}>
            <FAQAccordionItem
              item={{
                question: 'How can I contribute?',
                answer:
                  'You can report prices, confirm existing reports, or add new stations.',
              }}
            />
          </View>
        </View>
      </ScrollView>
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
    marginTop: theme.Spacing.lg,
  },
  headerTitle: {
    fontSize: theme.Typography.fontSizeLarge,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.darkGray,
  },
  viewAllButton: {
    padding: theme.Spacing.sm,
  },
  viewAllText: {
    color: theme.Colors.primary,
    fontWeight: theme.Typography.fontWeightMedium,
    fontSize: theme.Typography.fontSizeSmall,
  },
  pagerView: {
    height: 220,
    marginBottom: theme.Spacing.sm,
  },
  pagerIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.xl,
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
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.Colors.light.background,
    paddingTop: theme.Spacing.md,
  },
  welcomeContainer: {
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.lg,
    backgroundColor: theme.Colors.white,
    marginHorizontal: theme.Spacing.md,
    marginTop: theme.Spacing.md,
    marginBottom: theme.Spacing.lg,
    borderRadius: theme.BorderRadius.md,
    shadowColor: theme.Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: theme.Typography.fontSizeXXLarge,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.darkGray,
    marginBottom: theme.Spacing.xs,
  },
  sloganText: {
    fontSize: theme.Typography.fontSizeMedium,
    color: theme.Colors.textGray,
    marginBottom: theme.Spacing.xs,
  },
  faqContainer: {
    backgroundColor: theme.Colors.white,
    borderRadius: theme.BorderRadius.md,
    marginHorizontal: theme.Spacing.md,
    marginTop: theme.Spacing.xl,
    marginBottom: theme.Spacing.xxl,
    padding: theme.Spacing.xl,
    shadowColor: theme.Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faqItemContainer: {
    marginBottom: theme.Spacing.md,
  },
});
