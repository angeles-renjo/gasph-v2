import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '../utils/queryKeys';
import { defaultQueryOptions } from '../utils/queryOptions';
import { PriceCardProps } from '@/components/price/PriceCard';
import { Tables } from '@/utils/supabase/types';

type ActivePriceReport = Tables<'active_price_reports'>;

// Function to fetch prices for a specific station and fuel type
const fetchStationFuelTypePrices = async (
  stationId: string | null,
  fuelType: string | null,
  userId: string | undefined
): Promise<PriceCardProps[]> => {
  if (!stationId || !fuelType) {
    return []; // Return empty if required params are missing
  }

  try {
    const { data, error } = await supabase
      .from('active_price_reports')
      .select('*')
      .eq('station_id', stationId)
      .eq('fuel_type', fuelType)
      .order('confirmations_count', { ascending: false }) // Order by confirmations first
      .order('reported_at', { ascending: false }) // Then by most recent
      .limit(50); // Add a reasonable limit to prevent excessive data fetching

    if (error) {
      console.error('Error fetching station fuel type prices:', error);
      return []; // Return empty array instead of throwing to allow UI to render
    }

    // Map to PriceCardProps, similar to useStationDetails
    const enhancedPrices = (data || []).map(
      (price: ActivePriceReport): PriceCardProps => ({
        id: price.id ?? '',
        station_id: price.station_id ?? '',
        fuel_type: price.fuel_type ?? 'Unknown',
        price: price.price ?? 0,
        reported_at: price.reported_at ?? new Date().toISOString(),
        confirmations_count: price.confirmations_count ?? 0,
        cycle_id: price.cycle_id ?? '',
        source: 'community',
        username: price.reporter_username ?? 'Anonymous',
        user_id: price.user_id ?? '',
        isOwnReport: userId ? price.user_id === userId : false, // Check if it's the user's own report
      })
    );

    return enhancedPrices;
  } catch (error) {
    console.error('Error in fetchStationFuelTypePrices:', error);
    return []; // Return empty array to allow UI to render
  }
};

// Custom hook using TanStack Query
export function useStationFuelTypePrices(
  stationId: string | null,
  fuelType: string | null
) {
  const { user } = useAuth();

  return useQuery({
    // Include both stationId and fuelType in the query key
    queryKey: queryKeys.stations.fuelTypePrices(
      stationId ?? '',
      fuelType ?? ''
    ),
    queryFn: () => fetchStationFuelTypePrices(stationId, fuelType, user?.id),
    enabled: !!stationId && !!fuelType, // Only enable if both params are provided
    ...defaultQueryOptions.stations.detail, // Reuse similar options or define specific ones
  });
}
