import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import { defaultQueryOptions } from '@/hooks/queries/utils/queryOptions';

// Use the view type, potentially extending or picking fields if needed
// type ActivePriceReport = Tables<'active_price_reports'>;

// Define the structure of a contribution based on the view
interface UserContribution {
  id: string;
  fuel_type: string;
  price: number;
  reported_at: string;
  station_id: string;
  station_name: string;
  station_brand: string;
  station_city: string;
  confirmations_count: number;
  confidence_score: number;
  cycle_id: string;
  // user_id is implicitly the current user
  // reporter_username is also implicitly the current user's username
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

      // Query the active_price_reports view instead
      const { data, error } = await supabase
        .from('active_price_reports')
        .select(
          `
          id,
          fuel_type,
          price,
          reported_at,
          station_id,
          station_name,
          station_brand,
          station_city,
          confirmations_count,
          confidence_score,
          cycle_id
        `
        )
        .eq('user_id', userId)
        .order('reported_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user contributions:', error.message);
        throw error;
      }

      // Cast directly to the updated UserContribution interface
      return (data as UserContribution[]) || [];
    },
    ...defaultQueryOptions.users.contributions,
    enabled: !!userId,
  });
}
