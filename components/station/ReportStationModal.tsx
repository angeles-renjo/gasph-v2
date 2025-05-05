import { useState } from 'react';
import {
  Modal,
  Alert,
  View,
  Text,
  TouchableOpacity,
  Modal as RNModal,
  Pressable,
  FlatList,
  Platform,
} from 'react-native';
import { Input } from '@/components/ui/Input'; // Assuming Input component exists
import { Button } from '@/components/ui/Button'; // Assuming Button component exists
import { useAuth } from '@/hooks/useAuth'; // To get user ID
import { TablesInsert, Database } from '@/utils/supabase/types'; // Import types
import { supabase } from '@/utils/supabase/supabase'; // Import supabase client
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import { styles } from './ReportingStationModal.styles';

type ReportReason = 'Incorrect Info' | 'Permanently Closed' | "Doesn't Exist";

type ReportStationModalProps = {
  isVisible: boolean;
  onClose: () => void;
  stationId: string;
  stationName: string;
};

type StationReportInsert = TablesInsert<'station_reports'>;

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
        status: 'pending',
      };

      const { error } = await supabase
        .from('station_reports')
        .insert(dataToInsert);

      if (error) {
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.reports.list('pending'),
      });
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

const ReportStationModal: React.FC<ReportStationModalProps> = ({
  isVisible,
  onClose,
  stationId,
  stationName,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(
    null
  );
  const [isReasonPickerVisible, setIsReasonPickerVisible] = useState(false);
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
      case "Doesn't Exist":
      case 'Permanently Closed':
        reportType = 'delete';
        break;
      case 'Incorrect Info':
        reportType = 'update';
        reportedData = {
          comment: `User reported incorrect info: ${comment || '(no comment)'}`,
        };
        break;
      default:
        return;
    }

    const reportData: Omit<
      StationReportInsert,
      'user_id' | 'id' | 'created_at' | 'resolved_at' | 'resolver_id' | 'status'
    > = {
      station_id: stationId,
      report_type: reportType,
      reason: `${selectedReason}${comment ? `: ${comment}` : ''}`,
      reported_data: reportedData,
      latitude: null,
      longitude: null,
    };

    submitReportMutation.mutate(reportData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  const handleClose = () => {
    setSelectedReason(null);
    setComment('');
    submitReportMutation.reset();
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

          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={() => setIsReasonPickerVisible(true)}
          >
            <Text
              style={!selectedReason ? styles.pickerPlaceholder : undefined}
            >
              {selectedReason || 'Select a reason...'}
            </Text>
          </TouchableOpacity>

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
              variant='outline'
              style={styles.button}
              disabled={submitReportMutation.isPending}
            />
            <Button
              title='Submit Report'
              onPress={handleSubmit}
              style={styles.button}
              loading={submitReportMutation.isPending}
              disabled={!selectedReason || submitReportMutation.isPending}
            />
          </View>
        </View>
      </View>

      {/* Reason Picker Modal */}
      <RNModal
        visible={isReasonPickerVisible}
        transparent
        animationType='slide'
        onRequestClose={() => setIsReasonPickerVisible(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheet}>
            <Text style={styles.modalTitle}>Choose a reason</Text>
            <FlatList
              data={['Incorrect Info', 'Permanently Closed', "Doesn't Exist"]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedReason(item as ReportReason);
                    setIsReasonPickerVisible(false);
                  }}
                  style={styles.optionButton}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </RNModal>
    </Modal>
  );
};

export default ReportStationModal;
