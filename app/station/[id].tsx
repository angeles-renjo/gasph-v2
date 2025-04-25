import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router'; // Import useRouter
import { openDirections } from '@/utils/navigation';
import { FontAwesome5 } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient
import { useStationDetails } from '@/hooks/queries/stations/useStationDetails';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase/supabase';
import { PriceCard } from '@/components/price/PriceCard';
import { DOEPriceTable } from '@/components/price/DOEPriceTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Input } from '@/components/ui/Input';
import { formatOperatingHours } from '@/utils/formatters';
import { FuelType } from '@/hooks/queries/prices/useBestPrices';
import { queryKeys } from '@/hooks/queries/utils/queryKeys'; // Import queryKeys
import ReportStationModal from '@/components/station/ReportStationModal'; // Import the report modal
import FavoriteButton from '@/components/station/FavoriteButton';
import { useFavoriteStations } from '@/hooks/queries/stations/useFavoriteStations';

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter(); // Get router instance
  const queryClient = useQueryClient(); // Get query client instance
  const [reportModalVisible, setReportModalVisible] = useState(false); // For price reporting
  const [isStationReportModalVisible, setIsStationReportModalVisible] =
    useState(false); // For station problem reporting
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>('Diesel');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentCycle, setCurrentCycle] = useState<any>(null); // Consider typing this better

  // Fetch station details using TanStack Query
  const {
    data: station,
    isLoading,
    isError, // Renamed from error for clarity with query error object
    error: stationError, // Use the error object from the query
    refetch,
  } = useStationDetails(id || null);

  // Fetch favorite station IDs for the current user
  const { favoriteStationIds, isLoading: isFavoritesLoading } =
    useFavoriteStations(user?.id);

  // Fetch current price cycle
  useEffect(() => {
    if (id) {
      // Only fetch if id is available
      fetchCurrentCycle();
    }
  }, [id]); // Depend only on id

  const fetchCurrentCycle = async () => {
    try {
      const { data, error } = await supabase
        .from('price_reporting_cycles')
        // Removed start_date and end_date from select
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

  const openMapsApp = () => {
    if (!station?.latitude || !station?.longitude) {
      Alert.alert('Error', 'Station location not available.');
      return;
    }
    openDirections(station.latitude, station.longitude, station.name);
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
      // Optionally try fetching it again
      // await fetchCurrentCycle();
      // if (!currentCycle) return; // Check again after fetch attempt
      return;
    }

    try {
      setSubmitting(true);

      // Removed expiresAt calculation as end_date no longer exists

      // Submit the price report
      const { error: reportError } = await supabase
        .from('user_price_reports')
        .insert({
          station_id: id,
          fuel_type: selectedFuelType,
          price: parsedPrice, // Use parsed price
          user_id: user.id,
          // expires_at: expiresAt.toISOString(), // Removed non-existent column
          cycle_id: currentCycle.id,
        });

      if (reportError) throw reportError;

      // --- Invalidate Queries ---
      // Invalidate the user contributions query so ProfileScreen updates
      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.contributions(user.id), // user is guaranteed here
      });
      // Invalidate the station details for the *current* screen to show new report/confirmation state
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stations.detail(id),
      });
      // Invalidate best prices query as new data might affect it
      await queryClient.invalidateQueries({
        queryKey: queryKeys.prices.best.all(),
      });
      // Invalidate the specific fuel type prices query for the new screen
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stations.fuelTypePrices(id, selectedFuelType),
      });
      // --- Invalidate the map query ---
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stations.listWithPrice(selectedFuelType),
      });
      // Also invalidate for the 'none' case if that's relevant, or potentially all listWithPrice keys
      // For simplicity, let's just invalidate the specific one for now.
      // If users switch fuel types often, invalidating all might be better:
      // await queryClient.invalidateQueries({ queryKey: ['stations', 'listWithPrice'] });

      // Success feedback
      setReportModalVisible(false);
      setPrice(''); // Reset price input
      Alert.alert(
        'Success',
        'Your price report has been submitted. Thank you for contributing!'
      );
      // No need to call refetch() manually, invalidateQueries handles it for stationDetails
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

  // --- Render Logic ---

  if (isLoading) {
    return <LoadingIndicator fullScreen message='Loading station details...' />;
  }

  if (isError || !station) {
    return (
      <ErrorDisplay
        fullScreen
        message={stationError?.message || 'Failed to load station details.'}
        onRetry={refetch}
      />
    );
  }

  // No longer need to group prices here, the hook provides bestCommunityPrices

  // Check if there are any best prices to display
  const hasBestCommunityPrices =
    station.bestCommunityPrices &&
    Object.values(station.bestCommunityPrices).some((price) => !!price);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.stationName}>{station.name}</Text>
              <Text style={styles.stationBrand}>{station.brand}</Text>
              <Text style={styles.stationAddress}>
                {station.address}, {station.city}
              </Text>
            </View>
            {/* Favorite Button */}
            {user && (
              <FavoriteButton
                stationId={station.id}
                userId={user.id}
                favoriteStationIds={favoriteStationIds}
                size={32}
              />
            )}
          </View>
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
        <Button
          title='Report Problem'
          onPress={() => setIsStationReportModalVisible(true)} // Open the station report modal
          style={styles.actionButton}
          variant='outline' // Use outline or a different style
          leftIcon={
            <FontAwesome5
              name='exclamation-triangle'
              size={16}
              color='#f59e0b' // Example warning icon
            />
          }
        />
      </View>

      {/* Community Prices - Updated Logic */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Community Reported Prices</Text>

        {hasBestCommunityPrices ? (
          Object.entries(station.bestCommunityPrices).map(
            ([fuelType, bestPrice]) => {
              // Only render if a best price exists for this fuel type
              if (!bestPrice) return null;

              return (
                <View key={fuelType} style={styles.fuelTypeSection}>
                  <Text style={styles.fuelTypeTitle}>{fuelType}</Text>
                  <PriceCard
                    key={bestPrice.id} // Use bestPrice data
                    id={bestPrice.id}
                    station_id={id || ''}
                    fuel_type={bestPrice.fuel_type}
                    price={bestPrice.price}
                    reported_at={bestPrice.reported_at}
                    source='community'
                    username={bestPrice.username}
                    user_id={bestPrice.user_id}
                    confirmations_count={bestPrice.confirmations_count}
                    cycle_id={bestPrice.cycle_id}
                    isOwnReport={bestPrice.isOwnReport}
                  />
                  {/* Add placeholder link/button to view all reports */}
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => {
                      // Navigate to the community prices screen
                      router.push({
                        pathname: '/station/community-prices',
                        params: {
                          stationId: id,
                          fuelType: fuelType,
                          stationName: station.name, // Pass station name
                        },
                      });
                    }}
                  >
                    <Text style={styles.viewAllButtonText}>
                      View all reports
                    </Text>
                    <FontAwesome5
                      name='chevron-right'
                      size={12}
                      color='#2a9d8f'
                    />
                  </TouchableOpacity>
                </View>
              );
            }
          )
        ) : (
          // Corrected Else block for when no community prices exist
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

      {/* DOE Prices */}
      {station.doePrices && station.doePrices.length > 0 ? (
        <View style={styles.section}>
          <DOEPriceTable
            prices={station.doePrices.map((price) => ({
              // Provide defaults for potentially null fields from the view
              fuel_type: price.fuel_type ?? 'Unknown Fuel',
              min_price: price.min_price, // Already nullable in DOEPriceTable
              max_price: price.max_price, // Already nullable in DOEPriceTable
              common_price: price.common_price, // Already nullable in DOEPriceTable
              week_of: price.week_of ?? 'N/A', // Provide default if week_of is null
              // Map source_type from the view to the source prop, provide default
              source: price.source_type ?? 'Unknown Source',
            }))}
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
                          {key.charAt(0).toUpperCase() +
                            key.slice(1).replace(/_/g, ' ')}
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
                disabled={submitting} // Disable close while submitting
              >
                <FontAwesome5 name='times' size={20} color='#666' />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalStationName}>{station.name}</Text>

            {/* Add cycle information */}
            {currentCycle ? (
              <View style={styles.cycleInfoContainer}>
                <Text style={styles.cycleInfoLabel}>For price cycle:</Text>
                {/* Removed display of start/end date */}
                <Text style={styles.cycleInfoValue}>
                  #{currentCycle.cycle_number}
                </Text>
              </View>
            ) : (
              // Optionally show loading or message if cycle is still loading/null
              <View style={styles.cycleInfoContainer}>
                <Text style={styles.cycleInfoLabel}>
                  Checking active price cycle...
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
                  disabled={submitting} // Disable selection while submitting
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
              editable={!submitting} // Disable input while submitting
            />

            <View style={styles.modalFooter}>
              <Button
                title='Cancel'
                variant='outline'
                onPress={() => setReportModalVisible(false)}
                style={styles.modalButton}
                disabled={submitting} // Disable cancel while submitting
              />
              <Button
                title={submitting ? 'Submitting...' : 'Submit'}
                onPress={handleReportPrice}
                loading={submitting}
                style={styles.modalButton}
                disabled={submitting || !currentCycle} // Disable if submitting or no cycle
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Station Problem Report Modal */}
      {station && (
        <ReportStationModal
          isVisible={isStationReportModalVisible}
          onClose={() => setIsStationReportModalVisible(false)}
          stationId={station.id}
          stationName={station.name}
        />
      )}
    </ScrollView>
  );
}

// --- Styles ---
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
    gap: 8, // Add gap between buttons
  },
  actionButton: {
    flex: 1,
    // marginHorizontal: 4, // Remove horizontal margin if using gap
  },
  section: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#fff', // Add background to sections for better visual separation
    borderRadius: 8, // Optional: round corners
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
    paddingLeft: 4, // Align with cards
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
    padding: 12, // Reduce padding slightly
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12, // Reduce margin slightly
    alignItems: 'flex-start', // Align items at the top
  },
  infoIcon: {
    width: 24, // Slightly smaller icon width
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2, // Align icon better with text
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2, // Reduce margin
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20, // Improve readability
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  amenityBadge: {
    backgroundColor: '#e6f7f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 6,
    marginBottom: 6,
  },
  amenityText: {
    fontSize: 12,
    color: '#2a9d8f',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker overlay
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24, // More padding
    paddingBottom: 30, // More padding at bottom
    maxHeight: '85%', // Allow slightly more height
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20, // More margin
  },
  modalTitle: {
    fontSize: 22, // Larger title
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8, // Larger touch target
  },
  modalStationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16, // Reduced margin
    textAlign: 'center',
  },
  cycleInfoContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0', // Lighter background
  },
  cycleInfoLabel: {
    fontSize: 14,
    color: '#555', // Darker label
    marginBottom: 4,
    textAlign: 'center',
  },
  cycleInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 8, // Add margin top
  },
  fuelTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    justifyContent: 'center', // Center fuel types
  },
  fuelTypeOption: {
    paddingHorizontal: 14, // More padding
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e9e9e9', // Lighter inactive background
    margin: 4, // Use margin for spacing
  },
  selectedFuelType: {
    backgroundColor: '#2a9d8f',
  },
  fuelTypeOptionText: {
    fontSize: 14,
    color: '#555',
  },
  selectedFuelTypeText: {
    color: '#fff',
    fontWeight: 'bold', // Bold selected
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24, // More margin top
    paddingTop: 16, // Add padding top
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6, // Adjust spacing
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: -8, // Adjust to align nicely below the card
    marginBottom: 8,
  },
  viewAllButtonText: {
    fontSize: 13,
    color: '#2a9d8f',
    marginRight: 5,
    fontWeight: '500',
  },
});
