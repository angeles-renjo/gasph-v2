import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView, // Import ScrollView for potentially long content
} from 'react-native';
import React, { useState } from 'react'; // Import useState
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons'; // Use Feather icons
import { useRouter } from 'expo-router'; // Import useRouter
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import { useStationFuelTypePrices } from '@/hooks/queries/stations/useStationFuelTypePrices';
import type { GasStation } from '@/hooks/queries/stations/useNearbyStations';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices';
import { formatPrice } from '@/utils/formatters';
import { Colors, Spacing, Typography, BorderRadius } from '@/styles/theme';
import ReportStationModal from '../station/ReportStationModal'; // Import the report modal

interface StationInfoModalProps {
  station: GasStation | null;
  fuelType: FuelType | null;
  isVisible: boolean;
  onClose: () => void;
  // Add a prop for the selected fuel type name if needed for display
  // fuelTypeName?: string;
}

// Helper to format DOE source type
const formatDoeSourceType = (sourceType: string | null | undefined) => {
  if (!sourceType) return 'N/A';
  if (sourceType === 'BRAND_SPECIFIC') return 'Brand Specific';
  return sourceType.replace('_', ' ') ?? 'N/A';
};

export function StationInfoModal({
  station,
  fuelType, // e.g., 'diesel', 'gasoline_95'
  isVisible,
  onClose,
}: StationInfoModalProps) {
  const [isReportModalVisible, setIsReportModalVisible] = useState(false); // State for report modal

  // --- Fetch Community Price ---
  const {
    data: communityPriceData,
    isLoading: communityLoading,
    error: communityError,
  } = useStationFuelTypePrices(station?.id ?? null, fuelType);

  // Get the latest price report (usually the one with most confirmations or most recent)
  const latestCommunityPrice = communityPriceData?.[0];

  // --- Fetch DOE Price ---
  const {
    data: doePriceDataResult,
    isLoading: isDoeLoading, // Renamed for clarity
    error: doeError,
  } = useQuery({
    queryKey: queryKeys.stations.doePrice(station?.id ?? '', fuelType ?? ''),
    queryFn: async () => {
      if (!station?.id || !fuelType) return null;
      // Assuming fuelType is like 'diesel', 'gasoline_95' etc.
      // Adjust if your DB expects different format (e.g., uppercase)
      const dbFuelType = fuelType.toUpperCase(); // Adjust if needed
      const { data, error } = await supabase
        .from('doe_price_view')
        .select('common_price, min_price, max_price, source_type')
        .eq('gas_station_id', station.id)
        .eq('fuel_type', dbFuelType)
        .maybeSingle();
      if (error) {
        console.error('Error fetching DOE price view:', error);
        throw error;
      }
      return data;
    },
    enabled: !!station && !!fuelType,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  // --- Display Logic ---
  const isCommunityLoading = communityLoading; // Keep existing name
  const hasDoeError = !!doeError;
  const hasCommunityError = !!communityError;
  const showNoOfficialData =
    !isDoeLoading && !hasDoeError && !doePriceDataResult; // Show if loaded, no error, but no data

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

// --- Styles ---
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dimmed background
  },
  modalView: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%', // Limit height to prevent overflow on small screens
    backgroundColor: Colors.white, // Use theme white
    borderRadius: BorderRadius.xl, // Match web: rounded-xl
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  // --- Header ---
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg, // ~p-4
    paddingTop: Spacing.lg, // ~p-4
    paddingBottom: Spacing.md, // ~pb-3
    // Approximation of bg-gradient-to-r from-emerald-50 to-teal-50
    // Use a solid color for simplicity in RN unless expo-linear-gradient is added
    backgroundColor: '#f0fdfa', // Fallback color as Colors.backgroundLightGreen doesn't exist
    position: 'relative', // Needed for absolute positioning of close button
  },
  headerTextContainer: {
    flex: 1,
    marginRight: Spacing.xl, // Ensure space for close button
  },
  modalTitle: {
    fontSize: Typography.fontSizeLarge, // Corrected: Use fontSizeLarge instead of fontSizeLg
    fontWeight: Typography.fontWeightSemiBold, // Match web: font-semibold
    color: Colors.darkGray, // Match web: text-gray-800
    marginBottom: Spacing.xs, // Reduced margin
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align icon with top of text
    marginTop: Spacing.xxs, // Small top margin
  },
  addressIcon: {
    marginRight: Spacing.xs, // Match web: gap-1
    marginTop: 2, // Align icon slightly better with text line
  },
  modalAddress: {
    flex: 1, // Allow text to wrap
    fontSize: Typography.fontSizeSmall, // Corrected: Use fontSizeSmall instead of fontSizeSm
    color: Colors.textGray, // Match web: text-gray-600
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.md, // Match web: right-4
    top: Spacing.md, // Match web: top-4
    // Match web: h-8 w-8 rounded-full bg-white/80 hover:bg-white
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Ensure it's above header background
  },
  // --- Scrollable Content ---
  scrollContentContainer: {
    paddingHorizontal: Spacing.lg, // ~p-4
    paddingBottom: Spacing.lg, // Add padding at the bottom
  },
  sectionTitle: {
    fontSize: Typography.fontSizeLarge, // Corrected: Use fontSizeLarge instead of fontSizeLg
    fontWeight: Typography.fontWeightMedium, // Match web: font-medium
    color: Colors.darkGray, // Match web: text-gray-800
    marginBottom: Spacing.sm, // Match web: mb-2
    marginTop: Spacing.md, // Add space above section title
  },
  badgeWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md, // Match web: mb-4
    flexWrap: 'wrap', // Allow wrapping on small screens
    gap: Spacing.sm, // Match web: gap-2
  },
  doeBadge: {
    // Match web: Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 font-normal"
    backgroundColor: Colors.backgroundGray, // Match web: bg-gray-100
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs + 1,
    borderRadius: BorderRadius.sm, // Adjust as needed
    borderWidth: 1,
    borderColor: Colors.dividerGray, // Corrected: Use dividerGray instead of borderGray
  },
  doeBadgeText: {
    fontSize: Typography.fontSizeXSmall, // Corrected: Use fontSizeXSmall instead of fontSizeXs
    color: Colors.textGray, // Match web: text-gray-600
    fontWeight: Typography.fontWeightRegular, // Corrected: Use fontWeightRegular instead of fontWeightNormal
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    marginRight: Spacing.xxs, // Match web: mr-1
  },
  warningText: {
    // Match web: text-amber-600 text-xs
    color: Colors.warning, // Use theme warning color
    fontSize: Typography.fontSizeXSmall, // Corrected: Use fontSizeXSmall instead of fontSizeXs
  },
  inlineLoader: {
    marginVertical: Spacing.md,
    alignSelf: 'center',
  },
  errorTextSmall: {
    fontSize: Typography.fontSizeSmall, // Corrected: Use fontSizeSmall instead of fontSizeSm
    color: Colors.error,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  priceGridContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundGray, // Match web: bg-gray-50
    borderRadius: BorderRadius.lg, // Match web: rounded-lg
    overflow: 'hidden',
    marginTop: Spacing.xs, // Add some top margin
  },
  priceBlock: {
    flex: 1,
    padding: Spacing.md, // Match web: p-3
    alignItems: 'center',
  },
  priceBlockHighlight: {
    backgroundColor: Colors.backgroundGray2, // Match web: bg-gray-100
  },
  priceBlockLabel: {
    fontSize: Typography.fontSizeXSmall, // Corrected: Use fontSizeXSmall instead of fontSizeXs
    color: Colors.textGray, // Match web: text-gray-500
    marginBottom: Spacing.xxs, // Match web: mb-1
  },
  priceBlockValue: {
    fontSize: Typography.fontSizeMedium, // Corrected: Use fontSizeMedium instead of fontSizeBase
    fontWeight: Typography.fontWeightMedium, // Match web: font-medium
    color: Colors.darkGray, // Match web: text-gray-800
  },
  separator: {
    height: 1,
    backgroundColor: Colors.dividerGray, // Match web: <Separator />
    marginVertical: Spacing.lg, // Space around separator
  },
  // --- Community Section ---
  communitySection: {
    backgroundColor: '#f0fdfa', // Fallback color as Colors.backgroundLightGreen doesn't exist
    borderRadius: BorderRadius.lg, // Match web: rounded-lg
    padding: Spacing.lg, // Match web: p-4
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs, // Space below header
  },
  communityTitle: {
    fontSize: Typography.fontSizeSmall, // Corrected: Use fontSizeSmall instead of fontSizeSm
    color: Colors.textGray, // Match web: text-gray-600
  },
  confirmationsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmationIcon: {
    marginRight: Spacing.xxs, // Match web: gap-1
  },
  confirmationsText: {
    fontSize: Typography.fontSizeXSmall, // Corrected: Use fontSizeXSmall instead of fontSizeXs
    color: Colors.textGray, // Match web: text-gray-500
  },
  communityPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline', // Align text baselines
    marginTop: Spacing.xs, // Match web: mt-1
    flexWrap: 'wrap', // Allow wrapping
  },
  communityPriceValue: {
    fontSize: Typography.fontSizeXLarge, // Corrected: Use fontSizeXLarge instead of fontSizeXl
    fontWeight: Typography.fontWeightBold, // Match web: font-bold
    color: Colors.primary, // Match web: text-emerald-600
  },
  communityReporterText: {
    fontSize: Typography.fontSizeXSmall, // Corrected: Use fontSizeXSmall instead of fontSizeXs
    color: Colors.textGray, // Match web: text-gray-500
    marginLeft: Spacing.sm, // Match web: ml-2
    flexShrink: 1, // Allow shrinking if needed
  },
  infoText: {
    fontSize: Typography.fontSizeSmall, // Corrected: Use fontSizeSmall instead of fontSizeSm
    color: Colors.textGray,
    textAlign: 'center',
    marginVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  // --- Footer ---
  footerContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.dividerGray,
    // Removed marginTop as spacing is handled by ScrollView padding
  },
  footerButton: {
    // flex: 1, // Adjust flex to accommodate 3 buttons if needed, or use fixed width
    paddingHorizontal: Spacing.md, // Add horizontal padding
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md, // Match web: p-4 (adjust vertical only)
  },
  closeFooterButton: {
    // Match web: variant="outline"
    borderRightWidth: 1,
    borderRightColor: Colors.dividerGray,
    backgroundColor: Colors.white,
    borderWidth: 1, // Add border
    borderColor: Colors.dividerGray, // Corrected: Use dividerGray instead of borderGray
    // Adjust padding slightly to account for border
    paddingVertical: Spacing.md - 1,
    // Ensure button is not cut off by main view border radius
    borderBottomLeftRadius: BorderRadius.xl,
  },
  reportFooterButton: {
    // Style similar to close button?
    backgroundColor: Colors.white,
    borderRightWidth: 1, // Add separator if needed
    borderRightColor: Colors.dividerGray,
  },
  reportFooterButtonText: {
    color: Colors.warning, // Use warning color for text
  },
  directionsFooterButton: {
    // Match web: bg-emerald-600 hover:bg-emerald-700
    backgroundColor: Colors.primary, // Use theme primary or a specific green
    flex: 1.2, // Give directions slightly more space? Adjust as needed
    // Ensure button is not cut off by main view border radius
    borderBottomRightRadius: BorderRadius.xl,
  },
  footerButtonText: {
    marginLeft: Spacing.sm, // Match web: mr-2 (applied as marginLeft)
    fontSize: Typography.fontSizeSmall, // Corrected: Use fontSizeSmall instead of fontSizeSm
    fontWeight: Typography.fontWeightMedium,
  },
  closeFooterButtonText: {
    color: Colors.darkGray,
  },
  directionsFooterButtonText: {
    color: Colors.white,
  },
});
