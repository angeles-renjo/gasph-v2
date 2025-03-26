import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/formatters';

interface PriceCycleCardProps {
  cycle: {
    id: string;
    cycle_number: number;
    start_date: string;
    end_date: string;
    status: 'active' | 'completed' | 'archived';
    doe_import_date: string | null;
  };
  onArchive?: (id: string) => void;
  onActivate?: (id: string) => void;
}

export function PriceCycleCard({
  cycle,
  onArchive,
  onActivate,
}: PriceCycleCardProps) {
  const isActive = cycle.status === 'active';
  const isArchived = cycle.status === 'archived';

  return (
    <Card
      style={[
        styles.card,
        isActive && styles.activeCard,
        isArchived && styles.archivedCard,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.cycleNumberContainer}>
          <Text style={styles.cycleNumberLabel}>Cycle</Text>
          <Text style={styles.cycleNumber}>{cycle.cycle_number}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.statusText,
              isActive && styles.activeStatusText,
              isArchived && styles.archivedStatusText,
            ]}
          >
            {cycle.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.dateContainer}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Start Date</Text>
          <Text style={styles.dateValue}>{formatDate(cycle.start_date)}</Text>
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>End Date</Text>
          <Text style={styles.dateValue}>{formatDate(cycle.end_date)}</Text>
        </View>
      </View>

      {cycle.doe_import_date && (
        <View style={styles.importInfoContainer}>
          <FontAwesome5 name='file-import' size={14} color='#666' />
          <Text style={styles.importText}>
            DOE Import: {formatDate(cycle.doe_import_date)}
          </Text>
        </View>
      )}

      {!isActive && !isArchived && onActivate && (
        <Button
          title='Set as Active'
          variant='outline'
          size='small'
          onPress={() => onActivate(cycle.id)}
          style={styles.actionButton}
        />
      )}

      {!isActive && !isArchived && onArchive && (
        <Button
          title='Archive'
          variant='danger'
          size='small'
          onPress={() => onArchive(cycle.id)}
          style={styles.actionButton}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    padding: 16,
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2a9d8f',
  },
  archivedCard: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: '#999',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cycleNumberContainer: {
    alignItems: 'center',
  },
  cycleNumberLabel: {
    fontSize: 12,
    color: '#666',
  },
  cycleNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    padding: 4,
    borderRadius: 4,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  activeStatusText: {
    color: '#2a9d8f',
  },
  archivedStatusText: {
    color: '#999',
  },
  dateContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  importInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  importText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  actionButton: {
    marginTop: 12,
  },
});
