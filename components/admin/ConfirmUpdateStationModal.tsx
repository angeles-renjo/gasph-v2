import React, { useState, useEffect } from 'react';
import {
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { View, Text } from '@/components/Themed';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Checkbox from 'expo-checkbox';
import { Json, Tables, TablesUpdate } from '@/utils/supabase/types';
import { Colors } from '@/styles/theme';
import { useAuth } from '@/hooks/useAuth';
import { useStationDetails } from '@/hooks/queries/stations/useStationDetails';
import { useUpdateStationMutation } from '@/hooks/queries/admin/reports/useUpdateStationMutation';
import { useUpdateReportStatusMutation } from '@/hooks/queries/admin/reports/useUpdateReportStatusMutation';
import { StationReportWithUser } from '@/hooks/queries/utils/types';
// Use styles from ConfirmAddStationModal for similarity, adjust if needed
import { styles } from '@/styles/components/admin/ConfirmAddStationModal.styles';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { ErrorDisplay } from '../common/ErrorDisplay';

type ConfirmUpdateStationModalProps = {
  isVisible: boolean;
  onClose: () => void;
  report: StationReportWithUser | null; // Report contains reason and station_id
};

const ConfirmUpdateStationModal: React.FC<ConfirmUpdateStationModalProps> = ({
  isVisible,
  onClose,
  report,
}) => {
  // State for form fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null); // place_id might be null
  const [amenities, setAmenities] = useState<Record<string, boolean>>({});
  const [operatingHoursJson, setOperatingHoursJson] = useState('{}');
  const [status, setStatus] = useState<'active' | 'inactive'>('inactive'); // Default to inactive

  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const stationId = report?.station_id ?? null;

  // Fetch current station details
  const {
    data: stationDetails,
    isLoading: isLoadingDetails,
    isError: isErrorDetails,
    error: detailsError,
    refetch: refetchDetails,
  } = useStationDetails(stationId);

  // Mutations
  const updateStationMutation = useUpdateStationMutation();
  const updateReportStatusMutation = useUpdateReportStatusMutation();

  // Effect to populate state when station details load or report changes
  useEffect(() => {
    if (stationDetails) {
      setName(stationDetails.name ?? '');
      setBrand(stationDetails.brand ?? '');
      setAddress(stationDetails.address ?? '');
      setCity(stationDetails.city ?? '');
      setProvince(stationDetails.province ?? '');
      setLatitude(stationDetails.latitude ?? null);
      setLongitude(stationDetails.longitude ?? null);
      setPlaceId(stationDetails.place_id ?? ''); // Handle potential null place_id
      // Ensure status is 'active' or 'inactive' before setting state
      const fetchedStatus = stationDetails.status;
      setStatus(
        fetchedStatus === 'active' || fetchedStatus === 'inactive'
          ? fetchedStatus
          : 'inactive' // Default to inactive if fetched status is invalid
      );

      // Safely handle amenities (assuming it's JSONB in DB)
      setAmenities(
        typeof stationDetails.amenities === 'object' &&
          stationDetails.amenities !== null &&
          !Array.isArray(stationDetails.amenities)
          ? (stationDetails.amenities as Record<string, boolean>)
          : {}
      );

      // Safely handle operating hours (assuming it's JSONB in DB)
      try {
        setOperatingHoursJson(
          stationDetails.operating_hours
            ? JSON.stringify(stationDetails.operating_hours, null, 2)
            : '{}'
        );
      } catch (e) {
        console.error('Error stringifying operating hours:', e);
        setOperatingHoursJson('{}');
      }
    } else {
      // Reset form if no details (e.g., modal opened without valid stationId)
      setName('');
      setBrand('');
      setAddress('');
      setCity('');
      setProvince('');
      setLatitude(null);
      setLongitude(null);
      setPlaceId('');
      setAmenities({});
      setOperatingHoursJson('{}');
      setStatus('inactive');
    }
  }, [stationDetails, report]); // Depend on stationDetails and report

  const handleAmenityChange = (key: string, isChecked: boolean) => {
    setAmenities((prev) => ({ ...prev, [key]: isChecked }));
  };

  const handleConfirmPress = async () => {
    if (!report || !user || !stationId) {
      Alert.alert('Error', 'Report data, user, or station ID is missing.');
      return;
    }
    // Basic validation (similar to add modal, adjust as needed)
    if (
      !name.trim() ||
      !brand.trim() ||
      !address.trim() ||
      !city.trim() ||
      !province.trim() ||
      latitude === null ||
      longitude === null
      // placeId is allowed to be empty/null during update if necessary
    ) {
      Alert.alert(
        'Error',
        'Please ensure required station fields (Name, Brand, Address, City, Province, Lat, Lng) are filled.'
      );
      return;
    }
    let parsedOperatingHours = {};
    try {
      parsedOperatingHours = JSON.parse(operatingHoursJson || '{}');
      if (
        typeof parsedOperatingHours !== 'object' ||
        Array.isArray(parsedOperatingHours) ||
        parsedOperatingHours === null
      ) {
        throw new Error('Operating hours must be a valid JSON object.');
      }
    } catch (e: any) {
      Alert.alert(
        'Invalid JSON',
        `Error parsing Operating Hours JSON: ${e.message}`
      );
      return;
    }

    const finalStationUpdateData: TablesUpdate<'gas_stations'> = {
      name: name.trim(),
      brand: brand.trim(),
      address: address.trim(),
      city: city.trim(),
      province: province.trim(),
      latitude: latitude,
      longitude: longitude,
      place_id: placeId?.trim() || null, // Send null if empty string
      amenities: amenities,
      operating_hours: parsedOperatingHours as Json,
      status: status,
    };

    try {
      // 1. Update the station
      await updateStationMutation.mutateAsync({
        id: stationId,
        ...finalStationUpdateData,
      });

      // 2. Update the report status to 'approved'
      await updateReportStatusMutation.mutateAsync({
        reportId: report.id,
        newStatus: 'approved',
        resolverId: user.id,
      });

      Alert.alert('Success', 'Station updated and report approved.');
      onClose(); // Close modal on success
    } catch (error: any) {
      console.error('Error during station update or report approval:', error);
      Alert.alert(
        'Operation Failed',
        error.message || 'Could not update station or approve report.'
      );
      // Do not close modal on error
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const currentTextColor = Colors[colorScheme ?? 'light'].text;
  const isProcessing =
    updateStationMutation.isPending || updateReportStatusMutation.isPending;

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoadingDetails) {
      return <LoadingIndicator message='Loading station details...' />;
    }
    if (isErrorDetails || !stationDetails) {
      return (
        <ErrorDisplay
          message={
            detailsError?.message ||
            'Failed to load station details. Station might not exist.'
          }
          onRetry={refetchDetails}
        />
      );
    }

    // Station details loaded, render the form
    return (
      <>
        <Text style={[styles.modalTitle, { color: currentTextColor }]}>
          Confirm Station Update
        </Text>

        {/* Display Report Reason */}
        <View style={styles.suggestionBox}>
          <Text style={[styles.suggestionTitle, { color: currentTextColor }]}>
            Report Reason:
          </Text>
          <Text style={{ color: currentTextColor }}>
            {report?.reason || 'No reason provided.'}
          </Text>
        </View>

        {/* Form Fields */}
        <Text style={[styles.label, { color: currentTextColor }]}>
          Station Name:*
        </Text>
        <Input
          value={name}
          onChangeText={setName}
          style={styles.input}
          editable={true}
        />

        <Text style={[styles.label, { color: currentTextColor }]}>Brand:*</Text>
        <Input
          placeholder='e.g., Shell, Petron'
          value={brand}
          onChangeText={setBrand}
          style={styles.input}
          editable={true}
        />

        <Text style={[styles.label, { color: currentTextColor }]}>
          Address:*
        </Text>
        <Input
          placeholder='Street Address'
          value={address}
          onChangeText={setAddress}
          style={styles.input}
          editable={true}
        />

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={[styles.label, { color: currentTextColor }]}>
              City:*
            </Text>
            <Input
              placeholder='e.g., Legazpi City'
              value={city}
              onChangeText={setCity}
              style={styles.input}
              editable={true}
            />
          </View>
          <View style={styles.column}>
            <Text style={[styles.label, { color: currentTextColor }]}>
              Province:*
            </Text>
            <Input
              placeholder='e.g., Albay'
              value={province}
              onChangeText={setProvince}
              style={styles.input}
              editable={true}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={[styles.label, { color: currentTextColor }]}>
              Latitude:*
            </Text>
            <Input
              value={latitude?.toString() ?? ''}
              onChangeText={(t) => setLatitude(parseFloat(t) || null)}
              style={styles.input}
              keyboardType='numeric'
              editable={true}
            />
          </View>
          <View style={styles.column}>
            <Text style={[styles.label, { color: currentTextColor }]}>
              Longitude:*
            </Text>
            <Input
              value={longitude?.toString() ?? ''}
              onChangeText={(t) => setLongitude(parseFloat(t) || null)}
              style={styles.input}
              keyboardType='numeric'
              editable={true}
            />
          </View>
        </View>

        <Text style={[styles.label, { color: currentTextColor }]}>
          Google Place ID:
        </Text>
        <Input
          placeholder='(Optional) Find using Google Maps'
          value={placeId ?? ''}
          onChangeText={setPlaceId}
          style={styles.input}
          editable={true} // Make editable
        />

        {/* Status Picker */}
        <Text style={[styles.label, { color: currentTextColor }]}>Status:</Text>
        <View style={styles.row}>
          <Pressable
            style={styles.checkboxContainer}
            onPress={() => setStatus('active')}
          >
            <Checkbox
              style={styles.checkbox}
              value={status === 'active'}
              onValueChange={() => setStatus('active')}
              color={status === 'active' ? Colors.primary : undefined}
            />
            <Text style={[styles.checkboxLabel, { color: currentTextColor }]}>
              Active
            </Text>
          </Pressable>
          <Pressable
            style={styles.checkboxContainer}
            onPress={() => setStatus('inactive')}
          >
            <Checkbox
              style={styles.checkbox}
              value={status === 'inactive'}
              onValueChange={() => setStatus('inactive')}
              color={status === 'inactive' ? Colors.primary : undefined}
            />
            <Text style={[styles.checkboxLabel, { color: currentTextColor }]}>
              Inactive
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.label, { color: currentTextColor }]}>
          Amenities:
        </Text>
        <View style={styles.amenitiesContainer}>
          {[
            'Air',
            'Water',
            'Convenience Store',
            'Restroom',
            'ATM',
            'Car Wash',
            'Loyalty Program',
            'Full Service',
          ].map((amenity) => {
            const key = amenity.toLowerCase().replace(/\s+/g, '_');
            return (
              <Pressable
                key={key}
                onPress={() => handleAmenityChange(key, !amenities[key])}
                style={styles.checkboxContainer}
              >
                <Checkbox
                  style={styles.checkbox}
                  value={amenities[key] || false}
                  onValueChange={(val) => handleAmenityChange(key, val)}
                  color={amenities[key] ? Colors.primary : undefined}
                />
                <Text
                  style={[styles.checkboxLabel, { color: currentTextColor }]}
                >
                  {amenity}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: currentTextColor }]}>
          Operating Hours (JSON):
        </Text>
        <Input
          placeholder='e.g., {"mon-fri": "06:00-22:00", "sat": "07:00-21:00"}'
          value={operatingHoursJson}
          onChangeText={setOperatingHoursJson}
          multiline
          numberOfLines={4}
          style={[styles.input, styles.jsonInput]}
          autoCapitalize='none'
          autoCorrect={false}
        />

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title='Cancel'
            onPress={handleCancel}
            variant='outline'
            style={styles.button}
            disabled={isProcessing}
          />
          <Button
            title={isProcessing ? 'Processing...' : 'Confirm & Update Station'}
            onPress={handleConfirmPress}
            style={styles.button}
            loading={isProcessing}
            disabled={isProcessing}
          />
        </View>
      </>
    );
  };

  return (
    <Modal
      animationType='slide'
      transparent={true}
      visible={isVisible}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.centeredView}>
            <View
              style={[
                styles.modalView,
                { backgroundColor: Colors[colorScheme ?? 'light'].background },
              ]}
            >
              {renderContent()}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ConfirmUpdateStationModal;
