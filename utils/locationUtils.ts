import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';
import {
  LocationData,
  DEFAULT_LOCATION,
  LOCATION_PERMISSION_KEY,
  LOCATION_TIMEOUT,
} from '@/constants/map/locationConstants';

/**
 * Checks the current location permission status or requests it if not determined.
 * Stores the result in AsyncStorage.
 * @returns {Promise<boolean>} True if permission is granted, false otherwise.
 */
export const checkOrRequestLocationPermission = async (): Promise<boolean> => {
  console.log('Checking/Requesting location permission...');

  try {
    // First check the actual system permission status
    const { status: systemStatus } =
      await Location.getForegroundPermissionsAsync();
    console.log('Current system permission status:', systemStatus);

    // If permission is already granted by the system, update storage and return true
    if (systemStatus === 'granted') {
      console.log('Permission already granted (from system check)');
      await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, systemStatus);
      return true;
    }

    // If system says not granted, check if we've previously determined permission is denied
    // This helps avoid repeatedly asking when the user has denied permission
    if (systemStatus === 'denied') {
      const storedPermission = await AsyncStorage.getItem(
        LOCATION_PERMISSION_KEY
      );
      if (storedPermission === 'denied') {
        console.log('Permission previously denied and stored');
        return false;
      }
    }

    // If we get here, we need to request permission
    console.log('Requesting foreground permission...');
    const { status: newStatus } =
      await Location.requestForegroundPermissionsAsync();

    // Save the permission status
    await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, newStatus);

    if (newStatus !== 'granted') {
      console.log('Permission denied (after request)');
      return false;
    }

    console.log('Permission granted (after request)');
    return true;
  } catch (error) {
    console.error('Error checking/requesting location permission:', error);
    // On error, check stored permission as fallback
    const storedPermission = await AsyncStorage.getItem(
      LOCATION_PERMISSION_KEY
    );
    return storedPermission === 'granted';
  }
};

/**
 * Fetches the current device location with a timeout.
 * @param {number} timeoutMs - Timeout duration in milliseconds.
 * @returns {Promise<LocationData>} The location data (latitude, longitude).
 * @throws {Error} If location fetching fails or times out.
 */
export const fetchCurrentLocation = async (
  timeoutMs = 10000 // Reduce timeout to 10 seconds (from 20 seconds)
): Promise<LocationData> => {
  console.log(
    `LocationUtils: Fetching current location with timeout ${timeoutMs}ms...`
  );

  try {
    console.log('LocationUtils: Creating location promise with low accuracy');
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // Try balanced accuracy instead of low
      mayShowUserSettingsDialog: false, // Don't show settings dialog
    });

    console.log('LocationUtils: Setting up timeout race');
    // Race the location promise against a timeout
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<null>((_, reject) => {
      timeoutId = setTimeout(() => {
        console.log(
          `LocationUtils: Location request timed out after ${timeoutMs}ms`
        );
        reject(new Error('Inner location request timed out'));
      }, timeoutMs);
    });

    // Make sure to clear the timeout
    const clearTimeoutFn = () => {
      if (timeoutId) clearTimeout(timeoutId);
    };

    try {
      console.log('LocationUtils: Awaiting race between location and timeout');
      const position = await Promise.race([locationPromise, timeoutPromise]);
      clearTimeoutFn(); // Clear timeout if location resolves first

      if (!position) {
        console.error('LocationUtils: Received null position');
        throw new Error('Received null position');
      }

      console.log('LocationUtils: Location fetched successfully', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toISOString(),
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        isDefaultLocation: false,
      };
    } catch (raceError) {
      clearTimeoutFn(); // Make sure to clear timeout on error
      throw raceError; // Re-throw the error
    }
  } catch (err: any) {
    console.error('LocationUtils: Error fetching location:', err.message);

    // Try a fallback approach with last known position if available
    try {
      console.log(
        'LocationUtils: Trying to get last known position as fallback'
      );
      const lastKnownPosition = await Location.getLastKnownPositionAsync();

      if (lastKnownPosition) {
        console.log('LocationUtils: Using last known position', {
          latitude: lastKnownPosition.coords.latitude,
          longitude: lastKnownPosition.coords.longitude,
          timestamp: new Date(lastKnownPosition.timestamp).toISOString(),
        });

        return {
          latitude: lastKnownPosition.coords.latitude,
          longitude: lastKnownPosition.coords.longitude,
          isDefaultLocation: false,
        };
      } else {
        console.log('LocationUtils: No last known position available');
      }
    } catch (fallbackErr) {
      console.error('LocationUtils: Fallback also failed:', fallbackErr);
    }

    // Re-throw the original error to be handled by the caller
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
