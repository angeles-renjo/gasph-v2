import React, { useState, useRef } from 'react'; // Import useRef
import { StyleSheet, View, Text, Animated } from 'react-native'; // Import Animated, remove Modal (not needed here)
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// Removed useRouter import as navigation will be in Modal
import { GasStation } from '@/hooks/queries/stations/useNearbyStations';
import { LocationData } from '@/hooks/useLocation';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices';
import { StationInfoModal } from './StationInfoModal'; // Import the modal component
import theme from '@/styles/theme';
import mapStyle from '@/styles/mapStyle.json'; // Import the custom map style

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
  const mapViewRef = useRef<MapView>(null); // Ref for MapView

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
    // Optional: Animate map to center on the marker
    mapViewRef.current?.animateToRegion(
      {
        latitude: station.latitude,
        longitude: station.longitude,
        latitudeDelta: 0.02, // Zoom in closer
        longitudeDelta: 0.02,
      },
      300 // Animation duration
    );
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
        loadingBackgroundColor={theme.Colors.white} // Use theme color
        customMapStyle={mapStyle} // Apply custom map style
        showsCompass={false} // Hide compass
        showsTraffic={false} // Hide traffic
        toolbarEnabled={false} // Hide toolbar (Android)
        ref={mapViewRef} // Assign ref
        onPress={handleCloseModal} // Close modal if map is pressed
      >
        {stations.map((station) => {
          const isSelected = selectedStationData?.id === station.id;
          return (
            <Marker
              key={station.id}
              coordinate={{
                latitude: station.latitude,
                longitude: station.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }} // Center anchor for custom view
              onPress={(e) => {
                e.stopPropagation(); // Prevent map press from firing
                handleMarkerPress(station);
              }}
            >
              {/* Custom Marker View */}
              <Animated.View style={[styles.markerWrap]}>
                <Animated.View
                  style={[
                    styles.markerRing,
                    isSelected && styles.selectedMarkerRing, // Style for selected
                  ]}
                />
                <View style={styles.marker} />
              </Animated.View>
            </Marker>
          );
        })}
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
  // Custom Marker Styles
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30, // Ring size
    height: 30,
  },
  markerRing: {
    width: 24, // Ring size
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(42, 157, 143, 0.3)', // Primary color with opacity
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(42, 157, 143, 0.5)',
  },
  selectedMarkerRing: {
    // Style when selected
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(42, 157, 143, 0.5)',
    borderColor: theme.Colors.primary,
  },
  marker: {
    width: 10, // Inner dot size
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.Colors.primary, // Solid primary color
  },
});
