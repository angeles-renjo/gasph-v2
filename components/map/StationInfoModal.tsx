import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking, // Import Linking
  Platform, // Import Platform
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { FontAwesome5 } from '@expo/vector-icons'; // Import icons
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import { useStationFuelTypePrices } from '@/hooks/queries/stations/useStationFuelTypePrices';
import type { GasStation } from '@/hooks/queries/stations/useNearbyStations';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices';
import { DOEPriceDisplay } from '@/components/price/DOEPriceDisplay'; // Import DOE display
import { formatPrice } from '@/utils/formatters';
import { Colors, Spacing, Typography, BorderRadius } from '@/styles/theme';

interface StationInfoModalProps {
  station: GasStation | null;
  fuelType: FuelType | null;
  isVisible: boolean;
  onClose: () => void;
}

export function StationInfoModal({
  station,
  fuelType,
  isVisible,
  onClose,
}: StationInfoModalProps) {
  // --- Fetch Community Price ---
  const {
    data: communityPriceData,
    isLoading: communityLoading,
    error: communityError,
  } = useStationFuelTypePrices(station?.id ?? null, fuelType);

  const latestCommunityPrice = communityPriceData?.[0];

  // --- Fetch DOE Price ---
  const {
    data: doePriceDataResult,
    isLoading: doeLoading,
    error: doeError,
  } = useQuery({
    queryKey: queryKeys.stations.doePrice(station?.id ?? '', fuelType ?? ''),
    queryFn: async () => {
      if (!station?.id || !fuelType) return null;

      // Convert fuelType to uppercase for the query
      const upperCaseFuelType = fuelType.toUpperCase();

      const { data, error } = await supabase
        .from('doe_price_view')
        .select('common_price, min_price, max_price, source_type')
        .eq('gas_station_id', station.id)
        .eq('fuel_type', upperCaseFuelType) // Use uppercase version
        .maybeSingle();

      if (error) {
        console.error('Error fetching DOE price view:', error);
        throw error;
      }
      return data;
    },
    enabled: !!station && !!fuelType,
    staleTime: 60 * 60 * 1000,
  });

  // --- Display Logic ---
  const isLoading = communityLoading || doeLoading;
  const hasError = !!communityError || !!doeError;

  // --- Directions Handler ---
  const handleDirections = () => {
    if (!station) return;
    const { latitude, longitude, name } = station;
    const scheme = Platform.select({
      ios: 'maps://0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${latitude},${longitude}`;
    const label = encodeURIComponent(name); // Encode station name for URL
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  // Render nothing if no station is selected
  if (!station) {
    return null;
  }

  return (
    <Modal
      animationType='slide'
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity // Allow closing modal by tapping background
        style={styles.centeredView}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View style={styles.modalView} onStartShouldSetResponder={() => true}>
          {/* Prevent taps inside modal from closing it */}
          <Text style={styles.modalTitle}>{station.name}</Text>
          <Text style={styles.modalBrand}>{station.brand}</Text>
          <Text style={styles.modalAddress}>{station.address}</Text>

          <View style={styles.divider} />

          {fuelType && (
            <View style={styles.priceSection}>
              <Text style={styles.priceTitle}>Price for {fuelType}:</Text>
              {isLoading && (
                <ActivityIndicator
                  size='large'
                  color={Colors.primary}
                  style={styles.loader}
                />
              )}
              {hasError && !isLoading && (
                <Text style={styles.errorTextLarge}>Error loading price</Text>
              )}
              {!isLoading && !hasError && (
                <View style={styles.priceDisplayContainer}>
                  {/* Display Community Price or '--' */}
                  <View style={styles.priceItem}>
                    <Text style={styles.priceValue}>
                      {latestCommunityPrice?.price !== null &&
                      latestCommunityPrice?.price !== undefined
                        ? formatPrice(latestCommunityPrice.price)
                        : '--'}
                    </Text>
                    <Text style={styles.priceSource}>(Community)</Text>
                  </View>

                  {/* Display DOE Price using DOEPriceDisplay */}
                  <DOEPriceDisplay
                    min_price={doePriceDataResult?.min_price ?? null}
                    common_price={doePriceDataResult?.common_price ?? null}
                    max_price={doePriceDataResult?.max_price ?? null}
                    source_type={doePriceDataResult?.source_type ?? null}
                  />
                </View>
              )}
            </View>
          )}
          {!fuelType && (
            <Text style={styles.infoText}>
              Select a default fuel type in settings to see prices.
            </Text>
          )}

          {/* Buttons Container */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={onClose}>
              <FontAwesome5 name='times' size={16} color={Colors.primary} />
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDirections}
            >
              <FontAwesome5
                name='directions'
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.buttonText}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dim background
  },
  modalView: {
    margin: Spacing.lg,
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%', // Adjust width
  },
  modalTitle: {
    fontSize: Typography.fontSizeXLarge,
    fontWeight: Typography.fontWeightBold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    color: Colors.darkGray,
  },
  modalBrand: {
    fontSize: Typography.fontSizeLarge,
    color: Colors.textGray,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  modalAddress: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dividerGray,
    width: '100%',
    marginVertical: Spacing.md,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    width: '100%',
  },
  priceTitle: {
    fontSize: Typography.fontSizeMedium,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.darkGray,
    marginBottom: Spacing.sm,
  },
  loader: {
    marginVertical: Spacing.md,
  },
  priceDisplayContainer: {
    alignItems: 'center',
    width: '100%', // Ensure DOE display takes width
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: Spacing.xs,
    marginBottom: Spacing.md, // Add space before DOE display
  },
  priceValue: {
    fontSize: Typography.fontSizeXXLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.primary,
  },
  priceSource: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.textGray,
    marginLeft: Spacing.xs,
    fontStyle: 'italic',
  },
  errorTextLarge: {
    fontSize: Typography.fontSizeMedium,
    color: Colors.error,
    fontStyle: 'italic',
    marginVertical: Spacing.md,
  },
  infoText: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  buttonContainer: {
    // Styles for button row
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out buttons
    width: '100%',
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dividerGray,
    paddingTop: Spacing.md,
  },
  actionButton: {
    // Style for individual buttons
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray2, // Add background
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md, // Add border radius
    flex: 0.45, // Allow buttons to share space but not fill entirely
    justifyContent: 'center', // Center content
  },
  buttonText: {
    // Style for button text
    color: Colors.primary,
    fontWeight: Typography.fontWeightMedium,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSizeMedium,
  },
  // Removed closeButton and closeButtonText as they are replaced by actionButton styles
});
