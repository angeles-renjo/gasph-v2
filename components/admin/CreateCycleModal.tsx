import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatDate } from "@/utils/formatters";
import type { PriceCycle } from "@/hooks/queries/prices/usePriceCycles";

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

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === "ios");
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

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const newCycle = await onSubmit(startDate, endDate);
      // Reset form state after successful submission
      setStartDate(new Date());
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + 7);
      setEndDate(newEndDate);
      return newCycle;
    } catch (error) {
      // Error handling is done in the parent component
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = endDate < startDate || loading || isSubmitting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
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
              <FontAwesome5 name="times" size={20} color="#666" />
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
              <FontAwesome5 name="calendar-alt" size={16} color="#2a9d8f" />
            </TouchableOpacity>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
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
              <FontAwesome5 name="calendar-alt" size={16} color="#2a9d8f" />
            </TouchableOpacity>
          </View>

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
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
              title="Cancel"
              variant="outline"
              onPress={onClose}
              style={styles.button}
              disabled={isSubmitting}
            />
            <Button
              title="Create Cycle"
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  cycleNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cycleNumberLabel: {
    fontSize: 16,
    color: "#333",
    marginRight: 10,
  },
  cycleNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2a9d8f",
  },
  datePickerContainer: {
    marginBottom: 20,
  },
  datePickerLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },
  datePickerButtonDisabled: {
    opacity: 0.5,
  },
  datePickerText: {
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    color: "#f44336",
    marginTop: -10,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});
