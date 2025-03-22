import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import {
  formatPrice,
  formatRelativeTime,
  formatConfidenceScore,
  getConfidenceColor,
} from '@/utils/formatters';

export interface PriceCardProps {
  fuelType: string;
  price: number;
  date: string;
  source: 'community' | 'official';
  username?: string;
  confidence?: number;
  upvotes?: number;
  downvotes?: number;
}

export function PriceCard({
  fuelType,
  price,
  date,
  source,
  username,
  confidence = 0,
  upvotes = 0,
  downvotes = 0,
}: PriceCardProps) {
  const isCommunity = source === 'community';
  const confidenceColor = getConfidenceColor(confidence);
  const relativeTime = formatRelativeTime(date);

  return (
    <Card variant='outline' style={styles.card}>
      <View style={styles.priceContainer}>
        <Text style={styles.fuelType}>{fuelType}</Text>
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
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Confidence</Text>
              <View
                style={[
                  styles.confidenceBadge,
                  { backgroundColor: confidenceColor },
                ]}
              >
                <Text style={styles.confidenceText}>
                  {formatConfidenceScore(confidence)}
                </Text>
              </View>
            </View>

            <View style={styles.userContainer}>
              <Text style={styles.userLabel}>Reported by</Text>
              <Text style={styles.username}>{username || 'Anonymous'}</Text>
            </View>

            <View style={styles.votesContainer}>
              <Text style={styles.votesLabel}>Votes</Text>
              <View style={styles.votesRow}>
                <Text style={styles.upvotes}>+{upvotes}</Text>
                <Text style={styles.voteSeparator}>/</Text>
                <Text style={styles.downvotes}>-{downvotes}</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    padding: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fuelType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2a9d8f',
  },
  sourceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceLabel: {
    fontSize: 14,
    color: '#666',
  },
  dateLabel: {
    fontSize: 14,
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  userContainer: {
    alignItems: 'center',
  },
  userLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  username: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  votesContainer: {
    alignItems: 'center',
  },
  votesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  votesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvotes: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4caf50',
  },
  voteSeparator: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 2,
  },
  downvotes: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f44336',
  },
});
