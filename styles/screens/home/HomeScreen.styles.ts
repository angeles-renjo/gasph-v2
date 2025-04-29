import { StyleSheet } from 'react-native';
import theme from '@/styles/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.light.background,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: theme.Colors.light.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.md,
    marginBottom: theme.Spacing.md,
    marginTop: theme.Spacing.lg,
  },
  headerTitle: {
    fontSize: theme.Typography.fontSizeLarge,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.darkGray,
  },
  viewAllButton: {
    padding: theme.Spacing.sm,
  },
  viewAllText: {
    color: theme.Colors.primary,
    fontWeight: theme.Typography.fontWeightMedium,
    fontSize: theme.Typography.fontSizeSmall,
  },
  pagerView: {
    height: 220,
    marginBottom: theme.Spacing.sm,
  },
  pagerIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.xl,
  },
  pagerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    opacity: 0.5,
  },
  listContent: {
    padding: theme.Spacing.md,
    paddingTop: theme.Spacing.sm,
  },

  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.Colors.primaryLightTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.xl,
    shadowColor: theme.Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  fallbackIcon: {
    opacity: 0.9,
  },
  fallbackTitle: {
    fontSize: theme.Typography.fontSizeXLarge,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.darkGray,
    marginBottom: theme.Spacing.md,
    textAlign: 'center',
  },
  fallbackMessage: {
    fontSize: theme.Typography.fontSizeMedium,
    color: theme.Colors.textGray,
    textAlign: 'center',
    marginBottom: theme.Spacing.xl,
    lineHeight: 22,
  },
  fallbackButtonContainer: {
    width: '100%',
  },
  fallbackButton: {
    marginBottom: theme.Spacing.md,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.Colors.light.background,
    paddingTop: theme.Spacing.md,
  },
  welcomeContainer: {
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.lg,
    backgroundColor: theme.Colors.white,
    marginHorizontal: theme.Spacing.md,
    marginTop: theme.Spacing.md,
    marginBottom: theme.Spacing.lg,
    borderRadius: theme.BorderRadius.md,
    shadowColor: theme.Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: theme.Typography.fontSizeXXLarge,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.darkGray,
    marginBottom: theme.Spacing.xs,
  },
  sloganText: {
    fontSize: theme.Typography.fontSizeMedium,
    color: theme.Colors.textGray,
    marginBottom: theme.Spacing.xs,
  },
  fuelTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.Colors.lightGray2,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.lg,
  },
  fuelTypeIcon: {
    marginRight: theme.Spacing.xs,
  },
  fuelTypeText: {
    fontSize: theme.Typography.fontSizeSmall,
    color: theme.Colors.primary,
    fontWeight: theme.Typography.fontWeightMedium,
  },
  faqContainer: {
    backgroundColor: theme.Colors.white,
    borderRadius: theme.BorderRadius.md,
    marginHorizontal: theme.Spacing.md,
    marginTop: theme.Spacing.xl,
    marginBottom: theme.Spacing.xxl,
    padding: theme.Spacing.xl,
    shadowColor: theme.Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faqItemContainer: {
    marginBottom: theme.Spacing.md,
  },
  // Styles for the inline permission denied message in favorites section
  permissionDeniedContainer: {
    alignItems: 'center',
    paddingVertical: theme.Spacing.xl,
    paddingHorizontal: theme.Spacing.md,
    marginHorizontal: theme.Spacing.md,
    marginBottom: theme.Spacing.lg,
    backgroundColor: theme.Colors.white, // Match other card backgrounds
    borderRadius: theme.BorderRadius.md,
    shadowColor: theme.Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  permissionDeniedIcon: {
    marginBottom: theme.Spacing.md,
    opacity: 0.8,
  },
  permissionDeniedTitle: {
    fontSize: theme.Typography.fontSizeMedium,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.darkGray,
    marginBottom: theme.Spacing.sm,
    textAlign: 'center',
  },
  permissionDeniedMessage: {
    fontSize: theme.Typography.fontSizeSmall,
    color: theme.Colors.textGray,
    textAlign: 'center',
    marginBottom: theme.Spacing.lg,
    lineHeight: 18,
  },
  permissionDeniedButton: {
    width: '80%', // Make button slightly narrower than full width
  },
});
