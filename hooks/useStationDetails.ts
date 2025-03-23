// hooks/useStationDetails.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { Database } from '@/utils/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type GasStation = Database['public']['Tables']['gas_stations']['Row'];
type PriceReport = Database['public']['Views']['active_price_reports']['Row'];

// Enhanced price report type that includes user's vote
interface EnhancedPriceReport extends PriceReport {
  userVote?: 'up' | 'down' | null;
  isOwnReport?: boolean;
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

      // Get community-reported prices
      const { data: communityPrices, error: communityError } = await supabase
        .from('active_price_reports')
        .select('*')
        .eq('station_id', stationId)
        .order('upvotes', { ascending: false });

      if (communityError) {
        throw communityError;
      }

      // Get user's votes if they're logged in
      let userVotes: Record<string, boolean> = {};

      if (user) {
        const { data: votes, error: votesError } = await supabase
          .from('user_price_votes')
          .select('report_id, is_upvote')
          .eq('user_id', user.id)
          .in(
            'report_id',
            (communityPrices || []).map((p) => p.id)
          );

        if (votesError) {
          console.error('Error fetching user votes:', votesError);
        } else if (votes) {
          // Create a map of report ID to vote type
          userVotes = votes.reduce((acc, vote) => {
            acc[vote.report_id] = vote.is_upvote;
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

      // Add user's vote and check for own reports
      const enhancedPrices = (communityPrices || []).map((price) => {
        const userVote =
          userVotes[price.id] !== undefined
            ? userVotes[price.id]
              ? 'up'
              : 'down'
            : null;

        // Check if this is the user's own report
        const isOwnReport = user && price.user_id === user.id;

        return {
          ...price,
          userVote,
          isOwnReport,
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
