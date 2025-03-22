import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
          });
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to get location');
          setLoading(false);
          Alert.alert(
            'Location Error',
            "We couldn't determine your location. Some features may be limited.",
            [{ text: 'OK' }]
          );
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
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh location');
      Alert.alert(
        'Location Error',
        "We couldn't update your location. Please try again.",
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return { location, loading, error, refreshLocation };
}
