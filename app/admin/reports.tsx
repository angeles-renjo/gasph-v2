import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  useColorScheme, // Import useColorScheme for styles
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TablesInsert } from '@/utils/supabase/types'; // Keep only one import for TablesInsert
import { formatDistanceToNow } from 'date-fns';
import ConfirmAddStationModal from '@/components/admin/ConfirmAddStationModal';
import ConfirmUpdateStationModal from '@/components/admin/ConfirmUpdateStationModal'; // Import the new update modal

// Import moved hooks
import { usePendingReports } from '@/hooks/queries/admin/reports/usePendingReports';
import { useUpdateReportStatusMutation } from '@/hooks/queries/admin/reports/useUpdateReportStatusMutation';
import { useDeleteStationMutation } from '@/hooks/queries/admin/reports/useDeleteStationMutation';
import { useCreateStationMutation } from '@/hooks/queries/admin/reports/useCreateStationMutation';

// Import moved types
import {
  StationReportWithUser,
  isValidReportedAddData,
} from '@/hooks/queries/utils/types';

// Import moved styles
import { styles } from '@/styles/screens/admin/AdminReportsScreen.styles';
import { Colors } from '@/styles/theme'; // Import Colors for dynamic styling

// --- Hooks and Types previously defined here are now imported ---

export default function AdminReportsScreen() {
  const [isAddConfirmModalVisible, setIsAddConfirmModalVisible] =
    useState(false); // Renamed for clarity
  const [isUpdateConfirmModalVisible, setIsUpdateConfirmModalVisible] =
    useState(false); // State for update modal
  const [selectedReportForAdd, setSelectedReportForAdd] =
    useState<StationReportWithUser | null>(null); // Renamed for clarity
  const [selectedReportForUpdate, setSelectedReportForUpdate] =
    useState<StationReportWithUser | null>(null); // State for update report
  const colorScheme = useColorScheme(); // Get color scheme for styles

  const {
    data: reports,
    isLoading,
    isError,
    error,
    refetch,
  } = usePendingReports(); // Use imported hook

  // Define mutations at the screen level using imported hooks
  const updateStatusMutation = useUpdateReportStatusMutation();
  const deleteStationMutation = useDeleteStationMutation();
  const createStationMutation = useCreateStationMutation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false); // State for modal loading

  // Define the function to handle the confirmation attempt
  const handleConfirmAttempt = async (
    stationData: TablesInsert<'gas_stations'>,
    reportId: string,
    resolverId: string
  ): Promise<boolean> => {
    setIsConfirming(true);
    try {
      // 1. Create the station (optimistic update happens in its onMutate)
      await createStationMutation.mutateAsync(stationData);
      console.log('Station created successfully (handleConfirmAttempt)');

      // 2. Update the report status to 'approved' (optimistic update happens in its onMutate)
      await updateStatusMutation.mutateAsync({
        reportId: reportId,
        newStatus: 'approved',
        resolverId: resolverId,
      });
      console.log('Report status updated successfully (handleConfirmAttempt)');

      // 3. Invalidation is now handled by the useCreateStationMutation's onSettled callback
      // console.log('Invalidating queries after successful creation...'); // Removed console log
      // const adminStationListKey = queryKeys.admin.stations.list();
      // const mapStationsBaseKey = [
      //   ...queryKeys.stations.all,
      //   'listWithPrice',
      // ] as const;
      // // Use setTimeout to delay invalidation slightly, allowing UI to settle
      // setTimeout(() => {
      //   queryClient.invalidateQueries({ queryKey: adminStationListKey });
      //   queryClient.invalidateQueries({ queryKey: mapStationsBaseKey });
      //   console.log('Admin and Map queries invalidated.');
      // }, 150);

      Alert.alert('Success', 'Station created and report approved.');
      setIsConfirming(false);
      return true; // Indicate success
    } catch (error: any) {
      // console.error('Error during confirm/create process:', error); // Removed console log
      Alert.alert(
        'Operation Failed',
        error.message || 'Could not create station or update report.'
      );
      setIsConfirming(false);
      return false; // Indicate failure
    }
  };

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
        setSelectedReportForAdd(report); // Use renamed state setter
        setIsAddConfirmModalVisible(true); // Use renamed state setter
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
                  await deleteStationMutation.mutateAsync(report.station_id);
                  await updateStatusMutation.mutateAsync({
                    reportId: report.id,
                    newStatus: 'approved',
                    resolverId: user.id,
                  });
                  Alert.alert(
                    'Success',
                    'Station deleted and report approved.'
                  );
                } catch (err: any) {
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
        // Open the update confirmation modal instead of just approving the report
        setSelectedReportForUpdate(report);
        setIsUpdateConfirmModalVisible(true);
        // The modal will handle the station update and report status update
      }
    }
  };

  const renderReportItem = ({ item }: { item: StationReportWithUser }) => {
    // Revert to simpler ternary access, relying on the type guard
    const reportedData = isValidReportedAddData(item.reported_data)
      ? item.reported_data
      : {}; // Keep default empty object for safety

    const name =
      typeof reportedData.name === 'string' ? reportedData.name : 'N/A';
    const brand =
      typeof reportedData.brand === 'string' ? reportedData.brand : 'N/A';
    const comments =
      typeof reportedData.comments === 'string' ? reportedData.comments : null;

    // Define dynamic colors based on the current color scheme
    const themeColors = Colors[colorScheme ?? 'light'];
    const currentTextColor = themeColors.text;
    // Using textGray for secondary text elements as it's defined in common colors
    const secondaryTextColor = Colors.textGray;
    const cardBackgroundColor = themeColors.background;
    const borderColor = Colors.dividerGray; // Common color

    return (
      <Card
        style={{ ...styles.reportCard, backgroundColor: cardBackgroundColor }}
      >
        {/* Apply dynamic border color to header */}
        <View style={[styles.cardHeader, { borderBottomColor: borderColor }]}>
          {/* Apply dynamic text color */}
          <Text style={[styles.reportType, { color: currentTextColor }]}>
            {item.report_type.toUpperCase()}
          </Text>
          {/* Apply dynamic secondary text color */}
          <Text style={[styles.reportDate, { color: secondaryTextColor }]}>
            {formatDistanceToNow(new Date(item.created_at), {
              addSuffix: true,
            })}
          </Text>
        </View>
        {/* Apply dynamic secondary text color */}
        <Text style={[styles.userInfo, { color: secondaryTextColor }]}>
          By: {item.profile?.username ?? 'Unknown User'} (
          {item.user_id?.substring(0, 8)}...)
        </Text>

        {item.report_type === 'add' && (
          <>
            {/* Apply dynamic text color */}
            <Text style={[styles.detailLabel, { color: currentTextColor }]}>
              Suggested Name:
            </Text>
            <Text style={[styles.detailValue, { color: currentTextColor }]}>
              {name}
            </Text>
            <Text style={[styles.detailLabel, { color: currentTextColor }]}>
              Suggested Brand:
            </Text>
            <Text style={[styles.detailValue, { color: currentTextColor }]}>
              {brand}
            </Text>
            <Text style={[styles.detailLabel, { color: currentTextColor }]}>
              Location:
            </Text>
            <Text style={[styles.detailValue, { color: currentTextColor }]}>
              Lat: {item.latitude?.toFixed(5)}, Lng:{' '}
              {item.longitude?.toFixed(5)}
            </Text>
            {comments && (
              <>
                <Text style={[styles.detailLabel, { color: currentTextColor }]}>
                  Comments:
                </Text>
                <Text style={[styles.detailValue, { color: currentTextColor }]}>
                  {comments}
                </Text>
              </>
            )}
          </>
        )}

        {(item.report_type === 'update' || item.report_type === 'delete') && (
          <>
            {/* Apply dynamic text color */}
            <Text style={[styles.detailLabel, { color: currentTextColor }]}>
              Station ID:
            </Text>
            <Text style={[styles.detailValue, { color: currentTextColor }]}>
              {item.station_id}
            </Text>
            <Text style={[styles.detailLabel, { color: currentTextColor }]}>
              Reason:
            </Text>
            <Text style={[styles.detailValue, { color: currentTextColor }]}>
              {item.reason ?? 'No reason provided'}
            </Text>
          </>
        )}

        {/* Apply dynamic border color to button container */}
        <View style={[styles.buttonContainer, { borderTopColor: borderColor }]}>
          <Button
            title='Reject'
            onPress={() => handleAction(item, 'reject')}
            variant='danger'
            style={styles.actionButton}
            disabled={
              updateStatusMutation.isPending ||
              deleteStationMutation.isPending ||
              createStationMutation.isPending
            }
          />
          <Button
            title='Approve'
            onPress={() => handleAction(item, 'approve')}
            variant='primary' // Changed from 'success'
            style={styles.actionButton}
            disabled={
              updateStatusMutation.isPending ||
              deleteStationMutation.isPending ||
              createStationMutation.isPending
            }
          />
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return <LoadingIndicator message='Loading reports...' />;
  }

  if (isError) {
    return <ErrorDisplay message={error?.message} onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          // Apply dynamic text color
          <Text
            style={[
              styles.emptyText,
              { color: Colors[colorScheme ?? 'light'].text },
            ]}
          >
            No pending reports.
          </Text>
        }
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={
          reports?.length === 0 ? styles.emptyListContainer : null
        }
      />
      {/* Add Station Modal */}
      <ConfirmAddStationModal
        isVisible={isAddConfirmModalVisible} // Use renamed state
        onClose={() => {
          setIsAddConfirmModalVisible(false); // Use renamed state setter
          setSelectedReportForAdd(null); // Use renamed state setter
        }}
        report={selectedReportForAdd} // Use renamed state
        onConfirmAttempt={handleConfirmAttempt}
        isConfirming={isConfirming} // Still uses the create mutation loading state
      />
      {/* Update Station Modal */}
      <ConfirmUpdateStationModal
        isVisible={isUpdateConfirmModalVisible}
        onClose={() => {
          setIsUpdateConfirmModalVisible(false);
          setSelectedReportForUpdate(null);
        }}
        report={selectedReportForUpdate}
        // The update modal handles its own mutations internally
      />
    </View>
  );
}

// Styles moved to styles/screens/admin/AdminReportsScreen.styles.ts
