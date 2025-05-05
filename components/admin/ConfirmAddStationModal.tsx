import { useState, useEffect } from 'react';
import { z } from 'zod'; // Import Zod
import {
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
  useColorScheme,
  Linking, // <-- Add Linking
  TouchableOpacity, // <-- Add TouchableOpacity
} from 'react-native';
import { View, Text } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Checkbox from 'expo-checkbox';
import { Json, TablesInsert } from '@/utils/supabase/types';
import { Colors } from '@/styles/theme';
import { useAuth } from '@/hooks/useAuth';

// Import moved types
import {
  // Renamed from StationReport locally
  StationReportWithUser,
  isValidReportedAddData,
} from '@/hooks/queries/utils/types';

// Import moved styles
import { styles } from '@/styles/components/admin/ConfirmAddStationModal.styles';

// --- MODIFIED PROPS ---
type ConfirmAddStationModalProps = {
  isVisible: boolean;
  onClose: () => void;
  report: StationReportWithUser | null; // Use the imported type
  onConfirmAttempt: (
    stationData: TablesInsert<'gas_stations'>,
    reportId: string,
    resolverId: string
  ) => Promise<boolean>;
  isConfirming: boolean;
};
// --- END MODIFIED PROPS ---

// --- ZOD SCHEMA ---
const stationCreationSchema = z.object({
  name: z.string().min(1, 'Station Name is required.'),
  brand: z.string().min(1, 'Brand is required.'),
  address: z.string().min(1, 'Address is required.'),
  city: z.string().min(1, 'City is required.'),
  province: z.string().min(1, 'Province is required.'),
  latitude: z.number({ invalid_type_error: 'Latitude must be a number.' }),
  longitude: z.number({ invalid_type_error: 'Longitude must be a number.' }),
  placeId: z.string().optional(), // Made optional
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
});
// --- END ZOD SCHEMA ---

// Type for flattened Zod errors
type ValidationErrors = Record<string, string[] | undefined>;

const ConfirmAddStationModal: React.FC<ConfirmAddStationModalProps> = ({
  isVisible,
  onClose,
  report,
  onConfirmAttempt,
  isConfirming,
}) => {
  // State remains the same
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState('');
  const [amenities, setAmenities] = useState<Record<string, boolean>>({});
  const [operatingHoursJson, setOperatingHoursJson] = useState('{}');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  ); // State for validation errors

  const { user } = useAuth();
  const colorScheme = useColorScheme();

  // Effect to populate state remains the same
  useEffect(() => {
    if (
      report &&
      report.report_type === 'add' &&
      isValidReportedAddData(report.reported_data)
    ) {
      const data = report.reported_data;
      setName(typeof data.name === 'string' ? data.name : '');
      setBrand(typeof data.brand === 'string' ? data.brand : '');
      setAddress(typeof data.address === 'string' ? data.address : '');
      setCity(typeof data.city === 'string' ? data.city : '');
      setProvince(typeof data.province === 'string' ? data.province : '');
      setLatitude(report.latitude ?? null);
      setLongitude(report.longitude ?? null);
      setAmenities(
        typeof data.amenities === 'object' &&
          data.amenities !== null &&
          !Array.isArray(data.amenities)
          ? (data.amenities as Record<string, boolean>)
          : {}
      );
      setOperatingHoursJson(
        typeof data.operating_hours_notes === 'string'
          ? `{\n  "notes": "${data.operating_hours_notes}"\n}`
          : '{}'
      );
      setPlaceId('');
    } else {
      setName('');
      setBrand('');
      setAddress('');
      setCity('');
      setProvince('');
      setLatitude(null);
      setLongitude(null);
      setAmenities({});
      setOperatingHoursJson('{}');
      setPlaceId('');
      setValidationErrors({}); // Clear errors on report change
    }
  }, [report]);

  const handleAmenityChange = (key: string, isChecked: boolean) => {
    setAmenities((prev) => ({ ...prev, [key]: isChecked }));
  };

  // --- REFACTORED HANDLERS (Using Zod) ---
  const attemptStationCreationAndReportUpdate = async (): Promise<boolean> => {
    if (!report || !user) {
      Alert.alert('Error', 'Report data or admin user is missing.');
      return false;
    }

    const formData = {
      name: name.trim(),
      brand: brand.trim(),
      address: address.trim(),
      city: city.trim(),
      province: province.trim(),
      latitude: latitude, // Keep as number | null for initial check
      longitude: longitude, // Keep as number | null for initial check
      placeId: placeId.trim(),
      amenities: amenities,
      operatingHoursJson: operatingHoursJson || '{}',
    };

    // Use safeParse to validate
    const result = stationCreationSchema.safeParse(formData);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setValidationErrors(errors);
      console.error('Validation Errors:', JSON.stringify(errors, null, 2)); // Log detailed errors
      Alert.alert('Validation Error', 'Please check the highlighted fields.');
      return false;
    }

    // Clear errors if validation passes
    setValidationErrors({});

    // Data is valid, proceed
    const validatedData = result.data;

    // Parse operating hours JSON safely (already validated by Zod)
    const parsedOperatingHours = JSON.parse(validatedData.operatingHoursJson);

    const finalStationData: TablesInsert<'gas_stations'> = {
      name: validatedData.name,
      brand: validatedData.brand,
      address: validatedData.address,
      city: validatedData.city,
      province: validatedData.province,
      latitude: validatedData.latitude, // Now guaranteed to be a number
      longitude: validatedData.longitude, // Now guaranteed to be a number
      place_id: validatedData.placeId || null, // Convert empty string to null for DB
      amenities: validatedData.amenities,
      operating_hours: parsedOperatingHours as Json,
      status: 'active',
    };

    try {
      const success = await onConfirmAttempt(
        finalStationData,
        report.id,
        user.id
      );
      return success;
    } catch (error) {
      console.error('Error during station creation attempt:', error);
      Alert.alert('Error', 'Failed to create station. Please try again.');
      return false;
    }
  };

  const handleConfirmPress = async () => {
    const success = await attemptStationCreationAndReportUpdate();
    if (success) {
      onClose();
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
      // Android geo URI format: geo:latitude,longitude?z=zoom
      // Query parameters might not be universally supported for zoom on Android geo URIs
      // A simple lat,lng might be more reliable, opening the map centered.
      // Adding the query parameter anyway as it works on many devices.
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

  // --- END REFACTORED HANDLERS ---

  // Helper to render suggested data (read-only)
  const renderSuggestedData = () => {
    if (
      !report ||
      report.report_type !== 'add' ||
      !isValidReportedAddData(report.reported_data)
    ) {
      return null;
    }
    const reportedData = report.reported_data;
    const currentTextColor = Colors[colorScheme ?? 'light'].text;

    return (
      <View
        style={[
          styles.suggestionBox,
          {
            backgroundColor: Colors.lightGray,
            borderColor: Colors.lightGray,
          },
        ]}
      >
        <Text style={[styles.suggestionTitle, { color: currentTextColor }]}>
          User Suggestion:
        </Text>
        <Text style={{ color: currentTextColor }}>
          Name:{' '}
          {typeof reportedData.name === 'string' ? reportedData.name : 'N/A'}
        </Text>
        <Text style={{ color: currentTextColor }}>
          Brand:{' '}
          {typeof reportedData.brand === 'string' ? reportedData.brand : 'N/A'}
        </Text>
        <Text style={{ color: currentTextColor }}>
          Address:{' '}
          {typeof reportedData.address === 'string'
            ? reportedData.address
            : 'N/A'}
        </Text>
        <Text style={{ color: currentTextColor }}>
          City:{' '}
          {typeof reportedData.city === 'string' ? reportedData.city : 'N/A'}
        </Text>
        <Text style={{ color: currentTextColor }}>
          Province:{' '}
          {typeof reportedData.province === 'string'
            ? reportedData.province
            : 'N/A'}
        </Text>
        <Text style={{ color: currentTextColor }}>
          Coords: Lat {report.latitude?.toFixed(5)}, Lng{' '}
          {report.longitude?.toFixed(5)}
        </Text>
        <Text style={{ color: currentTextColor }}>
          Op Hours Notes:{' '}
          {typeof reportedData.operating_hours_notes === 'string'
            ? reportedData.operating_hours_notes
            : 'N/A'}
        </Text>
        <Text style={{ color: currentTextColor }}>
          Amenities:{' '}
          {typeof reportedData.amenities === 'object' &&
          reportedData.amenities !== null &&
          !Array.isArray(reportedData.amenities)
            ? Object.entries(reportedData.amenities || {})
                .filter(([, val]) => val === true)
                .map(([key]) => key)
                .join(', ') || 'None'
            : 'N/A'}
        </Text>
      </View>
    );
  };

  const currentTextColor = Colors[colorScheme ?? 'light'].text;

  const errorColor = Colors.error; // Define error color

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
              <Text style={[styles.modalTitle, { color: currentTextColor }]}>
                Confirm & Create Station
              </Text>

              {renderSuggestedData()}

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
                placeholderTextColor={Colors.mediumGray}
              />
              {renderError('name')}

              <Text style={[styles.label, { color: currentTextColor }]}>
                Brand:*
              </Text>
              <Input
                placeholder='e.g., Shell, Petron'
                value={brand}
                onChangeText={setBrand}
                style={[
                  styles.input,
                  validationErrors.brand && { borderColor: errorColor },
                ]}
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
                    typeof latitude !== 'number' ||
                    typeof longitude !== 'number'
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
                Google Place ID:*
              </Text>
              <Input
                placeholder='Find using Google Maps (Required)'
                value={placeId}
                onChangeText={setPlaceId}
                style={[
                  styles.input,
                  validationErrors.placeId && { borderColor: errorColor },
                ]}
                placeholderTextColor={Colors.mediumGray}
              />
              {renderError('placeId')}

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
                        style={[
                          styles.checkboxLabel,
                          { color: currentTextColor },
                        ]}
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
                placeholderTextColor={Colors.mediumGray}
              />
              {renderError('operatingHoursJson')}

              <View style={styles.buttonContainer}>
                <Button
                  title='Cancel'
                  onPress={handleCancel}
                  variant='outline'
                  style={styles.button}
                  disabled={isConfirming}
                />
                <Button
                  title={
                    isConfirming ? 'Processing...' : 'Confirm & Create Station'
                  }
                  onPress={handleConfirmPress}
                  style={styles.button}
                  loading={isConfirming}
                  disabled={isConfirming}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Styles moved to styles/components/admin/ConfirmAddStationModal.styles.ts
export default ConfirmAddStationModal;
