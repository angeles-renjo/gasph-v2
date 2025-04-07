import React from 'react';
import { StyleSheet, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Removed Themed View import as SafeAreaView is used as the root
import { useColorScheme } from '@/components/useColorScheme'; // Import useColorScheme
import { useLocation } from '@/hooks/useLocation';
import { useNearbyStations } from '@/hooks/queries/stations/useNearbyStations';
import { StationMapView } from '@/components/map/StationMapView';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import theme from '@/styles/theme';

// Helper function to open app settings (copied from explore.tsx logic)
const openAppSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};

export default function MapScreen() {
  const colorScheme = useColorScheme() ?? 'light'; // Get current color scheme
  const {
    getLocationWithFallback,
    loading: locationLoading,
    error: locationError,
    permissionDenied,
    refreshLocation, // Added for potential refresh action
  } = useLocation();

  const locationData = getLocationWithFallback();

  const {
    data: stations,
    isLoading: stationsLoading,
    error: stationsError,
    refetch: refetchStations,
    isRefetching: stationsRefetching,
  } = useNearbyStations({
    radiusKm: 15, // Use a reasonable radius
    enabled: !!locationData, // Only fetch when location is available
    providedLocation: locationData,
  });

  // Handle initial location loading
  if (locationLoading && !locationData) {
    return <LoadingIndicator fullScreen message='Getting location...' />;
  }

  // Handle location permission denial
  if (permissionDenied && !locationData.isDefaultLocation) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ErrorDisplay
          fullScreen
          title='Location Permission Required'
          message='Please grant location permission in settings to view nearby stations on the map.'
          onRetry={openAppSettings}
        />
      </SafeAreaView>
    );
  }

  // Handle station fetching errors (after location is resolved)
  if (stationsError && !stationsLoading && !stationsRefetching) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ErrorDisplay
          fullScreen
          title='Error Loading Stations'
          message='Could not load station data. Please try again.'
          onRetry={refetchStations}
        />
      </SafeAreaView>
    );
  }

  // Render map once location is available
  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.Colors[colorScheme].background }, // Apply dynamic background color
      ]}
      edges={['top', 'bottom']}
    >
      {/* Render map directly, StationMapView handles its own loading/initial state */}
      <StationMapView
        stations={stations || []} // Pass empty array if stations are null/undefined initially
        initialLocation={locationData}
        isLoading={stationsLoading || stationsRefetching} // Indicate loading on the map
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Removed backgroundColor here, applied dynamically above
  },
  // Removed content and title styles as the map fills the screen
});
