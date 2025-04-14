import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { useLocation, LocationData } from '@/hooks/useLocation';
import { calculateDistance, getBoundingBox } from '@/lib/geo';
import { queryKeys } from '../utils/queryKeys';
import { defaultQueryOptions } from '../utils/queryOptions';

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
}

export function useNearbyStations({
  radiusKm = 5,
  enabled = true,
  providedLocation,
}: UseNearbyStationsOptions = {}) {
  const { getLocationWithFallback, loading: locationLoading } = useLocation();
  const location = providedLocation || getLocationWithFallback();

  return useQuery({
    queryKey: queryKeys.stations.nearby({ location, radiusKm }),
    queryFn: async (): Promise<GasStation[]> => {
      if (!location) {
        throw new Error('Location not available');
      }

      // Get bounding box for more efficient querying
      const bbox = getBoundingBox(location, radiusKm);

      // Query stations within the bounding box
      const { data, error } = await supabase
        .from('gas_stations')
        .select('*')
        .eq('status', 'active')
        .gte('latitude', bbox.minLat)
        .lte('latitude', bbox.maxLat)
        .gte('longitude', bbox.minLng)
        .lte('longitude', bbox.maxLng);

      if (error) {
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
    },
    enabled: !!location && enabled,
    ...defaultQueryOptions.stations.nearby,
  });
}
