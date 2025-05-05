import React, {
  useState,
  useRef,
  useMemo,
  useCallback, // Import forwardRef
  forwardRef,
} from 'react';
import {
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
  coordsToGeoJSONFeature,
} from 'react-native-clusterer';
import type { Feature, Point, GeoJsonProperties } from 'geojson'; // Import GeoJSON types

import { GasStation } from '@/hooks/queries/stations/useNearbyStations';
import { LocationData } from '@/constants/map/locationConstants';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices';
import { StationInfoModal } from './StationInfoModal';
import theme from '@/styles/theme';
import mapStyle from '@/styles/mapStyle.json';
import { formatPrice } from '@/utils/formatters'; // Import correct formatter
import { useGoogleMapIosPerfFix } from '@/hooks/useGoogleMapIosPerfFix'; // Import the perf fix hook
import {
  PHILIPPINES_CENTER,
  PHILIPPINES_WIDE_REGION,
  PHILIPPINES_BOUNDS,
  ZOOM_LEVELS,
  ANIMATION_DURATION,
  DEFAULT_MAP_REGION,
} from '@/constants/map/locationConstants';

import { styles } from '@/styles/components/map/StationMapView.styles';
import { MaterialIcons } from '@expo/vector-icons';

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
      // Use the centralized default region if location is the fallback
      if (initialLocation.isDefaultLocation) {
        return DEFAULT_MAP_REGION;
      }
      // Otherwise, use user's location but with the default zoom level for consistency
      return {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: ZOOM_LEVELS.CITY.latitudeDelta,
        longitudeDelta: ZOOM_LEVELS.CITY.longitudeDelta,
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
          newRegion.latitudeDelta > PHILIPPINES_WIDE_REGION.latitudeDelta + 5 ||
          newRegion.longitudeDelta > PHILIPPINES_WIDE_REGION.longitudeDelta + 5
        ) {
          targetLat = PHILIPPINES_CENTER.latitude;
          targetLng = PHILIPPINES_CENTER.longitude;
          newRegion.latitudeDelta = PHILIPPINES_WIDE_REGION.latitudeDelta;
          newRegion.longitudeDelta = PHILIPPINES_WIDE_REGION.longitudeDelta;
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
          mapViewRef.current.animateToRegion(
            centerFocusedRegion,
            ANIMATION_DURATION.SHORT
          );
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
            ANIMATION_DURATION.MEDIUM
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
          mapViewRef.current.animateToRegion(
            expansionRegion,
            ANIMATION_DURATION.MEDIUM
          );
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
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapViewRef}
            style={styles.map}
            // provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE} // Use Apple Maps on iOS, Google Maps on Android
            provider={PROVIDER_GOOGLE}
            initialRegion={calculatedInitialRegion}
            onRegionChangeComplete={handleInternalRegionChangeComplete}
            onLayout={onMapLayout}
            onMapReady={() => {
              console.log('StationMapView: Map is ready!', {
                provider: Platform.OS === 'ios' ? 'Apple Maps' : 'Google Maps',
                initialRegion: calculatedInitialRegion,
                hasStations: stations?.length > 0,
                stationsCount: stations?.length,
              });
            }}
            showsUserLocation={true}
            showsMyLocationButton={showDefaultMyLocationButton}
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
            removeClippedSubviews={Platform.OS === 'ios'}
            onPanDrag={() => {}}
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
        </View>

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
