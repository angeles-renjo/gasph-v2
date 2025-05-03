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
import FuelPreferenceModal from '@/components/home/FuelPreferenceModal'; // Added import
import { formatFuelType } from '@/utils/formatters'; // Added import
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
import { styles } from '@/styles/screens/home/HomeScreen.styles';

export default function HomeScreen() {
  // Get user profile for welcome message
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const [currentPage, setCurrentPage] = useState(0);
  const [isFuelModalVisible, setIsFuelModalVisible] = useState(false); // Added state for modal
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

  // Get location status for error handling and permission status
  const locationError = useLocationStore((state) => state.error);
  const locationLoading = useLocationStore((state) => state.loading);
  const permissionDenied = useLocationStore((state) => state.permissionDenied); // Get permission status
  const refreshLocation = useLocationStore((state) => state.refreshLocation);

  const navigateToStation = (stationId: string) => {
    router.push(`/station/${stationId}`);
  };

  // --- Inline Location Permission Denied Message for Favorites ---
  const renderFavoritesPermissionDenied = () => (
    <View style={styles.permissionDeniedContainer}>
      <FontAwesome5
        name='map-marker-alt'
        size={32} // Smaller icon for inline message
        color={theme.Colors.primary}
        style={styles.permissionDeniedIcon}
      />
      <Text style={styles.permissionDeniedTitle}>Location Needed</Text>
      <Text style={styles.permissionDeniedMessage}>
        Enable location access to see distances to your favorite stations.
      </Text>
      <Button
        title='Enable Location'
        onPress={openDeviceLocationSettings}
        variant='primary'
        style={styles.permissionDeniedButton}
      />
    </View>
  );
  // --- End Inline Message ---

  const renderContent = () => {
    // Note: isLoading check for favoriteStations query is still relevant
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
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView style={styles.scrollContainer}>
          {/* Welcome Section */}
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeHeader}>
              <View>
                <Text style={styles.welcomeText}>
                  Hi,{' '}
                  {userProfile?.username ||
                    user?.email?.split('@')[0] ||
                    'there'}
                  !
                </Text>
                <Text style={styles.sloganText}>
                  Find the best fuel prices near you
                </Text>
              </View>
              <TouchableOpacity
                style={styles.fuelTypeButton}
                onPress={() => setIsFuelModalVisible(true)}
              >
                <FontAwesome5
                  name='gas-pump'
                  size={16}
                  color={theme.Colors.primary}
                  style={styles.fuelTypeIcon}
                />
                <Text style={styles.fuelTypeText}>
                  {defaultFuelType
                    ? formatFuelType(defaultFuelType)
                    : 'Select fuel type'}
                </Text>
              </TouchableOpacity>
            </View>
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
          ) : permissionDenied ? ( // Check permission denied first
            renderFavoritesPermissionDenied() // Show specific message for favorites section
          ) : !location ? ( // Then check if location is null (still loading or failed without denial)
            <EmptyState
              title='Getting Location...' // Changed message slightly
              message='Waiting for location to show favorite stations with distances.'
              icon='map-marker-alt' // Use a location icon
              // Removed action button here as permission denied case handles it
            />
          ) : !defaultFuelType ? (
            <EmptyState
              title='Fuel Type Preference Required'
              message='Please select your preferred fuel type to see the best prices.'
              icon='gas-pump' // Use a gas pump icon
              onAction={{
                label: 'Select Fuel Type',
                onPress: () => setIsFuelModalVisible(true), // Open the fuel preference modal
              }}
            />
          ) : isLoading ? ( // Add check for favorite stations loading state here
            <LoadingIndicator message='Loading favorite stations...' />
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
                    // Re-applying negative margin to counteract PagerView padding
                    <View
                      key={item.id}
                      collapsable={false}
                      style={{ marginVertical: -10, marginHorizontal: -5 }}
                    >
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
      </SafeAreaView>
    );
  };

  // Render the main content, handling loading/error states internally within renderContent
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.Colors.white} barStyle='dark-content' />
      {renderContent()}

      {/* Fuel Preference Modal */}
      <FuelPreferenceModal
        isVisible={isFuelModalVisible}
        onClose={() => setIsFuelModalVisible(false)}
      />
    </View>
  );
}
