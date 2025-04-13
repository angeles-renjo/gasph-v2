import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import {
  useClusterer,
  isPointCluster,
  // ClustererFeature, // Removed - Use GeoJSON types
  // ClustererPointProperties, // Removed - Use GeoJSON types
  // ClustererClusterProperties, // Removed - Use GeoJSON types
  coordsToGeoJSONFeature,
} from 'react-native-clusterer';
import type { Feature, Point, GeoJsonProperties } from 'geojson'; // Import GeoJSON types

import { GasStation } from '@/hooks/queries/stations/useNearbyStations';
import { LocationData } from '@/hooks/useLocation';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices';
import { StationInfoModal } from './StationInfoModal';
import theme from '@/styles/theme';
import mapStyle from '@/styles/mapStyle.json';

// --- Constants for Map Views ---
const PHILIPPINES_CENTER = { latitude: 12.8797, longitude: 121.774 }; // Approx center
const PHILIPPINES_DELTA = { latitudeDelta: 15, longitudeDelta: 15 }; // Zoom level for whole country view
const USER_DELTA = { latitudeDelta: 0.1, longitudeDelta: 0.1 }; // Existing zoom for user location
const CLUSTER_ZOOM_DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 }; // Zoom level when clicking a cluster

const { width: INITIAL_MAP_WIDTH, height: INITIAL_MAP_HEIGHT } =
  Dimensions.get('window');
// --- End Constants ---

interface StationMapViewProps {
  stations: GasStation[]; // Expecting raw station data
  initialLocation: LocationData;
  isLoading?: boolean; // Map loading, not price loading
  defaultFuelType: FuelType | null;
}

// --- Memoized Marker Components ---
// Define properties expected for a cluster
type ClusterProperties = GeoJsonProperties & {
  cluster_id: number;
  point_count: number; // Use this for calculations
  point_count_abbreviated: number | string;
};

// Define properties expected for an individual point (original station data)
type PointProperties = GasStation & GeoJsonProperties;

interface StationMarkerProps {
  point: Feature<Point, PointProperties>; // Use GeoJSON Feature type
  isSelected: boolean;
  onPress: (station: GasStation) => void;
}

const StationMarker = React.memo(
  ({ point, isSelected, onPress }: StationMarkerProps) => {
    // Access station data from properties
    const station = point.properties;
    return (
      <Marker
        key={`station-${station.id}`} // Use station id from properties
        coordinate={{
          latitude: station.latitude,
          longitude: station.longitude,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        onPress={(e) => {
          e.stopPropagation();
          onPress(station);
        }}
        tracksViewChanges={Platform.OS === 'android' ? isSelected : false} // Optimize marker re-renders
      >
        <Animated.View style={[styles.markerWrap]}>
          <Animated.View
            style={[styles.markerRing, isSelected && styles.selectedMarkerRing]}
          />
          <View style={styles.marker} />
        </Animated.View>
      </Marker>
    );
  }
);

interface ClusterMarkerProps {
  point: Feature<Point, ClusterProperties>; // Use GeoJSON Feature type
  onPress: (clusterId: number) => void;
}

const ClusterMarker = React.memo(({ point, onPress }: ClusterMarkerProps) => {
  // Check if properties exist before destructuring
  const properties = point.properties;
  if (!properties) return null; // Should not happen if data is correct

  // Use point_count for calculation, point_count_abbreviated for display
  const {
    point_count,
    point_count_abbreviated: countDisplay,
    cluster_id: clusterId,
  } = properties;
  const { coordinates } = point.geometry;

  // Slightly larger style for clusters, similar to station marker
  const clusterSize = 28 + Math.min(point_count, 10); // Use point_count (number)
  const ringSize = clusterSize - 4;
  const dotSize = 12;

  return (
    <Marker
      key={`cluster-${clusterId}`}
      coordinate={{
        latitude: coordinates[1],
        longitude: coordinates[0],
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={(e) => {
        e.stopPropagation();
        onPress(clusterId);
      }}
      tracksViewChanges={false} // Clusters generally don't need frequent updates
    >
      <View
        style={[styles.markerWrap, { width: clusterSize, height: clusterSize }]}
      >
        <View
          style={[
            styles.markerRing,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              backgroundColor: 'rgba(42, 157, 143, 0.4)', // Slightly darker cluster ring
              borderColor: 'rgba(42, 157, 143, 0.6)',
            },
          ]}
        />
        <View
          style={[
            styles.marker,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: theme.Colors.primary, // Reverted to primary
            },
          ]}
        />
        <Text style={styles.clusterText}>{countDisplay}</Text>
        {/* Display abbreviated count */}
      </View>
    </Marker>
  );
});
// --- End Memoized Marker Components ---

export function StationMapView({
  stations,
  initialLocation,
  isLoading = false,
  defaultFuelType,
}: StationMapViewProps) {
  const [selectedStationData, setSelectedStationData] =
    useState<GasStation | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const mapViewRef = useRef<MapView>(null);

  // --- State for Map Interaction ---
  const [mapDimensions, setMapDimensions] = useState({
    width: INITIAL_MAP_WIDTH,
    height: INITIAL_MAP_HEIGHT,
  });

  // Calculate initial region based on whether we have user location or default
  const calculatedInitialRegion = useMemo(() => {
    if (!initialLocation) return undefined; // Handle case where initialLocation might be null/undefined briefly
    return {
      latitude: initialLocation.isDefaultLocation
        ? PHILIPPINES_CENTER.latitude
        : initialLocation.latitude,
      longitude: initialLocation.isDefaultLocation
        ? PHILIPPINES_CENTER.longitude
        : initialLocation.longitude,
      ...(initialLocation.isDefaultLocation ? PHILIPPINES_DELTA : USER_DELTA),
    };
  }, [initialLocation]);

  const [region, setRegion] = useState<Region | undefined>(
    calculatedInitialRegion
  );

  // Update region state when map moves
  const onRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion);
  }, []);

  // Update map dimensions on layout
  const onMapLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setMapDimensions({ width, height });
    }
  }, []);
  // --- End State for Map Interaction ---

  // --- Prepare Data for Clusterer ---
  const geoJsonPoints = useMemo(() => {
    return stations.map(
      (station) =>
        // Convert station data to GeoJSON Feature format
        coordsToGeoJSONFeature(
          [station.longitude, station.latitude], // Use array format [lng, lat]
          { ...station } // Pass original station data as properties
        ) as Feature<Point, PointProperties> // Assert type
    );
  }, [stations]);
  // --- End Prepare Data ---

  // --- Use Clusterer Hook ---
  // Provide a fallback region if state.region is undefined initially
  const currentRegionForHook = region ??
    calculatedInitialRegion ?? { ...PHILIPPINES_CENTER, ...PHILIPPINES_DELTA };

  const [points, superclusterInstance] = useClusterer(
    geoJsonPoints,
    mapDimensions,
    currentRegionForHook, // Use the guaranteed defined region
    {
      radius: 15, // Adjust cluster radius as needed
      maxZoom: 12, // Corresponds to react-native-maps zoom levels
      minPoints: 4,
    } // Optional: Add clustering options here
  );
  // --- End Use Clusterer Hook ---

  // --- Handlers ---
  const handleMarkerPress = useCallback((station: GasStation) => {
    setSelectedStationData(station);
    setIsModalVisible(true);
    mapViewRef.current?.animateToRegion(
      {
        latitude: station.latitude,
        longitude: station.longitude,
        ...CLUSTER_ZOOM_DELTA, // Zoom in closer
      },
      300
    );
  }, []);

  const handleClusterPress = useCallback(
    (clusterId: number) => {
      if (!superclusterInstance) return;

      const expansionRegion =
        superclusterInstance.getClusterExpansionRegion(clusterId);

      if (expansionRegion) {
        mapViewRef.current?.animateToRegion(expansionRegion, 300);
      }
    },
    [superclusterInstance]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedStationData(null);
  }, []);
  // --- End Handlers ---

  // --- Render Logic ---
  if (!region) {
    // Show loading or placeholder if region isn't set yet
    return (
      <View style={styles.loadingContainer}>
        <Text>Initializing map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={calculatedInitialRegion} // Use the calculated one
        region={region} // Control region for clustering updates
        onRegionChangeComplete={onRegionChangeComplete}
        onLayout={onMapLayout} // Get map dimensions
        showsUserLocation={!initialLocation?.isDefaultLocation} // Check initialLocation exists
        showsMyLocationButton={!initialLocation?.isDefaultLocation}
        loadingEnabled={isLoading}
        loadingIndicatorColor={theme.Colors.primary}
        loadingBackgroundColor={theme.Colors.white}
        customMapStyle={mapStyle}
        showsCompass={false}
        showsTraffic={false}
        toolbarEnabled={false}
        onPress={handleCloseModal}
      >
        {points.map((point) => {
          if (isPointCluster(point)) {
            // Render Cluster Marker
            return (
              <ClusterMarker
                key={`cluster-${point.properties.cluster_id}`}
                point={point}
                onPress={handleClusterPress}
              />
            );
          } else {
            // Render Individual Station Marker
            // Type assertion for individual points
            const pointFeature = point as Feature<Point, PointProperties>;
            const isSelected =
              selectedStationData?.id === pointFeature.properties.id;
            return (
              <StationMarker
                key={`station-${pointFeature.properties.id}`}
                point={pointFeature}
                isSelected={isSelected}
                onPress={handleMarkerPress}
              />
            );
          }
        })}
      </MapView>

      <StationInfoModal
        station={selectedStationData}
        fuelType={defaultFuelType}
        isVisible={isModalVisible}
        onClose={handleCloseModal}
      />
    </View>
  );
}
// --- End Render Logic ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // --- Marker Styles ---
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    // Default size, clusters might override
    width: 30,
    height: 30,
  },
  markerRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(42, 157, 143, 0.3)',
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(42, 157, 143, 0.5)',
  },
  selectedMarkerRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(42, 157, 143, 0.5)',
    borderColor: theme.Colors.primary,
  },
  marker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.Colors.primary,
  },
  // --- Cluster Specific Styles ---
  clusterText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.Colors.white, // White text on cluster dot
    textAlign: 'center',
    position: 'absolute', // Position over the dot
  },
});
