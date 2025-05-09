import {
  StyleSheet,
  Platform,
  Linking,
  TouchableOpacity,
  Text,
} from 'react-native'; // Added Text
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons'; // Import MaterialIcons
import { useColorScheme } from '@/components/useColorScheme'; // Import useColorScheme
import { useLocationStore } from '@/hooks/stores/useLocationStore'; // Use Zustand store
import { useStationsWithPrices } from '@/hooks/queries/stations/useStationsWithPrices'; // Import the new hook
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore'; // Import preferences store
import { StationMapView } from '@/components/map/StationMapView';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import theme from '@/styles/theme';
import { View } from 'react-native';
import AddStationModal from '@/components/station/AddStationModal'; // Import the Add modal
import { useState, useRef } from 'react'; // Import useState and useRef
import MapView, { Region, PROVIDER_GOOGLE } from 'react-native-maps'; // Import MapView types and PROVIDER_GOOGLE
import {
  ZOOM_LEVELS,
  ANIMATION_DURATION,
  DEFAULT_MAP_REGION,
} from '@/constants/map/locationConstants';

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
import { useAuth } from '@/hooks/useAuth';
import { useFavoriteStations } from '@/hooks/queries/stations/useFavoriteStations';

export default function MapScreen() {
  const [isAddStationModalVisible, setIsAddStationModalVisible] =
    useState(false); // State for Add Station Modal
  const [currentMapCenter, setCurrentMapCenter] = useState<
    | {
        latitude: number;
        longitude: number;
      }
    | undefined
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

  // MOVED THESE HOOKS HERE - BEFORE ANY CONDITIONAL RETURNS
  const { user } = useAuth();
  const { favoriteStationIds } = useFavoriteStations(user?.id);

  // Handle initial location loading
  if (locationLoading) {
    // Only show loading indicator if we don't have any location data yet
    // or if we have default location data (which means we're still trying to get the real location)
    if (!locationData || locationData.isDefaultLocation) {
      console.log(
        'MapScreen: Showing loading indicator due to locationLoading && (!locationData || locationData.isDefaultLocation)'
      );
      return <LoadingIndicator fullScreen message='Getting location...' />;
    } else {
      console.log(
        'MapScreen: Continuing to render map despite locationLoading=true because we have non-default location data'
      );
      // If we have real location data, continue rendering the map even if still technically loading
    }
  }

  // Handle location permission denial
  if (permissionDenied && !locationData.isDefaultLocation) {
    return (
      <View style={styles.container}>
        <ErrorDisplay
          fullScreen
          title='Location Permission Required'
          message='Please grant location permission in settings to view nearby stations on the map.'
          onRetry={openLocationSettings} // Use action from store
        />
      </View>
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
    setIsAddStationModalVisible(true);
  };

  // Function to animate map to user's current location
  const handleMyLocationPress = () => {
    if (mapRef.current && locationData) {
      mapRef.current.animateToRegion(
        {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          latitudeDelta: ZOOM_LEVELS.NEIGHBORHOOD.latitudeDelta, // Zoom in closer
          longitudeDelta: ZOOM_LEVELS.NEIGHBORHOOD.longitudeDelta,
        },
        ANIMATION_DURATION.LONG // Animation duration
      );
    }
  };

  // Render map once location is available
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.Colors[colorScheme].background },
      ]}
    >
      <StationMapView
        ref={mapRef}
        stations={stations || []}
        initialLocation={locationData}
        isLoading={stationsLoading || stationsRefetching}
        defaultFuelType={fuelTypeForMap}
        onRegionChangeComplete={handleRegionChangeComplete}
        favoriteStationIds={favoriteStationIds}
        showDefaultMyLocationButton={false}
      />

      {/* Custom My Location Button */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={handleMyLocationPress}
      >
        <MaterialIcons
          name='my-location'
          size={24}
          color={theme.Colors.primary}
        />
      </TouchableOpacity>

      <Button
        title='Add Station'
        onPress={handleAddStationPress}
        style={styles.addStationButton}
        textStyle={styles.addStationButtonText}
      />

      <AddStationModal
        isVisible={isAddStationModalVisible}
        onClose={() => setIsAddStationModalVisible(false)}
        initialCoordinates={currentMapCenter ?? locationData}
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
    marginTop: 54, // Adjust top for Android status bar
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
  myLocationButton: {
    position: 'absolute',
    bottom: theme.Spacing.xl, // Position at the bottom
    right: theme.Spacing.xl, // Position at the right
    backgroundColor: theme.Colors.white, // White background
    padding: theme.Spacing.md, // Padding around the icon
    borderRadius: 50, // Make it circular
    zIndex: 1, // Ensure it's above the map
    // Add shadow for better visibility (optional)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Elevation for Android shadow
  },
});
