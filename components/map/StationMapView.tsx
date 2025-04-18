import React, { useState, useRef, useMemo, useCallback } from 'react';
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
import { formatPrice } from '@/utils/formatters'; // Import correct formatter

// --- Constants for Map Views ---
const PHILIPPINES_CENTER = { latitude: 12.8797, longitude: 121.774 }; // Approx center
const PHILIPPINES_DELTA = { latitudeDelta: 15, longitudeDelta: 15 }; // Zoom level for whole country view
const USER_DELTA = { latitudeDelta: 0.1, longitudeDelta: 0.1 }; // Keep for potential future use?
const CLUSTER_ZOOM_DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 }; // Zoom level when clicking a cluster

// ++ Add Bounding Box and Zoom Limits ++
const PHILIPPINES_BOUNDS = {
  // Looser bounds to allow slight over-panning before snapping back
  sw: { latitude: 4.0, longitude: 116.0 }, // Approx Southwest corner
  ne: { latitude: 21.5, longitude: 127.5 }, // Approx Northeast corner
};
const MIN_ZOOM_LEVEL = 6; // Prevent zooming out too far (Higher number = more zoomed in)
const MAX_ZOOM_LEVEL = 18; // Optional: Limit max zoom

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

// Define properties expected for an individual point (original station data - now includes optional price)
type PointProperties = GasStation & GeoJsonProperties;

interface StationMarkerProps {
  point: Feature<Point, PointProperties>; // Use GeoJSON Feature type
  isSelected: boolean;
  onPress: (station: GasStation) => void;
}

const StationMarker = React.memo(
  ({ point, isSelected, onPress }: StationMarkerProps) => {
    const station = point.properties;
    const priceText =
      station.price !== null && station.price !== undefined
        ? formatPrice(station.price)
        : '--';

    return (
      <Marker
        key={`station-${station.id}`}
        coordinate={{
          latitude: station.latitude,
          longitude: station.longitude,
        }}
        anchor={{ x: 0.5, y: 0.5 }} // Center anchor
        onPress={(e) => {
          e.stopPropagation();
          onPress(station);
        }}
        // Force re-render if selected (Android) or if there's a price to display.
        // This ensures the price text updates when the station data changes.
        tracksViewChanges={
          Platform.OS === 'android'
            ? isSelected || station.price !== null
            : station.price !== null
        }
      >
        {/* Revised Dot/Ring Marker Style */}
        <View style={styles.markerContainer}>
          <View style={[styles.markerWrap]}>
            <Animated.View
              style={[
                styles.markerRing,
                isSelected && styles.selectedMarkerRing,
              ]}
            />
            <View style={styles.marker} />
          </View>
          <Text
            style={[
              styles.markerPriceText,
              isSelected && styles.selectedMarkerPriceText,
            ]}
          >
            {priceText}
          </Text>
        </View>
      </Marker>
    );
  }
);

interface ClusterMarkerProps {
  point: Feature<Point, ClusterProperties>;
  bestPrice: number | null;
  onPress: (clusterId: number) => void;
  // isSelected: boolean; // Add if cluster selection state is needed
}

const ClusterMarker = React.memo(
  ({ point, bestPrice, onPress /*, isSelected */ }: ClusterMarkerProps) => {
    const properties = point.properties;
    if (!properties) return null;

    const { cluster_id: clusterId, point_count } = properties; // Get count
    const { coordinates } = point.geometry;
    const priceDisplayText = bestPrice !== null ? formatPrice(bestPrice) : '--'; // Keep price text separate
    const countDisplayText = point_count.toString(); // Text for the count inside circle

    // Optional: Adjust size based on point_count if desired
    // const clusterSize = 28 + Math.min(point_count, 10);
    // const ringSize = clusterSize - 4;
    // const dotSize = 12;

    return (
      <Marker
        key={`cluster-${clusterId}`}
        coordinate={{
          latitude: coordinates[1],
          longitude: coordinates[0],
        }}
        anchor={{ x: 0.5, y: 0.5 }} // Center anchor
        onPress={(e) => {
          e.stopPropagation();
          onPress(clusterId);
        }}
        tracksViewChanges={false}
      >
        {/* Use similar Dot/Ring Style for Clusters */}
        <View style={styles.markerContainer}>
          <View
            style={[
              styles.markerWrap /*, { width: clusterSize, height: clusterSize } */,
            ]}
          >
            <Animated.View
              style={[
                styles.markerRing,
                // isSelected && styles.selectedMarkerRing, // Apply selection style if needed
                // { width: ringSize, height: ringSize, borderRadius: ringSize / 2 } // Apply dynamic size if needed
              ]}
            >
              {/* Add Text for count inside the ring - Apply style later */}
              <Text style={styles.clusterCountText}>{countDisplayText}</Text>
            </Animated.View>
            {/* Remove the inner dot View */}
            {/* <View
              style={[
                styles.marker // , { width: dotSize, height: dotSize, borderRadius: dotSize / 2 } ,
              ]}
            /> */}
          </View>
          {/* Text below the marker (for price) */}
          <Text
            style={[
              styles.markerPriceText, // Keep this style for the price below
              // isSelected && styles.selectedMarkerPriceText, // Apply selection style if needed
            ]}
          >
            {priceDisplayText} {/* Display the price text */}
          </Text>
        </View>
      </Marker>
    );
  }
);
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

  // Calculate initial region - ALWAYS focus on Philippines
  const calculatedInitialRegion = useMemo(() => {
    return {
      ...PHILIPPINES_CENTER,
      ...PHILIPPINES_DELTA,
    };
  }, []); // Dependency array empty as it only uses constants

  const [region, setRegion] = useState<Region | undefined>(
    calculatedInitialRegion
  );

  // Update region state and enforce bounds when map moves
  const onRegionChangeComplete = useCallback((newRegion: Region) => {
    let targetLat = newRegion.latitude;
    let targetLng = newRegion.longitude;
    let needsAdjustment = false;

    // --- Boundary Clamping Logic ---
    // Prevent zooming out too far (using delta as a fallback/complement to minZoomLevel)
    if (
      newRegion.latitudeDelta > PHILIPPINES_DELTA.latitudeDelta + 5 || // Allow slightly more than initial delta
      newRegion.longitudeDelta > PHILIPPINES_DELTA.longitudeDelta + 5
    ) {
      targetLat = PHILIPPINES_CENTER.latitude;
      targetLng = PHILIPPINES_CENTER.longitude;
      // Use a reasonable delta if zoom is too far out
      newRegion.latitudeDelta = PHILIPPINES_DELTA.latitudeDelta;
      newRegion.longitudeDelta = PHILIPPINES_DELTA.longitudeDelta;
      needsAdjustment = true;
    } else {
      // Clamp Latitude
      if (newRegion.latitude < PHILIPPINES_BOUNDS.sw.latitude) {
        targetLat = PHILIPPINES_BOUNDS.sw.latitude;
        needsAdjustment = true;
      } else if (newRegion.latitude > PHILIPPINES_BOUNDS.ne.latitude) {
        targetLat = PHILIPPINES_BOUNDS.ne.latitude;
        needsAdjustment = true;
      }

      // Clamp Longitude
      if (newRegion.longitude < PHILIPPINES_BOUNDS.sw.longitude) {
        targetLng = PHILIPPINES_BOUNDS.sw.longitude;
        needsAdjustment = true;
      } else if (newRegion.longitude > PHILIPPINES_BOUNDS.ne.longitude) {
        targetLng = PHILIPPINES_BOUNDS.ne.longitude;
        needsAdjustment = true;
      }
    }
    // --- End Clamping Logic ---

    const currentTargetRegion = {
      latitude: targetLat,
      longitude: targetLng,
      latitudeDelta: newRegion.latitudeDelta, // Keep user's zoom level if within delta limits
      longitudeDelta: newRegion.longitudeDelta,
    };

    // Update the state regardless (needed for clusterer)
    setRegion(currentTargetRegion);

    // Animate back smoothly only if adjustments were needed
    if (needsAdjustment && mapViewRef.current) {
      // --- Animate back towards the center ---
      const centerFocusedRegion = {
        latitude: PHILIPPINES_CENTER.latitude, // Target the center latitude
        longitude: PHILIPPINES_CENTER.longitude, // Target the center longitude
        latitudeDelta: currentTargetRegion.latitudeDelta, // Keep the current zoom level (unless it was adjusted above)
        longitudeDelta: currentTargetRegion.longitudeDelta, // Keep the current zoom level (unless it was adjusted above)
      };
      mapViewRef.current.animateToRegion(centerFocusedRegion, 200); // Slightly longer animation for centering
    }
  }, []); // Dependencies: PHILIPPINES_BOUNDS, PHILIPPINES_CENTER, PHILIPPINES_DELTA

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

  // --- Calculate Best Price per Cluster ---
  const clusterBestPrices = useMemo(() => {
    const bestPrices = new Map<number, number | null>();
    if (!superclusterInstance) {
      return bestPrices;
    }

    points.forEach((point) => {
      if (isPointCluster(point)) {
        const clusterId = point.properties.cluster_id;
        const leaves = superclusterInstance.getLeaves(
          clusterId,
          Infinity // Get all leaves within the cluster
        ) as Feature<Point, PointProperties>[]; // Assert type for leaves

        let minPrice: number | null = null;
        leaves.forEach((leaf) => {
          const price = leaf.properties.price; // Access price from station properties
          if (price !== null && price !== undefined) {
            if (minPrice === null || price < minPrice) {
              minPrice = price;
            }
          }
        });
        bestPrices.set(clusterId, minPrice);
      }
    });

    return bestPrices;
  }, [points, superclusterInstance]);
  // --- End Calculate Best Price ---

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
        // region={region} // DO NOT control region directly when animating in onRegionChangeComplete
        onRegionChangeComplete={onRegionChangeComplete}
        onLayout={onMapLayout} // Get map dimensions
        showsUserLocation={false} // ++ Disable user location dot ++
        showsMyLocationButton={false} // ++ Disable location button ++
        loadingEnabled={isLoading}
        loadingIndicatorColor={theme.Colors.primary}
        loadingBackgroundColor={theme.Colors.white}
        customMapStyle={mapStyle}
        showsCompass={false}
        showsTraffic={false}
        toolbarEnabled={false}
        onPress={handleCloseModal}
        // ++ Add Zoom Limits and disable rotation/pitch ++
        minZoomLevel={MIN_ZOOM_LEVEL}
        maxZoomLevel={MAX_ZOOM_LEVEL} // Optional
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {points.map((point) => {
          if (isPointCluster(point)) {
            // Render Cluster Marker
            const clusterId = point.properties.cluster_id;
            const bestPrice = clusterBestPrices.get(clusterId) ?? null;
            return (
              <ClusterMarker
                key={`cluster-${clusterId}`}
                point={point}
                bestPrice={bestPrice} // Pass calculated best price
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
  // --- Revised Marker Styles ---
  markerContainer: {
    alignItems: 'center', // Center the dot/ring and the text below
  },
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34, // Increased size
    height: 34, // Increased size
    marginBottom: 2, // Space between marker and text
  },
  markerRing: {
    width: 29, // Increased size (approx 1.2x)
    height: 29, // Increased size (approx 1.2x)
    borderRadius: 14.5, // Adjusted for new size
    backgroundColor: theme.Colors.white, // Default white background
    position: 'absolute',
    borderWidth: 2, // Make border slightly thicker
    borderColor: theme.Colors.primary, // Default primary border
    // Add centering for the child Text element
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMarkerRing: {
    // Style for selected state
    backgroundColor: theme.Colors.primary, // Primary background when selected
    borderColor: theme.Colors.darkGray, // Darker border when selected
  },
  marker: {
    // Central dot
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.Colors.primary, // Primary color dot
  },
  markerPriceText: {
    // Style for the price text below the marker
    fontSize: theme.Typography.fontSizeSmall,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white background
    paddingHorizontal: theme.Spacing.xs,
    paddingVertical: 1,
    borderRadius: theme.BorderRadius.sm,
    overflow: 'hidden', // Clip background to border radius
  },
  selectedMarkerPriceText: {
    // Optional: Style changes for text when marker is selected
    // e.g., color: theme.Colors.white, backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  clusterCountText: {
    // Style for the count text inside the cluster circle
    fontSize: theme.Typography.fontSizeSmall, // Adjust size as needed
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.primary, // Use primary color for the count text
    textAlign: 'center', // Ensure text is centered
  },
  // --- End Revised Marker Styles ---
});
