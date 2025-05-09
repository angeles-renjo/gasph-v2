import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 350;
const isLargeScreen = screenWidth > 400;

export const styles = StyleSheet.create({
  card: {
    // Use padding and borderRadius specific to this card
    padding: isSmallScreen ? Spacing.md : Spacing.xl,
    borderRadius: BorderRadius.lg,
    // Shadow and elevation are now handled by TouchableCard's 'elevated' variant
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGray,
  },
  fuelTypeContainer: {
    backgroundColor: Colors.primaryLightTint,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg_xl,
    alignSelf: 'flex-start',
  },
  fuelType: {
    fontSize: isSmallScreen
      ? Typography.fontSizeSmall
      : Typography.fontSizeMedium,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.primary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: isSmallScreen
      ? Typography.fontSizeXLarge
      : Typography.fontSizeXXLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.primary,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLightTint,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxxs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xxs,
  },
  savingsIcon: {
    marginRight: 3,
  },
  savingsBadgeText: {
    fontSize: Typography.fontSizeXXSmall,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.success,
  },

  // Content container - adaptive based on screen size
  contentContainer: {
    marginBottom: Spacing.md,
  },
  standardLayout: {
    flexDirection: 'column',
  },
  wideLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Station section
  stationSection: {
    marginBottom: isLargeScreen ? 0 : Spacing.sm,
    width: isLargeScreen ? '60%' : '100%',
  },
  stationName: {
    fontSize: Typography.fontSizeLarge,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.darkGray,
    marginBottom: Spacing.xxxs,
  },
  stationBrand: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
  },

  // Metrics section
  metricsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: isLargeScreen ? 'flex-end' : 'flex-start',
    width: isLargeScreen ? '40%' : '100%',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginBottom: isSmallScreen ? Spacing.xs : 0,
    backgroundColor: Colors.primaryLightTint,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.md,
  },
  metricText: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeightMedium,
  },

  // Action section
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.dividerGray,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.lightGray2,
    minHeight: 44,
    minWidth: 44,
    flex: 1,
    marginHorizontal: Spacing.xxs,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeightMedium,
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSizeSmall,
  },
});
