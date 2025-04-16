import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Pressable, // Import Pressable
} from 'react-native';
import { View, Text } from '@/components/Themed';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Checkbox from 'expo-checkbox';
import { Database, Tables, Json, TablesInsert } from '@/utils/supabase/types'; // Import TablesInsert
import { supabase } from '@/utils/supabase/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import theme from '@/styles/theme';
import { useAuth } from '@/hooks/useAuth'; // Needed for resolver_id

// Type for the report object passed as prop
type StationReport = Tables<'station_reports'> & {
  profile: { username: string | null } | null;
};
// Define the type for optimistic update context (copied from reports.tsx)
type StationReportWithUser = Tables<'station_reports'> & {
  profile: { username: string | null } | null;
};
// Type for the data structure within reported_data for 'add' reports
type ReportedAddData = {
  name?: unknown;
  brand?: unknown;
  address?: unknown;
  city?: unknown;
  province?: unknown;
  amenities?: unknown;
  operating_hours_notes?: unknown;
  comments?: unknown;
};

// Type guard to check if the reported_data is a valid object (non-null, non-array)
function isValidReportedAddData(
  data: Json | null
): data is Record<string, unknown> {
  return data !== null && typeof data === 'object' && !Array.isArray(data);
}

type ConfirmAddStationModalProps = {
  isVisible: boolean;
  onClose: () => void;
  report: StationReport | null; // The report to confirm/create from
};

// --- Mutation Hook for Creating Station ---
const useCreateStationMutation = () => {
  const queryClient = useQueryClient();
  const adminStationListKey = queryKeys.admin.stations.list();
  const mapStationsBaseKey = ['stations', 'listWithPrice']; // For invalidation

  return useMutation<
    Tables<'gas_stations'> | null,
    Error,
    TablesInsert<'gas_stations'>,
    { previousAdminStations?: Tables<'gas_stations'>[] } // Context ONLY for admin list rollback
  >({
    mutationFn: async (stationData) => {
      const { data, error } = await supabase
        .from('gas_stations')
        .insert(stationData)
        .select()
        .single();

      if (error) {
        console.error('Error creating station:', error);
        if (error.message.includes('gas_stations_place_id_unique')) {
          throw new Error(`Station with this Google Place ID already exists.`);
        }
        if (error.message.includes('gas_stations_name_address_unique')) {
          throw new Error(`Station with this Name and Address already exists.`);
        }
        throw new Error(error.message || 'Failed to create station.');
      }
      return data;
    },
    // Optimistic Update ONLY for Admin List
    onMutate: async (newStationData) => {
      await queryClient.cancelQueries({ queryKey: adminStationListKey });
      const previousAdminStations =
        queryClient.getQueryData<Tables<'gas_stations'>[]>(adminStationListKey);

      const optimisticStation: Tables<'gas_stations'> = {
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
        ...newStationData,
        amenities: newStationData.amenities ?? {},
        operating_hours: newStationData.operating_hours ?? {},
        place_id: newStationData.place_id ?? null,
      };

      if (previousAdminStations) {
        queryClient.setQueryData<Tables<'gas_stations'>[]>(
          adminStationListKey,
          [...previousAdminStations, optimisticStation]
        );
      }
      // No map cache update here
      return { previousAdminStations };
    },
    onError: (err, newStationData, context) => {
      // Rollback admin list
      if (context?.previousAdminStations) {
        queryClient.setQueryData<Tables<'gas_stations'>[]>(
          adminStationListKey,
          context.previousAdminStations
        );
      }
      // Error is handled by the component calling mutateAsync
    },
    onSettled: () => {
      // Invalidate admin list AND map lists to trigger refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.stations.list(),
      });
      queryClient.invalidateQueries({ queryKey: mapStationsBaseKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.stations.list() });
    },
  });
};
// --- End Create Station Mutation ---

// --- Re-use Update Report Status Mutation (or create a dedicated one if needed) ---
const useUpdateReportStatusMutation = () => {
  const queryClient = useQueryClient();
  const pendingReportsQueryKey = queryKeys.admin.reports.list('pending');

  return useMutation<
    void,
    Error,
    {
      reportId: string;
      newStatus: Database['public']['Enums']['report_status'];
      resolverId: string;
    },
    { previousReports?: StationReportWithUser[] }
  >({
    mutationFn: async ({ reportId, newStatus, resolverId }) => {
      const { error } = await supabase
        .from('station_reports')
        .update({
          status: newStatus,
          resolved_at: new Date().toISOString(),
          resolver_id: resolverId,
        })
        .eq('id', reportId);
      if (error) throw error;
    },
    onMutate: async ({ reportId }) => {
      await queryClient.cancelQueries({ queryKey: pendingReportsQueryKey });
      const previousReports = queryClient.getQueryData<StationReportWithUser[]>(
        pendingReportsQueryKey
      );
      if (previousReports) {
        queryClient.setQueryData<StationReportWithUser[]>(
          pendingReportsQueryKey,
          previousReports.filter((report) => report.id !== reportId)
        );
      }
      return { previousReports };
    },
    onError: (err, variables, context) => {
      if (context?.previousReports) {
        queryClient.setQueryData<StationReportWithUser[]>(
          pendingReportsQueryKey,
          context.previousReports
        );
      }
      console.error('Error updating report status:', err);
      // Error handled by caller (handleConfirmCreate)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: pendingReportsQueryKey });
    },
    onSuccess: (data, variables) => {
      // No Alert here, handled by caller
      if (variables.newStatus === 'approved') {
        console.warn('Report approved (ID:', variables.reportId);
      }
    },
  });
};
// --- End Update Report Status Mutation ---

const ConfirmAddStationModal: React.FC<ConfirmAddStationModalProps> = ({
  isVisible,
  onClose,
  report,
}) => {
  // State for editable fields, initialized from the report
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState(''); // Google Place ID - Required
  const [amenities, setAmenities] = useState<Record<string, boolean>>({});
  const [operatingHoursJson, setOperatingHoursJson] = useState('{}'); // Admin inputs JSON string

  const createStationMutation = useCreateStationMutation();
  const updateReportStatusMutation = useUpdateReportStatusMutation();
  const { user } = useAuth(); // Get current admin user

  // Effect to populate state when report prop changes
  useEffect(() => {
    if (
      report &&
      report.report_type === 'add' &&
      isValidReportedAddData(report.reported_data) // Use type guard
    ) {
      const data = report.reported_data; // Already narrowed type
      setName(typeof data.name === 'string' ? data.name : '');
      setBrand(typeof data.brand === 'string' ? data.brand : '');
      setAddress(typeof data.address === 'string' ? data.address : '');
      setCity(typeof data.city === 'string' ? data.city : '');
      setProvince(typeof data.province === 'string' ? data.province : '');
      setLatitude(report.latitude ?? null);
      setLongitude(report.longitude ?? null);
      setAmenities(
        typeof data.amenities === 'object' && !Array.isArray(data.amenities)
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
      // Reset if report is null or not an 'add' report
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

  const handleConfirmCreate = async () => {
    if (!report || !user) {
      Alert.alert('Error', 'Report data or admin user is missing.');
      return;
    }
    if (!placeId.trim()) {
      Alert.alert('Error', 'Google Place ID is required.');
      return;
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
      return;
    }

    let parsedOperatingHours = {};
    try {
      parsedOperatingHours = JSON.parse(operatingHoursJson || '{}');
      if (
        typeof parsedOperatingHours !== 'object' ||
        Array.isArray(parsedOperatingHours)
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

    try {
      await createStationMutation.mutateAsync(finalStationData);
      await updateReportStatusMutation.mutateAsync({
        reportId: report.id,
        newStatus: 'approved',
        resolverId: user.id,
      });
      Alert.alert('Success', 'Station created and report approved.');
      handleClose();
    } catch (error: any) {
      Alert.alert(
        'Operation Failed',
        error.message || 'An unexpected error occurred.'
      );
    }
  };

  const handleClose = () => {
    createStationMutation.reset();
    updateReportStatusMutation.reset();
    onClose();
  };

  if (!isVisible || !report || report.report_type !== 'add') {
    return null;
  }

  const reportedData = isValidReportedAddData(report.reported_data)
    ? (report.reported_data as ReportedAddData) // Cast after check
    : {};

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
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Confirm & Create Station</Text>
              <Text style={styles.subTitle}>
                Review user suggestion and add Place ID.
              </Text>

              {/* Display User Suggestion (Readonly) */}
              <View style={styles.suggestionBox}>
                <Text style={styles.suggestionTitle}>User Suggestion:</Text>
                <Text>
                  Name:{' '}
                  {typeof reportedData.name === 'string'
                    ? reportedData.name
                    : 'N/A'}
                </Text>
                <Text>
                  Brand:{' '}
                  {typeof reportedData.brand === 'string'
                    ? reportedData.brand
                    : 'N/A'}
                </Text>
                <Text>
                  Address:{' '}
                  {typeof reportedData.address === 'string'
                    ? reportedData.address
                    : 'N/A'}
                </Text>
                <Text>
                  City:{' '}
                  {typeof reportedData.city === 'string'
                    ? reportedData.city
                    : 'N/A'}
                </Text>
                <Text>
                  Province:{' '}
                  {typeof reportedData.province === 'string'
                    ? reportedData.province
                    : 'N/A'}
                </Text>
                <Text>
                  Coords: Lat {report.latitude?.toFixed(5)}, Lng{' '}
                  {report.longitude?.toFixed(5)}
                </Text>
                <Text>
                  Op. Hours Notes:{' '}
                  {typeof reportedData.operating_hours_notes === 'string'
                    ? reportedData.operating_hours_notes
                    : 'N/A'}
                </Text>
                <Text>
                  Amenities:{' '}
                  {typeof reportedData.amenities === 'object' &&
                  !Array.isArray(reportedData.amenities)
                    ? Object.entries(reportedData.amenities || {})
                        .filter(([_, v]) => v === true) // Ensure value is boolean true
                        .map(([k]) => k.replace(/_/g, ' '))
                        .join(', ') || 'None'
                    : 'None'}
                </Text>
              </View>

              {/* Editable Fields for Admin */}
              <Text style={styles.label}>Station Name:*</Text>
              <Input value={name} onChangeText={setName} style={styles.input} />

              <Text style={styles.label}>Brand:*</Text>
              <Input
                value={brand}
                onChangeText={setBrand}
                style={styles.input}
              />

              <Text style={styles.label}>Address:*</Text>
              <Input
                value={address}
                onChangeText={setAddress}
                style={styles.input}
              />

              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>City:*</Text>
                  <Input
                    value={city}
                    onChangeText={setCity}
                    style={styles.input}
                  />
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Province:*</Text>
                  <Input
                    value={province}
                    onChangeText={setProvince}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Latitude:*</Text>
                  <Input
                    value={latitude?.toString() ?? ''}
                    onChangeText={(t) => setLatitude(parseFloat(t) || null)}
                    style={styles.input}
                    keyboardType='numeric'
                  />
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Longitude:*</Text>
                  <Input
                    value={longitude?.toString() ?? ''}
                    onChangeText={(t) => setLongitude(parseFloat(t) || null)}
                    style={styles.input}
                    keyboardType='numeric'
                  />
                </View>
              </View>

              <Text style={styles.label}>Google Place ID:*</Text>
              <Input
                placeholder='Paste Google Place ID here'
                value={placeId}
                onChangeText={setPlaceId}
                style={styles.input}
              />

              {/* Editable Amenities */}
              <Text style={styles.label}>Amenities:</Text>
              <View style={styles.amenitiesContainer}>
                {[
                  'Convenience Store',
                  'Restroom',
                  'ATM',
                  'Air/Water',
                  'Car Wash',
                ].map((amenity) => {
                  const key = amenity.toLowerCase().replace(/ /g, '_');
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
                        color={
                          amenities[key] ? theme.Colors.primary : undefined
                        }
                      />
                      <Text style={styles.checkboxLabel}>{amenity}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Operating Hours (JSON):</Text>
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
                  onPress={handleClose}
                  variant='outline'
                  style={styles.button}
                  disabled={
                    createStationMutation.isPending ||
                    updateReportStatusMutation.isPending
                  }
                />
                <Button
                  title={
                    createStationMutation.isPending ||
                    updateReportStatusMutation.isPending
                      ? 'Processing...'
                      : 'Confirm & Create Station'
                  }
                  onPress={handleConfirmCreate}
                  style={styles.button}
                  loading={
                    createStationMutation.isPending ||
                    updateReportStatusMutation.isPending
                  }
                  disabled={
                    createStationMutation.isPending ||
                    updateReportStatusMutation.isPending
                  }
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: { flex: 1 },
  scrollViewContent: { flexGrow: 1, justifyContent: 'center' },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20, // Slightly less padding
    paddingTop: 25,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    marginBottom: 5,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
    color: 'grey',
  },
  suggestionBox: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  suggestionTitle: { fontWeight: 'bold', marginBottom: 5 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4, marginTop: 8 },
  input: { marginBottom: 10 },
  jsonInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  column: { flex: 1, marginHorizontal: 4 },
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
  checkboxLabel: { fontSize: 14 },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: { flex: 1, marginHorizontal: 5 },
});

export default ConfirmAddStationModal;
