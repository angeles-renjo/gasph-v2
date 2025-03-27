import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "../utils/queryKeys";
import { defaultQueryOptions } from "../utils/queryOptions";
import { DOEPrice } from "@/components/price/DOEPriceTable";
import { PriceCardProps } from "@/components/price/PriceCard";

interface GasStation {
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
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface ActivePriceReport {
  id: string;
  station_id: string;
  fuel_type: string;
  price: number;
  user_id: string;
  reported_at: string;
  expires_at: string;
  cycle_id: string;
  station_name: string;
  station_brand: string;
  station_city: string;
  station_latitude: number;
  station_longitude: number;
  reporter_username: string;
  confirmations_count: number;
  confidence_score: number;
}

interface StationWithPrices extends GasStation {
  communityPrices: PriceCardProps[];
  doePrices: DOEPrice[];
  latestDOEDate?: string;
}

export function useStationDetails(stationId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.stations.detail(stationId ?? ""),
    queryFn: async (): Promise<StationWithPrices | null> => {
      if (!stationId) return null;

      // Get station details
      const { data: station, error: stationError } = await supabase
        .from("gas_stations")
        .select("*")
        .eq("id", stationId)
        .single();

      if (stationError) throw stationError;
      if (!station) return null;

      // Get active price reports for this station
      const { data: communityPrices, error: communityError } = await supabase
        .from("active_price_reports")
        .select("*")
        .eq("station_id", stationId)
        .order("reported_at", { ascending: false });

      if (communityError) throw communityError;

      // Map the community prices to match PriceCardProps
      const enhancedPrices = (communityPrices || []).map(
        (price): PriceCardProps => ({
          id: price.id,
          station_id: price.station_id,
          fuel_type: price.fuel_type,
          price: price.price,
          reported_at: price.reported_at,
          confirmations_count: price.confirmations_count,
          cycle_id: price.cycle_id,
          source: "community",
          username: price.reporter_username,
          user_id: price.user_id,
          isOwnReport: user ? price.user_id === user.id : false,
        })
      );

      return {
        ...station,
        communityPrices: enhancedPrices,
        doePrices: [], // Will be implemented with proper DOE price handling
        latestDOEDate: undefined,
      };
    },
    enabled: !!stationId,
    ...defaultQueryOptions.stations.detail,
  });
}
