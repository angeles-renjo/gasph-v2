import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal } from 'react-native'; // Added Modal import
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; // Removed Callout import
// Removed useRouter import as navigation will be in Modal
import { GasStation } from '@/hooks/queries/stations/useNearbyStations';
import { LocationData } from '@/hooks/useLocation';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices';
import { StationInfoModal } from './StationInfoModal'; // Import the modal component
import theme from '@/styles/theme';

interface StationMapViewProps {
  stations: GasStation[];
  initialLocation: LocationData;
  isLoading?: boolean; // Map loading, not price loading
  defaultFuelType: FuelType | null;
}

export function StationMapView({
  stations,
  initialLocation,
  isLoading = false,
  defaultFuelType,
}: StationMapViewProps) {
  const [selectedStationData, setSelectedStationData] =
    useState<GasStation | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const initialRegion = initialLocation
    ? {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
    : undefined;

  if (!initialRegion) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Initializing map...</Text>
      </View>
    );
  }

  const handleMarkerPress = (station: GasStation) => {
    setSelectedStationData(station);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedStationData(null); // Clear selected data when closing
  };

  return (
    // Use React.Fragment or View as root because Modal must be sibling to MapView
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={!initialLocation.isDefaultLocation}
        showsMyLocationButton={!initialLocation.isDefaultLocation}
        loadingEnabled={isLoading}
        loadingIndicatorColor={theme.Colors.primary}
        loadingBackgroundColor='#ffffff'
        onPress={handleCloseModal} // Close modal if map is pressed
      >
        {stations.map((station) => (
          <Marker
            key={station.id}
            coordinate={{
              latitude: station.latitude,
              longitude: station.longitude,
            }}
            pinColor={theme.Colors.primary}
            onPress={(e) => {
              e.stopPropagation(); // Prevent map press from firing
              handleMarkerPress(station);
            }}
          >
            {/* No Callout needed here */}
          </Marker>
        ))}
      </MapView>

      {/* Render the Modal */}
      <StationInfoModal
        station={selectedStationData}
        fuelType={defaultFuelType}
        isVisible={isModalVisible}
        onClose={handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Added container style
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Removed unused callout styles
});
