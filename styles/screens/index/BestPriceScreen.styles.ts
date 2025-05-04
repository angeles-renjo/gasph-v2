import { StyleSheet } from 'react-native';
import theme from '@/styles/theme';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 350;
const isLargeScreen = screenWidth > 400;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.light.background,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: theme.Colors.light.background,
  },

  // Removed header styles again

  // Removed old filter styles (filterContainer, filterSection, etc.)

  // Enhanced stats styles
  statsContainer: {
    backgroundColor: theme.Colors.white,
    marginBottom: theme.Spacing.md,
    borderRadius: theme.BorderRadius.lg,
    padding: isSmallScreen ? theme.Spacing.md : theme.Spacing.xl,
    elevation: 2,
    shadowColor: theme.Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statsRow: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isSmallScreen ? 'flex-start' : 'center',
  },
  statItem: {
    alignItems: isSmallScreen ? 'flex-start' : 'center',
    flex: isSmallScreen ? 0 : 1,
    marginBottom: isSmallScreen ? theme.Spacing.md : 0,
    padding: theme.Spacing.md,
    borderRadius: theme.BorderRadius.md,
  },
  statItemHighlight: {
    backgroundColor: theme.Colors.primaryLightTint,
    borderWidth: 1,
    borderColor: theme.Colors.primary,
  },
  statLabel: {
    fontSize: theme.Typography.fontSizeSmall,
    color: theme.Colors.textGray,
    marginBottom: theme.Spacing.xxs,
    fontWeight: theme.Typography.fontWeightMedium,
  },
  statLabelHighlight: {
    fontSize: theme.Typography.fontSizeSmall,
    color: theme.Colors.primary,
    marginBottom: theme.Spacing.xxs,
    fontWeight: theme.Typography.fontWeightMedium,
  },
  statValue: {
    fontSize: isSmallScreen
      ? theme.Typography.fontSizeLarge
      : theme.Typography.fontSizeXLarge,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.darkGray,
  },
  statValueHighlight: {
    fontSize: isSmallScreen
      ? theme.Typography.fontSizeLarge
      : theme.Typography.fontSizeXLarge,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.primary,
  },

  // Enhanced list styles
  listContent: {
    padding: isSmallScreen ? theme.Spacing.md : theme.Spacing.xl,
    paddingTop: theme.Spacing.md, // Keep padding top for list content
  },

  // Enhanced fallback styles
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.xxl,
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
});
