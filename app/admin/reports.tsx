import React, { useState } from 'react'; // Add useState back
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
} from '@tanstack/react-query'; // Import QueryKey
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Database, Tables, TablesInsert, Json } from '@/utils/supabase/types'; // Import base types and TablesInsert, Json
import { formatDistanceToNow } from 'date-fns'; // For relative time
import ConfirmAddStationModal from '@/components/admin/ConfirmAddStationModal'; // Import the confirmation modal
// Import the specific GasStation type used by the map query hook
import type { GasStation } from '@/hooks/queries/stations/useNearbyStations';

// Define the type for a report fetched from the DB, potentially joining user info
type StationReportWithUser = Tables<'station_reports'> & {
  // Use the alias 'profile' defined in the select statement
  profile: { username: string | null } | null;
};

// Define the expected structure within reported_data for 'add' reports
type ReportedAddData = {
  name?: unknown; // Use unknown for initial check
  brand?: unknown;
  address?: unknown;
  city?: unknown;
  province?: unknown;
  amenities?: unknown;
  operating_hours_notes?: unknown;
  comments?: unknown; // Added comments field based on AddStationModal
};

// Type guard to check if the reported_data is a valid object (non-null, non-array)
function isValidReportedAddData(data: Json | null): boolean {
  return data !== null && typeof data === 'object' && !Array.isArray(data);
}

// --- Query Hook ---
const usePendingReports = () => {
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
  });
};
// --- End Query Hook ---

// --- Mutation Hooks (Approve/Reject Report Status) ---
const useUpdateReportStatusMutation = () => {
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
// --- End Update Report Status Mutation ---

// --- Delete Station Mutation ---
const useDeleteStationMutation = () => {
  const queryClient = useQueryClient();
  const adminStationListKey = queryKeys.admin.stations.list();
  const mapStationsBaseKey = ['stations', 'listWithPrice']; // Partial key for invalidation

  // Define the type for the context object used ONLY for admin list rollback
  type DeleteMutationContext = {
    previousAdminStations?: Tables<'gas_stations'>[];
  };

  return useMutation<void, Error, string, DeleteMutationContext>({
    mutationFn: async (stationId) => {
      const { error } = await supabase
        .from('gas_stations')
        .delete()
        .eq('id', stationId);
      if (error) {
        console.error('Error deleting station:', error);
        throw new Error(error.message || 'Failed to delete station.');
      }
    },
    // Optimistic Update ONLY for Admin List
    onMutate: async (stationIdToDelete) => {
      await queryClient.cancelQueries({ queryKey: adminStationListKey });
      const previousAdminStations =
        queryClient.getQueryData<Tables<'gas_stations'>[]>(adminStationListKey);

      if (previousAdminStations) {
        queryClient.setQueryData<Tables<'gas_stations'>[]>(
          adminStationListKey,
          previousAdminStations.filter(
            (station) => station.id !== stationIdToDelete
          )
        );
      }
      // No map cache update here
      return { previousAdminStations };
    },
    onError: (err, stationIdToDelete, context) => {
      // Rollback admin list
      if (context?.previousAdminStations) {
        queryClient.setQueryData<Tables<'gas_stations'>[]>(
          adminStationListKey,
          context.previousAdminStations
        );
      }
      console.error('Error deleting station:', err); // Log the actual error
    },
    onSettled: () => {
      // Invalidate admin list AND map lists to trigger refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.stations.list(),
      });
      queryClient.invalidateQueries({ queryKey: mapStationsBaseKey });
      // Also invalidate the general station list if it exists elsewhere
      queryClient.invalidateQueries({ queryKey: queryKeys.stations.list() });
    },
  });
};
// --- End Delete Station Mutation ---

export default function AdminReportsScreen() {
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] =
    useState<StationReportWithUser | null>(null);

  const {
    data: reports,
    isLoading,
    isError,
    error,
    refetch,
  } = usePendingReports();
  const updateStatusMutation = useUpdateReportStatusMutation();
  const deleteStationMutation = useDeleteStationMutation();
  const { user } = useAuth();

  const handleAction = (
    report: StationReportWithUser,
    action: 'approve' | 'reject'
  ) => {
    if (!user) {
      Alert.alert('Error', 'Admin user not found.');
      return;
    }

    if (action === 'reject') {
      Alert.alert(
        `Confirm Rejection`,
        `Are you sure you want to reject this report?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Reject',
            onPress: () =>
              updateStatusMutation.mutate(
                {
                  reportId: report.id,
                  newStatus: 'rejected',
                  resolverId: user.id,
                },
                {
                  onSuccess: () => Alert.alert('Success', 'Report rejected.'),
                  onError: (err) =>
                    Alert.alert(
                      'Rejection Failed',
                      err.message || 'Could not reject report.'
                    ),
                }
              ),
            style: 'destructive',
          },
        ]
      );
    } else {
      // action === 'approve'
      if (report.report_type === 'add') {
        setSelectedReport(report);
        setIsConfirmModalVisible(true);
      } else if (report.report_type === 'delete') {
        Alert.alert(
          `Confirm Station Deletion`,
          `Approving this report will permanently delete station ID: ${report.station_id}. This cannot be undone. Are you sure?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Confirm Delete Station',
              onPress: async () => {
                if (!report.station_id) return;
                try {
                  // Call delete mutation (optimistic update for admin list happens inside)
                  await deleteStationMutation.mutateAsync(report.station_id);
                  // Update report status (optimistic update for report list happens inside)
                  await updateStatusMutation.mutateAsync({
                    reportId: report.id,
                    newStatus: 'approved',
                    resolverId: user.id,
                  });
                  // Rely on onSettled invalidation to update map/other lists
                  Alert.alert(
                    'Success',
                    'Station deleted and report approved.'
                  );
                } catch (err: any) {
                  // Errors should be handled by individual mutation onError, but catch here as fallback
                  Alert.alert(
                    'Error',
                    err.message || 'Failed to process deletion.'
                  );
                }
              },
              style: 'destructive',
            },
          ]
        );
      } else if (report.report_type === 'update') {
        Alert.alert(
          `Confirm Approval`,
          `Approving this 'update' report marks it as reviewed. Please manually check and apply necessary changes to the station based on the reason/comments.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Confirm Approve Report',
              onPress: () =>
                updateStatusMutation.mutate(
                  {
                    reportId: report.id,
                    newStatus: 'approved',
                    resolverId: user.id,
                  },
                  {
                    onSuccess: () => Alert.alert('Success', 'Report approved.'),
                    onError: (err) =>
                      Alert.alert(
                        'Approval Failed',
                        err.message || 'Could not approve report.'
                      ),
                  }
                ),
              style: 'default',
            },
          ]
        );
      }
    }
  };

  const renderReportItem = ({ item }: { item: StationReportWithUser }) => {
    // Safely access reported_data properties with type checking
    const reportedData = isValidReportedAddData(item.reported_data)
      ? (item.reported_data as ReportedAddData)
      : {}; // Cast after check
    const name =
      typeof reportedData.name === 'string' ? reportedData.name : 'N/A';
    const brand =
      typeof reportedData.brand === 'string' ? reportedData.brand : 'N/A';
    const comments =
      typeof reportedData.comments === 'string' ? reportedData.comments : null;

    return (
      <Card style={styles.reportCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.reportType}>
            {item.report_type.toUpperCase()}
          </Text>
          <Text style={styles.reportDate}>
            {formatDistanceToNow(new Date(item.created_at), {
              addSuffix: true,
            })}
          </Text>
        </View>
        <Text style={styles.userInfo}>
          By: {item.profile?.username ?? 'Unknown User'} (
          {item.user_id?.substring(0, 8)}...)
        </Text>

        {item.report_type === 'add' && (
          <>
            <Text style={styles.detailLabel}>Suggested Name:</Text>
            <Text style={styles.detailValue}>{name}</Text>
            <Text style={styles.detailLabel}>Suggested Brand:</Text>
            <Text style={styles.detailValue}>{brand}</Text>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>
              Lat: {item.latitude?.toFixed(5)}, Lng:{' '}
              {item.longitude?.toFixed(5)}
            </Text>
            {comments && (
              <>
                <Text style={styles.detailLabel}>Comments:</Text>
                <Text style={styles.detailValue}>{comments}</Text>
              </>
            )}
            {/* TODO: Display amenities and op hours notes if needed */}
          </>
        )}

        {(item.report_type === 'update' || item.report_type === 'delete') && (
          <>
            <Text style={styles.detailLabel}>Station ID:</Text>
            <Text style={styles.detailValue}>{item.station_id}</Text>
            <Text style={styles.detailLabel}>Reason:</Text>
            <Text style={styles.detailValue}>
              {item.reason ?? 'No reason provided'}
            </Text>
          </>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title='Reject'
            onPress={() => handleAction(item, 'reject')}
            variant='danger'
            style={styles.actionButton}
            disabled={
              updateStatusMutation.isPending || deleteStationMutation.isPending
            }
          />
          <Button
            title='Approve'
            onPress={() => handleAction(item, 'approve')}
            variant='primary'
            style={styles.actionButton}
            disabled={
              updateStatusMutation.isPending || deleteStationMutation.isPending
            }
          />
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return <LoadingIndicator fullScreen message='Loading pending reports...' />;
  }

  if (isError) {
    return (
      <ErrorDisplay
        fullScreen
        message={error?.message || 'Failed to load reports.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No pending reports found.</Text>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Confirmation Modal for Adding Stations */}
      <ConfirmAddStationModal
        isVisible={isConfirmModalVisible}
        onClose={() => {
          setIsConfirmModalVisible(false);
          setSelectedReport(null); // Clear selected report on close
        }}
        report={selectedReport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Light grey background
  },
  listContent: {
    padding: 16,
  },
  reportCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  reportType: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333', // Darker text
  },
  reportDate: {
    fontSize: 12,
    color: '#666',
  },
  userInfo: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 2,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align buttons to the right
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    marginLeft: 10, // Space between buttons
    minWidth: 80, // Ensure buttons have some minimum width
    paddingVertical: 6, // Smaller padding
    paddingHorizontal: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
});
