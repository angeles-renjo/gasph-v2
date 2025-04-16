import React, { useState } from 'react';
import { Modal, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { View, Text } from '@/components/Themed';
import { Input } from '@/components/ui/Input'; // Assuming Input component exists
import { Button } from '@/components/ui/Button'; // Assuming Button component exists
import { Picker } from '@react-native-picker/picker'; // Using picker for reason selection
import { useAuth } from '@/hooks/useAuth'; // To get user ID
import { TablesInsert, Database } from '@/utils/supabase/types'; // Import types
import { supabase } from '@/utils/supabase/supabase'; // Import supabase client
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';

// Use single quotes to avoid issues with the apostrophe
type ReportReason = 'Incorrect Info' | 'Permanently Closed' | "Doesn't Exist";

type ReportStationModalProps = {
  isVisible: boolean;
  onClose: () => void;
  stationId: string;
  stationName: string;
};

// Type for the report submission data
type StationReportInsert = TablesInsert<'station_reports'>;

// --- Mutation Hook ---
const useSubmitReportMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      reportData: Omit<
        StationReportInsert,
        'user_id' | 'id' | 'created_at' | 'resolved_at' | 'resolver_id'
      >
    ) => {
      if (!user) throw new Error('User not authenticated');

      const dataToInsert: StationReportInsert = {
        ...reportData,
        user_id: user.id,
        status: 'pending', // Explicitly set status
      };

      const { error } = await supabase
        .from('station_reports')
        .insert(dataToInsert);

      if (error) {
        console.error('Error submitting report:', error);
        // Check for the specific duplicate error from the trigger
        if (
          error.message.includes(
            'User already has a pending report for this station'
          )
        ) {
          throw new Error(
            'You already have a pending report for this station.'
          );
        }
        throw new Error(error.message || 'Failed to submit report.');
      }
    },
    onSuccess: () => {
      // Invalidate the admin pending reports list so it refreshes
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.reports.list('pending'),
      });
      // Optionally invalidate queries if needed, e.g., a user's reports list
      // queryClient.invalidateQueries({ queryKey: queryKeys.userReports() }); // Example
      Alert.alert('Report Submitted', 'Thank you for your feedback!');
    },
    onError: (error: Error) => {
      Alert.alert(
        'Submission Failed',
        error.message || 'Could not submit report. Please try again.'
      );
    },
  });
};
// --- End Mutation Hook ---

const ReportStationModal: React.FC<ReportStationModalProps> = ({
  isVisible,
  onClose,
  stationId,
  stationName,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(
    null
  );
  const [comment, setComment] = useState('');
  const { user } = useAuth();
  const submitReportMutation = useSubmitReportMutation();

  const handleSubmit = () => {
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'Please log in to submit a report.'
      );
      return;
    }
    if (!selectedReason) {
      Alert.alert('Reason Required', 'Please select a reason for your report.');
      return;
    }

    let reportType: Database['public']['Enums']['report_type'];
    let reportedData: StationReportInsert['reported_data'] = null;

    switch (selectedReason) {
      case "Doesn't Exist": // Match the updated type definition
      case 'Permanently Closed':
        reportType = 'delete';
        break;
      case 'Incorrect Info':
        reportType = 'update';
        // Optionally capture specific incorrect info in reported_data if UI allows
        reportedData = {
          comment: `User reported incorrect info: ${comment || '(no comment)'}`,
        };
        break;
      default:
        // Should not happen if validation works
        console.error('Invalid reason selected');
        return;
    }

    const reportData: Omit<
      StationReportInsert,
      'user_id' | 'id' | 'created_at' | 'resolved_at' | 'resolver_id' | 'status'
    > = {
      station_id: stationId,
      report_type: reportType,
      reason: `${selectedReason}${comment ? `: ${comment}` : ''}`, // Combine reason and comment
      reported_data: reportedData, // Include structured data if applicable
      latitude: null, // Not applicable for update/delete reports
      longitude: null, // Not applicable for update/delete reports
    };

    submitReportMutation.mutate(reportData, {
      onSuccess: () => {
        handleClose(); // Close modal on success
      },
    });
  };

  const handleClose = () => {
    setSelectedReason(null);
    setComment('');
    submitReportMutation.reset(); // Reset mutation state
    onClose();
  };

  return (
    <Modal
      animationType='slide'
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Report Problem</Text>
          <Text style={styles.stationName}>{stationName}</Text>

          <Text style={styles.label}>Reason:</Text>
          {/* Basic Picker for Reason Selection */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedReason}
              onValueChange={(itemValue) =>
                setSelectedReason(itemValue as ReportReason)
              }
              style={styles.picker}
              prompt='Select a reason' // iOS only
            >
              <Picker.Item
                label='Select a reason...'
                value={null}
                enabled={false}
                style={styles.pickerPlaceholder}
              />
              <Picker.Item label='Incorrect Info' value='Incorrect Info' />
              <Picker.Item
                label='Permanently Closed'
                value='Permanently Closed'
              />
              <Picker.Item
                label="Doesn't Exist Anymore"
                value="Doesn't Exist"
              />
              {/* Add more Picker.Item for other reasons */}
            </Picker>
          </View>

          <Text style={styles.label}>Optional Comment:</Text>
          <Input
            placeholder='Add details (e.g., wrong address, closed hours)'
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            style={styles.commentInput}
          />

          <View style={styles.buttonContainer}>
            <Button
              title='Cancel'
              onPress={handleClose}
              variant='outline' // Assuming an outline variant exists
              style={styles.button}
              disabled={submitReportMutation.isPending}
            />
            <Button
              title='Submit Report'
              onPress={handleSubmit}
              style={styles.button}
              loading={submitReportMutation.isPending} // Changed isLoading to loading
              disabled={!selectedReason || submitReportMutation.isPending}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white', // Or use theme color
    borderRadius: 15,
    padding: 25,
    alignItems: 'stretch', // Stretch items horizontally
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%', // Adjust width as needed
  },
  modalTitle: {
    marginBottom: 5,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stationName: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
    color: 'grey', // Or use theme color
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    marginTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc', // Or use theme color
    borderRadius: 5,
    marginBottom: 15,
    // Height might be needed for Android picker display
    ...(Platform.OS === 'android' && { height: 50, justifyContent: 'center' }),
  },
  picker: {
    // iOS requires explicit height sometimes, Android uses container
    ...(Platform.OS === 'ios' && { height: 150 }),
  },
  pickerPlaceholder: {
    color: '#999', // Style for the placeholder item
  },
  commentInput: {
    minHeight: 80,
    textAlignVertical: 'top', // Align text to top for multiline
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out buttons
    marginTop: 15,
  },
  button: {
    flex: 1, // Make buttons share space
    marginHorizontal: 5, // Add some space between buttons
  },
});

export default ReportStationModal;
