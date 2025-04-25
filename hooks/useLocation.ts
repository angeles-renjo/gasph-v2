import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';

// Location permission storage key
const LOCATION_PERMISSION_KEY = 'gasph_location_permission_status';
// Default location coordinates for Metro Manila
const DEFAULT_LOCATION = {
  latitude: 13.1391,
  longitude: 123.7438,
  isDefaultLocation: true,
};

export interface LocationData {
  latitude: number;
  longitude: number;
  isDefaultLocation?: boolean;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  // Reference to track if component is mounted
  const isMountedRef = useRef(true);
  // Reference to track location subscription
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null
  );

  useEffect(() => {
    // Reset state on mount
    setLoading(true);
    setError(null);

    // Main location function
    const initLocation = async () => {
      try {
        // Check for stored permission status first
        const storedPermission = await AsyncStorage.getItem(
          LOCATION_PERMISSION_KEY
        );

        // Check if we've previously determined permission is denied
        if (storedPermission === 'denied') {
          if (isMountedRef.current) {
            console.log('Using stored permission: denied');
            setPermissionDenied(true);
            setLocation(DEFAULT_LOCATION);
            setLoading(false);
            return;
          }
        }

        // Get the current permission status
        const { status: currentStatus } =
          await Location.getForegroundPermissionsAsync();

        // If permission is already granted, we can proceed
        if (currentStatus === 'granted') {
          console.log('Permission already granted, getting location');
        } else {
          // Request permission if not already granted
          console.log('Requesting permission');
          const { status } = await Location.requestForegroundPermissionsAsync();

          // Early exit if component unmounted during async operation
          if (!isMountedRef.current) return;

          // Save the permission status
          await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, status);

          if (status !== 'granted') {
            console.log('Permission denied');
            setPermissionDenied(true);
            setLocation(DEFAULT_LOCATION);
            setLoading(false);
            return;
          }
        }

        // Use Promise.race to add a timeout to the location request
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low, // Request lower accuracy
        });

        // Race the location promise against a timeout
        const position = await Promise.race([
          locationPromise,
          new Promise<null>((_, reject) =>
            setTimeout(
              () => reject(new Error('Inner location request timed out')),
              20000 // Increased timeout to 20 seconds
            )
          ),
        ]);

        // Early exit if component unmounted
        if (!isMountedRef.current) return;

        // Check if position is null (shouldn't happen with the race)
        if (!position) {
          throw new Error('Received null position');
        }

        // Set the location
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          isDefaultLocation: false,
        });
        setError(null);
      } catch (err: any) {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          console.error('Location error:', err.message);
          setLocation(DEFAULT_LOCATION);
          setError(err.message || 'Failed to get location');
        }
      } finally {
        // Always clean up and stop loading if mounted
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Start the location request process
    initLocation();

    // Cleanup function
    return () => {
      isMountedRef.current = false;

      // Remove location subscription if it exists
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    };
  }, []); // Empty deps so this only runs once on mount

  // Manual refresh function
  const refreshLocation = async () => {
    if (loading) return; // Don't allow refresh while already loading

    setLoading(true);
    setError(null);

    try {
      // Check permission status first
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        // Try requesting permission again
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();

        // Update stored status
        await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, newStatus);

        if (newStatus !== 'granted') {
          setPermissionDenied(true);
          setLocation(DEFAULT_LOCATION);
          setLoading(false);
          return;
        } else {
          // Permission was granted this time
          setPermissionDenied(false);
        }
      }

      // Set a refresh timeout
      const refreshTimeoutId = setTimeout(() => {
        console.warn('Location refresh timed out');
        setLoading(false);
        setError('Location refresh timed out. Using previous location.');
      }, 10000);

      // Get new location
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low, // Request lower accuracy
      });

      // Clear timeout
      clearTimeout(refreshTimeoutId);

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        isDefaultLocation: false,
      });
      setError(null);
    } catch (err: any) {
      console.error('Error refreshing location:', err.message);
      setError(err.message || 'Failed to refresh location');
      // Keep existing location - don't reset to default
    } finally {
      setLoading(false);
    }
  };

  // Function to help with location settings
  const openLocationSettings = () => {
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

  // Function to provide consistent access to location, always returns a value
  const getLocationWithFallback = (): LocationData => {
    return location || DEFAULT_LOCATION;
  };

  return {
    location,
    loading,
    error,
    permissionDenied,
    refreshLocation,
    getLocationWithFallback,
    openLocationSettings,
  };
}
