import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/styles/theme';
import {
  usePriceConfirmation,
  useHasConfirmedPrice,
} from '@/hooks/queries/prices/usePriceConfirmation';
import { useAuth } from '@/hooks/useAuth';

interface PriceConfirmationProps {
  reportId: string;
  stationId: string;
  confirmationsCount: number;
  isOwnReport: boolean;
}

export function PriceConfirmation({
  reportId,
  stationId,
  confirmationsCount = 0,
  isOwnReport = false,
}: PriceConfirmationProps) {
  // Get current user authentication status
  const { user } = useAuth();
  // Hook for mutating (confirming) a price report
  const { mutate: confirmPrice, isPending: isConfirming } =
    usePriceConfirmation();
  // Hook to check if the current user has already confirmed this specific report
  const { data: hasConfirmed } = useHasConfirmedPrice(reportId);

  // Handler function to trigger the price confirmation mutation
  const handleConfirmPrice = () => {
    if (!reportId || !stationId) return;
    confirmPrice(
      { reportId, stationId },
      {
        onError: (error) => {
          console.error('Error confirming price:', error);
          // Optionally show an alert to the user here
        },
      }
    );
  };

  // Rationale: Display confirmation count and 'Your report' tag if the user has already confirmed this price
  // or if they are the original reporter. This prevents users from confirming their own reports or confirming multiple times.
  if (hasConfirmed || isOwnReport) {
    return (
      <View style={styles.confirmationsContainer}>
        <Text style={styles.confirmationsLabel}>Confirmations</Text>
        <Text style={styles.confirmationsCount}>
          {confirmationsCount}{' '}
          {confirmationsCount === 1 ? 'Confirmation' : 'Confirmations'}
        </Text>
        {isOwnReport && <Text style={styles.ownReportTag}>Your report</Text>}
      </View>
    );
  }

  // Rationale: If the user is logged in, hasn't confirmed this report yet, and isn't the owner,
  // provide the option to confirm. Show a loading indicator during the confirmation API call.
  if (user && !isOwnReport) {
    return isConfirming ? (
      <ActivityIndicator size='small' color={Colors.primary} /> // Indicate confirmation in progress
    ) : (
      <View style={styles.confirmationsContainer}>
        <TouchableOpacity
          onPress={handleConfirmPrice}
          style={styles.confirmButton}
          disabled={isConfirming}
        >
          <FontAwesome5 name='check-circle' size={16} color={Colors.primary} />
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
        <Text style={styles.confirmationsCount}>
          {confirmationsCount}{' '}
          {confirmationsCount === 1 ? 'Confirmation' : 'Confirmations'}
        </Text>
      </View>
    );
  }

  // Rationale: Default fallback for users who are not logged in or cannot confirm.
  // Simply displays the current confirmation count without interaction.
  return (
    <View style={styles.confirmationsContainer}>
      <Text style={styles.confirmationsLabel}>Confirmations</Text>
      <Text style={styles.confirmationsCount}>
        {confirmationsCount}{' '}
        {confirmationsCount === 1 ? 'Confirmation' : 'Confirmations'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  confirmationsContainer: {
    alignItems: 'center',
  },
  confirmationsLabel: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.textGray,
    marginBottom: Spacing.xxs,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  confirmButtonText: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.primary,
    marginLeft: Spacing.xxs,
  },
  confirmationsCount: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.textGray,
  },
  ownReportTag: {
    fontSize: Typography.fontSizeXXSmall,
    color: Colors.primary,
    fontStyle: 'italic',
    marginTop: Spacing.xxxs,
  },
});
