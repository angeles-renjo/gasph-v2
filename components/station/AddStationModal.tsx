import React, { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  View, // Use standard View
  Text, // Use standard Text
  TextInput, // Use standard TextInput if ui/Input isn't suitable
  StyleSheet, // Import StyleSheet
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { Feather } from '@expo/vector-icons'; // Import icons

import { Button } from '@/components/ui/Button'; // Keep using custom Button
import { Input } from '@/components/ui/Input'; // Keep using custom Input (assuming it's flexible)
import { useAuth } from '@/hooks/useAuth';
import { TablesInsert } from '@/utils/supabase/types';
import { supabase } from '@/utils/supabase/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import theme, { Colors, Spacing, Typography } from '@/styles/theme'; // Import theme elements
import { LocationObjectCoords } from 'expo-location';
import LocationPickerModal from '@/components/map/LocationPickerModal';
import { reverseGeocode, AddressComponents } from '@/lib/geo';
import styles from '@/styles/components/station/AddStationModal.styles'; // Import new styles

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
        station_id: null, // Explicitly null for add reports
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
      // Consider invalidating station lists if applicable after review
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

// Define amenity keys type
type AmenityKey =
  | 'convenienceStore'
  | 'restroom'
  | 'atm'
  | 'airWater'
  | 'carWash'
  | 'foodService';

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
  >(undefined); // Initialize as undefined
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  const [operatingHoursNotes, setOperatingHoursNotes] = useState('');
  // Updated amenities state
  const [amenities, setAmenities] = useState<Record<AmenityKey, boolean>>({
    convenienceStore: false,
    restroom: false,
    atm: false,
    airWater: false,
    carWash: false,
    foodService: false,
  });

  const { user } = useAuth();
  const submitAddStationMutation = useSubmitAddStationMutation();
  const colorScheme = useColorScheme() ?? 'light'; // Keep for potential theme adjustments

  // Function to reset all state
  const resetState = () => {
    setStationName('');
    setStationBrand('');
    setFetchedAddress(null);
    setIsGeocoding(false);
    setGeocodeError(null);
    setOperatingHoursNotes('');
    // Reset amenities to initial state
    setAmenities({
      convenienceStore: false,
      restroom: false,
      atm: false,
      airWater: false,
      carWash: false,
      foodService: false,
    });
    // Set location based on initialCoordinates or undefined
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

  // Effect to reset state when modal becomes visible or initial coords change
  useEffect(() => {
    if (isVisible) {
      resetState();
    }
  }, [isVisible, initialCoordinates]); // Rerun if initialCoordinates changes

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
    setFetchedAddress(null); // Clear previous address/error
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
      setFetchedAddress(null); // Ensure address is null on error
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAmenityChange = (amenity: AmenityKey) => {
    setAmenities((prev) => ({
      ...prev,
      [amenity]: !prev[amenity],
    }));
  };

  const handleSubmit = () => {
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'Please log in to suggest a station.'
      );
      return;
    }
    if (!selectedLocation) {
      Alert.alert(
        'Location Required',
        'Please set the station location using the map.'
      );
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
    if (isGeocoding) {
      Alert.alert('Please Wait', 'Fetching address details...');
      return;
    }

    // Use fetched address details, ensure city/province exist
    const finalAddress =
      fetchedAddress?.streetAddress ?? fetchedAddress?.formattedAddress ?? '';
    const finalCity = fetchedAddress?.city ?? '';
    const finalProvince = fetchedAddress?.province ?? '';

    // It might be okay to submit without a perfect address, admin can verify.
    // Let's remove the strict city/province check for now, but keep the data.
    // if (!finalCity || !finalProvince) {
    //   Alert.alert(
    //     'Address Incomplete',
    //     'Could not determine City and Province for the selected location. Please try a slightly different location or submit anyway for review.'
    //   );
    //   // return; // Allow submission even if geocoding isn't perfect
    // }

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
        address: finalAddress, // Use geocoded address if available
        city: finalCity, // Use geocoded city if available
        province: finalProvince, // Use geocoded province if available
        // Pass the structured amenities object
        amenities: amenities,
        operating_hours_notes: operatingHoursNotes.trim() || null,
      },
      reason: `User suggested adding: ${stationName.trim()} (${stationBrand.trim()})`,
    };

    submitAddStationMutation.mutate(reportData, {
      onSuccess: () => {
        handleClose(); // Close modal on success
      },
      // onError is handled globally by the mutation hook
    });
  };

  const handleClose = () => {
    resetState(); // Ensure state is reset on close
    onClose();
  };

  // Helper to render amenity checkboxes
  const renderAmenityCheckbox = (key: AmenityKey, label: string) => (
    <Pressable
      key={key}
      onPress={() => handleAmenityChange(key)}
      style={styles.checkboxItemContainer} // Use item container for spacing
    >
      <Checkbox
        style={styles.checkbox}
        value={amenities[key]}
        onValueChange={() => handleAmenityChange(key)} // Redundant but okay
        color={amenities[key] ? Colors.primary : Colors.mediumGray}
      />
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );

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
        <View style={styles.backdrop}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.card}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Suggest New Station</Text>
              </View>

              {/* Card Content */}
              <View style={styles.cardContent}>
                {/* 1. Location */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.labelNumber}>1.</Text>
                    <Text style={styles.label}>Set Location on Map</Text>
                    <Text style={styles.requiredIndicator}>*</Text>
                  </View>
                  <Button
                    title={
                      selectedLocation
                        ? 'Change Location'
                        : 'Set Location on Map'
                    }
                    onPress={handleOpenLocationPicker}
                    variant='outline'
                    leftIcon={
                      // Correct prop name: leftIcon
                      <Feather
                        name='map-pin'
                        size={16}
                        color={Colors.primary}
                      />
                    }
                    style={styles.locationButton}
                    textStyle={styles.locationButtonText}
                  />
                  {selectedLocation && (
                    <Text style={styles.coordsText}>
                      Selected: Lat: {selectedLocation.latitude.toFixed(6)},
                      Lng: {selectedLocation.longitude.toFixed(6)}
                    </Text>
                  )}
                  {/* Display Geocoding Status/Result */}
                  {isGeocoding && (
                    <View style={styles.addressDisplayContainer}>
                      <ActivityIndicator size='small' color={Colors.primary} />
                      <Text style={styles.addressText}>
                        {' '}
                        Fetching address...
                      </Text>
                    </View>
                  )}
                  {geocodeError && (
                    <View style={styles.addressDisplayContainer}>
                      <Text style={[styles.addressText, styles.errorText]}>
                        Error: {geocodeError}
                      </Text>
                    </View>
                  )}
                  {fetchedAddress && !isGeocoding && (
                    <View style={styles.addressDisplayContainer}>
                      <Text style={styles.addressLabel}>Detected Address:</Text>
                      <Text style={styles.addressText}>
                        {fetchedAddress.formattedAddress || 'N/A'}
                      </Text>
                      {/* Optionally show city/province */}
                      {/* <Text style={styles.addressDetailText}>
                        City: {fetchedAddress.city || 'N/A'}, Prov: {fetchedAddress.province || 'N/A'}
                      </Text> */}
                    </View>
                  )}
                </View>

                {/* 2. Station Name */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.labelNumber}>2.</Text>
                    <Text style={styles.label}>Station Name</Text>
                    <Text style={styles.requiredIndicator}>*</Text>
                  </View>
                  <Input
                    placeholder='e.g., Shell EDSA Cor. Main Ave'
                    value={stationName}
                    onChangeText={setStationName}
                    maxLength={100}
                    placeholderTextColor={Colors.placeholderGray}
                    // style={inputStyle} // Use Input's internal styling or pass custom if needed
                  />
                </View>

                {/* 3. Brand */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.labelNumber}>3.</Text>
                    <Text style={styles.label}>Brand</Text>
                    <Text style={styles.requiredIndicator}>*</Text>
                  </View>
                  <Input
                    placeholder='e.g., Shell, Petron, Caltex'
                    value={stationBrand}
                    onChangeText={setStationBrand}
                    maxLength={50}
                    placeholderTextColor={Colors.placeholderGray}
                    // style={inputStyle}
                  />
                </View>

                {/* 4. Amenities */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.labelNumber}>4.</Text>
                    <Text style={styles.label}>Amenities (Optional)</Text>
                  </View>
                  <View style={styles.amenitiesGrid}>
                    {renderAmenityCheckbox(
                      'convenienceStore',
                      'Convenience Store'
                    )}
                    {renderAmenityCheckbox('restroom', 'Restroom')}
                    {renderAmenityCheckbox('atm', 'ATM')}
                    {renderAmenityCheckbox('airWater', 'Air/Water')}
                    {renderAmenityCheckbox('carWash', 'Car Wash')}
                    {renderAmenityCheckbox('foodService', 'Food Service')}
                  </View>
                </View>

                {/* 5. Operating Hours */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.labelNumber}>5.</Text>
                    <Text style={styles.label}>
                      Operating Hours Notes (Optional)
                    </Text>
                  </View>
                  <View style={styles.textAreaContainer}>
                    <Feather
                      name='clock'
                      size={16}
                      color={Colors.iconGray}
                      style={styles.textAreaIcon}
                    />
                    <TextInput // Use standard TextInput for multiline
                      placeholder='e.g., 24 hours, 6am-10pm Mon-Sat'
                      value={operatingHoursNotes}
                      onChangeText={setOperatingHoursNotes}
                      multiline
                      numberOfLines={3} // Suggests initial height
                      style={styles.textAreaInput} // Apply specific styles
                      maxLength={150}
                      placeholderTextColor={Colors.placeholderGray}
                      textAlignVertical='top' // Align text to top
                    />
                  </View>
                </View>

                {/* Required Field Note */}
                <Text style={styles.requiredText}>
                  <Text style={styles.requiredIndicator}>*</Text> Required field
                </Text>
              </View>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <Button
                  title='Cancel'
                  onPress={handleClose}
                  variant='outline'
                  leftIcon={
                    // Correct prop name: leftIcon
                    <Feather name='x' size={16} color={Colors.textGray} />
                  }
                  style={StyleSheet.flatten([
                    styles.footerButton,
                    styles.cancelButton,
                  ])} // Flatten styles
                  textStyle={styles.cancelButtonText}
                  disabled={submitAddStationMutation.isPending || isGeocoding}
                />
                <Button
                  title='Submit Suggestion'
                  onPress={handleSubmit}
                  leftIcon={
                    // Correct prop name: leftIcon
                    <Feather name='check' size={16} color={Colors.white} />
                  }
                  style={StyleSheet.flatten([
                    styles.footerButton,
                    styles.submitButton,
                  ])} // Flatten styles
                  textStyle={styles.submitButtonText}
                  loading={submitAddStationMutation.isPending}
                  disabled={
                    !selectedLocation ||
                    !stationName.trim() ||
                    !stationBrand.trim() ||
                    isGeocoding ||
                    // !fetchedAddress?.city || // Relaxed this check
                    // !fetchedAddress?.province || // Relaxed this check
                    submitAddStationMutation.isPending
                  }
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Location Picker Modal */}
      {isLocationPickerVisible && (
        <LocationPickerModal
          isVisible={isLocationPickerVisible}
          onClose={handleCloseLocationPicker}
          onLocationSelect={handleLocationSelect}
          initialLocation={
            // Correct prop name: initialLocation
            selectedLocation
              ? selectedLocation // Pass the full selectedLocation object
              : initialCoordinates // Use initialCoordinates if location not yet selected
              ? {
                  // Ensure initialCoordinates is also a full Coords object
                  latitude: initialCoordinates.latitude,
                  longitude: initialCoordinates.longitude,
                  accuracy: null,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                }
              : undefined // Pass undefined if neither is available
          }
        />
      )}
    </Modal>
  );
};

export default AddStationModal;
