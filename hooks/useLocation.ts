import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  isDefaultLocation?: boolean; // Flag to indicate if using fallback location
}

// Default location coordinates for Metro Manila (Quezon City - center point)
const DEFAULT_LOCATION: LocationData = {
  latitude: 13.1391,
  longitude: 123.7438,
  isDefaultLocation: true,
};

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function getLocation() {
      try {
        setLoading(true);

        // Request permission to access location
        const { status } = await Location.requestForegroundPermissionsAsync();
        // console.log('[useLocation] Permission status:', status); // Log status removed

        if (status !== 'granted') {
          // console.log('[useLocation] Permission denied.'); // Log denial removed
          if (isMounted) {
            setError('Permission to access location was denied');
            setPermissionDenied(true);
            setLoading(false);
          }
          return;
        }

        // Get current position
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        // console.log('[useLocation] Position obtained:', position); // Log position removed

        if (isMounted) {
          const newLocation = {
            // Create object first
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            isDefaultLocation: false,
          };
          // console.log('[useLocation] Setting location state:', newLocation); // Log location being set removed
          setLocation(newLocation);
          setError(null);
          setPermissionDenied(false);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          // console.error('[useLocation] Error getting location:', err); // Log error removed
          setError(err.message || 'Failed to get location');
          setPermissionDenied(true);
          setLoading(false);
        }
      }
    }

    getLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setPermissionDenied(true);
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        isDefaultLocation: false,
      });
      setError(null);
      setPermissionDenied(false);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh location');
      setPermissionDenied(true);
    } finally {
      setLoading(false);
    }
  };

  // For components that can use a default location (like Explore)
  // This function is guaranteed to never return null
  const getLocationWithFallback = (): LocationData => {
    if (location) {
      // console.log('[useLocation] getLocationWithFallback: Returning actual location state:', location); // Log removed
      return location;
    }
    // console.log('[useLocation] getLocationWithFallback: Returning DEFAULT_LOCATION'); // Log removed
    return DEFAULT_LOCATION;
  };

  return {
    location,
    loading,
    error,
    permissionDenied,
    refreshLocation,
    getLocationWithFallback,
  };
}
