import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  useColorScheme, // Import useColorScheme
} from 'react-native';
import { View, Text } from '@/components/Themed';
import { Input } from '@/components/ui/Input';
import Checkbox from 'expo-checkbox';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { TablesInsert } from '@/utils/supabase/types';
import { supabase } from '@/utils/supabase/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import theme, { Colors } from '@/styles/theme'; // Import Colors directly
import { LocationObjectCoords } from 'expo-location';
import LocationPickerModal from '@/components/map/LocationPickerModal';
import { reverseGeocode, AddressComponents } from '@/lib/geo';

// Type for the report submission data
type StationReportInsert = TablesInsert<'station_reports'>;

type AddStationModalProps = {
  isVisible: boolean;
  onClose: () => void;
  initialCoordinates?: { latitude: number; longitude: number };
};

// --- Mutation Hook (Remains the same) ---
const useSubmitAddStationMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
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
      const dataToInsert: StationReportInsert = {
        ...reportData,
        user_id: user.id,
        status: 'pending',
        station_id: null,
      };
      const { error } = await supabase
        .from('station_reports')
        .insert(dataToInsert);
      if (error) {
        console.error('Error submitting add station report:', error);
        throw new Error(error.message || 'Failed to submit suggestion.');
      }
    },
    onSuccess: () => {
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
  const [fetchedAddress, setFetchedAddress] =
    useState<AddressComponents | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
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
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  const [operatingHoursNotes, setOperatingHoursNotes] = useState('');
  const [amenities, setAmenities] = useState<Record<string, boolean>>({});

  const { user } = useAuth();
  const submitAddStationMutation = useSubmitAddStationMutation();
  const colorScheme = useColorScheme() ?? 'light'; // Get current color scheme

  // Function to reset all state
  const resetState = () => {
    setStationName('');
    setStationBrand('');
    setFetchedAddress(null);
    setIsGeocoding(false);
    setGeocodeError(null);
    setOperatingHoursNotes('');
    setAmenities({});
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
    setIsLocationPickerVisible(false);
    submitAddStationMutation.reset();
  };

  // Effect to reset state when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      resetState();
    }
  }, [isVisible, initialCoordinates]);

  // --- Handlers ---
  const handleOpenLocationPicker = () => {
    setIsLocationPickerVisible(true);
  };

  const handleCloseLocationPicker = () => {
    setIsLocationPickerVisible(false);
  };

  const handleLocationSelect = async (location: LocationObjectCoords) => {
    setSelectedLocation(location);
    setIsLocationPickerVisible(false);
    setFetchedAddress(null);
    setGeocodeError(null);
    setIsGeocoding(true);

    try {
      const addressResult = await reverseGeocode({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setFetchedAddress(addressResult);
      if (!addressResult) {
        setGeocodeError('Could not determine address for this location.');
      }
    } catch (error: any) {
      console.error('Reverse geocoding failed:', error);
      setGeocodeError(error.message || 'Failed to fetch address details.');
      setFetchedAddress(null);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in.');
      return;
    }
    if (!stationName.trim()) {
      Alert.alert('Name Required', 'Please enter the station name.');
      return;
    }
    if (!stationBrand.trim()) {
      Alert.alert('Brand Required', 'Please enter the station brand.');
      return;
    }
    if (!selectedLocation) {
      Alert.alert(
        'Location Required',
        'Please set the station location using the map.'
      );
      return;
    }
    if (isGeocoding) {
      Alert.alert('Please Wait', 'Fetching address details...');
      return;
    }
    const finalAddress =
      fetchedAddress?.streetAddress ?? fetchedAddress?.formattedAddress ?? '';
    const finalCity = fetchedAddress?.city ?? '';
    const finalProvince = fetchedAddress?.province ?? '';

    if (!finalCity || !finalProvince) {
      Alert.alert(
        'Address Incomplete',
        'Could not determine City and Province for the selected location. Please try a slightly different location.'
      );
      return;
    }

    const reportData: Omit<
      StationReportInsert,
      | 'user_id'
      | 'id'
      | 'created_at'
      | 'resolved_at'
      | 'resolver_id'
      | 'station_id'
      | 'status'
    > = {
      report_type: 'add',
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      reported_data: {
        name: stationName.trim(),
        brand: stationBrand.trim(),
        address: finalAddress,
        city: finalCity,
        province: finalProvince,
        amenities: amenities,
        operating_hours_notes: operatingHoursNotes.trim() || null,
      },
      reason: `User suggested adding: ${stationName.trim()} (${stationBrand.trim()})`,
    };

    submitAddStationMutation.mutate(reportData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Define dynamic styles based on color scheme
  const dynamicStyles = {
    modalView: {
      backgroundColor: Colors[colorScheme].background, // Use scheme background
    },
    modalTitle: {
      color: Colors[colorScheme].text, // Use scheme text color
    },
    label: {
      color: Colors[colorScheme].text, // Use scheme text color
    },
    addressDisplayContainer: {
      backgroundColor: Colors.lightGray2, // Use appropriate gray
      borderColor: Colors.lightGray, // Use appropriate gray
    },
    addressText: {
      color: Colors[colorScheme].text, // Use scheme text color
    },
    checkboxLabel: {
      color: Colors[colorScheme].text, // Use scheme text color
    },
    requiredText: {
      color: Colors.mediumGray, // Keep medium gray for less emphasis
    },
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
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.centeredView}>
            {/* Apply dynamic background */}
            <View style={[styles.modalView, dynamicStyles.modalView]}>
              {/* Apply dynamic text color */}
              <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>
                Suggest New Station
              </Text>

              <Text style={[styles.label, dynamicStyles.label]}>
                1. Set Location on Map:*
              </Text>
              <Button
                title={
                  selectedLocation ? 'Change Location' : 'Set Location on Map'
                }
                onPress={handleOpenLocationPicker}
                variant='outline'
                style={styles.setLocationButton}
              />
              {selectedLocation && (
                <Text style={styles.coordsText}>
                  Selected: Lat: {selectedLocation.latitude.toFixed(6)}, Lng:{' '}
                  {selectedLocation.longitude.toFixed(6)}
                </Text>
              )}

              {/* Display Geocoding Status/Result */}
              {isGeocoding && (
                <View
                  style={[
                    styles.addressDisplayContainer,
                    dynamicStyles.addressDisplayContainer,
                  ]}
                >
                  <ActivityIndicator size='small' color={Colors.primary} />
                  {/* Apply dynamic text color */}
                  <Text style={[styles.addressText, dynamicStyles.addressText]}>
                    {' '}
                    Fetching address...
                  </Text>
                </View>
              )}
              {geocodeError && (
                <View
                  style={[
                    styles.addressDisplayContainer,
                    dynamicStyles.addressDisplayContainer,
                  ]}
                >
                  <Text style={[styles.addressText, styles.errorText]}>
                    Error: {geocodeError}
                  </Text>
                </View>
              )}
              {fetchedAddress && !isGeocoding && (
                <View
                  style={[
                    styles.addressDisplayContainer,
                    dynamicStyles.addressDisplayContainer,
                  ]}
                >
                  <Text style={styles.addressLabel}>Detected Address:</Text>
                  {/* Apply dynamic text color */}
                  <Text style={[styles.addressText, dynamicStyles.addressText]}>
                    {fetchedAddress.formattedAddress || 'N/A'}
                  </Text>
                  <Text style={styles.addressDetailText}>
                    City: {fetchedAddress.city || 'N/A'}
                  </Text>
                  <Text style={styles.addressDetailText}>
                    Province: {fetchedAddress.province || 'N/A'}
                  </Text>
                </View>
              )}
              {!selectedLocation && !isGeocoding && !geocodeError && (
                <View
                  style={[
                    styles.addressDisplayContainer,
                    dynamicStyles.addressDisplayContainer,
                  ]}
                >
                  <Text style={styles.addressTextMuted}>
                    Address details will appear here after setting location.
                  </Text>
                </View>
              )}

              <Text style={[styles.label, dynamicStyles.label]}>
                2. Station Name:*
              </Text>
              <Input
                placeholder='e.g., Shell EDSA Cor. Main Ave'
                value={stationName}
                onChangeText={setStationName}
                style={styles.input}
                maxLength={100}
                // Add placeholderTextColor based on scheme if needed
                placeholderTextColor={Colors.placeholderGray}
              />

              <Text style={[styles.label, dynamicStyles.label]}>
                3. Brand:*
              </Text>
              <Input
                placeholder='e.g., Shell, Petron, Caltex'
                value={stationBrand}
                onChangeText={setStationBrand}
                style={styles.input}
                maxLength={50}
                placeholderTextColor={Colors.placeholderGray}
              />

              {/* Amenities Checkboxes */}
              <Text style={[styles.label, dynamicStyles.label]}>
                4. Amenities (Optional):
              </Text>
              <View style={styles.amenitiesContainer}>
                {[
                  'Convenience Store',
                  'Restroom',
                  'ATM',
                  'Air/Water',
                  'Car Wash',
                  'Food Service',
                ].map((amenity) => {
                  const key = amenity.toLowerCase().replace(/ /g, '_');
                  const isChecked = amenities[key] || false;
                  const toggleCheckbox = () => {
                    setAmenities((prev) => ({ ...prev, [key]: !isChecked }));
                  };
                  return (
                    <Pressable
                      key={key}
                      onPress={toggleCheckbox}
                      style={styles.checkboxContainer}
                    >
                      <Checkbox
                        style={styles.checkbox}
                        value={isChecked}
                        onValueChange={toggleCheckbox}
                        color={isChecked ? theme.Colors.primary : undefined}
                      />
                      {/* Apply dynamic text color */}
                      <Text
                        style={[
                          styles.checkboxLabel,
                          dynamicStyles.checkboxLabel,
                        ]}
                      >
                        {amenity}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, dynamicStyles.label]}>
                5. Operating Hours Notes (Optional):
              </Text>
              <Input
                placeholder='e.g., 24 hours, 6am-10pm Mon-Sat'
                value={operatingHoursNotes}
                onChangeText={setOperatingHoursNotes}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.commentInput]}
                maxLength={150}
                placeholderTextColor={Colors.placeholderGray}
              />

              {/* Apply dynamic text color */}
              <Text style={[styles.requiredText, dynamicStyles.requiredText]}>
                * Required field
              </Text>

              <View style={styles.buttonContainer}>
                <Button
                  title='Cancel'
                  onPress={handleClose}
                  variant='outline'
                  style={styles.button}
                  disabled={submitAddStationMutation.isPending || isGeocoding}
                />
                <Button
                  title='Submit Suggestion'
                  onPress={handleSubmit}
                  style={styles.button}
                  loading={submitAddStationMutation.isPending}
                  disabled={
                    !selectedLocation ||
                    !stationName.trim() ||
                    !stationBrand.trim() ||
                    isGeocoding ||
                    !fetchedAddress?.city ||
                    !fetchedAddress?.province ||
                    submitAddStationMutation.isPending
                  }
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Location Picker Modal */}
      {isLocationPickerVisible && (
        <LocationPickerModal
          isVisible={isLocationPickerVisible}
          onClose={handleCloseLocationPicker}
          onLocationSelect={handleLocationSelect}
          initialLocation={selectedLocation}
        />
      )}
    </Modal>
  );
};

// Base styles
const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 20,
  },
  modalView: {
    // Base styles, background applied dynamically
    margin: 20,
    borderRadius: 15,
    padding: 25,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '95%',
  },
  modalTitle: {
    // Base styles, color applied dynamically
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  label: {
    // Base styles, color applied dynamically
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    marginBottom: 15,
    // Consider adding dynamic border/text colors if needed based on scheme
  },
  commentInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  setLocationButton: {
    marginBottom: 5,
  },
  coordsText: {
    fontSize: 12,
    color: theme.Colors.gray, // Keep gray for muted coords
    textAlign: 'center',
    marginBottom: 10,
  },
  addressDisplayContainer: {
    // Base styles, background/border applied dynamically
    marginTop: 5,
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.darkGray, // Keep dark gray for label
    marginBottom: 4,
  },
  addressText: {
    // Base styles, color applied dynamically
    fontSize: 14,
    marginBottom: 2,
  },
  addressDetailText: {
    fontSize: 13,
    color: Colors.darkGray, // Keep dark gray for details
  },
  addressTextMuted: {
    fontSize: 13,
    color: Colors.mediumGray, // Keep medium gray
    fontStyle: 'italic',
  },
  errorText: {
    color: Colors.error,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 15,
  },
  checkbox: {
    marginRight: 8,
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.Colors.primary,
  },
  checkboxLabel: {
    // Base styles, color applied dynamically
    fontSize: 14,
  },
  requiredText: {
    // Base styles, color applied dynamically
    fontSize: 12,
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default AddStationModal;
