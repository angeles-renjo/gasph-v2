import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { Database } from '@/utils/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { DOEPrice } from '@/components/price/DOEPriceTable';

type GasStation = Database['public']['Tables']['gas_stations']['Row'];
type PriceReport = Database['public']['Views']['active_price_reports']['Row'];

// Enhanced price report type that includes confirmation details
interface EnhancedPriceReport extends PriceReport {
  isOwnReport?: boolean;
  userHasConfirmed?: boolean;
  confirmationsCount?: number;
}

// Combined type for station with its prices
export interface StationWithPrices extends GasStation {
  communityPrices: EnhancedPriceReport[];
  doePrices: DOEPrice[]; // DOE prices from the view
  latestDOEDate?: string; // Latest date for DOE prices
}

export function useStationDetails(stationId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stationDetails', stationId, user?.id],
    queryFn: async (): Promise<StationWithPrices | null> => {
      if (!stationId) return null;

      // First, get the station details
      console.log(`Fetching station details for ID: ${stationId}`);
      const { data: station, error: stationError } = await supabase
        .from('gas_stations')
        .select('*')
        .eq('id', stationId)
        .single();

      if (stationError) {
        console.error('Error fetching station details:', stationError);
        throw stationError;
      }

      if (!station) {
        console.log('No station found with ID:', stationId);
        return null;
      }

      console.log('Station fetched:', {
        id: station.id,
        name: station.name,
        brand: station.brand,
        city: station.city,
      });

      // Get community-reported prices from the view that includes reporter username
      const { data: communityPrices, error: communityError } = await supabase
        .from('active_price_reports')
        .select('*')
        .eq('station_id', stationId)
        .order('reported_at', { ascending: false });

      if (communityError) {
        console.error('Error fetching community prices:', communityError);
        throw communityError;
      }

      // Check user's confirmations if logged in
      let userConfirmations: Record<string, boolean> = {};

      if (user) {
        const { data: confirmations, error: confirmError } = await supabase
          .from('price_confirmations')
          .select('report_id')
          .eq('user_id', user.id)
          .in(
            'report_id',
            (communityPrices || []).map((p) => p.id)
          );

        if (confirmError) {
          console.error('Error fetching user confirmations:', confirmError);
        } else if (confirmations) {
          // Create a map of report ID to confirmation status
          userConfirmations = confirmations.reduce((acc, confirmation) => {
            acc[confirmation.report_id] = true;
            return acc;
          }, {} as Record<string, boolean>);
        }
      }

      // Get DOE prices from the doe_price_view
      console.log(`Fetching DOE prices for station ID: ${stationId}`);
      const { data: doePrices, error: doeError } = await supabase
        .from('doe_price_view')
        .select('fuel_type, min_price, common_price, max_price, week_of')
        .eq('gas_station_id', stationId)
        .order('week_of', { ascending: false });

      if (doeError) {
        console.error('Error fetching DOE prices:', doeError);
        // Don't throw, just log the error and continue with empty doe prices
      }

      console.log('DOE Prices retrieved:', doePrices);

      // Find the latest DOE price date
      const latestDOEDate = doePrices?.length
        ? doePrices.reduce((latest, current) => {
            const latestDate = new Date(latest);
            const currentDate = new Date(current.week_of);
            return currentDate > latestDate ? current.week_of : latest;
          }, doePrices[0].week_of)
        : undefined;

      console.log('Latest DOE date calculated:', latestDOEDate);

      // Enhance community prices with confirmation details
      const enhancedPrices = (communityPrices || []).map((price) => {
        // Check if this is the user's own report
        const isOwnReport = user && price.user_id === user.id;

        return {
          ...price,
          isOwnReport,
          userHasConfirmed: userConfirmations[price.id] || false,
          confirmationsCount: price.confirmations_count || 0,
        };
      });

      // Combine all data
      const result = {
        ...station,
        communityPrices: enhancedPrices || [],
        doePrices: doePrices || [],
        latestDOEDate,
      };

      console.log('Combined station data being returned:', {
        stationId: result.id,
        communityPricesCount: result.communityPrices.length,
        doePricesCount: result.doePrices.length,
        hasLatestDOEDate: !!result.latestDOEDate,
      });

      return result;
    },
    enabled: !!stationId,
  });
}
