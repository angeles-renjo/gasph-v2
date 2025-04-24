import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  isDefaultLocation?: boolean;
}

// Location permission storage key
const LOCATION_PERMISSION_KEY = 'gasph_location_permission_status';

// Default location coordinates for Metro Manila
export const DEFAULT_LOCATION: LocationData = {
  latitude: 13.1391,
  longitude: 123.7438,
  isDefaultLocation: true,
};

/**
 * Checks the current location permission status or requests it if not determined.
 * Stores the result in AsyncStorage.
 * @returns {Promise<boolean>} True if permission is granted, false otherwise.
 */
export const checkOrRequestLocationPermission = async (): Promise<boolean> => {
  console.log('Checking/Requesting location permission...');
  // Check for stored permission status first
  const storedPermission = await AsyncStorage.getItem(LOCATION_PERMISSION_KEY);
  if (storedPermission === 'denied') {
    console.log('Using stored permission: denied');
    return false;
  }

  // Get the current permission status
  let { status } = await Location.getForegroundPermissionsAsync();

  // If permission is already granted, we can proceed
  if (status === 'granted') {
    console.log('Permission already granted (from system check)');
    await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, status); // Ensure storage is up-to-date
    return true;
  }

  // Request permission if not already granted
  console.log('Requesting foreground permission...');
  const response = await Location.requestForegroundPermissionsAsync();
  status = response.status;

  // Save the permission status
  await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, status);

  if (status !== 'granted') {
    console.log('Permission denied (after request)');
    return false;
  }

  console.log('Permission granted (after request)');
  return true;
};

/**
 * Fetches the current device location with a timeout.
 * @param {number} timeoutMs - Timeout duration in milliseconds.
 * @returns {Promise<LocationData>} The location data (latitude, longitude).
 * @throws {Error} If location fetching fails or times out.
 */
export const fetchCurrentLocation = async (
  timeoutMs = 20000
): Promise<LocationData> => {
  console.log('Fetching current location...');
  try {
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low, // Use lower accuracy as decided before
    });

    // Race the location promise against a timeout
    const position = await Promise.race([
      locationPromise,
      new Promise<null>((_, reject) =>
        setTimeout(
          () => reject(new Error('Inner location request timed out')),
          timeoutMs
        )
      ),
    ]);

    if (!position) {
      throw new Error('Received null position');
    }

    console.log('Location fetched successfully.');
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      isDefaultLocation: false,
    };
  } catch (err: any) {
    console.error('Error fetching location:', err.message);
    // Re-throw the error to be handled by the caller (e.g., the Zustand store)
    throw err;
  }
};

/**
 * Opens the device's location settings screen.
 * Clears the stored permission status beforehand.
 */
export const openDeviceLocationSettings = () => {
  console.log('Opening device location settings...');
  // Reset stored permission status when user manually opens settings
  AsyncStorage.removeItem(LOCATION_PERMISSION_KEY)
    .then(() => {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    })
    .catch((err) => {
      console.error('Error clearing permission status:', err);
      // Still try to open settings even if clearing fails
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    });
};
