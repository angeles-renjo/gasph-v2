// components/admin/CycleInfoBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { formatDate } from '@/utils/formatters';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme'; // Import theme constants

interface CycleInfoBadgeProps {
  cycleNumber: number;
  status: 'active' | 'completed' | 'archived';
  compact?: boolean;
  showDates?: boolean;
  startDate?: string;
  endDate?: string;
}

export function CycleInfoBadge({
  cycleNumber,
  status,
  compact = false,
  showDates = false,
  startDate,
  endDate,
}: CycleInfoBadgeProps) {
  // Get appropriate icon and colors based on status
  const getStatusInfo = () => {
    switch (status) {
      case 'active':
        return {
          icon: 'play-circle',
          color: Colors.primary, // Use theme color
          bgColor: Colors.primaryLightTint, // Use theme color
        };
      case 'completed':
        return {
          icon: 'check-circle',
          color: Colors.successDark, // Use theme color
          bgColor: Colors.successLightTint, // Use theme color
        };
      case 'archived':
        return {
          icon: 'archive',
          color: Colors.mediumGray2, // Use theme color
          bgColor: Colors.backgroundGray2, // Use theme color
        };
      default:
        return {
          icon: 'circle',
          color: Colors.textGray, // Use theme color
          bgColor: Colors.lightGray2, // Use theme color
        };
    }
  };

  const { icon, color, bgColor } = getStatusInfo();

  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor: bgColor }]}>
        <FontAwesome5 name={icon} size={12} color={color} style={styles.icon} />
        <Text style={[styles.compactText, { color }]}>
          Cycle #{cycleNumber}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <FontAwesome5 name={icon} size={14} color={color} style={styles.icon} />
        <Text style={[styles.cycleNumber, { color }]}>
          Cycle #{cycleNumber}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: color }]}>
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
      </View>

      {showDates && startDate && endDate && (
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {formatDate(startDate)} - {formatDate(endDate)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md, // Use theme border radius
    padding: Spacing.inputPaddingHorizontal, // Use theme spacing
    marginVertical: Spacing.sm, // Use theme spacing
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg_xl, // Use theme border radius
    paddingVertical: Spacing.xxs, // Use theme spacing
    paddingHorizontal: Spacing.sm, // Use theme spacing
  },
  compactText: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    fontWeight: Typography.fontWeightMedium, // Use theme typography
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.xs, // Use theme spacing
  },
  cycleNumber: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.xs, // Use theme spacing
    paddingVertical: Spacing.xxxs, // Use theme spacing
    borderRadius: BorderRadius.sm, // Use theme border radius
  },
  statusText: {
    color: Colors.white, // Use theme color
    fontSize: Typography.fontSizeXXSmall, // Use theme typography
    fontWeight: Typography.fontWeightBold, // Use theme typography
  },
  dateContainer: {
    marginTop: Spacing.xs, // Use theme spacing
  },
  dateText: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    color: Colors.textGray, // Use theme color
  },
});
