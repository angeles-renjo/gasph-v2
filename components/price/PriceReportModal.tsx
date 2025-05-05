import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FuelType } from '@/hooks/queries/prices/useBestPrices';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';
import { useLocationStore } from '@/hooks/stores/useLocationStore';
import { Colors } from '@/styles/theme';
import { formatFuelType } from '@/utils/formatters';

interface PriceReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  stationId: string;
  stationName: string;
  defaultFuelType?: FuelType;
}

export function PriceReportModal({
  isVisible,
  onClose,
  stationId,
  stationName,
  defaultFuelType = 'Diesel',
}: PriceReportModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userPreferredFuelType = usePreferencesStore.getState().defaultFuelType;
  const location = useLocationStore.getState().location;
  const [selectedFuelType, setSelectedFuelType] =
    useState<FuelType>(defaultFuelType);
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentCycle, setCurrentCycle] = useState<any>(null);

  useEffect(() => {
    if (isVisible && stationId) {
      fetchCurrentCycle();
    }
  }, [isVisible, stationId]);

  const fetchCurrentCycle = async () => {
    try {
      const { data, error } = await supabase
        .from('price_reporting_cycles')
        .select('id, cycle_number')
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching current cycle:', error.message);
      } else if (data) {
        setCurrentCycle(data);
      } else {
        console.log('No active price reporting cycle found.');
        setCurrentCycle(null);
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error('Unexpected error fetching current cycle:', err.message);
      } else {
        console.error('Unexpected error fetching current cycle:', err);
      }
    }
  };

  const handleReportPrice = async () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to report prices.'
      );
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid positive price.');
      return;
    }

    if (!currentCycle) {
      Alert.alert(
        'Price Cycle Unavailable',
        'Could not find an active price reporting cycle. Please try again shortly.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const { error: reportError } = await supabase
        .from('user_price_reports')
        .insert({
          station_id: stationId,
          fuel_type: selectedFuelType,
          price: parsedPrice,
          user_id: user.id,
          cycle_id: currentCycle.id,
        });

      if (reportError) throw reportError;

      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.contributions(user.id),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stations.detail(stationId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.prices.best.all(),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stations.fuelTypePrices(
          stationId,
          selectedFuelType
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stations.listWithPrice(selectedFuelType),
      });
      if (user?.id) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.stations.favorites.prices(
            user.id,
            userPreferredFuelType ?? undefined,
            location?.latitude,
            location?.longitude
          ),
        });
      }

      resetAndClose();
      Alert.alert(
        'Success',
        'Your price report has been submitted. Thank you for contributing!'
      );
    } catch (error: any) {
      console.error('Error submitting price report:', error);
      Alert.alert(
        'Submission Error',
        error.message || 'Failed to submit price report. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setPrice('');
    onClose();
  };

  useEffect(() => {
    if (defaultFuelType) {
      setSelectedFuelType(defaultFuelType);
    }
  }, [defaultFuelType]);

  const renderFuelTypeItem = ({ item }: { item: FuelType }) => (
    <TouchableOpacity
      style={[
        styles.fuelTypeOption,
        selectedFuelType === item && styles.selectedFuelType,
      ]}
      onPress={() => setSelectedFuelType(item)}
      disabled={submitting}
    >
      <Text
        style={[
          styles.fuelTypeOptionText,
          selectedFuelType === item && styles.selectedFuelTypeText,
        ]}
      >
        {formatFuelType(item)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType='slide'
      onRequestClose={resetAndClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Report Fuel Price</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={resetAndClose}
                  disabled={submitting}
                >
                  <FontAwesome5 name='times' size={20} color='#666' />
                </TouchableOpacity>
              </View>
              <View style={styles.modalHeaderButtons}>
                <Button
                  title='Cancel'
                  variant='outline'
                  onPress={resetAndClose}
                  style={{ minWidth: 100, flex: 1, marginRight: 8 }}
                  disabled={submitting}
                />
                <Button
                  title={submitting ? 'Submitting...' : 'Submit'}
                  onPress={handleReportPrice}
                  loading={submitting}
                  style={{ minWidth: 100, flex: 1, marginLeft: 8 }}
                  disabled={submitting || !currentCycle}
                />
              </View>
            </View>

            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps='handled'
            >
              <Text style={styles.modalStationName}>{stationName}</Text>

              {currentCycle ? (
                <View style={styles.cycleInfoContainer}>
                  <Text style={styles.cycleInfoLabel}>For price cycle:</Text>
                  <Text style={styles.cycleInfoValue}>
                    #{currentCycle.cycle_number}
                  </Text>
                </View>
              ) : (
                <View style={styles.cycleInfoContainer}>
                  <Text style={styles.cycleInfoLabel}>
                    Checking active price cycle...
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Fuel Type</Text>
              <FlatList
                data={
                  [
                    'Diesel',
                    'RON 91',
                    'RON 95',
                    'RON 97',
                    'RON 100',
                  ] as FuelType[]
                }
                renderItem={renderFuelTypeItem}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.fuelTypeList}
                contentContainerStyle={styles.fuelTypeListContent}
              />

              <Text style={styles.inputLabel}>Price (PHP)</Text>
              <Input
                placeholder='Enter current price'
                keyboardType='decimal-pad'
                value={price}
                onChangeText={setPrice}
                leftIcon={
                  <FontAwesome5 name='dollar-sign' size={16} color='#777' />
                }
                editable={!submitting}
              />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  closeButton: {
    padding: 8,
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalContent: {
    padding: 16,
  },
  modalStationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textGray,
    marginBottom: 16,
    textAlign: 'center',
  },
  cycleInfoContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cycleInfoLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    textAlign: 'center',
  },
  cycleInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.darkGray,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.darkGray,
    marginBottom: 8,
    marginTop: 8,
  },
  fuelTypeList: {
    marginBottom: 16,
  },
  fuelTypeListContent: {
    paddingHorizontal: 4,
  },
  fuelTypeOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e9e9e9',
    marginHorizontal: 4,
  },
  selectedFuelType: {
    backgroundColor: Colors.primary,
  },
  fuelTypeOptionText: {
    fontSize: 14,
    color: '#555',
  },
  selectedFuelTypeText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default PriceReportModal;
