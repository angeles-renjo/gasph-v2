import { StyleSheet, Platform, Linking } from 'react-native'; // Added Text for potential button text styling
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme'; // Import useColorScheme
import { useLocationStore } from '@/hooks/stores/useLocationStore'; // Use Zustand store
import { useStationsWithPrices } from '@/hooks/queries/stations/useStationsWithPrices'; // Import the new hook
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore'; // Import preferences store
import { StationMapView } from '@/components/map/StationMapView';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import theme from '@/styles/theme';
import { View } from '@/components/Themed'; // Keep this View for the main container
import AddStationModal from '@/components/station/AddStationModal'; // Import the Add modal
import { useState, useRef } from 'react'; // Import useState and useRef
import MapView, { Region } from 'react-native-maps'; // Import MapView types

// Helper function to open app settings (copied from explore.tsx logic)
const openAppSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};
import type { FuelType } from '@/hooks/queries/prices/useBestPrices'; // Import FuelType
import { Button } from '@/components/ui/Button'; // Import the standard Button component (named export)

export default function MapScreen() {
  const [isAddStationModalVisible, setIsAddStationModalVisible] =
    useState(false); // State for Add Station Modal
  const [currentMapCenter, setCurrentMapCenter] = useState<
    { latitude: number; longitude: number } | undefined
  >(undefined);
  const mapRef = useRef<MapView>(null); // Ref for the map view component
  const colorScheme = useColorScheme() ?? 'light'; // Get current color scheme
  const preferredFuelType = usePreferencesStore(
    (state) => state.defaultFuelType
  ); // Get preferred fuel type
  // Determine the fuel type to use: preference or fallback to 'RON 91'
  const fuelTypeForMap: FuelType | null = preferredFuelType ?? 'RON 91';
  // Get state and actions from Zustand store using individual selectors to prevent re-renders
  const getLocationWithFallback = useLocationStore(
    (state) => state.getLocationWithFallback
  );
  const locationLoading = useLocationStore((state) => state.loading);
  const locationError = useLocationStore((state) => state.error);
  const permissionDenied = useLocationStore((state) => state.permissionDenied);
  const openLocationSettings = useLocationStore(
    (state) => state.openLocationSettings
  );

  const locationData = getLocationWithFallback();

  const {
    data: stations,
    isLoading: stationsLoading,
    error: stationsError,
    refetch: refetchStations,
    isRefetching: stationsRefetching,
  } = useStationsWithPrices(fuelTypeForMap); // Use the new hook, passing the fuel type

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
          onRetry={openLocationSettings} // Use action from store
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

  // Update current center state when map region changes
  const handleRegionChangeComplete = (region: Region) => {
    setCurrentMapCenter({
      latitude: region.latitude,
      longitude: region.longitude,
    });
  };

  const handleAddStationPress = () => {
    // Use the state variable holding the latest map center
    // The initial locationData could be used as a fallback if needed, but center is better
    console.log('Add station pressed, current center:', currentMapCenter);
    setIsAddStationModalVisible(true);
  };

  // Render map once location is available
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.Colors[colorScheme].background }, // Apply dynamic background color
      ]}
    >
      {/* Render map directly, StationMapView handles its own loading/initial state */}
      <StationMapView
        ref={mapRef} // Assign ref
        stations={stations || []} // Pass empty array if stations are null/undefined initially
        initialLocation={locationData}
        isLoading={stationsLoading || stationsRefetching} // Indicate loading on the map
        defaultFuelType={fuelTypeForMap} // Pass the determined fuel type
        onRegionChangeComplete={handleRegionChangeComplete} // Pass the handler
      />
      {/* Add Station Button (Top Right) */}
      <Button
        title='Add Station'
        onPress={handleAddStationPress}
        style={styles.addStationButton}
        textStyle={styles.addStationButtonText} // Add text style
      />

      {/* Add Station Modal */}
      <AddStationModal
        isVisible={isAddStationModalVisible}
        onClose={() => setIsAddStationModalVisible(false)}
        initialCoordinates={currentMapCenter ?? locationData} // Pass current center or initial location
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addStationButton: {
    position: 'absolute',
    top: theme.Spacing.xl, // Use theme spacing (e.g., 16)
    right: theme.Spacing.xl, // Use theme spacing (e.g., 16)
    backgroundColor: theme.Colors.primary, // Use theme primary color
    paddingVertical: theme.Spacing.sm, // Use theme spacing (e.g., 8)
    paddingHorizontal: theme.Spacing.md, // Use theme spacing (e.g., 10)
    borderRadius: theme.BorderRadius.md, // Use theme border radius (e.g., 8)
    zIndex: 1, // Ensure it's above the map
  },
  addStationButtonText: {
    color: theme.Colors.white, // Use theme white color
    fontSize: theme.Typography.fontSizeMedium, // Use theme font size (e.g., 14)
    fontWeight: theme.Typography.fontWeightSemiBold, // Use theme font weight (e.g., 600)
  },
});
