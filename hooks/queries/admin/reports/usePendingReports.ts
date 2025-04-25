import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import type { StationReportWithUser } from '@/hooks/queries/utils/types'; // Import shared type

export const usePendingReports = () => {
  return useQuery<StationReportWithUser[], Error>({
    queryKey: queryKeys.admin.reports.list('pending'),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('station_reports')
        .select(
          `
          *,
          profile:profiles ( username )
        `
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending reports:', error);
        throw new Error(error.message || 'Failed to fetch reports');
      }
      return data || [];
    },
    // Consider adding default query options if needed
  });
};
