import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView, // Import ScrollView
} from 'react-native';
import { View, Text } from '@/components/Themed';
import { Input } from '@/components/ui/Input';
import Checkbox from 'expo-checkbox'; // Import Expo Checkbox
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { TablesInsert } from '@/utils/supabase/types';
import { supabase } from '@/utils/supabase/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/utils/queryKeys'; // Import queryKeys
import * as Location from 'expo-location'; // To get current location for initial map region
import theme from '@/styles/theme'; // Import theme for colors
import { LocationObjectCoords } from 'expo-location'; // Import LocationObjectCoords
import LocationPickerModal from '@/components/map/LocationPickerModal'; // Import the new modal

// Type for the report submission data
type StationReportInsert = TablesInsert<'station_reports'>;

type AddStationModalProps = {
  isVisible: boolean;
  onClose: () => void;
  initialCoordinates?: { latitude: number; longitude: number }; // Optional initial coords from map center
};

// --- Mutation Hook (Similar to ReportStationModal, but for 'add' type) ---
const useSubmitAddStationMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      // The incoming reportData now includes report_type
      reportData: Omit<
        StationReportInsert,
        | 'user_id'
        | 'id'
        | 'created_at'
        | 'resolved_at'
        | 'resolver_id'
        | 'station_id'
        | 'status'
      >
    ) => {
      if (!user) throw new Error('User not authenticated');

      // Construct the final object to insert
      const dataToInsert: StationReportInsert = {
        ...reportData, // reportData already contains report_type: 'add'
        user_id: user.id,
        status: 'pending', // Set status here
        station_id: null, // Ensure station_id is null for 'add'
      };

      const { error } = await supabase
        .from('station_reports')
        .insert(dataToInsert);

      if (error) {
        console.error('Error submitting add station report:', error);
        // Note: The duplicate check trigger doesn't apply to 'add' reports by default
        throw new Error(error.message || 'Failed to submit suggestion.');
      }
    },
    onSuccess: () => {
      // Invalidate the admin pending reports list so it refreshes
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.reports.list('pending'),
      });
      Alert.alert(
        'Suggestion Submitted',
        'Thank you! Your suggestion will be reviewed.'
      );
    },
    onError: (error: Error) => {
      Alert.alert(
        'Submission Failed',
        error.message || 'Could not submit suggestion. Please try again.'
      );
    },
  });
};
// --- End Mutation Hook ---

const AddStationModal: React.FC<AddStationModalProps> = ({
  isVisible,
  onClose,
  initialCoordinates,
}) => {
  const [stationName, setStationName] = useState('');
  const [stationBrand, setStationBrand] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  // Initialize selectedLocation with only lat/lng if initialCoordinates is provided
  const [selectedLocation, setSelectedLocation] = useState<
    LocationObjectCoords | undefined
  >(
    initialCoordinates
      ? {
          ...initialCoordinates,
          accuracy: null,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        }
      : undefined
  );
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false); // State for new modal
  const [operatingHoursNotes, setOperatingHoursNotes] = useState('');
  const [amenities, setAmenities] = useState<Record<string, boolean>>({}); // State for amenities checkboxes

  const { user } = useAuth();
  const submitAddStationMutation = useSubmitAddStationMutation();

  // Effect to reset state when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      setStationName('');
      setStationBrand('');
      setAddress('');
      setCity('');
      setProvince('');
      setOperatingHoursNotes('');
      setAmenities({}); // Reset amenities
      // Reset selectedLocation similarly when modal becomes visible
      setSelectedLocation(
        initialCoordinates
          ? {
              ...initialCoordinates,
              accuracy: null,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            }
          : undefined
      );
    }
  }, [isVisible, initialCoordinates]); // Rerun when visibility or initial coords change

  // --- Handlers ---
  const handleOpenLocationPicker = () => {
    setIsLocationPickerVisible(true);
  };

  const handleCloseLocationPicker = () => {
    setIsLocationPickerVisible(false);
  };

  const handleLocationSelect = (location: LocationObjectCoords) => {
    setSelectedLocation(location);
    setIsLocationPickerVisible(false); // Close picker after selection
  };

  const handleSubmit = () => {
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'Please log in to suggest a station.'
      );
      return;
    }
    if (!stationName.trim()) {
      Alert.alert('Name Required', 'Please enter the station name.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter the station address.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('City Required', 'Please enter the city.');
      return;
    }
    if (!province.trim()) {
      Alert.alert('Province Required', 'Please enter the province.');
      return;
    }
    if (!selectedLocation) {
      Alert.alert(
        'Location Required',
        'Please set the station location using the map.'
      );
      return;
    }

    // Define reportData including report_type
    const reportData: Omit<
      StationReportInsert,
      | 'user_id' // Omit fields set by the hook or DB defaults
      | 'id'
      | 'created_at'
      | 'resolved_at'
      | 'resolver_id'
      | 'station_id'
      | 'status'
    > = {
      report_type: 'add', // Set report_type here
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      // Store name/brand/comments in reported_data JSONB field
      reported_data: {
        name: stationName.trim(),
        brand: stationBrand.trim(),
        address: address.trim(),
        city: city.trim(),
        province: province.trim(),
        amenities: amenities, // Add selected amenities
        operating_hours_notes: operatingHoursNotes.trim() || null, // Add operating hours notes
        // comments: comments.trim() || null, // Keep original comments field if needed, or merge
      },
      // Update reason to reflect more data captured (use correct variable stationBrand)
      reason: `User suggested adding: ${stationName.trim()} (${stationBrand.trim()})`,
    };

    submitAddStationMutation.mutate(reportData, {
      onSuccess: () => {
        handleClose(); // Close modal on success
      },
    });
  };

  const handleClose = () => {
    // Reset state before closing (already done in useEffect, but good practice)
    setStationName('');
    setStationBrand('');
    setAddress('');
    setCity('');
    setProvince('');
    setOperatingHoursNotes('');
    setAmenities({});
    setSelectedLocation(undefined);
    setIsLocationPickerVisible(false); // Ensure picker is closed
    submitAddStationMutation.reset();
    onClose();
  };

  return (
    <Modal
      animationType='slide'
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Wrap content in ScrollView */}
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Suggest New Station</Text>

              {/* Use ScrollView inside modalView if content might overflow */}
              {/* <ScrollView> */}
              <Text style={styles.label}>Station Name:*</Text>
              <Input
                placeholder='e.g., Shell EDSA Cor. Main Ave'
                value={stationName}
                onChangeText={setStationName}
                style={styles.input}
                maxLength={100} // Add reasonable max length
              />

              <Text style={styles.label}>Brand:*</Text>
              <Input
                placeholder='e.g., Shell, Petron, Caltex'
                value={stationBrand}
                onChangeText={setStationBrand}
                style={styles.input}
                maxLength={50}
              />

              <Text style={styles.label}>Address:*</Text>
              <Input
                placeholder='e.g., 123 EDSA corner Main Ave'
                value={address}
                onChangeText={setAddress}
                style={styles.input}
                maxLength={200}
              />

              <Text style={styles.label}>City:*</Text>
              <Input
                placeholder='e.g., Quezon City'
                value={city}
                onChangeText={setCity}
                style={styles.input}
                maxLength={50}
              />

              <Text style={styles.label}>Province:*</Text>
              <Input
                placeholder='e.g., Metro Manila'
                value={province}
                onChangeText={setProvince}
                style={styles.input}
                maxLength={50}
              />

              <Text style={styles.label}>Location:*</Text>
              <Button
                title='Set Location on Map'
                onPress={handleOpenLocationPicker}
                variant='outline' // Or choose another appropriate variant
                style={styles.setLocationButton}
              />
              {selectedLocation && (
                <Text style={styles.coordsText}>
                  Lat: {selectedLocation.latitude.toFixed(6)}, Lng:{' '}
                  {selectedLocation.longitude.toFixed(6)}
                </Text>
              )}

              {/* Amenities Checkboxes */}
              <Text style={styles.label}>Amenities (Optional):</Text>
              <View style={styles.amenitiesContainer}>
                {[
                  'Convenience Store',
                  'Restroom',
                  'ATM',
                  'Air/Water',
                  'Car Wash',
                ].map((amenity) => {
                  const key = amenity.toLowerCase().replace(/ /g, '_'); // Generate key like 'convenience_store'
                  const isChecked = amenities[key] || false;
                  const toggleCheckbox = () => {
                    setAmenities((prev) => ({ ...prev, [key]: !isChecked }));
                  };
                  return (
                    // Wrap Checkbox and Text in a Pressable for better touch target
                    <Pressable
                      key={key}
                      onPress={toggleCheckbox}
                      style={styles.checkboxContainer}
                    >
                      <Checkbox
                        style={styles.checkbox}
                        value={isChecked}
                        onValueChange={toggleCheckbox} // Use onValueChange
                        color={isChecked ? theme.Colors.primary : undefined}
                      />
                      <Text style={styles.checkboxLabel}>{amenity}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>
                Operating Hours Notes (Optional):
              </Text>
              <Input
                placeholder='e.g., 24 hours, 6am-10pm Mon-Sat'
                value={operatingHoursNotes}
                onChangeText={setOperatingHoursNotes}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.commentInput]}
                maxLength={150}
              />

              {/* Add required field indicator */}
              <Text style={styles.requiredText}>* Required field</Text>

              <View style={styles.buttonContainer}>
                <Button
                  title='Cancel'
                  onPress={handleClose}
                  variant='outline'
                  style={styles.button}
                  disabled={submitAddStationMutation.isPending}
                />
                <Button
                  title='Submit Suggestion'
                  onPress={handleSubmit}
                  style={styles.button}
                  loading={submitAddStationMutation.isPending}
                  disabled={
                    !selectedLocation || // Use selectedLocation
                    !stationName.trim() ||
                    !stationBrand.trim() ||
                    !address.trim() ||
                    !city.trim() ||
                    !province.trim() ||
                    submitAddStationMutation.isPending
                  }
                />
              </View>
              {/* </ScrollView> */}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- Location Picker Modal --- */}
      {/* Render the modal conditionally */}
      {isLocationPickerVisible && (
        <LocationPickerModal
          isVisible={isLocationPickerVisible}
          onClose={handleCloseLocationPicker}
          onLocationSelect={handleLocationSelect}
          initialLocation={selectedLocation} // Pass current selection as initial
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1, // Ensure content can grow to fill space
    justifyContent: 'center', // Center content vertically in scrollview
  },
  centeredView: {
    flex: 1, // Allow inner view to take space within scrollview
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Apply background to outer container if needed
    paddingVertical: 20, // Add padding if needed when keyboard is up
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '95%', // Allow slightly more height
  },
  modalTitle: {
    marginBottom: 15, // Less space below title
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    marginBottom: 15,
  },
  commentInput: {
    minHeight: 60, // Slightly smaller comment box
    textAlignVertical: 'top',
    marginBottom: 10, // Less margin below comments
  },
  setLocationButton: {
    marginBottom: 5, // Space below button
  },
  coordsText: {
    fontSize: 12,
    color: theme.Colors.gray,
    textAlign: 'center',
    marginBottom: 15, // Space below coordinates
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  checkboxContainer: {
    // New style for wrapping checkbox and label
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 15, // Add right margin for spacing
    // width: '45%', // Adjust width as needed or let it wrap naturally
  },
  checkbox: {
    marginRight: 8, // Space between checkbox and label
    // Adjust size if needed via width/height, expo-checkbox size prop is limited
    width: 20,
    height: 20,
    borderRadius: 4, // Match bouncy checkbox style
    borderWidth: 2, // Match bouncy checkbox style
    borderColor: theme.Colors.primary, // Match bouncy checkbox style
  },
  checkboxLabel: {
    // New style for the label text
    fontSize: 14,
  },
  mapContainer: {
    height: 180, // Slightly smaller map
    width: '100%',
    backgroundColor: '#e0e0e0', // Placeholder background
    borderRadius: 8,
    overflow: 'hidden', // Clip map to border radius
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject, // Make map fill container
  },
  mapPlaceholder: {
    // Styles for when map is loading
  },
  requiredText: {
    fontSize: 12,
    color: 'grey',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15, // Less space above buttons
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default AddStationModal;
