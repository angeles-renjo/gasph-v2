import React, { useState, useEffect } from 'react';
import { z } from 'zod'; // Import Zod
import {
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
  useColorScheme,
  ActivityIndicator,
  Linking, // <-- Add Linking
  TouchableOpacity, // <-- Add TouchableOpacity
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
import { ZodErrorMap, ZodIssue } from 'zod'; // Import Zod types for error handling

type ConfirmUpdateStationModalProps = {
  isVisible: boolean;
  onClose: () => void;
  report: StationReportWithUser | null; // Report contains reason and station_id
};

// --- ZOD SCHEMA ---
const stationUpdateSchema = z.object({
  name: z.string().min(1, 'Station Name is required.'),
  brand: z.string().min(1, 'Brand is required.'),
  address: z.string().min(1, 'Address is required.'),
  city: z.string().min(1, 'City is required.'),
  province: z.string().min(1, 'Province is required.'),
  latitude: z.number({ invalid_type_error: 'Latitude must be a number.' }),
  longitude: z.number({ invalid_type_error: 'Longitude must be a number.' }),
  placeId: z.string().nullable().optional(), // Allow null or empty string
  amenities: z.record(z.boolean()).optional().default({}),
  operatingHoursJson: z
    .string()
    .refine(
      (val) => {
        try {
          const parsed = JSON.parse(val);
          return (
            typeof parsed === 'object' &&
            !Array.isArray(parsed) &&
            parsed !== null
          );
        } catch (e) {
          return false;
        }
      },
      { message: 'Operating Hours must be a valid JSON object.' }
    )
    .optional()
    .default('{}'),
  status: z.enum(['active', 'inactive']),
});
// --- END ZOD SCHEMA ---

// Type for flattened Zod errors
type ValidationErrors = Record<string, string[] | undefined>;

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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  ); // State for validation errors

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
      setValidationErrors({}); // Clear errors when details load/reset
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

    const formData = {
      name: name.trim(),
      brand: brand.trim(),
      address: address.trim(),
      city: city.trim(),
      province: province.trim(),
      latitude: latitude, // Keep as number | null for initial check
      longitude: longitude, // Keep as number | null for initial check
      placeId: placeId?.trim() || null, // Use null if empty
      amenities: amenities,
      operatingHoursJson: operatingHoursJson || '{}',
      status: status,
    };

    // Use safeParse to validate
    const result = stationUpdateSchema.safeParse(formData);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setValidationErrors(errors);
      console.error('Validation Errors:', JSON.stringify(errors, null, 2)); // Log detailed errors
      Alert.alert('Validation Error', 'Please check the highlighted fields.');
      return; // Stop execution if validation fails
    }

    // Clear errors if validation passes
    setValidationErrors({});

    // Data is valid, proceed
    const validatedData = result.data;

    // Parse operating hours JSON safely (already validated by Zod)
    const parsedOperatingHours = JSON.parse(validatedData.operatingHoursJson);

    const finalStationUpdateData: TablesUpdate<'gas_stations'> = {
      name: validatedData.name,
      brand: validatedData.brand,
      address: validatedData.address,
      city: validatedData.city,
      province: validatedData.province,
      latitude: validatedData.latitude, // Guaranteed to be a number
      longitude: validatedData.longitude, // Guaranteed to be a number
      place_id: validatedData.placeId, // Use validated placeId
      amenities: validatedData.amenities,
      operating_hours: parsedOperatingHours as Json,
      status: validatedData.status,
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
    setValidationErrors({}); // Clear errors on cancel
    onClose();
  };

  // --- MAP LINK HANDLER ---
  const handleOpenMap = async () => {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      Alert.alert('Error', 'Invalid coordinates provided.');
      return;
    }

    const scheme = Platform.select({
      ios: 'maps://?ll=',
      android: 'geo:',
    });
    const latLng = `${latitude},${longitude}`;
    const zoomLevel = 17; // Street level zoom
    const url = Platform.select({
      ios: `${scheme}${latLng}&z=${zoomLevel}`,
      android: `${scheme}${latLng}?q=${latLng}&z=${zoomLevel}`,
    });

    if (!url) {
      Alert.alert('Error', 'Could not create map URL for this platform.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Don't know how to open this URL: ${url}`);
      }
    } catch (error) {
      console.error('Failed to open map link:', error);
      Alert.alert('Error', 'Could not open map application.');
    }
  };
  // --- END MAP LINK HANDLER ---

  const currentTextColor = Colors[colorScheme ?? 'light'].text;
  const errorColor = Colors.error; // Define error color
  const isProcessing =
    updateStationMutation.isPending || updateReportStatusMutation.isPending;

  // Helper to render error messages
  const renderError = (field: keyof ValidationErrors) => {
    if (validationErrors[field]) {
      return (
        <Text style={{ color: errorColor, fontSize: 12, marginTop: 2 }}>
          {validationErrors[field]?.[0]}
        </Text>
      );
    }
    return null;
  };

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
          style={[
            styles.input,
            validationErrors.name && { borderColor: errorColor },
          ]}
          editable={true}
          placeholderTextColor={Colors.mediumGray}
        />
        {renderError('name')}

        <Text style={[styles.label, { color: currentTextColor }]}>Brand:*</Text>
        <Input
          placeholder='e.g., Shell, Petron'
          value={brand}
          onChangeText={setBrand}
          style={[
            styles.input,
            validationErrors.brand && { borderColor: errorColor },
          ]}
          editable={true}
          placeholderTextColor={Colors.mediumGray}
        />
        {renderError('brand')}

        <Text style={[styles.label, { color: currentTextColor }]}>
          Address:*
        </Text>
        <Input
          placeholder='Street Address'
          value={address}
          onChangeText={setAddress}
          style={[
            styles.input,
            validationErrors.address && { borderColor: errorColor },
          ]}
          editable={true}
          placeholderTextColor={Colors.mediumGray}
        />
        {renderError('address')}

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={[styles.label, { color: currentTextColor }]}>
              City:*
            </Text>
            <Input
              placeholder='e.g., Legazpi City'
              value={city}
              onChangeText={setCity}
              style={[
                styles.input,
                validationErrors.city && { borderColor: errorColor },
              ]}
              editable={true}
              placeholderTextColor={Colors.mediumGray}
            />
            {renderError('city')}
          </View>
          <View style={styles.column}>
            <Text style={[styles.label, { color: currentTextColor }]}>
              Province:*
            </Text>
            <Input
              placeholder='e.g., Albay'
              value={province}
              onChangeText={setProvince}
              style={[
                styles.input,
                validationErrors.province && { borderColor: errorColor },
              ]}
              editable={true}
              placeholderTextColor={Colors.mediumGray}
            />
            {renderError('province')}
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
              style={[
                styles.input,
                validationErrors.latitude && { borderColor: errorColor },
              ]}
              keyboardType='numeric'
              editable={true}
              placeholderTextColor={Colors.mediumGray}
            />
            {renderError('latitude')}
          </View>
          <View style={styles.column}>
            <Text style={[styles.label, { color: currentTextColor }]}>
              Longitude:*
            </Text>
            <Input
              value={longitude?.toString() ?? ''}
              onChangeText={(t) => setLongitude(parseFloat(t) || null)}
              style={[
                styles.input,
                validationErrors.longitude && { borderColor: errorColor },
              ]}
              keyboardType='numeric'
              editable={true}
              placeholderTextColor={Colors.mediumGray}
            />
            {renderError('longitude')}
          </View>
        </View>

        {/* --- View on Map Link --- */}
        <TouchableOpacity
          onPress={handleOpenMap}
          disabled={
            typeof latitude !== 'number' || typeof longitude !== 'number'
          }
          style={{
            alignSelf: 'flex-end', // Position it near the coords
            marginBottom: 10, // Add some space before the next field
            opacity:
              typeof latitude !== 'number' || typeof longitude !== 'number'
                ? 0.5
                : 1, // Dim if disabled
          }}
        >
          <Text
            style={{
              color: Colors.primary, // Use theme color for link
              fontSize: 14,
              textDecorationLine: 'underline',
            }}
          >
            View on Map
          </Text>
        </TouchableOpacity>
        {/* --- End View on Map Link --- */}

        <Text style={[styles.label, { color: currentTextColor }]}>
          Google Place ID:
        </Text>
        <Input
          placeholder='(Optional) Find using Google Maps'
          value={placeId ?? ''}
          onChangeText={setPlaceId}
          style={[
            styles.input,
            validationErrors.placeId && { borderColor: errorColor },
          ]} // placeId is optional, but show error if invalid format provided
          editable={true} // Make editable
          placeholderTextColor={Colors.mediumGray}
        />
        {renderError('placeId')}

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
          style={[
            styles.input,
            styles.jsonInput,
            validationErrors.operatingHoursJson && { borderColor: errorColor },
          ]}
          autoCapitalize='none'
          autoCorrect={false}
          placeholderTextColor={Colors.mediumGray}
        />
        {renderError('operatingHoursJson')}

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
