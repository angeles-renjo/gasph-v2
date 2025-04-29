import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';
import { FuelType, ALL_FUEL_TYPES } from '@/hooks/queries/prices/useBestPrices';
import { Picker } from '@react-native-picker/picker';
import { formatFuelType } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Typography, BorderRadius } from '@/styles/theme';

interface FuelPreferenceModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const FuelPreferenceModal: React.FC<FuelPreferenceModalProps> = ({
  isVisible,
  onClose,
}) => {
  const { defaultFuelType, setDefaultFuelType } = usePreferencesStore();
  // Temporary state to hold selection before saving
  const [tempSelectedFuelType, setTempSelectedFuelType] =
    useState<FuelType | null>(defaultFuelType);

  // Update temporary state when modal becomes visible
  React.useEffect(() => {
    if (isVisible) {
      setTempSelectedFuelType(defaultFuelType);
    }
  }, [isVisible, defaultFuelType]);

  const handleDone = () => {
    setDefaultFuelType(tempSelectedFuelType); // Save the selection to the store
    onClose(); // Close the modal
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType='slide'
      onRequestClose={() => {
        // Don't close the modal on back button press, force user to use Done button
        return true;
      }}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        // Removed onPressOut to prevent closing without saving
      >
        <TouchableOpacity
          style={styles.modalPickerContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Button
              title='Cancel'
              onPress={onClose}
              size='small'
              variant='secondary'
            />
            <Text style={styles.modalTitle}>Select Fuel Type</Text>
            <Button
              title='Done'
              onPress={handleDone}
              size='small'
              variant='outline'
            />
          </View>
          <Picker
            selectedValue={tempSelectedFuelType} // Use temporary state for Picker value
            onValueChange={(itemValue: FuelType | null) => {
              setTempSelectedFuelType(itemValue); // Update temporary state on change
            }}
            style={styles.modalPicker}
            itemStyle={styles.modalPickerItem}
          >
            <Picker.Item label='None (Use best available)' value={null} />
            {ALL_FUEL_TYPES.map((fuelType) => (
              <Picker.Item
                key={fuelType}
                label={formatFuelType(fuelType)}
                value={fuelType}
              />
            ))}
          </Picker>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.modalBackdrop,
    justifyContent: 'flex-end',
  },
  modalPickerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.lg,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGray,
  },
  modalTitle: {
    fontSize: Typography.fontSizeLarge,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.darkGray,
  },
  modalPicker: {},
  modalPickerItem: {},
});

export default FuelPreferenceModal;
