import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView, // Import ScrollView for potentially long content
} from 'react-native';
import { useState } from 'react'; // Import useState
// Removed useQuery import
import { Feather } from '@expo/vector-icons'; // Use Feather icons
import { useRouter } from 'expo-router'; // Import useRouter
import { useStationFuelTypePrices } from '@/hooks/queries/stations/useStationFuelTypePrices';
import type { GasStation } from '@/hooks/queries/stations/useNearbyStations';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices';
import { formatPrice } from '@/utils/formatters';
import { Colors } from '@/styles/theme'; // Import Colors directly
import ReportStationModal from '../station/ReportStationModal'; // Import the report modal

// Import the new hook for DOE price
import { useStationDoePrice } from '@/hooks/queries/stations/useStationDoePrice';
// Import the moved styles
import { styles } from '@/styles/components/map/StationInfoModal.styles';

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
  fuelType, // e.g., 'diesel', 'gasoline_95'
  isVisible,
  onClose,
}: StationInfoModalProps) {
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

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
  } = useStationDoePrice(station?.id, fuelType); // Use the new hook

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
    const scheme = Platform.select({
      ios: 'maps://0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${latitude},${longitude}`;
    const label = encodeURIComponent(name);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });
    if (url) Linking.openURL(url);
  };

  // --- Report Station Handler ---
  const handleReportPress = () => {
    setIsReportModalVisible(true);
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
        onPressOut={onClose} // Close when tapping outside the modal content
      >
        {/* Prevent taps inside the modal from closing it */}
        <View style={styles.modalView} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.modalTitle}>{station.name}</Text>
              <View style={styles.addressContainer}>
                <Feather
                  name='map-pin'
                  size={14}
                  color={Colors.primary} // Use theme color
                  style={styles.addressIcon}
                />
                <Text style={styles.modalAddress} numberOfLines={2}>
                  {station.address}
                </Text>
              </View>
            </View>
            {/* Close Button - Positioned Absolutely */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name='x' size={18} color={Colors.textGray} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content Area - Wrapped for Navigation */}
          <TouchableOpacity
            activeOpacity={0.8} // Provide visual feedback on tap
            onPress={handleNavigateToStation}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContentContainer}
              scrollEnabled={false} // Disable scroll for the wrapper touchable
            >
              {/* Price Section */}
              {fuelType && (
                <>
                  <Text style={styles.sectionTitle}>
                    Price for {fuelType.replace('_', ' ')}
                  </Text>

                  {/* DOE Badge & Warning Row */}
                  <View style={styles.badgeWarningRow}>
                    <View style={styles.doeBadge}>
                      <Text style={styles.doeBadgeText}>
                        DOE:{' '}
                        {formatDoeSourceType(doePriceDataResult?.source_type)}
                      </Text>
                    </View>
                    {showNoOfficialData && (
                      <View style={styles.warningContainer}>
                        <Feather
                          name='alert-circle'
                          size={12}
                          color={Colors.warning} // Use theme warning color
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
                      size='small' // Smaller indicator inline
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
                            color={Colors.primary} // Use theme color
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

          {/* Footer */}
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
              style={[styles.footerButton, styles.reportFooterButton]} // Add specific style if needed
              onPress={handleReportPress}
            >
              <Feather name='alert-triangle' size={16} color={Colors.warning} />
              <Text
                style={[
                  styles.footerButtonText,
                  styles.reportFooterButtonText, // Add specific style if needed
                ]}
              >
                Report
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Render the Report Modal */}
      {station && (
        <ReportStationModal
          isVisible={isReportModalVisible}
          onClose={() => setIsReportModalVisible(false)}
          stationId={station.id}
          stationName={station.name}
        />
      )}
    </Modal>
  );
}

// Styles moved to styles/components/map/StationInfoModal.styles.ts
