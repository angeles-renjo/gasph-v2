import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FuelType } from '@/hooks/queries/prices/useBestPrices';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore'; // Import preferences store
import { useLocationStore } from '@/hooks/stores/useLocationStore'; // Import location store
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme';
import { formatFuelType } from '@/utils/formatters';

interface PriceReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  stationId: string;
  stationName: string;
  defaultFuelType?: FuelType; // Optional default fuel type from map or parent component
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
  // Get necessary state for invalidating the favorites prices query
  const userPreferredFuelType = usePreferencesStore.getState().defaultFuelType;
  const location = useLocationStore.getState().location;
  const [selectedFuelType, setSelectedFuelType] =
    useState<FuelType>(defaultFuelType);
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentCycle, setCurrentCycle] = useState<any>(null); // TODO: Better typing

  // Fetch current price cycle when modal becomes visible
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

    // Re-fetch or ensure currentCycle is available
    if (!currentCycle) {
      Alert.alert(
        'Price Cycle Unavailable',
        'Could not find an active price reporting cycle. Please try again shortly.'
      );
      return;
    }

    try {
      setSubmitting(true);

      // Submit the price report
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

      // --- Invalidate Queries ---
      // Invalidate the user contributions query so ProfileScreen updates
      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.contributions(user.id),
      });
      // Invalidate the station details for the current screen
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stations.detail(stationId),
      });
      // Invalidate best prices query as new data might affect it
      await queryClient.invalidateQueries({
        queryKey: queryKeys.prices.best.all(),
      });
      // Invalidate the specific fuel type prices query
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stations.fuelTypePrices(
          stationId,
          selectedFuelType
        ),
      });
      // Invalidate the map query
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stations.listWithPrice(selectedFuelType),
      });
      // --- Invalidate Favorite Prices Query ---
      if (user?.id) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.stations.favorites.prices(
            user.id,
            userPreferredFuelType ?? undefined, // Use the user's preferred type for the key
            location?.latitude,
            location?.longitude
          ),
        });
      }
      // --- End Invalidation ---

      // Success feedback
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
    // Don't reset the selected fuel type to maintain user preference
  };

  // When defaultFuelType prop changes, update the selected fuel type
  useEffect(() => {
    if (defaultFuelType) {
      setSelectedFuelType(defaultFuelType);
    }
  }, [defaultFuelType]);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType='slide'
      onRequestClose={resetAndClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Fuel Price</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={resetAndClose}
              disabled={submitting}
            >
              <FontAwesome5 name='times' size={20} color='#666' />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalStationName}>{stationName}</Text>

          {/* Cycle information */}
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
          <View style={styles.fuelTypeSelector}>
            {(
              ['Diesel', 'RON 91', 'RON 95', 'RON 97', 'RON 100'] as FuelType[]
            ).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.fuelTypeOption,
                  selectedFuelType === type && styles.selectedFuelType,
                ]}
                onPress={() => setSelectedFuelType(type)}
                disabled={submitting}
              >
                <Text
                  style={[
                    styles.fuelTypeOptionText,
                    selectedFuelType === type && styles.selectedFuelTypeText,
                  ]}
                >
                  {formatFuelType(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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

          <View style={styles.modalFooter}>
            <Button
              title='Cancel'
              variant='outline'
              onPress={resetAndClose}
              style={styles.modalButton}
              disabled={submitting}
            />
            <Button
              title={submitting ? 'Submitting...' : 'Submit'}
              onPress={handleReportPrice}
              loading={submitting}
              style={styles.modalButton}
              disabled={submitting || !currentCycle}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  closeButton: {
    padding: 8,
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
  fuelTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    justifyContent: 'center',
  },
  fuelTypeOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e9e9e9',
    margin: 4,
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
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6,
  },
});

export default PriceReportModal;
