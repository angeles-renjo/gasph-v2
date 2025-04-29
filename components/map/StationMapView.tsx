import React, {
  useState,
  useRef,
  useMemo,
  useCallback, // Import forwardRef
  forwardRef,
} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  LayoutChangeEvent,
  Platform,
  TouchableOpacity, // Import TouchableOpacity
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
// Removed duplicate MaterialIcons import here
import {
  useClusterer,
  isPointCluster,
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
import { useGoogleMapIosPerfFix } from '@/hooks/useGoogleMapIosPerfFix'; // Import the perf fix hook

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

export interface StationMapViewProps {
  stations: GasStation[];
  initialLocation: LocationData;
  isLoading?: boolean;
  defaultFuelType: FuelType | null;
  onRegionChangeComplete?: (region: Region) => void;
  favoriteStationIds?: string[]; // Add favorite station IDs
  showDefaultMyLocationButton?: boolean; // Add prop to control default button
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
  point: Feature<Point, PointProperties>;
  isSelected: boolean;
  onPress: (station: GasStation) => void;
  isFavorite?: boolean; // Add favorite prop
}

import { MaterialIcons } from '@expo/vector-icons';

const StationMarker = React.memo(
  ({ point, isSelected, onPress, isFavorite }: StationMarkerProps) => {
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
        anchor={{ x: 0.5, y: 0.5 }}
        onPress={(e) => {
          e.stopPropagation();
          onPress(station);
        }}
        tracksViewChanges={isSelected} // Simplified for performance
        accessibilityLabel={isFavorite ? 'Favorite station' : 'Station'}
      >
        {isFavorite ? (
          <View style={styles.favoriteMarkerContainer}>
            <MaterialIcons
              name='star'
              size={32}
              color='#FFD700'
              style={styles.favoriteStarIcon}
            />
            <Text style={styles.favoriteMarkerPriceText}>{priceText}</Text>
          </View>
        ) : (
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
        )}
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
          <View style={[styles.markerWrap]}>
            <Animated.View style={[styles.markerRing]}>
              {/* Add Text for count inside the ring - Apply style later */}
              <Text style={styles.clusterCountText}>{countDisplayText}</Text>
            </Animated.View>
          </View>
          {/* Text below the marker (for price) */}
          <Text style={[styles.markerPriceText]}>
            {priceDisplayText} {/* Display the price text */}
          </Text>
        </View>
      </Marker>
    );
  }
);
// --- End Memoized Marker Components ---

// Wrap component with forwardRef
export const StationMapView = forwardRef<MapView, StationMapViewProps>(
  (
    {
      stations,
      initialLocation,
      isLoading = false,
      defaultFuelType,
      onRegionChangeComplete: onRegionChangeCompleteProp,
      favoriteStationIds,
      showDefaultMyLocationButton = true, // Default to true
    },
    ref
  ) => {
    // Apply the iOS performance fix hook (no-op on other platforms)
    useGoogleMapIosPerfFix();

    const [selectedStationData, setSelectedStationData] =
      useState<GasStation | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    // Use the forwarded ref if provided, otherwise use a local ref for internal use
    const internalMapRef = useRef<MapView>(null);
    const mapViewRef = ref || internalMapRef; // Prioritize forwarded ref

    // --- State for Map Interaction ---
    const [mapDimensions, setMapDimensions] = useState({
      width: INITIAL_MAP_WIDTH,
      height: INITIAL_MAP_HEIGHT,
    });

    // Calculate initial region based on the provided initialLocation
    const calculatedInitialRegion = useMemo(() => {
      return {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        // Use a reasonable delta for initial zoom, maybe USER_DELTA or a bit wider
        latitudeDelta: 0.0922, // Standard delta
        longitudeDelta: 0.0421, // Standard delta
      };
    }, [initialLocation]); // Depend on initialLocation

    const [region, setRegion] = useState<Region | undefined>(
      calculatedInitialRegion // Use the calculated region based on prop
    );

    // Update region state and enforce bounds when map moves
    const handleInternalRegionChangeComplete = useCallback(
      (newRegion: Region) => {
        let targetLat = newRegion.latitude;
        let targetLng = newRegion.longitude;
        let needsAdjustment = false;

        // Boundary Clamping Logic (simplified for brevity, assume it's correct)
        if (
          newRegion.latitudeDelta > PHILIPPINES_DELTA.latitudeDelta + 5 ||
          newRegion.longitudeDelta > PHILIPPINES_DELTA.longitudeDelta + 5
        ) {
          targetLat = PHILIPPINES_CENTER.latitude;
          targetLng = PHILIPPINES_CENTER.longitude;
          newRegion.latitudeDelta = PHILIPPINES_DELTA.latitudeDelta;
          newRegion.longitudeDelta = PHILIPPINES_DELTA.longitudeDelta;
          needsAdjustment = true;
        } else {
          if (newRegion.latitude < PHILIPPINES_BOUNDS.sw.latitude)
            targetLat = PHILIPPINES_BOUNDS.sw.latitude;
          else if (newRegion.latitude > PHILIPPINES_BOUNDS.ne.latitude)
            targetLat = PHILIPPINES_BOUNDS.ne.latitude;
          if (newRegion.longitude < PHILIPPINES_BOUNDS.sw.longitude)
            targetLng = PHILIPPINES_BOUNDS.sw.longitude;
          else if (newRegion.longitude > PHILIPPINES_BOUNDS.ne.longitude)
            targetLng = PHILIPPINES_BOUNDS.ne.longitude;
          needsAdjustment =
            targetLat !== newRegion.latitude ||
            targetLng !== newRegion.longitude;
        }

        const currentTargetRegion = {
          latitude: targetLat,
          longitude: targetLng,
          latitudeDelta: newRegion.latitudeDelta,
          longitudeDelta: newRegion.longitudeDelta,
        };

        setRegion(currentTargetRegion);

        // Call the prop handler passed from the parent
        if (onRegionChangeCompleteProp) {
          onRegionChangeCompleteProp(currentTargetRegion);
        }

        // Animate back smoothly only if adjustments were needed
        if (
          needsAdjustment &&
          typeof mapViewRef === 'object' &&
          mapViewRef?.current
        ) {
          // Check if ref is an object and current exists
          const centerFocusedRegion = {
            latitude: PHILIPPINES_CENTER.latitude,
            longitude: PHILIPPINES_CENTER.longitude,
            latitudeDelta: currentTargetRegion.latitudeDelta,
            longitudeDelta: currentTargetRegion.longitudeDelta,
          };
          mapViewRef.current.animateToRegion(centerFocusedRegion, 200);
        }
      },
      [onRegionChangeCompleteProp, mapViewRef] // Include mapViewRef
    );

    const onMapLayout = useCallback((event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (width > 0 && height > 0) {
        setMapDimensions({ width, height });
      }
    }, []);

    const geoJsonPoints = useMemo(() => {
      return stations.map(
        (station) =>
          coordsToGeoJSONFeature([station.longitude, station.latitude], {
            ...station,
          }) as Feature<Point, PointProperties>
      );
    }, [stations]);

    const currentRegionForHook = region ?? calculatedInitialRegion;

    const [points, superclusterInstance] = useClusterer(
      geoJsonPoints,
      mapDimensions,
      currentRegionForHook,
      { radius: 30, maxZoom: 14, minPoints: 4 } // Adjusted radius and maxZoom
    );

    const clusterBestPrices = useMemo(() => {
      const bestPrices = new Map<number, number | null>();
      if (!superclusterInstance) return bestPrices;
      points.forEach((point) => {
        if (isPointCluster(point)) {
          const clusterId = point.properties.cluster_id;
          const leaves = superclusterInstance.getLeaves(
            clusterId,
            Infinity
          ) as Feature<Point, PointProperties>[];
          let minPrice: number | null = null;
          leaves.forEach((leaf) => {
            const price = leaf.properties.price;
            if (price !== null && price !== undefined) {
              if (minPrice === null || price < minPrice) minPrice = price;
            }
          });
          bestPrices.set(clusterId, minPrice);
        }
      });
      return bestPrices;
    }, [points, superclusterInstance]);

    const handleMarkerPress = useCallback(
      (station: GasStation) => {
        setSelectedStationData(station);
        setIsModalVisible(true);
        // Use current zoom level instead of fixed delta
        if (typeof mapViewRef === 'object' && mapViewRef?.current && region) {
          mapViewRef.current.animateToRegion(
            {
              latitude: station.latitude,
              longitude: station.longitude,
              latitudeDelta: region.latitudeDelta, // Use current delta
              longitudeDelta: region.longitudeDelta, // Use current delta
            },
            300
          );
        }
      },
      [mapViewRef, region] // Add region dependency
    );

    const handleClusterPress = useCallback(
      (clusterId: number) => {
        if (
          !superclusterInstance ||
          typeof mapViewRef !== 'object' ||
          !mapViewRef?.current
        )
          return; // Check ref type
        const expansionRegion =
          superclusterInstance.getClusterExpansionRegion(clusterId);
        if (expansionRegion) {
          mapViewRef.current.animateToRegion(expansionRegion, 300);
        }
      },
      [superclusterInstance, mapViewRef] // Include mapViewRef
    );

    const handleCloseModal = useCallback(() => {
      setIsModalVisible(false);
      setSelectedStationData(null);
    }, []);

    if (!region) {
      return (
        <View style={styles.loadingContainer}>
          <Text>Initializing map...</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <MapView
          ref={mapViewRef} // Pass the ref here
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={calculatedInitialRegion}
          onRegionChangeComplete={handleInternalRegionChangeComplete} // Use internal handler
          onLayout={onMapLayout}
          showsUserLocation={true} // <-- Change to true
          showsMyLocationButton={showDefaultMyLocationButton} // <-- Use prop
          loadingEnabled={isLoading}
          loadingIndicatorColor={theme.Colors.primary}
          loadingBackgroundColor={theme.Colors.white}
          customMapStyle={mapStyle}
          showsCompass={false}
          showsTraffic={false}
          toolbarEnabled={false}
          onPress={handleCloseModal}
          rotateEnabled={false}
          pitchEnabled={false}
          removeClippedSubviews={Platform.OS === 'ios'} // iOS only performance optimization
          onPanDrag={() => {}} // Workaround for iOS panning lag issue #4937
        >
          {points.map((point) => {
            if (isPointCluster(point)) {
              const clusterId = point.properties.cluster_id;
              const bestPrice = clusterBestPrices.get(clusterId) ?? null;
              return (
                <ClusterMarker
                  key={`cluster-${clusterId}`}
                  point={point}
                  bestPrice={bestPrice}
                  onPress={handleClusterPress}
                />
              );
            } else {
              const pointFeature = point as Feature<Point, PointProperties>;
              const isSelected =
                selectedStationData?.id === pointFeature.properties.id;
              const isFavorite =
                Array.isArray(favoriteStationIds) &&
                favoriteStationIds.includes(pointFeature.properties.id);
              return (
                <StationMarker
                  key={`station-${pointFeature.properties.id}`}
                  point={pointFeature}
                  isSelected={isSelected}
                  onPress={handleMarkerPress}
                  isFavorite={isFavorite}
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
);
// --- End Render Logic ---

// Styles remain the same
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
    alignItems: 'center',
  },
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    marginBottom: 2,
  },
  starContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 8,
    paddingHorizontal: 2,
    paddingVertical: 0,
    zIndex: 2,
  },
  starText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  favoriteMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteStarIcon: {
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  favoriteMarkerPriceText: {
    fontSize: theme.Typography.fontSizeSmall,
    fontWeight: theme.Typography.fontWeightBold,
    color: '#FFD700',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: theme.Spacing.xs,
    paddingVertical: 1,
    borderRadius: theme.BorderRadius.sm,
    overflow: 'hidden',
    marginTop: -2,
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
