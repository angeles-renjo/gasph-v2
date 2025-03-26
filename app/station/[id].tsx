// app/station/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useStationDetails } from '@/hooks/useStationDetails';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase/supabase';
import { PriceCard } from '@/components/price/PriceCard';
import { DOEPriceTable } from '@/components/price/DOEPriceTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Input } from '@/components/ui/Input';
import { formatDate, formatOperatingHours } from '@/utils/formatters';
import { FuelType } from '@/hooks/useBestPrices';

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>('Diesel');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentCycle, setCurrentCycle] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchCurrentCycle();
    }
  }, [id]);

  const fetchCurrentCycle = async () => {
    try {
      const { data, error } = await supabase
        .from('price_reporting_cycles')
        .select('*')
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching current cycle:', error);
      } else if (data) {
        setCurrentCycle(data);
      }
    } catch (error) {
      console.error('Error fetching current cycle:', error);
    }
  };

  const {
    data: station,
    isLoading,
    error,
    refetch,
  } = useStationDetails(id || null);

  const openMapsApp = () => {
    if (station) {
      const url = `https://maps.google.com/?q=${station.latitude},${station.longitude}`;
      Linking.openURL(url);
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

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    try {
      setSubmitting(true);

      // Get current price cycle
      const { data: cycles, error: cycleError } = await supabase
        .from('price_reporting_cycles')
        .select('*')
        .eq('status', 'active')
        .single();

      if (cycleError) throw cycleError;

      if (!cycles) {
        Alert.alert(
          'Error',
          'No active price cycle found. Please try again later.'
        );
        return;
      }

      // Set expiration date to the end of the current cycle
      const expiresAt = new Date(cycles.end_date);

      // Submit the price report
      const { error: reportError } = await supabase
        .from('user_price_reports')
        .insert({
          station_id: id,
          fuel_type: selectedFuelType,
          price: parseFloat(price),
          user_id: user.id,
          expires_at: expiresAt.toISOString(),
          cycle_id: cycles.id,
        });

      if (reportError) throw reportError;

      // Success
      setReportModalVisible(false);
      setPrice('');
      Alert.alert(
        'Success',
        'Your price report has been submitted. Thank you for contributing!'
      );
      refetch();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to submit price report. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingIndicator fullScreen message='Loading station details...' />;
  }

  if (error || !station) {
    return (
      <ErrorDisplay
        fullScreen
        message='Failed to load station details. Please try again.'
        onRetry={refetch}
      />
    );
  }

  // Group price reports by fuel type
  const pricesByFuelType: Record<string, any[]> = {};
  station.communityPrices.forEach((price) => {
    if (!pricesByFuelType[price.fuel_type]) {
      pricesByFuelType[price.fuel_type] = [];
    }
    pricesByFuelType[price.fuel_type].push(price);
  });

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.stationName}>{station.name}</Text>
          <Text style={styles.stationBrand}>{station.brand}</Text>
          <Text style={styles.stationAddress}>
            {station.address}, {station.city}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <Button
          title='Report Price'
          onPress={() => setReportModalVisible(true)}
          style={styles.actionButton}
          variant='primary'
          leftIcon={<FontAwesome5 name='dollar-sign' size={16} color='#fff' />}
        />
        <Button
          title='Directions'
          onPress={openMapsApp}
          style={styles.actionButton}
          variant='outline'
          leftIcon={
            <FontAwesome5 name='directions' size={16} color='#2a9d8f' />
          }
        />
      </View>

      {/* Community Prices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Community Reported Prices</Text>

        {Object.keys(pricesByFuelType).length > 0 ? (
          Object.entries(pricesByFuelType).map(([fuelType, prices]) => (
            <View key={fuelType} style={styles.fuelTypeSection}>
              <Text style={styles.fuelTypeTitle}>{fuelType}</Text>
              {prices.map((price) => (
                <PriceCard
                  key={price.id}
                  id={price.id}
                  stationId={id || ''}
                  fuelType={price.fuel_type}
                  price={price.price}
                  date={price.reported_at}
                  source='community'
                  username={price.reporter_username}
                  userId={price.user_id}
                  confirmationsCount={price.confirmationsCount}
                  userHasConfirmed={price.userHasConfirmed}
                  isOwnReport={price.isOwnReport}
                />
              ))}
            </View>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No community price reports yet. Be the first to report a price!
            </Text>
            <Button
              title='Report Price'
              onPress={() => setReportModalVisible(true)}
              variant='outline'
              size='small'
              style={styles.emptyCardButton}
            />
          </Card>
        )}
      </View>
      {station.doePrices && station.doePrices.length > 0 ? (
        <View style={styles.section}>
          <DOEPriceTable
            prices={station.doePrices}
            latestDate={station.latestDOEDate}
          />
        </View>
      ) : (
        <View style={styles.section}>
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No DOE reference data available for this station.
            </Text>
          </Card>
        </View>
      )}

      {/* Station Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Station Information</Text>
        <Card style={styles.infoCard}>
          {/* Operating Hours */}
          {station.operating_hours &&
            Object.keys(station.operating_hours).length > 0 && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name='clock' size={16} color='#2a9d8f' />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Operating Hours</Text>
                  <Text style={styles.infoValue}>
                    {formatOperatingHours(station.operating_hours)}
                  </Text>
                </View>
              </View>
            )}

          {/* Amenities */}
          {station.amenities && Object.keys(station.amenities).length > 0 && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <FontAwesome5 name='store' size={16} color='#2a9d8f' />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Amenities</Text>
                <View style={styles.amenitiesContainer}>
                  {Object.entries(station.amenities as Record<string, boolean>)
                    .filter(([_, value]) => value)
                    .map(([key]) => (
                      <View key={key} style={styles.amenityBadge}>
                        <Text style={styles.amenityText}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            </View>
          )}
        </Card>
      </View>

      {/* Price Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType='slide'
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Fuel Price</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setReportModalVisible(false)}
              >
                <FontAwesome5 name='times' size={20} color='#666' />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalStationName}>{station.name}</Text>

            {/* Add cycle information */}
            {currentCycle && (
              <View style={styles.cycleInfoContainer}>
                <Text style={styles.cycleInfoLabel}>For price cycle:</Text>
                <Text style={styles.cycleInfoValue}>
                  #{currentCycle.cycle_number}:{' '}
                  {formatDate(currentCycle.start_date)} to{' '}
                  {formatDate(currentCycle.end_date)}
                </Text>
              </View>
            )}
            <Text style={styles.inputLabel}>Fuel Type</Text>
            <View style={styles.fuelTypeSelector}>
              {(
                [
                  'Diesel',
                  'RON 91',
                  'RON 95',
                  'RON 97',
                  'RON 100',
                ] as FuelType[]
              ).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.fuelTypeOption,
                    selectedFuelType === type && styles.selectedFuelType,
                  ]}
                  onPress={() => setSelectedFuelType(type)}
                >
                  <Text
                    style={[
                      styles.fuelTypeOptionText,
                      selectedFuelType === type && styles.selectedFuelTypeText,
                    ]}
                  >
                    {type}
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
            />

            <View style={styles.modalFooter}>
              <Button
                title='Cancel'
                variant='outline'
                onPress={() => setReportModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title='Submit'
                onPress={handleReportPrice}
                loading={submitting}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2a9d8f',
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  headerContent: {
    marginTop: 10,
  },
  stationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  stationBrand: {
    fontSize: 16,
    color: '#e6f7f5',
    marginBottom: 8,
  },
  stationAddress: {
    fontSize: 14,
    color: '#e6f7f5',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  fuelTypeSection: {
    marginBottom: 16,
  },
  fuelTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyCardButton: {
    marginTop: 8,
  },
  infoCard: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityBadge: {
    backgroundColor: '#e6f7f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  amenityText: {
    fontSize: 12,
    color: '#2a9d8f',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalStationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  fuelTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  fuelTypeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFuelType: {
    backgroundColor: '#2a9d8f',
  },
  fuelTypeOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedFuelTypeText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  debugCard: {
    padding: 14,
  },

  cycleInfoContainer: {
    marginBottom: 16,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  cycleInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cycleInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});
