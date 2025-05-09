import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useStationFuelTypePrices } from '@/hooks/queries/stations/useStationFuelTypePrices';
import type { GasStation } from '@/hooks/queries/stations/useNearbyStations';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices';
import { formatPrice, formatFuelType, formatDate } from '@/utils/formatters';
import { Colors, Spacing } from '@/styles/theme';
import { openDirections } from '@/utils/navigation';
import ReportStationModal from '../station/ReportStationModal';
import PriceReportModal from '../price/PriceReportModal'; // Import the PriceReportModal component
import { usePriceConfirmation } from '@/hooks/queries/prices/usePriceConfirmation';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import FavoriteButton from '@/components/station/FavoriteButton';
import { useFavoriteStations } from '@/hooks/queries/stations/useFavoriteStations';

// Import the new hook for DOE price
import { useStationDoePrice } from '@/hooks/queries/stations/useStationDoePrice';
// Import the moved styles
import { styles } from '@/styles/components/map/StationInfoModal.styles';
import { Button } from '../ui/Button';

interface StationInfoModalProps {
  station: GasStation | null;
  fuelType: FuelType | null;
  isVisible: boolean;
  onClose: () => void;
}

// Helper to format DOE source type
const formatDoeSourceType = (sourceType: string | null | undefined) => {
  if (!sourceType) return 'N/A';
  if (sourceType === 'BRAND_SPECIFIC') return 'Brand Specific';
  // Improved formatting for other types like 'RETAIL_OUTLET' -> 'Retail Outlet'
  return sourceType
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize each word
};

export function StationInfoModal({
  station,
  fuelType,
  isVisible,
  onClose,
}: StationInfoModalProps) {
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isPriceReportModalVisible, setIsPriceReportModalVisible] =
    useState(false);

  // --- Auth and Query Client ---
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // --- Price Confirmation ---
  const { mutate: confirmPrice, isPending: isConfirming } =
    usePriceConfirmation();

  // --- Favorite Stations ---
  const { favoriteStationIds } = useFavoriteStations(user?.id);

  // --- Fetch Community Price ---
  const {
    data: communityPriceData,
    isLoading: communityLoading,
    error: communityError,
  } = useStationFuelTypePrices(station?.id ?? null, fuelType);

  // Get the latest price report
  const latestCommunityPrice = communityPriceData?.[0];

  // --- Fetch DOE Price using the new hook ---
  const {
    data: doePriceDataResult,
    isLoading: isDoeLoading,
    error: doeError,
  } = useStationDoePrice(station?.id, fuelType);

  // --- Display Logic ---
  const isCommunityLoading = communityLoading;
  const hasDoeError = !!doeError;
  const hasCommunityError = !!communityError;
  const showNoOfficialData =
    !isDoeLoading && !hasDoeError && !doePriceDataResult;

  // --- Router ---
  const router = useRouter();

  // --- Directions Handler ---
  const handleDirections = () => {
    if (!station) return;
    const { latitude, longitude, name } = station;
    openDirections(latitude, longitude, name);
  };

  // --- Report Station Handler ---
  const handleReportPress = () => {
    setIsReportModalVisible(true);
  };

  // --- Report Price Handler ---
  const handleReportPricePress = () => {
    setIsPriceReportModalVisible(true);
  };

  // --- Confirm Price Handler ---
  const handleConfirmPrice = (e: any) => {
    // Stop event propagation to prevent navigation
    e.stopPropagation();

    if (!user) {
      Alert.alert('Login Required', 'You must be logged in to confirm prices.');
      return;
    }

    if (!latestCommunityPrice) {
      Alert.alert(
        'No Price to Confirm',
        'There is no community price to confirm.'
      );
      return;
    }

    if (latestCommunityPrice.user_id === user.id) {
      Alert.alert(
        'Cannot Confirm Own Report',
        'You cannot confirm your own price report.'
      );
      return;
    }

    confirmPrice(
      { reportId: latestCommunityPrice.id, stationId: station?.id || '' },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Price confirmed!');
          // Invalidate relevant queries
          queryClient.invalidateQueries({
            queryKey: queryKeys.stations.fuelTypePrices(
              station?.id || '',
              fuelType || 'none'
            ),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.stations.listWithPrice(fuelType || 'none'),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.prices.best.all(),
          });
        },
        onError: (error: any) => {
          console.error('Confirmation Error:', error);
          if (error?.code === '23505') {
            Alert.alert(
              'Already Confirmed',
              'You have already confirmed this price report.'
            );
          } else {
            Alert.alert(
              'Confirmation Failed',
              error?.message || 'Could not confirm the price. Please try again.'
            );
          }
        },
      }
    );
  };

  // --- Navigate to Station Details ---
  const handleNavigateToStation = () => {
    if (!station) return;
    onClose(); // Close the modal first
    router.push(`/station/${station.id}`);
  };

  // Render nothing if no station is selected or modal is not visible
  if (!station || !isVisible) {
    return null;
  }

  const renderPriceBlock = (
    label: string,
    value: number | null | undefined,
    highlight = false
  ) => (
    <View style={[styles.priceBlock, highlight && styles.priceBlockHighlight]}>
      <Text style={styles.priceBlockLabel}>{label}</Text>
      <Text style={styles.priceBlockValue}>
        {value !== null && value !== undefined ? formatPrice(value) : '--'}
      </Text>
    </View>
  );

  return (
    <Modal
      animationType='slide'
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.centeredView}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View style={styles.modalView} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.headerTextContainer}>
              {/* Container for Title */}
              <Text style={styles.modalTitle}>{station.name}</Text>
              <View style={styles.addressContainer}>
                <Feather
                  name='map-pin'
                  size={14}
                  color={Colors.primary}
                  style={styles.addressIcon}
                />
                <Text style={styles.modalAddress} numberOfLines={2}>
                  {station.address}
                </Text>
              </View>
            </View>
            {/* Favorite Button - Replacing the Close Button */}
            {user && (
              <View style={styles.closeButton}>
                <FavoriteButton
                  stationId={station.id}
                  userId={user.id}
                  favoriteStationIds={favoriteStationIds}
                  size={28}
                />
              </View>
            )}
          </View>

          {/* Scrollable Content Area - Wrapped for Navigation */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNavigateToStation}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContentContainer}
              scrollEnabled={false}
            >
              {/* Price Section */}
              {fuelType && (
                <>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      padding: Spacing.sm,
                    }}
                  >
                    <Text style={styles.sectionTitle}>
                      Price for {formatFuelType(fuelType)}
                    </Text>
                    {/* Report Price Button */}

                    <Button
                      title='Add Price'
                      onPress={handleReportPricePress}
                    />
                  </View>
                  {/* Report Price Button */}

                  {/* DOE Badge & Warning Row */}
                  <View style={styles.badgeWarningRow}>
                    <View style={styles.doeBadge}>
                      <Text style={styles.doeBadgeText}>
                        DOE:{' '}
                        {formatDoeSourceType(doePriceDataResult?.source_type)}
                      </Text>
                    </View>
                    {/* Week of date display */}
                    <Text style={styles.doeWeekOf}>
                      As of{' '}
                      {doePriceDataResult?.week_of
                        ? formatDate(doePriceDataResult.week_of)
                        : 'N/A'}
                    </Text>
                    {showNoOfficialData && (
                      <View style={styles.warningContainer}>
                        <Feather
                          name='alert-circle'
                          size={12}
                          color={Colors.warning}
                          style={styles.warningIcon}
                        />
                        <Text style={styles.warningText}>
                          No official data available
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* DOE Price Grid / Loader / Error */}
                  {isDoeLoading && (
                    <ActivityIndicator
                      size='small'
                      color={Colors.primary}
                      style={styles.inlineLoader}
                    />
                  )}
                  {hasDoeError && !isDoeLoading && (
                    <Text style={styles.errorTextSmall}>
                      Error loading DOE prices
                    </Text>
                  )}
                  {!isDoeLoading && !hasDoeError && doePriceDataResult && (
                    <View style={styles.priceGridContainer}>
                      {renderPriceBlock('Min', doePriceDataResult?.min_price)}
                      {renderPriceBlock(
                        'Common',
                        doePriceDataResult?.common_price,
                        true
                      )}
                      {renderPriceBlock('Max', doePriceDataResult?.max_price)}
                    </View>
                  )}
                  {/* Render empty grid if no official data */}
                  {showNoOfficialData && (
                    <View style={styles.priceGridContainer}>
                      {renderPriceBlock('Min', null)}
                      {renderPriceBlock('Common', null, true)}
                      {renderPriceBlock('Max', null)}
                    </View>
                  )}

                  {/* Separator */}
                  <View style={styles.separator} />

                  {/* Community Reported Section */}
                  <View style={styles.communitySection}>
                    <View style={styles.communityHeader}>
                      <Text style={styles.communityTitle}>
                        Community Reported:
                      </Text>
                      {latestCommunityPrice && (
                        <View style={styles.confirmationsContainer}>
                          <Feather
                            name='thumbs-up'
                            size={12}
                            color={Colors.primary}
                            style={styles.confirmationIcon}
                          />
                          <Text style={styles.confirmationsText}>
                            {latestCommunityPrice.confirmations_count}{' '}
                            confirmations
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Community Loader / Error / Price */}
                    {isCommunityLoading && (
                      <ActivityIndicator
                        size='small'
                        color={Colors.primary}
                        style={styles.inlineLoader}
                      />
                    )}
                    {hasCommunityError && !isCommunityLoading && (
                      <Text style={styles.errorTextSmall}>
                        Error loading community price
                      </Text>
                    )}
                    {!isCommunityLoading && !hasCommunityError && (
                      <>
                        <View style={styles.communityPriceRow}>
                          <Text style={styles.communityPriceValue}>
                            {latestCommunityPrice?.price !== null &&
                            latestCommunityPrice?.price !== undefined
                              ? formatPrice(latestCommunityPrice.price)
                              : '--'}
                          </Text>
                          {latestCommunityPrice && (
                            <Text style={styles.communityReporterText}>
                              reported by {latestCommunityPrice.username}
                            </Text>
                          )}
                          {!latestCommunityPrice && (
                            <Text style={styles.communityReporterText}>
                              No reports yet
                            </Text>
                          )}
                        </View>

                        {/* Confirm Price Button */}
                        {latestCommunityPrice &&
                          user &&
                          latestCommunityPrice.user_id !== user.id && (
                            <TouchableOpacity
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: Colors.primary,
                                paddingVertical: 6,
                                paddingHorizontal: 12,
                                borderRadius: 15,
                                alignSelf: 'flex-start',
                                marginTop: 10,
                              }}
                              onPress={handleConfirmPrice}
                              disabled={isConfirming}
                            >
                              <Feather
                                name='thumbs-up'
                                size={14}
                                color={Colors.white}
                                style={{ marginRight: 5 }}
                              />
                              <Text
                                style={{
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: 'bold',
                                }}
                              >
                                {isConfirming
                                  ? 'Confirming...'
                                  : 'Confirm Price'}
                              </Text>
                            </TouchableOpacity>
                          )}
                      </>
                    )}
                  </View>
                </>
              )}

              {/* Message if no fuel type selected */}
              {!fuelType && (
                <Text style={styles.infoText}>
                  Select a default fuel type in settings to see prices.
                </Text>
              )}
            </ScrollView>
          </TouchableOpacity>

          {/* Footer with 4 buttons */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={[styles.footerButton, styles.closeFooterButton]}
              onPress={onClose}
            >
              <Feather name='x' size={16} color={Colors.darkGray} />
              <Text
                style={[styles.footerButtonText, styles.closeFooterButtonText]}
              >
                Close
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.directionsFooterButton]}
              onPress={handleDirections}
            >
              <Feather name='map-pin' size={16} color={Colors.white} />
              <Text
                style={[
                  styles.footerButtonText,
                  styles.directionsFooterButtonText,
                ]}
              >
                Directions
              </Text>
            </TouchableOpacity>

            {/* Report Button */}
            <TouchableOpacity
              style={[styles.footerButton, styles.reportFooterButton]}
              onPress={handleReportPress}
            >
              <Feather name='alert-triangle' size={16} color={Colors.warning} />
              <Text
                style={[styles.footerButtonText, styles.reportFooterButtonText]}
              >
                Report
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Render the Report Station Modal */}
      {station && (
        <ReportStationModal
          isVisible={isReportModalVisible}
          onClose={() => setIsReportModalVisible(false)}
          stationId={station.id}
          stationName={station.name}
        />
      )}

      {/* Render the Price Report Modal */}
      {station && (
        <PriceReportModal
          isVisible={isPriceReportModalVisible}
          onClose={() => setIsPriceReportModalVisible(false)}
          stationId={station.id}
          stationName={station.name}
          defaultFuelType={fuelType || undefined}
        />
      )}
    </Modal>
  );
}
