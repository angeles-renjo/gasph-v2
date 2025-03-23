import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { useLocation, LocationData } from '@/hooks/useLocation';
import { calculateDistance, getBoundingBox } from '@/lib/geo';
import { Database } from '@/utils/supabase/types';

type GasStation = Database['public']['Tables']['gas_stations']['Row'] & {
  distance?: number;
};

export function useNearbyStations(
  radiusKm: number = 5,
  enabled: boolean = true,
  providedLocation?: LocationData // Accept an optional location parameter
) {
  const { getLocationWithFallback, loading: locationLoading } = useLocation();

  // Use the provided location or get it from the hook
  // Ensure we always have a valid location by using getLocationWithFallback which never returns null
  const location = providedLocation || getLocationWithFallback();

  return useQuery({
    queryKey: ['nearbyStations', location, radiusKm],
    queryFn: async () => {
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
      const stationsWithDistance = (data as GasStation[])
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
  });
}
