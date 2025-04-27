import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import { useUserProfile } from '@/hooks/queries/users/useUserProfile';
import { useLocationStore } from '@/hooks/stores/useLocationStore';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices'; // Re-use FuelType

// Define the structure for the combined data
export interface FavoriteStationPrice {
  id: string; // Station ID
  name: string | null;
  brand: string | null;
  city: string | null;
  distance: number | null;
  fuel_type: FuelType | null; // User's preferred fuel type
  price: number | null; // Price for the preferred fuel type
  confirmations_count: number | null; // Confirmations for this specific price
  // Add latitude/longitude if needed for features like 'Directions'
  latitude: number | null;
  longitude: number | null;
}

interface UseFavoriteStationPricesResult {
  data: FavoriteStationPrice[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  isRefetching: boolean;
}

export function useFavoriteStationPrices(): UseFavoriteStationPricesResult {
  const { data: userProfile } = useUserProfile();
  const userId = userProfile?.id;
  const location = useLocationStore((state) => state.location);
  const defaultFuelType = usePreferencesStore((state) => state.defaultFuelType);

  // No longer need to fetch favorite IDs separately
  // const { favoriteStationIds, isLoading: isLoadingFavorites } =
  //   useFavoriteStations(userId);

  const queryKey = queryKeys.stations.favorites.prices(
    userId,
    defaultFuelType ?? undefined, // Convert null to undefined
    location?.latitude, // Include location in key for distance changes
    location?.longitude
  );

  const {
    data,
    // isLoading: isLoadingPrices, // Renamed to isLoadingRpc
    isLoading: isLoadingRpc,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<FavoriteStationPrice[], Error>({
    queryKey: queryKey,
    queryFn: async () => {
      // Prerequisites check
      if (!userId || !defaultFuelType || !location) {
        console.log(
          'useFavoriteStationPrices: Missing userId, defaultFuelType, or location. Skipping fetch.'
        );
        return []; // Return empty if prerequisites are missing
      }

      // Call the Supabase RPC function
      const { data, error } = await supabase.rpc(
        'get_favorite_station_prices',
        {
          p_user_id: userId,
          p_fuel_type: defaultFuelType,
          p_user_lat: location.latitude,
          p_user_lon: location.longitude,
        }
      );

      if (error) {
        console.error('Error calling get_favorite_station_prices RPC:', error);
        throw error; // Re-throw the error to be handled by React Query
      }

      // The RPC function returns data in the desired format, already sorted by distance
      // Ensure the returned data matches the FavoriteStationPrice interface
      // Supabase RPC might return slightly different structure, adjust mapping if needed
      // Assuming the RPC returns the exact structure defined in the SQL function:
      return data as FavoriteStationPrice[];
    },
    // Enable the query only when all necessary parameters are available
    enabled: !!userId && !!location && !!defaultFuelType,
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
    refetchOnWindowFocus: true,
  });

  return {
    data,
    // isLoading: isLoadingFavorites || isLoadingPrices, // Old loading state
    isLoading: isLoadingRpc, // Use the loading state from the RPC query
    isError,
    error,
    refetch,
    isRefetching,
  };
}
