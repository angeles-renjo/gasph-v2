import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { Database } from '@/utils/supabase/types';

type GasStation = Database['public']['Tables']['gas_stations']['Row'];
type PriceReport = Database['public']['Views']['active_price_reports']['Row'];

// Combined type for station with its prices
export interface StationWithPrices extends GasStation {
  communityPrices: PriceReport[];
  officialPrices: {
    fuel_type: string;
    price: number;
    week_of: string;
  }[];
}

export function useStationDetails(stationId: string | null) {
  return useQuery({
    queryKey: ['stationDetails', stationId],
    queryFn: async (): Promise<StationWithPrices | null> => {
      if (!stationId) return null;

      // First, get the station details
      const { data: station, error: stationError } = await supabase
        .from('gas_stations')
        .select('*')
        .eq('id', stationId)
        .single();

      if (stationError) {
        throw stationError;
      }

      if (!station) {
        return null;
      }

      // Get community-reported prices
      const { data: communityPrices, error: communityError } = await supabase
        .from('active_price_reports')
        .select('*')
        .eq('station_id', stationId)
        .order('upvotes', { ascending: false });

      if (communityError) {
        throw communityError;
      }

      // Get official DOE prices for this brand and area
      const { data: officialPrices, error: officialError } = await supabase
        .from('fuel_prices')
        .select('fuel_type, common_price, week_of')
        .eq('brand', station.brand)
        .eq('area', station.city)
        .order('week_of', { ascending: false })
        .limit(10);

      if (officialError) {
        throw officialError;
      }

      // Combine all data
      return {
        ...station,
        communityPrices: communityPrices || [],
        officialPrices:
          officialPrices?.map((p) => ({
            fuel_type: p.fuel_type,
            price: p.common_price,
            week_of: p.week_of,
          })) || [],
      };
    },
    enabled: !!stationId,
  });
}
