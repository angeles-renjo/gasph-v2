import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/hooks/queries/utils/queryKeys";
import { defaultQueryOptions } from "@/hooks/queries/utils/queryOptions";

// Define the structure for a gas station
interface GasStationInfo {
  id: string;
  name: string;
  brand: string;
  city: string;
}

// Define the structure of a contribution
interface UserContribution {
  id: string;
  fuel_type: string;
  price: number;
  reported_at: string;
  station: GasStationInfo;
  confirmations_count: number;
  // Add cycle info if needed
  // cycle?: { cycle_number: number; status: string } | null;
}

// Define props for the hook
interface UseUserContributionsProps {
  limit?: number;
}

export function useUserContributions({
  limit = 10,
}: UseUserContributionsProps = {}) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<UserContribution[]>({
    queryKey: queryKeys.users.contributions(userId),
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from("user_price_reports")
        .select(
          `
          id,
          fuel_type,
          price,
          reported_at,
          confirmations_count,
          station:gas_stations!station_id(
            id,
            name,
            brand,
            city
          )
        `
        )
        .eq("user_id", userId)
        .order("reported_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching user contributions:", error.message);
        throw error;
      }

      return (data as unknown as UserContribution[]) || [];
    },
    ...defaultQueryOptions.users.contributions,
    enabled: !!userId,
  });
}
