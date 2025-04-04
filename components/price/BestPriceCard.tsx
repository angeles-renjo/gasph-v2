import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { TouchableCard } from '@/components/ui/Card';
import { formatPrice, formatDistance } from '@/utils/formatters';
import type { BestPrice } from '@/hooks/queries/prices/useBestPrices';

// Props now extends from our BestPrice type
export interface BestPriceCardProps
  extends Pick<
    // Use properties from BestPrice (which extends GasStation)
    BestPrice,
    | 'id' // Changed from station_id
    | 'name' // Changed from station_name
    | 'brand' // Changed from station_brand
    | 'fuel_type'
    | 'price'
    | 'distance'
    | 'city' // Changed from station_city
    | 'confirmations_count'
    // DOE fields
    | 'min_price'
    | 'common_price'
    | 'max_price'
    | 'week_of' // Optional: might be useful for context later
    | 'source_type' // Add source_type
  > {}

// Helper function to format source_type to just the specific label text
const formatSourceTypeLabel = (
  sourceType: string | null | undefined
): string => {
  if (!sourceType) return ''; // Return empty if no type
  switch (sourceType) {
    case 'brand_specific':
      return 'Brand Specific';
    case 'city_overall':
      return 'City Overall';
    case 'ncr_prevailing':
      return 'NCR Prevailing';
    // Add other cases as needed
    default:
      // Simple formatting for unknown types
      return sourceType.replace(/_/g, ' ');
  }
};

export function BestPriceCard({
  id, // Changed from station_id
  name, // Changed from station_name
  brand, // Changed from station_brand
  fuel_type,
  price,
  distance = 0, // Keep distance, assuming it's correctly passed or defaulted
  city, // Changed from station_city
  confirmations_count = 0,
  // Destructure new DOE props, providing defaults (null)
  min_price = null,
  common_price = null,
  max_price = null,
  source_type = null, // Destructure source_type
}: BestPriceCardProps) {
  const router = useRouter();

  const navigateToStation = () => {
    router.push(`/station/${id}`); // Use id here
  };

  return (
    <TouchableCard
      style={styles.card}
      variant='elevated'
      onPress={navigateToStation}
    >
      <View style={styles.priceRow}>
        <View style={styles.fuelTypeContainer}>
          <Text style={styles.fuelType}>{fuel_type}</Text>
        </View>
        {/* Display community price or placeholder */}
        <Text style={styles.price}>{price ? formatPrice(price) : '--'}</Text>
      </View>
      {/* Display DOE Price Range if available - Label + Badge + Table Row Style */}
      {(min_price !== null || common_price !== null || max_price !== null) && (
        <View style={styles.doeContainer}>
          {/* Row 1: Label + Badge */}
          <View style={styles.doeInfoRow}>
            <Text style={styles.doeLabel}>DOE:</Text>
            {source_type && ( // Only show badge if source_type exists
              <View style={styles.doeTypeBadge}>
                <Text style={styles.doeTypeBadgeText}>
                  {formatSourceTypeLabel(source_type)}
                </Text>
              </View>
            )}
          </View>
          {/* Row 2: Min/Common/Max Table */}
          <View style={styles.doeTableRow}>
            <View style={styles.doeTableCell}>
              <Text style={styles.doeTableHeader}>Min</Text>
              <Text style={styles.doeTableValue}>
                {min_price !== null ? formatPrice(min_price) : '--'}
              </Text>
            </View>
            <View style={styles.doeTableCell}>
              <Text style={styles.doeTableHeader}>Common</Text>
              <Text style={styles.doeTableValue}>
                {common_price !== null ? formatPrice(common_price) : '--'}
              </Text>
            </View>
            <View style={styles.doeTableCell}>
              <Text style={styles.doeTableHeader}>Max</Text>
              <Text style={styles.doeTableValue}>
                {max_price !== null ? formatPrice(max_price) : '--'}
              </Text>
            </View>
          </View>
        </View>
      )}
      <View style={styles.stationRow}>
        <Text style={styles.stationName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.stationBrand}>{brand}</Text>
      </View>
      {/* Add Confirmation display back */}
      <View style={styles.confirmationRow}>
        <FontAwesome5 name='check-circle' size={14} color='#666' />
        <Text style={styles.confirmationText}>
          {confirmations_count}
          <Text> </Text> {/* Explicit Text for space */}
          {confirmations_count === 1 ? 'confirmation' : 'confirmations'}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <FontAwesome5 name='map-marker-alt' size={14} color='#666' />
          <Text style={styles.infoText}>
            {city}
            <Text> </Text> {/* Explicit Text for space */}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <FontAwesome5 name='route' size={14} color='#666' />
          <Text style={styles.infoText}>{formatDistance(distance)}</Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.directionButton}
          onPress={navigateToStation}
        >
          <FontAwesome5 name='info-circle' size={14} color='#2a9d8f' />
          <Text style={styles.buttonText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.directionButton}>
          <FontAwesome5 name='directions' size={14} color='#2a9d8f' />
          <Text style={styles.buttonText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </TouchableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fuelTypeContainer: {
    backgroundColor: '#e6f7f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fuelType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2a9d8f',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2a9d8f',
  },
  // Styles for DOE Section (Container, Label+Badge Row, Table Row)
  doeContainer: {
    marginTop: 6, // Add a bit more space above
    marginBottom: 8,
  },
  doeInfoRow: {
    // Row for "DOE:" label and Type Badge
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, // Space between label/badge row and table row
  },
  doeLabel: {
    // Style for "DOE:" text
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginRight: 6,
  },
  doeTypeBadge: {
    // Style for the type badge (e.g., "NCR Prevailing")
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  doeTypeBadgeText: {
    // Text inside the type badge
    fontSize: 11,
    color: '#444',
    fontWeight: '500',
  },
  doeTableRow: {
    // Row containing Min/Common/Max cells
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  doeTableCell: {
    // Individual cell (Min, Common, or Max)
    flex: 1,
    alignItems: 'center',
  },
  doeTableHeader: {
    // Header text ("Min", "Common", "Max")
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  doeTableValue: {
    // Price value text
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  // Removed doeValueText style
  stationRow: {
    marginBottom: 4, // Reduced margin
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  stationBrand: {
    fontSize: 14,
    color: '#666',
  },
  doeBenchmarkRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align to the start
    alignItems: 'center',
    marginTop: 4, // Space below main price
    marginBottom: 8, // Space above station info
  },
  doeBenchmarkLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 4,
  },
  doeBenchmarkText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  confirmationRow: {
    // Add styles for confirmation row
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4, // Add some space
    marginBottom: 8,
  },
  confirmationText: {
    // Add styles for confirmation text
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: '#2a9d8f',
    fontWeight: '500',
    marginLeft: 6,
  },
  reporterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  reporterLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  reporterName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
});
