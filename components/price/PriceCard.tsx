import React, { useState } from 'react';
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
import { usePriceConfirmation } from '@/hooks/usePriceConfirmation';
import { useAuth } from '@/hooks/useAuth';

export interface PriceCardProps {
  id?: string; // Report ID for confirmation
  stationId?: string; // Station ID for query invalidation
  fuelType: string;
  price: number;
  date: string;
  source: 'community' | 'official';
  username?: string;
  userId?: string; // User ID of reporter
  confirmationsCount?: number;
  userHasConfirmed?: boolean;
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
  confirmationsCount = 0,
  userHasConfirmed = false,
  isOwnReport = false,
}: PriceCardProps) {
  const isCommunity = source === 'community';
  const relativeTime = formatRelativeTime(date);
  const { confirmPrice, isConfirming } = usePriceConfirmation();
  const { user } = useAuth();
  const [localConfirmed, setLocalConfirmed] = useState(userHasConfirmed);
  const [localConfirmCount, setLocalConfirmCount] =
    useState(confirmationsCount);
  const [isConfirmingLocal, setIsConfirmingLocal] = useState(false);

  const handleConfirmPrice = async () => {
    if (id && stationId) {
      setIsConfirmingLocal(true);
      const success = await confirmPrice(id, stationId);

      if (success) {
        setLocalConfirmed(true);
        setLocalConfirmCount((prevCount) => prevCount + 1);
      }

      setIsConfirmingLocal(false);
    }
  };

  const renderConfirmationContent = () => {
    // If user has already confirmed or it's their own report
    if (localConfirmed || isOwnReport) {
      return (
        <View style={styles.confirmationsContainer}>
          <Text style={styles.confirmationsLabel}>Confirmations</Text>
          <Text style={styles.confirmationsCount}>
            {localConfirmCount}{' '}
            {localConfirmCount === 1 ? 'Confirmation' : 'Confirmations'}
          </Text>
          {isOwnReport && <Text style={styles.ownReportTag}>Your report</Text>}
        </View>
      );
    }

    // If user hasn't confirmed and is not the report owner
    if (id && stationId && user && !isOwnReport) {
      return isConfirmingLocal ? (
        <ActivityIndicator size='small' color='#2a9d8f' />
      ) : (
        <View style={styles.confirmationsContainer}>
          <TouchableOpacity
            onPress={handleConfirmPrice}
            style={styles.confirmButton}
            disabled={isConfirmingLocal}
          >
            <FontAwesome5 name='check-circle' size={16} color='#2a9d8f' />
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>

          <Text style={styles.confirmationsCount}>
            {localConfirmCount}{' '}
            {localConfirmCount === 1 ? 'Confirmation' : 'Confirmations'}
          </Text>
        </View>
      );
    }

    // Fallback to just showing confirmation count
    return (
      <View style={styles.confirmationsContainer}>
        <Text style={styles.confirmationsLabel}>Confirmations</Text>
        <Text style={styles.confirmationsCount}>
          {localConfirmCount}{' '}
          {localConfirmCount === 1 ? 'Confirmation' : 'Confirmations'}
        </Text>
      </View>
    );
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
            <View style={styles.userContainer}>
              <Text style={styles.userLabel}>Reported by</Text>
              <Text style={styles.username}>{username || 'Anonymous'}</Text>
            </View>

            {/* Confirmations Section */}
            {renderConfirmationContent()}
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
  confirmationsContainer: {
    alignItems: 'center',
  },
  confirmationsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  confirmButtonText: {
    fontSize: 12,
    color: '#2a9d8f',
    marginLeft: 4,
  },
  confirmationsCount: {
    fontSize: 12,
    color: '#666',
  },
  ownReportTag: {
    fontSize: 10,
    color: '#2a9d8f',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
