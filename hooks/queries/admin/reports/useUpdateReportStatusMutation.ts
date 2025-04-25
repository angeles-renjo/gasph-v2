import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import { Database } from '@/utils/supabase/types';
import type { StationReportWithUser } from '@/hooks/queries/utils/types'; // Import shared type

export const useUpdateReportStatusMutation = () => {
  const queryClient = useQueryClient();
  const pendingReportsQueryKey = queryKeys.admin.reports.list('pending');

  return useMutation<
    void,
    Error,
    {
      reportId: string;
      newStatus: Database['public']['Enums']['report_status'];
      resolverId: string;
    },
    { previousReports?: StationReportWithUser[] }
  >({
    mutationFn: async ({ reportId, newStatus, resolverId }) => {
      const { error } = await supabase
        .from('station_reports')
        .update({
          status: newStatus,
          resolved_at: new Date().toISOString(),
          resolver_id: resolverId,
        })
        .eq('id', reportId);

      if (error) {
        console.error(`Error updating report status to ${newStatus}:`, error);
        throw new Error(error.message || `Failed to ${newStatus} report.`);
      }
    },
    onMutate: async ({ reportId }) => {
      await queryClient.cancelQueries({ queryKey: pendingReportsQueryKey });
      const previousReports = queryClient.getQueryData<StationReportWithUser[]>(
        pendingReportsQueryKey
      );
      if (previousReports) {
        queryClient.setQueryData<StationReportWithUser[]>(
          pendingReportsQueryKey,
          previousReports.filter((report) => report.id !== reportId)
        );
      }
      return { previousReports };
    },
    onError: (err, variables, context) => {
      if (context?.previousReports) {
        queryClient.setQueryData<StationReportWithUser[]>(
          pendingReportsQueryKey,
          context.previousReports
        );
      }
      console.error('Error updating report status:', err);
      // Error Alert should be handled by the calling component
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: pendingReportsQueryKey });
    },
    onSuccess: (data, variables) => {
      if (variables.newStatus === 'approved') {
        console.warn('Report approved (ID:', variables.reportId);
      }
    },
  });
};
