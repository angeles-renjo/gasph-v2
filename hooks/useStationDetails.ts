import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { Database } from '@/utils/supabase/types';
import { useAuth } from '@/hooks/useAuth';

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
  officialPrices: {
    fuel_type: string;
    price: number;
    week_of: string;
  }[];
}

export function useStationDetails(stationId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stationDetails', stationId, user?.id],
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

      // Get community-reported prices from the view that includes reporter username
      const { data: communityPrices, error: communityError } = await supabase
        .from('active_price_reports')
        .select('*')
        .eq('station_id', stationId)
        .order('reported_at', { ascending: false });

      if (communityError) {
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

      // Enhance community prices with confirmation details
      const enhancedPrices = (communityPrices || []).map((price) => {
        // Check if this is the user's own report
        const isOwnReport = user && price.user_id === user.id;

        console.log('Individual Price from view:', {
          id: price.id,
          reporterUsername: price.reporter_username,
          confirmationsCount: price.confirmations_count,
          userConfirmation: userConfirmations[price.id],
          isOwnReport,
        });

        return {
          ...price,
          isOwnReport,
          userHasConfirmed: userConfirmations[price.id] || false,
          confirmationsCount: price.confirmations_count || 0,
        };
      });

      // Combine all data
      return {
        ...station,
        communityPrices: enhancedPrices || [],
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
