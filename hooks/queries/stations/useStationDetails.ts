import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "../utils/queryKeys";
import { defaultQueryOptions } from "../utils/queryOptions";

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

interface EnhancedPriceReport extends ActivePriceReport {
  isOwnReport: boolean;
  userHasConfirmed: boolean;
}

interface StationWithPrices extends GasStation {
  communityPrices: EnhancedPriceReport[];
  doePrices: Array<{
    fuel_type: string;
    price: number;
    week_of: string;
  }>;
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

      // Get user confirmations if logged in
      let userConfirmations: Record<string, boolean> = {};
      if (user) {
        const { data: confirmations } = await supabase
          .from("price_confirmations")
          .select("report_id")
          .eq("user_id", user.id)
          .in(
            "report_id",
            (communityPrices || []).map((p) => p.id)
          );

        userConfirmations = (confirmations || []).reduce(
          (acc, { report_id }) => ({ ...acc, [report_id]: true }),
          {}
        );
      }

      // Enhance price reports with user-specific data
      const enhancedPrices = (communityPrices || []).map((price) => ({
        ...price,
        isOwnReport: user && price.user_id === user.id,
        userHasConfirmed: userConfirmations[price.id] || false,
      }));

      return {
        ...station,
        communityPrices: enhancedPrices,
        doePrices: [], // We'll implement DOE prices in a separate PR
        latestDOEDate: undefined,
      };
    },
    enabled: !!stationId,
    ...defaultQueryOptions.stations.detail,
  });
}
