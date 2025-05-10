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
 * Fetches the current device location using a progressive strategy.
 * First tries to get a quick, low-accuracy location, then attempts a more accurate one.
 * @returns {Promise<LocationData>} The location data (latitude, longitude).
 * @throws {Error} If all location fetching attempts fail.
 */
export const fetchCurrentLocation = async (): Promise<LocationData> => {
  console.log('LocationUtils: Starting progressive location acquisition');

  // Create a controller to manage the location acquisition process
  const controller = {
    bestLocation: null as Location.LocationObject | null,
    bestAccuracy: Infinity,
    hasReturned: false,
    timeoutIds: [] as NodeJS.Timeout[],
  };

  // Function to clear all timeouts
  const clearAllTimeouts = () => {
    controller.timeoutIds.forEach((id) => clearTimeout(id));
    controller.timeoutIds = [];
  };

  try {
    // Try to get the last known position immediately (fastest option)
    const lastKnownPromise = getLastKnownLocationWithTimeout();

    // Start a quick, low-accuracy location request
    const quickLocationPromise = getLocationWithOptions({
      accuracy: Location.Accuracy.Low,
      timeoutMs: LOCATION_TIMEOUT.QUICK,
    });

    // Start a more accurate location request in parallel
    const accurateLocationPromise = getLocationWithOptions({
      accuracy: Location.Accuracy.Balanced,
      timeoutMs: LOCATION_TIMEOUT.ACCURATE,
    });

    // Wait for any of the promises to resolve
    const locationResult = await Promise.any([
      lastKnownPromise,
      quickLocationPromise,
      accurateLocationPromise,
    ]);

    // Clear all timeouts since we got a result
    clearAllTimeouts();

    console.log('LocationUtils: Location acquired successfully', {
      latitude: locationResult.coords.latitude,
      longitude: locationResult.coords.longitude,
      accuracy: locationResult.coords.accuracy,
      source: locationResult.source,
    });

    return {
      latitude: locationResult.coords.latitude,
      longitude: locationResult.coords.longitude,
      isDefaultLocation: false,
    };
  } catch (error) {
    // Clear all timeouts on error
    clearAllTimeouts();

    console.error(
      'LocationUtils: All location acquisition methods failed:',
      error
    );
    throw new Error('Failed to acquire location after multiple attempts');
  }
};

/**
 * Gets the last known location with a timeout.
 * @returns {Promise<Location.LocationObject>} The location object with a source property.
 */
const getLastKnownLocationWithTimeout = async (): Promise<
  Location.LocationObject & { source: string }
> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Last known location request timed out'));
    }, LOCATION_TIMEOUT.QUICK);

    Location.getLastKnownPositionAsync()
      .then((position) => {
        if (position) {
          clearTimeout(timeoutId);
          console.log('LocationUtils: Got last known position');
          resolve({
            ...position,
            source: 'last_known',
          });
        } else {
          reject(new Error('No last known position available'));
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

/**
 * Gets the current location with specific options and a timeout.
 * @param {Object} options - The options for location acquisition.
 * @param {Location.Accuracy} options.accuracy - The accuracy level to use.
 * @param {number} options.timeoutMs - The timeout in milliseconds.
 * @returns {Promise<Location.LocationObject>} The location object with a source property.
 */
const getLocationWithOptions = async ({
  accuracy,
  timeoutMs,
}: {
  accuracy: Location.Accuracy;
  timeoutMs: number;
}): Promise<Location.LocationObject & { source: string }> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          `Location request with accuracy ${accuracy} timed out after ${timeoutMs}ms`
        )
      );
    }, timeoutMs);

    // Convert accuracy to a string for logging and source identification
    const accuracyName =
      typeof accuracy === 'number'
        ? Location.Accuracy[accuracy] || String(accuracy)
        : String(accuracy);

    console.log(
      `LocationUtils: Requesting location with accuracy: ${accuracyName}, timeout: ${timeoutMs}ms`
    );

    Location.getCurrentPositionAsync({
      accuracy,
      mayShowUserSettingsDialog: false,
    })
      .then((position) => {
        clearTimeout(timeoutId);
        console.log(
          `LocationUtils: Got position with accuracy: ${accuracyName}`,
          {
            accuracy: position.coords.accuracy,
          }
        );
        resolve({
          ...position,
          source: `current_${accuracyName.toString().toLowerCase()}`,
        });
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
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
