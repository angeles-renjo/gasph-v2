import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme'; // Import theme constants
import { formatDate } from '@/utils/formatters';
import type { PriceCycle } from '@/hooks/queries/prices/usePriceCycles';
import { Alert } from 'react-native';

interface CreateCycleModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (startDate: Date, endDate: Date) => Promise<PriceCycle>;
  loading: boolean;
  nextCycleNumber: number;
}

export function CreateCycleModal({
  visible,
  onClose,
  onSubmit,
  loading,
  nextCycleNumber,
}: CreateCycleModalProps) {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  });

  // State for controlling date picker visibility
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  // State to track submission status and prevent double-clicks
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handler for when the start date is changed via the picker
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);

      // If end date is earlier than start date, adjust it
      if (endDate < selectedDate) {
        const newEndDate = new Date(selectedDate);
        newEndDate.setDate(selectedDate.getDate() + 7);
        setEndDate(newEndDate);
      }
    }
  };

  // Handler for when the end date is changed via the picker
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Handler for submitting the new cycle data
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(startDate, endDate);
      // Reset form state after successful submission
      setStartDate(new Date());
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + 7);
      setEndDate(newEndDate);
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };
  // Determine if the submit button should be disabled
  const isDisabled = endDate < startDate || loading || isSubmitting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Price Cycle</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={isSubmitting}
            >
              <FontAwesome5 name='times' size={20} color={Colors.textGray} />{' '}
              {/* Use theme color */}
            </TouchableOpacity>
          </View>

          <View style={styles.cycleNumberContainer}>
            <Text style={styles.cycleNumberLabel}>Cycle Number:</Text>
            <Text style={styles.cycleNumber}>{nextCycleNumber}</Text>
          </View>

          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerLabel}>Start Date:</Text>
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                isDisabled && styles.datePickerButtonDisabled,
              ]}
              onPress={() => setShowStartDatePicker(true)}
              disabled={isSubmitting}
            >
              <Text style={styles.datePickerText}>{formatDate(startDate)}</Text>
              <FontAwesome5
                name='calendar-alt'
                size={16}
                color={Colors.primary}
              />{' '}
              {/* Use theme color */}
            </TouchableOpacity>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode='date'
              display='default'
              onChange={handleStartDateChange}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerLabel}>End Date:</Text>
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                isDisabled && styles.datePickerButtonDisabled,
              ]}
              onPress={() => setShowEndDatePicker(true)}
              disabled={isSubmitting}
            >
              <Text style={styles.datePickerText}>{formatDate(endDate)}</Text>
              <FontAwesome5
                name='calendar-alt'
                size={16}
                color={Colors.primary}
              />{' '}
              {/* Use theme color */}
            </TouchableOpacity>
          </View>

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode='date'
              display='default'
              onChange={handleEndDateChange}
              minimumDate={startDate}
            />
          )}

          {endDate < startDate && (
            <Text style={styles.errorText}>
              End date must be after start date
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title='Cancel'
              variant='outline'
              onPress={onClose}
              style={styles.button}
              disabled={isSubmitting}
            />
            <Button
              title='Create Cycle'
              onPress={handleSubmit}
              loading={loading || isSubmitting}
              disabled={isDisabled}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.modalBackdrop, // Use theme color
  },
  modalView: {
    width: '85%',
    backgroundColor: Colors.white, // Use theme color
    borderRadius: BorderRadius.xl_xxl, // Use theme border radius
    padding: Spacing.lg_xl, // Use theme spacing
    shadowColor: Colors.black, // Use theme color
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg_xl, // Use theme spacing
  },
  modalTitle: {
    fontSize: Typography.fontSizeXLarge, // Use theme typography
    fontWeight: Typography.fontWeightBold, // Use theme typography
    color: Colors.darkGray, // Use theme color
  },
  closeButton: {
    padding: Spacing.xxs, // Use theme spacing (approx 5)
  },
  cycleNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg_xl, // Use theme spacing
  },
  cycleNumberLabel: {
    fontSize: Typography.fontSizeLarge, // Use theme typography
    color: Colors.darkGray, // Use theme color
    marginRight: Spacing.md, // Use theme spacing
  },
  cycleNumber: {
    fontSize: Typography.fontSizeXLarge, // Use theme typography
    fontWeight: Typography.fontWeightBold, // Use theme typography
    color: Colors.primary, // Use theme color
  },
  datePickerContainer: {
    marginBottom: Spacing.lg_xl, // Use theme spacing
  },
  datePickerLabel: {
    fontSize: Typography.fontSizeLarge, // Use theme typography
    color: Colors.darkGray, // Use theme color
    marginBottom: Spacing.sm, // Use theme spacing
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.mediumGray, // Use theme color
    borderRadius: BorderRadius.md, // Use theme border radius
    padding: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  datePickerButtonDisabled: {
    opacity: 0.5,
  },
  datePickerText: {
    fontSize: Typography.fontSizeLarge, // Use theme typography
    color: Colors.darkGray, // Use theme color
  },
  errorText: {
    color: Colors.danger, // Use theme color
    marginTop: -Spacing.md, // Use negative theme spacing
    marginBottom: Spacing.md, // Use theme spacing
    fontSize: Typography.fontSizeMedium, // Added font size for consistency
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: Spacing.xxs, // Use theme spacing (approx 5)
  },
});
