import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { useLocation, LocationData } from '@/hooks/useLocation';
import { calculateDistance, getBoundingBox } from '@/lib/geo';
import { queryKeys } from '../utils/queryKeys';
import { defaultQueryOptions } from '../utils/queryOptions';

// Constants for query optimization
const LARGE_RADIUS_THRESHOLD = 25; // km
const MAX_STATIONS_PER_QUERY = 1000; // Limit to prevent excessive data fetching

// Export GasStation interface
export interface GasStation {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  amenities: Record<string, boolean>;
  operating_hours: Record<string, string>;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  distance?: number;
  price?: number | null; // Added optional price field for map clustering
}

interface UseNearbyStationsOptions {
  radiusKm?: number;
  enabled?: boolean;
  providedLocation?: LocationData;
  limit?: number; // Optional limit parameter
}

export function useNearbyStations({
  radiusKm = 5,
  enabled = true,
  providedLocation,
  limit,
}: UseNearbyStationsOptions = {}) {
  const { getLocationWithFallback, loading: locationLoading } = useLocation();
  const location = providedLocation || getLocationWithFallback();

  // Determine if we should use the optimized approach for large radius
  const isLargeRadius = radiusKm >= LARGE_RADIUS_THRESHOLD;

  return useQuery({
    queryKey: queryKeys.stations.nearby({
      location,
      radiusKm,
      isOptimized: isLargeRadius, // Add to query key to ensure proper caching
    }),
    queryFn: async (): Promise<GasStation[]> => {
      if (!location) {
        throw new Error('Location not available');
      }

      try {
        // Get bounding box for more efficient querying
        // Use optimization for large radius queries
        const bbox = getBoundingBox(location, radiusKm, isLargeRadius);

        // Query stations within the bounding box
        let query = supabase
          .from('gas_stations')
          .select('*')
          .eq('status', 'active')
          .gte('latitude', bbox.minLat)
          .lte('latitude', bbox.maxLat)
          .gte('longitude', bbox.minLng)
          .lte('longitude', bbox.maxLng);

        // Apply limit to prevent excessive data fetching
        // Use either the provided limit or the default max
        const effectiveLimit =
          limit || (isLargeRadius ? MAX_STATIONS_PER_QUERY : undefined);
        if (effectiveLimit) {
          query = query.limit(effectiveLimit);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching nearby stations:', error);
          throw error;
        }

        // Calculate exact distances and filter by actual radius
        const stationsWithDistance = (data || [])
          .map((station) => ({
            ...station,
            distance: calculateDistance(location, {
              latitude: station.latitude,
              longitude: station.longitude,
            }),
          }))
          .filter((station) => (station.distance as number) <= radiusKm)
          .sort((a, b) => (a.distance as number) - (b.distance as number));

        return stationsWithDistance;
      } catch (error) {
        console.error('Error in useNearbyStations:', error);
        throw error;
      }
    },
    enabled: !!location && enabled,
    ...defaultQueryOptions.stations.nearby,
  });
}
