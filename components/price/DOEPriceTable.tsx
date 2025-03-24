import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { formatDate, formatPrice } from '@/utils/formatters';

export interface DOEPrice {
  fuel_type: string;
  min_price: number;
  common_price: number;
  max_price: number;
  week_of: string;
}

interface DOEPriceTableProps {
  prices: DOEPrice[];
  latestDate?: string; // The latest date among all prices
}

export function DOEPriceTable({ prices, latestDate }: DOEPriceTableProps) {
  // Add debug logging
  useEffect(() => {
    console.log('DOEPriceTable received prices:', prices);
    console.log('DOEPriceTable received latestDate:', latestDate);
  }, [prices, latestDate]);

  // Find the most recent date if not provided
  const mostRecentDate =
    latestDate || (prices.length > 0 ? prices[0].week_of : '');

  // If there are no prices, show a message (for debugging)
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

      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.fuelTypeCell]}></Text>
        <Text style={[styles.headerCell, styles.valueCell]}>Min</Text>
        <Text style={[styles.headerCell, styles.valueCell]}>Common</Text>
        <Text style={[styles.headerCell, styles.valueCell]}>Max</Text>
      </View>

      <View style={styles.tableDivider} />

      {prices.map((price, index) => (
        <View
          key={price.fuel_type}
          style={[
            styles.tableRow,
            index % 2 === 0 ? styles.evenRow : styles.oddRow,
          ]}
        >
          <Text style={[styles.cell, styles.fuelTypeCell]}>
            {price.fuel_type}:
          </Text>
          <Text style={[styles.cell, styles.valueCell, styles.priceText]}>
            {price.min_price ? formatPrice(price.min_price) : '--'}
          </Text>
          <Text style={[styles.cell, styles.valueCell, styles.priceText]}>
            {price.common_price ? formatPrice(price.common_price) : '--'}
          </Text>
          <Text style={[styles.cell, styles.valueCell, styles.priceText]}>
            {price.max_price ? formatPrice(price.max_price) : '--'}
          </Text>
        </View>
      ))}

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
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  tableDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  oddRow: {
    backgroundColor: '#ffffff',
  },
  headerCell: {
    fontWeight: '600',
    color: '#666',
    fontSize: 14,
  },
  cell: {
    fontSize: 14,
    color: '#333',
  },
  fuelTypeCell: {
    flex: 1,
    paddingRight: 8,
  },
  valueCell: {
    width: 90,
    textAlign: 'right',
  },
  priceText: {
    color: '#2a9d8f',
    fontWeight: '500',
  },
  dateText: {
    marginTop: 12,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
});
