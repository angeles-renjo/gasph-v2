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

        if (status !== 'granted') {
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

        if (isMounted) {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            isDefaultLocation: false,
          });
          setError(null);
          setPermissionDenied(false);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
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
    if (location) return location;
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
