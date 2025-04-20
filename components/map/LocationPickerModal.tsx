import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  // Alert, // No longer needed here
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { LocationObjectCoords } from 'expo-location';
// import * as Location from 'expo-location'; // No longer needed here
import { Button } from '@/components/ui/Button';
import theme from '@/styles/theme';
import mapStyle from '@/styles/mapStyle.json'; // Import the custom map style

type LocationPickerModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationObjectCoords) => void;
  initialLocation?: LocationObjectCoords; // Optional initial location to center on
};

const DEFAULT_REGION: Region = {
  latitude: 14.5995, // Metro Manila center
  longitude: 120.9842,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

const DEFAULT_ZOOM: Pick<Region, 'latitudeDelta' | 'longitudeDelta'> = {
  latitudeDelta: 0.005, // Zoomed-in level
  longitudeDelta: 0.005,
};

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isVisible,
  onClose,
  onLocationSelect,
  initialLocation,
}) => {
  const [currentMarkerLocation, setCurrentMarkerLocation] = useState<
    LocationObjectCoords | undefined
  >(initialLocation);
  const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);
  const [isLoadingRegion, setIsLoadingRegion] = useState(true);
  const mapRef = useRef<MapView>(null);

  // Effect to determine initial region when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      setIsLoadingRegion(true);
      setCurrentMarkerLocation(initialLocation); // Reset marker to initial prop

      // Determine region based *only* on the initialLocation prop
      let region: Region;
      if (initialLocation) {
        // Use initialLocation if provided
        region = {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          ...DEFAULT_ZOOM,
        };
      } else {
        // Fallback to default region if no initialLocation is passed
        // (This shouldn't happen with the new AddStationModal flow, but good to have)
        console.warn(
          'LocationPickerModal opened without initialLocation. Using default region.'
        );
        region = DEFAULT_REGION;
      }

      setMapRegion(region);
      setIsLoadingRegion(false);
    } else {
      // Reset when modal closes
      setMapRegion(undefined);
      setIsLoadingRegion(true);
      // Keep currentMarkerLocation as is until next open or selection
    }
  }, [isVisible, initialLocation]); // Rerun when visibility or initial location changes

  // Update marker on map press
  const handleMapPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate as LocationObjectCoords;
    // Ensure we have all properties for LocationObjectCoords, even if null
    const fullCoordinate: LocationObjectCoords = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      accuracy: coordinate.accuracy ?? null,
      altitude: coordinate.altitude ?? null,
      altitudeAccuracy: coordinate.altitudeAccuracy ?? null,
      heading: coordinate.heading ?? null,
      speed: coordinate.speed ?? null,
    };
    setCurrentMarkerLocation(fullCoordinate);
  };

  // Handle confirm button press
  const handleConfirm = () => {
    if (currentMarkerLocation) {
      onLocationSelect(currentMarkerLocation);
    }
    // No need for an alert here, the button should be disabled if no location is set
  };

  // Handle region change complete (optional: could update marker if needed)
  // const handleRegionChangeComplete = (region: Region) => {
  //   // console.log('Region changed:', region);
  //   // You could potentially update the marker based on the center of the region
  //   // if you prefer a "center pin" style picker, but tap-to-place is simpler.
  // };

  return (
    <Modal
      animationType='slide'
      transparent={false} // Full screen modal
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {isLoadingRegion || !mapRegion ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={theme.Colors.primary} />
            <Text style={styles.loadingText}>Loading Map...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE} // Force Google Maps provider
            style={styles.map}
            initialRegion={mapRegion}
            customMapStyle={mapStyle} // Apply the custom map style
            onPress={handleMapPress}
            // onRegionChangeComplete={handleRegionChangeComplete} // Optional
            showsUserLocation={true}
            showsMyLocationButton={true} // Allow user to recenter
            pitchEnabled={false}
            rotateEnabled={false}
            zoomControlEnabled={true} // Show zoom controls if available (Android)
          >
            {currentMarkerLocation && (
              <Marker
                coordinate={currentMarkerLocation}
                title='Selected Location'
                description='Tap elsewhere to move'
                pinColor={theme.Colors.primary} // Use theme color
                draggable={false} // Dragging is handled by tapping
              />
            )}
          </MapView>
        )}

        {/* Instructions Text */}
        {!isLoadingRegion && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Tap on the map to place the pin.
            </Text>
          </View>
        )}

        {/* Buttons Container */}
        <View style={styles.buttonContainer}>
          <Button
            title='Cancel'
            onPress={onClose}
            variant='outline'
            style={styles.button} // Removed styles.cancelButton as it's empty
          />
          <Button
            title='Confirm Location'
            onPress={handleConfirm}
            style={styles.button}
            disabled={!currentMarkerLocation || isLoadingRegion} // Disable if no marker or loading
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white', // Ensure background for modal content
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.Colors.gray,
  },
  map: {
    flex: 1, // Map takes most of the screen
  },
  instructionsContainer: {
    position: 'absolute',
    top: 50, // Adjust as needed for status bar height
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent background
    borderRadius: 5,
    marginHorizontal: 20,
  },
  instructionsText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: 'white', // Solid background for buttons
    borderTopWidth: 1,
    borderTopColor: theme.Colors.dividerGray, // Use dividerGray from theme
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    // Optional: specific styles for cancel button if needed
  },
});

export default LocationPickerModal;
