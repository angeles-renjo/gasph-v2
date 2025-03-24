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
  officialPrices: {
    fuel_type: string;
    price: number;
    week_of: string;
  }[];
  doePrices: DOEPrice[]; // New field for DOE prices from the view
  latestDOEDate?: string; // Latest date for DOE prices
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

      // Get DOE prices from the doe_price_view
      const { data: doePrices, error: doeError } = await supabase
        .from('doe_price_view')
        .select('fuel_type, min_price, common_price, max_price, week_of')
        .eq('gas_station_id', stationId)
        .order('week_of', { ascending: false });

      if (doeError) {
        console.error('Error fetching DOE prices:', doeError);
        // Don't throw, just log the error and continue with empty doe prices
      }

      // For backward compatibility, we'll maintain the old officialPrices format
      // while also providing the new format
      const officialPrices =
        doePrices?.map((p) => ({
          fuel_type: p.fuel_type,
          price: p.common_price, // Using common price for backward compatibility
          week_of: p.week_of,
        })) || [];

      // Find the latest DOE price date
      const latestDOEDate = doePrices?.length
        ? doePrices.reduce((latest, current) => {
            const latestDate = new Date(latest);
            const currentDate = new Date(current.week_of);
            return currentDate > latestDate ? current.week_of : latest;
          }, doePrices[0].week_of)
        : undefined;

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
      return {
        ...station,
        communityPrices: enhancedPrices || [],
        officialPrices: officialPrices,
        doePrices: doePrices || [],
        latestDOEDate,
      };
    },
    enabled: !!stationId,
  });
}
