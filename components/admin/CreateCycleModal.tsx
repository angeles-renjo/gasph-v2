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
// Removed formatDate import as it's no longer needed
import type { PriceCycle } from '@/hooks/queries/prices/usePriceCycles';

interface CreateCycleModalProps {
  visible: boolean;
  onClose: () => void;
  // Removed startDate and endDate from onSubmit signature
  onSubmit: () => Promise<PriceCycle>;
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
  // Removed date state variables
  // Removed date picker visibility state

  // State to track submission status and prevent double-clicks
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Removed date change handlers

  // Handler for submitting the new cycle data
  const handleSubmit = async () => {
    console.log('[CreateCycleModal] handleSubmit entered.'); // Log entry
    try {
      setIsSubmitting(true);
      // Call onSubmit without arguments
      await onSubmit();
      // No date state to reset
    } finally {
      setIsSubmitting(false);
    }
  };
  // Determine if the submit button should be disabled
  // Removed endDate < startDate check
  const isDisabled = loading || isSubmitting;

  // Removed state log as date checks are gone

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
              <FontAwesome5 name='times' size={20} color={Colors.textGray} />
            </TouchableOpacity>
          </View>

          <View style={styles.cycleNumberContainer}>
            <Text style={styles.cycleNumberLabel}>Cycle Number:</Text>
            <Text style={styles.cycleNumber}>{nextCycleNumber}</Text>
          </View>

          {/* Removed Date Picker UI Elements */}

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
