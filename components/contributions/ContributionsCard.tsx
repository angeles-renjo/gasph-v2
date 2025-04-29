import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme';

interface ContributionsCardProps {
  confirmations: number;
  priceReports: number;
}

const ContributionsCard: React.FC<ContributionsCardProps> = ({
  confirmations,
  priceReports,
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Your Contributions</Text>
        <TouchableOpacity onPress={() => router.push('/contributions')}>
          <Text style={styles.detailsText}>Details {'>'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.contributionItem}>
          <FontAwesome5 name='check-circle' size={24} color={Colors.primary} />
          <View style={styles.contributionText}>
            <Text style={styles.contributionValue}>{confirmations}</Text>
            <Text style={styles.contributionLabel}>Confirmations</Text>
            <Text style={styles.contributionSubLabel}>Last 30 days</Text>
          </View>
        </View>

        <View style={styles.contributionItem}>
          <FontAwesome5 name='chart-bar' size={24} color={Colors.primary} />
          <View style={styles.contributionText}>
            <Text style={styles.contributionValue}>{priceReports}</Text>
            <Text style={styles.contributionLabel}>Price Reports</Text>
            <Text style={styles.contributionSubLabel}>Last 30 days</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: Spacing.xl,
    marginHorizontal: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerText: {
    fontSize: Typography.fontSizeLarge,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.darkGray,
  },
  detailsText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeightMedium,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  contributionItem: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dividerGray || Colors.gray,
    borderRadius: BorderRadius.sm,
    gap: 12,
    flex: 0.48, // Take up slightly less than half the space for proper spacing
    backgroundColor: Colors.backgroundGray2 || Colors.white,
  },
  contributionText: {
    marginLeft: Spacing.sm,
  },
  contributionValue: {
    fontSize: Typography.fontSizeXLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.darkGray,
  },
  contributionLabel: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
  },
  contributionSubLabel: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.textGray,
  },
});

export default ContributionsCard;
