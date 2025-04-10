import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatPrice } from '@/utils/formatters';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme';

interface DOEPriceDisplayProps {
  min_price: number | null;
  common_price: number | null;
  max_price: number | null;
  source_type: string | null;
}

// Helper function to format source_type label (kept local for now)
const formatSourceTypeLabel = (
  sourceType: string | null | undefined
): string => {
  if (!sourceType) return '';
  switch (sourceType) {
    case 'brand_specific':
      return 'Brand Specific';
    case 'city_overall':
      return 'City Overall';
    case 'ncr_prevailing':
      return 'NCR Prevailing';
    default:
      return sourceType.replace(/_/g, ' ');
  }
};

export function DOEPriceDisplay({
  min_price,
  common_price,
  max_price,
  source_type,
}: DOEPriceDisplayProps) {
  // Don't render if all prices are null
  if (min_price === null && common_price === null && max_price === null) {
    return null;
  }

  return (
    <View style={styles.doeContainer}>
      {/* Row 1: Label + Badge */}
      <View style={styles.doeInfoRow}>
        <Text style={styles.doeLabel}>DOE:</Text>
        {/* Explicitly render null if source_type is falsy (e.g., null, undefined, '') */}
        {source_type ? (
          <View style={styles.doeTypeBadge}>
            <Text style={styles.doeTypeBadgeText}>
              {formatSourceTypeLabel(source_type)}
            </Text>
          </View>
        ) : null}
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
  );
}

const styles = StyleSheet.create({
  doeContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  doeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxs,
  },
  doeLabel: {
    fontSize: Typography.fontSizeSmallMedium,
    color: Colors.textGray,
    fontWeight: Typography.fontWeightMedium,
    marginRight: Spacing.xs,
  },
  doeTypeBadge: {
    backgroundColor: Colors.lightGray,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxxs,
  },
  doeTypeBadgeText: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.mediumDarkGray,
    fontWeight: Typography.fontWeightMedium,
  },
  doeTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Back to space-between
    width: '100%', // Ensure row takes full width
    backgroundColor: Colors.backgroundGray,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  doeTableCell: {
    width: '33%', // Give each cell a third of the width
    alignItems: 'center',
  },
  doeTableHeader: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.mediumLightGray,
    marginBottom: Spacing.xxxs,
  },
  doeTableValue: {
    fontSize: Typography.fontSizeSmallMedium,
    color: Colors.mediumDarkGray,
    fontWeight: Typography.fontWeightMedium,
  },
});
