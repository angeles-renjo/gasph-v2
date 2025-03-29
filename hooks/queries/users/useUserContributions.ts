import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/hooks/queries/utils/queryKeys";
import { defaultQueryOptions } from "@/hooks/queries/utils/queryOptions"; // Adjust path if necessary

// Define the structure for a single gas station within the array
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
  // Correctly define gas_stations as an array of GasStationInfo objects
  // Supabase usually returns joined tables as arrays.
  gas_stations: GasStationInfo[];
  // Add cycle info if needed/available in the view/query
  // cycle?: { cycle_number: number; status: string } | null;
}

// Define props for the hook, allowing customization like limit
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
          gas_stations!inner(id, name, brand, city)
        `
          // cycle:price_reporting_cycles(cycle_number, status)
        )
        .eq("user_id", userId)
        .order("reported_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching user contributions:", error.message);
        throw error;
      }

      // Cast the data to the correct type. If data is null/undefined, default to empty array.
      // TypeScript should now be happier as the inferred type likely matches UserContribution[] better.
      return (data as UserContribution[]) || [];
    },
    ...defaultQueryOptions.users.profile, // Revisit this choice if needed
    enabled: !!userId,
  });
}
