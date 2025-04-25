import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { formatDate, formatPrice } from '@/utils/formatters';
import { Colors, Typography, Spacing } from '@/styles/theme'; // Import theme constants

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
    padding: Spacing.xl, // Use theme spacing
    marginBottom: Spacing.xl, // Use theme spacing
    backgroundColor: Colors.white, // Use theme color
  },
  title: {
    fontSize: Typography.fontSizeXLarge, // Use theme typography
    fontWeight: Typography.fontWeightBold, // Use theme typography
    color: Colors.darkGray, // Use theme color
    marginBottom: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  tableContainer: {
    marginBottom: Spacing.sm, // Use theme spacing
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.xs, // Use theme spacing
  },
  divider: {
    height: 1,
    backgroundColor: Colors.mediumLightGray2, // Use theme color
    marginBottom: Spacing.xxxs, // Use theme spacing
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm, // Use theme spacing
  },
  evenRow: {
    backgroundColor: Colors.backgroundGray2, // Use theme color
  },
  oddRow: {
    backgroundColor: Colors.white, // Use theme color
  },
  fuelTypeCell: {
    flex: 1.5,
    paddingRight: Spacing.xxs, // Use theme spacing
    justifyContent: 'center',
    minHeight: 42, // Keep minHeight for now
  },
  priceCell: {
    width: 70, // Keep width fixed for alignment
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxs, // Use theme spacing
  },
  headerCellText: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
    color: Colors.textGray, // Use theme color
    textAlign: 'center',
  },
  fuelTypeText: {
    fontSize: Typography.fontSizeSmallMedium, // Use theme typography
    color: Colors.darkGray, // Use theme color
  },
  priceText: {
    fontSize: Typography.fontSizeSmallMedium, // Use theme typography
    color: Colors.primary, // Use theme color
    fontWeight: Typography.fontWeightMedium, // Use theme typography
  },
  sourceText: {
    fontSize: Typography.fontSizeXSmall, // Use theme typography
    color: Colors.iconGray, // Use theme color
    marginTop: Spacing.xxxs, // Use theme spacing
  },
  dateText: {
    marginTop: Spacing.xs, // Use theme spacing
    fontSize: Typography.fontSizeSmall, // Use theme typography
    color: Colors.textGray, // Use theme color
    fontStyle: 'italic', // Keep fontStyle local
    textAlign: 'right',
  },
  emptyText: {
    fontSize: Typography.fontSizeSmallMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
    fontStyle: 'italic', // Keep fontStyle local
    textAlign: 'center',
    marginVertical: Spacing.lg_xl, // Use theme spacing
  },
});
