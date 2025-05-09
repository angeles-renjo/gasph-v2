import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { TouchableCard } from '@/components/ui/Card';
import {
  formatPrice,
  formatDistance,
  formatFuelType,
} from '@/utils/formatters';
import { DOEPriceDisplay } from './DOEPriceDisplay';
import type { BestPrice } from '@/hooks/queries/prices/useBestPrices';
import { styles } from './BestPriceCard.styles';
import { Colors } from '@/styles/theme';
import { openDirections } from '@/utils/navigation'; // Add this import

// Get screen dimensions for responsive layout
const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 350;
const isLargeScreen = screenWidth > 400;

// Props extends from BestPrice type
export interface BestPriceCardProps
  extends Pick<
    BestPrice,
    | 'id'
    | 'name'
    | 'brand'
    | 'fuel_type'
    | 'price'
    | 'distance'
    | 'city'
    | 'confirmations_count'
    | 'min_price'
    | 'common_price'
    | 'max_price'
    | 'week_of'
    | 'source_type'
  > {
  latitude?: number | null;
  longitude?: number | null;
  isLowestPrice?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
}

export function BestPriceCard({
  id,
  name,
  brand,
  fuel_type,
  price,
  distance = 0,
  city,
  confirmations_count = 0,
  min_price = null,
  common_price = null,
  max_price = null,
  source_type = null,
  latitude,
  longitude,
  isLowestPrice = false,
  isSelected = false,
  week_of = null,
  onPress,
}: BestPriceCardProps) {
  const router = useRouter();

  const navigateToStation = () => {
    if (onPress) {
      onPress(); // This will call handleNavigateToStation from the modal, which includes onClose
    } else {
      router.push(`/station/${id}`); // Fallback if no onPress is provided
    }
  };

  const handleOpenDirections = () => {
    // Changed function name to avoid confusion
    if (!latitude || !longitude) {
      Alert.alert('Error', 'Station location not available.');
      return;
    }
    openDirections(latitude, longitude, name || 'Gas Station');
  };

  // Calculate if this price is below average (for highlighting)
  const isBelowAverage = common_price && price && price < common_price;

  return (
    <TouchableCard
      style={styles.card}
      variant='elevated'
      onPress={onPress}
      isSelected={isSelected}
    >
      {/* Price Section - Most visually prominent */}
      <View style={styles.priceSection}>
        <View style={styles.fuelTypeContainer}>
          <Text style={styles.fuelType}>
            {fuel_type ? formatFuelType(fuel_type) : 'Unknown Fuel'}
          </Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{price ? formatPrice(price) : '--'}</Text>
          {isLowestPrice && (
            <View style={styles.savingsBadge}>
              <FontAwesome5
                name='arrow-down'
                size={10}
                color={Colors.success}
                style={styles.savingsIcon}
              />
              <Text style={styles.savingsBadgeText}>Best Value</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content Container - Adaptive layout based on screen size */}
      <View
        style={[
          styles.contentContainer,
          isLargeScreen ? styles.wideLayout : styles.standardLayout,
        ]}
      >
        {/* Station Details */}
        <View style={styles.stationSection}>
          <Text style={styles.stationName} numberOfLines={1}>
            {name ?? 'Unknown Station'}
          </Text>
          <Text style={styles.stationBrand}>
            {brand ?? 'Unknown Brand'} • {city ?? 'Unknown City'}
          </Text>
        </View>

        {/* Metrics Section */}
        <View style={styles.metricsSection}>
          <View style={styles.metricItem}>
            <FontAwesome5
              name='map-marker-alt'
              size={14}
              color={Colors.textGray}
            />
            <Text style={styles.metricText}>{formatDistance(distance)}</Text>
          </View>
          <View style={styles.metricItem}>
            <FontAwesome5
              name='check-circle'
              size={14}
              color={Colors.textGray}
            />
            <Text style={styles.metricText}>
              {`${confirmations_count}`}
              {confirmations_count === 1 ? ' confirmation' : ' confirmations'}
            </Text>
          </View>
        </View>
      </View>

      {/* DOE Price Comparison - When available */}
      {min_price !== null && common_price !== null && max_price !== null ? (
        <DOEPriceDisplay
          min_price={min_price}
          common_price={common_price}
          max_price={max_price}
          source_type={source_type}
          week_of={week_of}
        />
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToStation}
          activeOpacity={0.7}
        >
          <FontAwesome5 name='info-circle' size={16} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleOpenDirections} // Use the new handler function
          activeOpacity={0.7}
        >
          <FontAwesome5 name='directions' size={16} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </TouchableCard>
  );
}
