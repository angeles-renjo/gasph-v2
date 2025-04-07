import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { GasStation } from '@/hooks/queries/stations/useNearbyStations'; // Assuming type export
import { LocationData } from '@/hooks/useLocation'; // Assuming type export
import theme from '@/styles/theme'; // Import theme

interface StationMapViewProps {
  stations: GasStation[];
  initialLocation: LocationData;
  isLoading?: boolean; // To potentially show loading state on the map itself
}

export function StationMapView({
  stations,
  initialLocation,
  isLoading = false,
}: StationMapViewProps) {
  const router = useRouter();

  const initialRegion = initialLocation
    ? {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.1, // Start with a reasonable zoom level
        longitudeDelta: 0.1,
      }
    : undefined;

  if (!initialRegion) {
    // Handle case where location isn't ready (though MapScreen should handle primary loading)
    return (
      <View style={styles.loadingContainer}>
        <Text>Initializing map...</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      showsUserLocation={!initialLocation.isDefaultLocation}
      showsMyLocationButton={!initialLocation.isDefaultLocation}
      loadingEnabled={isLoading}
      loadingIndicatorColor={theme.Colors.primary}
      loadingBackgroundColor='#ffffff'
    >
      {stations.map((station) => (
        <Marker
          key={station.id}
          coordinate={{
            latitude: station.latitude,
            longitude: station.longitude,
          }}
          title={station.name}
          description={station.brand}
          pinColor={theme.Colors.primary} // Use theme color for pins
        >
          <Callout
            tooltip={false}
            onPress={() => router.push(`/station/${station.id}`)}
          >
            <View style={styles.calloutContainer}>
              <Text style={styles.calloutTitle} numberOfLines={1}>
                {station.name}
              </Text>
              <Text style={styles.calloutBrand}>{station.brand}</Text>
              <Text style={styles.calloutAction}>View Details {' >'}</Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutContainer: {
    width: 180,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    color: theme.Colors.darkGray,
  },
  calloutBrand: {
    fontSize: 12,
    color: theme.Colors.textGray,
    marginBottom: 4,
  },
  calloutAction: {
    fontSize: 12,
    color: theme.Colors.primary, // Use theme color
    fontWeight: '500',
  },
});
