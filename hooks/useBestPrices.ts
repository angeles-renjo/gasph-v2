import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { useLocation, LocationData } from '@/hooks/useLocation';
import { calculateDistance } from '@/lib/geo';
import { Database } from '@/utils/supabase/types';

type BestPrice = Database['public']['Views']['best_prices']['Row'] & {
  distance?: number;
};

export type FuelType = 'Diesel' | 'RON 91' | 'RON 95' | 'RON 97' | 'RON 100';

interface UseBestPricesParams {
  fuelType?: FuelType;
  maxDistance?: number;
  enabled?: boolean;
  providedLocation?: LocationData; // Accept an optional location parameter
}

export function useBestPrices({
  fuelType,
  maxDistance = 15, // Default to 15 kilometers
  enabled = true,
  providedLocation,
}: UseBestPricesParams = {}) {
  const { getLocationWithFallback, loading: locationLoading } = useLocation();

  // Use the provided location or get it from the hook
  // Ensure we always have a valid location by using getLocationWithFallback which never returns null
  const location = providedLocation || getLocationWithFallback();

  return useQuery({
    queryKey: ['bestPrices', location, fuelType, maxDistance],
    queryFn: async () => {
      if (!location) {
        throw new Error('Location not available');
      }

      // Query from the best_prices view
      let query = supabase.from('best_prices').select('*');

      // Apply fuel type filter if specified
      if (fuelType) {
        query = query.eq('fuel_type', fuelType);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Calculate distances from user location
      const pricesWithDistance = (data as BestPrice[])
        .map((price) => ({
          ...price,
          distance: calculateDistance(location, {
            latitude: price.station_latitude,
            longitude: price.station_longitude,
          }),
        }))
        .filter((price) => (price.distance as number) <= maxDistance)
        .sort((a, b) => {
          // Sort first by price, then by distance
          if (a.price !== b.price) {
            return a.price - b.price;
          }
          return (a.distance as number) - (b.distance as number);
        });

      return pricesWithDistance;
    },
    enabled: !!location && !locationLoading && enabled,
  });
}
