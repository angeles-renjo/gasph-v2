import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, {
  Marker,
  Callout,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNearbyStations } from '@/hooks/useNearbyStations';
import { useLocation } from '@/hooks/useLocation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.03;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const {
    location,
    loading: locationLoading,
    error: locationError,
    refreshLocation,
  } = useLocation();

  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null
  );
  const [region, setRegion] = useState<Region | null>(null);

  const {
    data: stations,
    isLoading,
    error,
    refetch,
  } = useNearbyStations(10, !!location); // 10 km radius

  // Set initial region when location is available
  useEffect(() => {
    if (location && !region) {
      const initialRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(initialRegion);
    }
  }, [location]);

  const handleMarkerPress = (stationId: string) => {
    setSelectedStationId(stationId);
  };

  const navigateToStation = (stationId: string) => {
    router.push(`/station/${stationId}`);
  };

  const centerOnUserLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    } else {
      refreshLocation();
    }
  };

  if (locationLoading) {
    return <LoadingIndicator fullScreen message='Getting your location...' />;
  }

  if (locationError || !location) {
    return (
      <ErrorDisplay
        fullScreen
        title='Location Error'
        message="We couldn't determine your location. Please check your location permissions and try again."
        onRetry={refreshLocation}
      />
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        fullScreen
        message='There was an error loading stations. Please try again.'
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <LoadingIndicator fullScreen message='Loading stations...' />
      ) : (
        <>
          {region && (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={region}
              provider={PROVIDER_GOOGLE}
              showsUserLocation
              showsMyLocationButton={false}
              onRegionChangeComplete={setRegion}
            >
              {/* User's location marker */}
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                pinColor='#2a9d8f'
                title='Your Location'
              />

              {/* Station markers */}
              {stations?.map((station) => (
                <Marker
                  key={station.id}
                  coordinate={{
                    latitude: station.latitude,
                    longitude: station.longitude,
                  }}
                  pinColor={
                    selectedStationId === station.id ? '#f4a261' : '#e76f51'
                  }
                  title={station.name}
                  description={station.brand}
                  onPress={() => handleMarkerPress(station.id)}
                >
                  <Callout
                    tooltip
                    onPress={() => navigateToStation(station.id)}
                  >
                    <Card style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>{station.name}</Text>
                      <Text style={styles.calloutBrand}>{station.brand}</Text>
                      <Text style={styles.calloutAddress} numberOfLines={2}>
                        {station.address}
                      </Text>
                      <TouchableOpacity style={styles.calloutButton}>
                        <Text style={styles.calloutButtonText}>
                          View Details
                        </Text>
                      </TouchableOpacity>
                    </Card>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          )}

          {/* Map controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.centerButton}
              onPress={centerOnUserLocation}
            >
              <FontAwesome5 name='location-arrow' size={20} color='#2a9d8f' />
            </TouchableOpacity>
          </View>

          {/* Floating footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {stations?.length || 0} stations found within 10 km
            </Text>
            <Button
              title='List View'
              variant='outline'
              onPress={() => router.push('/explore')}
              style={styles.listButton}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
  },
  centerButton: {
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  calloutContainer: {
    width: 200,
    padding: 12,
    borderRadius: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  calloutBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  calloutButton: {
    backgroundColor: '#2a9d8f',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  calloutButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  listButton: {
    paddingHorizontal: 20,
  },
});
