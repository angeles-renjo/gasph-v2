import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '../utils/queryKeys';
import { defaultQueryOptions } from '../utils/queryOptions';
// DOEPrice interface is now imported from types.ts
import { PriceCardProps } from '@/components/price/PriceCard';
import { Tables } from '@/utils/supabase/types'; // Import generated types

// Use generated types where possible
type GasStation = Tables<'gas_stations'>;
type ActivePriceReport = Tables<'active_price_reports'>;
type DoePriceView = Tables<'doe_price_view'>;

interface StationWithPrices extends GasStation {
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
}

// Removed duplicate ActivePriceReport interface - using the one from Tables<'active_price_reports'>

// Define the structure for the best community price per fuel type
type BestCommunityPrices = Record<string, PriceCardProps | undefined>;

interface StationDetailsData extends GasStation {
  // communityPrices: PriceCardProps[]; // We might not need to return the full list anymore
  bestCommunityPrices: BestCommunityPrices; // Return only the best price per fuel type
  doePrices: DoePriceView[]; // Use the generated type
  latestDOEDate?: string;
}

// Helper function to find the latest date from DOE prices
const getLatestDoeDate = (prices: DoePriceView[]): string | undefined => {
  if (!prices || prices.length === 0) {
    return undefined;
  }
  // Handle potential nulls in week_of
  return prices.reduce((latest: string | undefined, price) => {
    if (!price.week_of) return latest; // Skip if price.week_of is null
    if (!latest || price.week_of > latest) {
      return price.week_of; // Update latest if current price.week_of is later
    }
    return latest; // Keep the current latest
  }, undefined); // Start with undefined
};

// Helper function to find the best price report for a given fuel type
const findBestPrice = (
  prices: PriceCardProps[]
): PriceCardProps | undefined => {
  if (!prices || prices.length === 0) {
    return undefined;
  }

  return prices.reduce((best, current) => {
    if (!best) return current;
    // Higher confirmations win
    if (current.confirmations_count > best.confirmations_count) return current;
    // If confirmations are equal, more recent report wins
    if (
      current.confirmations_count === best.confirmations_count &&
      new Date(current.reported_at) > new Date(best.reported_at)
    ) {
      return current;
    }
    return best;
  }, prices[0]); // Start comparison with the first element
};

export function useStationDetails(stationId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.stations.detail(stationId ?? ''),
    queryFn: async (): Promise<StationDetailsData | null> => {
      // Updated return type
      if (!stationId) return null;

      // Get station details
      const { data: station, error: stationError } = await supabase
        .from('gas_stations')
        .select('*')
        .eq('id', stationId)
        .single();

      if (stationError) throw stationError;
      if (!station) return null;

      // Get active price reports for this station
      const { data: communityPrices, error: communityError } = await supabase
        .from('active_price_reports')
        .select('*')
        .eq('station_id', stationId)
        .order('reported_at', { ascending: false });

      if (communityError) throw communityError;

      // --- Fetch DOE Prices ---
      const { data: doePricesData, error: doeError } = await supabase
        .from('doe_price_view') // Query the view
        .select('*')
        .eq('gas_station_id', stationId); // Corrected: Filter by gas_station_id

      if (doeError) {
        // Log the error but don't throw, maybe DOE data is optional?
        // Depending on requirements, you might want to throw doeError;
        console.error('Error fetching DOE prices:', doeError);
      }

      const doePrices = doePricesData || [];
      const latestDOEDate = getLatestDoeDate(doePrices);
      // --- End Fetch DOE Prices ---

      // Map the community prices to match PriceCardProps, handling potential nulls
      const enhancedPrices = (communityPrices || []).map(
        (price: ActivePriceReport): PriceCardProps => ({
          id: price.id ?? '', // Provide default empty string if null (though id likely isn't null)
          station_id: price.station_id ?? '', // Default
          fuel_type: price.fuel_type ?? 'Unknown', // Default
          price: price.price ?? 0, // Default
          reported_at: price.reported_at ?? new Date().toISOString(), // Default to now if null
          confirmations_count: price.confirmations_count ?? 0, // Default
          cycle_id: price.cycle_id ?? '', // Default
          source: 'community', // Source is always community here
          username: price.reporter_username ?? 'Anonymous', // Default if username is null
          user_id: price.user_id ?? '', // Default
          isOwnReport: user ? price.user_id === user.id : false,
        })
      );

      // --- Process Community Prices to find the best per fuel type ---
      const pricesByFuelType: Record<string, PriceCardProps[]> = {};
      enhancedPrices.forEach((price) => {
        if (!pricesByFuelType[price.fuel_type]) {
          pricesByFuelType[price.fuel_type] = [];
        }
        pricesByFuelType[price.fuel_type].push(price);
      });

      const bestCommunityPrices: BestCommunityPrices = {};
      for (const fuelType in pricesByFuelType) {
        bestCommunityPrices[fuelType] = findBestPrice(
          pricesByFuelType[fuelType]
        );
      }
      // --- End Processing Community Prices ---

      return {
        ...station,
        // communityPrices: enhancedPrices, // Optionally remove if not needed elsewhere
        bestCommunityPrices: bestCommunityPrices, // Return the processed best prices
        doePrices: doePrices, // Use fetched DOE prices
        latestDOEDate: latestDOEDate, // Use calculated latest date
      };
    },
    enabled: !!stationId, // Query only runs if stationId is truthy
    ...defaultQueryOptions.stations.detail,
  });
}
