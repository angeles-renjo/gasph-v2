// components/price/PriceCard.tsx
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
import {
  formatPrice,
  formatRelativeTime,
  formatConfidenceScore,
  getConfidenceColor,
} from '@/utils/formatters';
import { usePriceVoting } from '@/hooks/usePriceVoting';
import { useAuth } from '@/hooks/useAuth';

export interface PriceCardProps {
  id?: string; // Report ID for voting
  stationId?: string; // Station ID for query invalidation
  fuelType: string;
  price: number;
  date: string;
  source: 'community' | 'official';
  username?: string;
  userId?: string; // User ID of reporter for self-vote prevention
  confidence?: number;
  upvotes?: number;
  downvotes?: number;
  userVote?: 'up' | 'down' | null; // User's current vote status
  isOwnReport?: boolean; // Flag to indicate if the current user is the reporter
}

export function PriceCard({
  id,
  stationId,
  fuelType,
  price,
  date,
  source,
  username,
  userId,
  confidence = 0,
  upvotes = 0,
  downvotes = 0,
  userVote,
  isOwnReport = false,
}: PriceCardProps) {
  const isCommunity = source === 'community';
  const confidenceColor = getConfidenceColor(confidence);
  const relativeTime = formatRelativeTime(date);
  const { handleVote, isVoting } = usePriceVoting();
  const { user } = useAuth();

  const handleUpvote = async () => {
    if (id && stationId && userId) {
      await handleVote(id, true, stationId, userId);
    }
  };

  const handleDownvote = async () => {
    if (id && stationId && userId) {
      await handleVote(id, false, stationId, userId);
    }
  };

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

            {/* Votes Section */}
            <View style={styles.votesContainer}>
              <Text style={styles.votesLabel}>Votes</Text>
              {isVoting ? (
                <ActivityIndicator size='small' color='#2a9d8f' />
              ) : (
                <View style={styles.votesRow}>
                  {/* Always show vote counts for everyone */}
                  {id && stationId && userId && user && !isOwnReport ? (
                    /* Show interactive buttons for authenticated users who aren't the reporter */
                    <>
                      <TouchableOpacity
                        onPress={handleUpvote}
                        style={styles.voteButton}
                        disabled={isVoting}
                      >
                        <Text
                          style={[
                            styles.upvotes,
                            userVote === 'up' && styles.activeVote,
                          ]}
                        >
                          <FontAwesome5
                            name='thumbs-up'
                            solid={userVote === 'up'}
                            size={12}
                          />{' '}
                          {upvotes}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.voteSeparator}>/</Text>
                      <TouchableOpacity
                        onPress={handleDownvote}
                        style={styles.voteButton}
                        disabled={isVoting}
                      >
                        <Text
                          style={[
                            styles.downvotes,
                            userVote === 'down' && styles.activeVote,
                          ]}
                        >
                          <FontAwesome5
                            name='thumbs-down'
                            solid={userVote === 'down'}
                            size={12}
                          />{' '}
                          {downvotes}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    /* Show non-interactive version for anonymous users or the reporter */
                    <>
                      <Text
                        style={[
                          styles.upvotes,
                          isOwnReport && styles.ownReportVote,
                        ]}
                      >
                        <FontAwesome5
                          name='thumbs-up'
                          solid={userVote === 'up' || isOwnReport}
                          size={12}
                        />{' '}
                        {upvotes}
                      </Text>
                      <Text style={styles.voteSeparator}>/</Text>
                      <Text style={styles.downvotes}>
                        <FontAwesome5
                          name='thumbs-down'
                          solid={userVote === 'down'}
                          size={12}
                        />{' '}
                        {downvotes}
                      </Text>
                    </>
                  )}
                </View>
              )}

              {/* Display info tag for own reports */}
              {isOwnReport && (
                <Text style={styles.ownReportTag}>Your report</Text>
              )}
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
  voteButton: {
    padding: 5,
  },
  upvotes: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4caf50',
  },
  downvotes: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f44336',
  },
  voteSeparator: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 2,
  },
  activeVote: {
    fontWeight: 'bold',
    opacity: 1,
  },
  ownReportVote: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  ownReportTag: {
    fontSize: 10,
    color: '#2a9d8f',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
