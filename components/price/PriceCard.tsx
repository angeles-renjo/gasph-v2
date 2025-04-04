import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { FontAwesome5 } from '@expo/vector-icons';
import { formatPrice, formatRelativeTime } from '@/utils/formatters';
import { Colors, Typography, Spacing } from '@/styles/theme'; // Import theme constants
// Removed unused hooks: usePriceConfirmation, useHasConfirmedPrice, useAuth
import { PriceConfirmation } from './PriceConfirmation'; // Import the new component

export interface PriceCardProps {
  id: string;
  station_id: string;
  fuel_type: string;
  price: number;
  reported_at: string;
  confirmations_count: number;
  cycle_id: string;
  source?: 'community' | 'official';
  username?: string;
  user_id?: string;
  isOwnReport?: boolean;
}

export function PriceCard({
  id,
  station_id,
  fuel_type,
  price,
  reported_at,
  confirmations_count = 0,
  source = 'community',
  username,
  user_id,
  isOwnReport = false,
}: PriceCardProps) {
  const isCommunity = source === 'community';
  const relativeTime = formatRelativeTime(reported_at);
  // Removed unused hooks and related logic (useAuth, usePriceConfirmation, useHasConfirmedPrice, handleConfirmPrice, renderConfirmationContent)

  return (
    <Card variant='outline' style={styles.card}>
      <View style={styles.priceContainer}>
        <Text style={styles.fuelType}>{fuel_type}</Text>
        <Text style={styles.price}>{formatPrice(price)}</Text>
      </View>

      <View style={styles.sourceContainer}>
        <Text style={styles.sourceLabel}>
          {isCommunity ? 'Community Report' : 'DOE Official Price'}
        </Text>
        <Text style={styles.dateLabel}>{relativeTime}</Text>
      </View>

      {isCommunity && (
        <>
          <View style={styles.divider} />

          <View style={styles.detailsContainer}>
            <View style={styles.userContainer}>
              <Text style={styles.userLabel}>Reported by</Text>
              <Text style={styles.username}>{username || 'Anonymous'}</Text>
            </View>

            {/* Use the extracted PriceConfirmation component */}
            <PriceConfirmation
              reportId={id}
              stationId={station_id}
              confirmationsCount={confirmations_count}
              isOwnReport={isOwnReport}
            />
          </View>
        </>
      )}
    </Card>
  );
}

// Styles remain the same...

const styles = StyleSheet.create({
  card: {
    marginVertical: Spacing.sm, // Use theme spacing
    padding: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm, // Use theme spacing
  },
  fuelType: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
    color: Colors.darkGray, // Use theme color
  },
  price: {
    fontSize: Typography.fontSizeLarge, // Use theme typography
    fontWeight: Typography.fontWeightBold, // Use theme typography
    color: Colors.primary, // Use theme color
  },
  sourceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceLabel: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    color: Colors.textGray, // Use theme color
  },
  dateLabel: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    color: Colors.placeholderGray, // Use theme color
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dividerGray, // Use theme color
    marginVertical: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userContainer: {
    alignItems: 'center',
  },
  userLabel: {
    fontSize: Typography.fontSizeXSmall, // Use theme typography
    color: Colors.textGray, // Use theme color
    marginBottom: Spacing.xxs, // Use theme spacing
  },
  username: {
    fontSize: Typography.fontSizeXSmall, // Use theme typography
    fontWeight: Typography.fontWeightMedium, // Use theme typography
    color: Colors.darkGray, // Use theme color
  },
  confirmationsContainer: {
    alignItems: 'center',
  },
  // Removed styles related to confirmation button and labels as they are now in PriceConfirmation.tsx
  // confirmationsContainer, confirmationsLabel, confirmButton, confirmButtonText, confirmationsCount, ownReportTag
});
