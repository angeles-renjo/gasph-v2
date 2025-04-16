import React, { useState, useEffect } from 'react';
import {
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
  useColorScheme,
} from 'react-native';
import { View, Text } from '@/components/Themed';
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
    }
  }, [report]);

  const handleAmenityChange = (key: string, isChecked: boolean) => {
    setAmenities((prev) => ({ ...prev, [key]: isChecked }));
  };

  // --- REFACTORED HANDLERS (Remain the same internally) ---
  const attemptStationCreationAndReportUpdate = async (): Promise<boolean> => {
    if (!report || !user) {
      Alert.alert('Error', 'Report data or admin user is missing.');
      return false;
    }
    if (!placeId.trim()) {
      Alert.alert('Error', 'Google Place ID is required.');
      return false;
    }
    if (
      !name.trim() ||
      !brand.trim() ||
      !address.trim() ||
      !city.trim() ||
      !province.trim() ||
      latitude === null ||
      longitude === null
    ) {
      Alert.alert(
        'Error',
        'Please ensure all required station fields are filled.'
      );
      return false;
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
      return false;
    }

    const finalStationData: TablesInsert<'gas_stations'> = {
      name: name.trim(),
      brand: brand.trim(),
      address: address.trim(),
      city: city.trim(),
      province: province.trim(),
      latitude: latitude,
      longitude: longitude,
      place_id: placeId.trim(),
      amenities: amenities,
      operating_hours: parsedOperatingHours as Json,
      status: 'active',
    };

    const success = await onConfirmAttempt(
      finalStationData,
      report.id,
      user.id
    );
    return success;
  };

  const handleConfirmPress = async () => {
    const success = await attemptStationCreationAndReportUpdate();
    if (success) {
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };
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
              <Input value={name} onChangeText={setName} style={styles.input} />

              <Text style={[styles.label, { color: currentTextColor }]}>
                Brand:*
              </Text>
              <Input
                placeholder='e.g., Shell, Petron'
                value={brand}
                onChangeText={setBrand}
                style={styles.input}
              />

              <Text style={[styles.label, { color: currentTextColor }]}>
                Address:*
              </Text>
              <Input
                placeholder='Street Address'
                value={address}
                onChangeText={setAddress}
                style={styles.input}
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
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: currentTextColor }]}>
                Google Place ID:*
              </Text>
              <Input
                placeholder='Find using Google Maps (Required)'
                value={placeId}
                onChangeText={setPlaceId}
                style={styles.input}
              />

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
              />

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
