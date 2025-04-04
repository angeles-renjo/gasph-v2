import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/formatters';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme'; // Import theme constants
import type { PriceCycle } from '@/hooks/queries/prices/usePriceCycles';

interface PriceCycleCardProps {
  cycle: PriceCycle;
  onArchive?: (id: string) => void; // Changed return type to void
  onActivate?: (id: string) => void; // Changed return type to void
  isArchiving?: boolean;
  isActivating?: boolean;
}

export function PriceCycleCard({
  cycle,
  onArchive,
  onActivate,
  isArchiving,
  isActivating,
}: PriceCycleCardProps) {
  // Removed async from handlers as they now just call the prop
  const handleArchive = () => {
    Alert.alert(
      'Archive Cycle',
      'Are you sure you want to archive this price cycle?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            // No need for try/catch here, error handled by mutation hook
            if (onArchive) {
              onArchive(cycle.id); // Call prop directly
            }
          },
        },
      ]
    );
  };

  // Removed async from handlers as they now just call the prop
  const handleActivate = () => {
    Alert.alert(
      'Activate Cycle',
      'Are you sure you want to activate this price cycle? This will deactivate the current active cycle.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Activate',
          onPress: () => {
            // No need for try/catch here, error handled by mutation hook
            if (onActivate) {
              onActivate(cycle.id); // Call prop directly
            }
          },
        },
      ]
    );
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cycle #{cycle.cycle_number}</Text>
          {cycle.doe_import_date && (
            <Text style={styles.importDate}>
              Imported: {formatDate(cycle.doe_import_date)}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            cycle.status === 'archived' && styles.archivedBadge,
            cycle.status === 'completed' && styles.completedBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              cycle.status === 'archived' && styles.archivedText,
              cycle.status === 'completed' && styles.completedText,
            ]}
          >
            {cycle.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.dates}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Start Date</Text>
          <Text style={styles.dateValue}>
            {cycle.start_date ? formatDate(cycle.start_date) : 'N/A'}
          </Text>
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>End Date</Text>
          <Text style={styles.dateValue}>
            {cycle.end_date ? formatDate(cycle.end_date) : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {cycle.status === 'completed' && onActivate && (
          <Button
            title='Activate Cycle'
            onPress={handleActivate}
            variant='primary'
            style={styles.actionButton}
            loading={isActivating}
            disabled={isActivating}
          />
        )}
        {cycle.status === 'completed' && onArchive && (
          <Button
            title='Archive Cycle'
            onPress={handleArchive}
            variant='outline'
            style={styles.actionButton}
            loading={isArchiving}
            disabled={isArchiving}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl, // Use theme spacing
    padding: Spacing.xl, // Use theme spacing
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl, // Use theme spacing
  },
  title: {
    fontSize: Typography.fontSizeXLarge, // Use theme typography
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
    color: Colors.darkGray, // Use theme color
  },
  importDate: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    color: Colors.textGray, // Use theme color
    marginTop: Spacing.xxs, // Use theme spacing
  },
  statusBadge: {
    backgroundColor: Colors.primaryLightTint, // Use theme color
    paddingHorizontal: Spacing.sm, // Use theme spacing
    paddingVertical: Spacing.xxs, // Use theme spacing
    borderRadius: BorderRadius.sm, // Use theme border radius
  },
  archivedBadge: {
    backgroundColor: Colors.backgroundGray2, // Use theme color
  },
  completedBadge: {
    backgroundColor: Colors.warningLightTint, // Use theme color
  },
  statusText: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    fontWeight: Typography.fontWeightBold, // Use theme typography
    color: Colors.primary, // Use theme color
  },
  archivedText: {
    color: Colors.textGray, // Use theme color
  },
  completedText: {
    color: Colors.warningDark, // Use theme color
  },
  dates: {
    flexDirection: 'row',
    marginBottom: Spacing.xl, // Use theme spacing
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    color: Colors.textGray, // Use theme color
    marginBottom: Spacing.xxs, // Use theme spacing
  },
  dateValue: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    fontWeight: Typography.fontWeightMedium, // Use theme typography
    color: Colors.darkGray, // Use theme color
  },
  actions: {
    marginTop: Spacing.sm, // Use theme spacing
    flexDirection: 'row',
    gap: Spacing.sm, // Use theme spacing
  },
  actionButton: {
    flex: 1,
  },
});
