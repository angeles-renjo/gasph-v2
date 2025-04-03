import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { formatDate, formatPrice } from '@/utils/formatters';

export interface DOEPrice {
  fuel_type: string;
  min_price: number | null; // Allow null
  common_price: number | null; // Allow null
  max_price: number | null; // Allow null
  week_of: string;
  source: string | null; // Source might be null if no DOE data found
}

interface DOEPriceTableProps {
  prices: DOEPrice[];
  latestDate?: string; // The latest date among all prices
}

export function DOEPriceTable({ prices, latestDate }: DOEPriceTableProps) {
  // Find the most recent date if not provided
  const mostRecentDate =
    latestDate || (prices.length > 0 ? prices[0].week_of : '');

  // If there are no prices, show a message
  if (!prices || prices.length === 0) {
    return (
      <Card style={styles.card}>
        <Text style={styles.title}>DOE Reference Data</Text>
        <Text style={styles.emptyText}>
          No DOE price data available for this station.
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>DOE Reference Data</Text>

      <View style={styles.tableContainer}>
        {/* Table Header */}
        <View style={styles.headerRow}>
          <View style={styles.fuelTypeCell}>
            <Text style={styles.headerCellText}></Text>
          </View>
          <View style={styles.priceCell}>
            <Text style={styles.headerCellText}>Min</Text>
          </View>
          <View style={styles.priceCell}>
            <Text style={styles.headerCellText}>Common</Text>
          </View>
          <View style={styles.priceCell}>
            <Text style={styles.headerCellText}>Max</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Table Rows */}
        {prices.map((price, index) => (
          <View
            key={price.fuel_type}
            style={[
              styles.dataRow,
              index % 2 === 0 ? styles.evenRow : styles.oddRow,
            ]}
          >
            <View style={styles.fuelTypeCell}>
              {/* Simplify fuel type display */}
              <Text style={styles.fuelTypeText}>{price.fuel_type}</Text>
              {/* Display the source only if it exists */}
              {price.source && (
                <Text style={styles.sourceText}>({price.source})</Text>
              )}
            </View>
            <View style={styles.priceCell}>
              <Text style={styles.priceText}>
                {price.min_price ? formatPrice(price.min_price) : '--'}
              </Text>
            </View>
            <View style={styles.priceCell}>
              <Text style={styles.priceText}>
                {price.common_price ? formatPrice(price.common_price) : '--'}
              </Text>
            </View>
            <View style={styles.priceCell}>
              <Text style={styles.priceText}>
                {price.max_price ? formatPrice(price.max_price) : '--'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {mostRecentDate && (
        <Text style={styles.dateText}>As of {formatDate(mostRecentDate)}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tableContainer: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginBottom: 2,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  evenRow: {
    backgroundColor: '#f5f5f5',
  },
  oddRow: {
    backgroundColor: '#ffffff',
  },
  fuelTypeCell: {
    flex: 1.5,
    paddingRight: 4,
    justifyContent: 'center',
    minHeight: 42,
  },
  priceCell: {
    width: 70,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  headerCellText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  fuelTypeText: {
    fontSize: 13,
    color: '#333',
  },
  priceText: {
    fontSize: 13,
    color: '#2a9d8f',
    fontWeight: '500',
  },
  sourceText: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  dateText: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
});
