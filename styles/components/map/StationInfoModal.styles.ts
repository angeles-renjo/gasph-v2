import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme';

export const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalView: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  // --- Header ---
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: '#f0fdfa',
    position: 'relative',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.fontSizeLarge,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.darkGray,
    marginBottom: Spacing.xs,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.xxs,
  },
  addressIcon: {
    marginRight: Spacing.xs,
    marginTop: 2,
  },
  modalAddress: {
    flex: 1,
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.md,
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  // --- Scrollable Content ---
  scrollContentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSizeLarge,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.darkGray,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  badgeWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  doeBadge: {
    backgroundColor: Colors.backgroundGray,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs + 1,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dividerGray,
  },
  doeBadgeText: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.textGray,
    fontWeight: Typography.fontWeightRegular,
  },
  doeWeekOf: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.textGray,
    fontWeight: Typography.fontWeightRegular,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    marginRight: Spacing.xxs,
  },
  warningText: {
    color: Colors.warning,
    fontSize: Typography.fontSizeXSmall,
  },
  inlineLoader: {
    marginVertical: Spacing.md,
    alignSelf: 'center',
  },
  errorTextSmall: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.error,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  priceGridContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundGray,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  priceBlock: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  priceBlockHighlight: {
    backgroundColor: Colors.backgroundGray2,
  },
  priceBlockLabel: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.textGray,
    marginBottom: Spacing.xxs,
  },
  priceBlockValue: {
    fontSize: Typography.fontSizeMedium,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.darkGray,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.dividerGray,
    marginVertical: Spacing.lg,
  },
  // --- Community Section ---
  communitySection: {
    backgroundColor: '#f0fdfa',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  communityTitle: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
  },
  confirmationsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmationIcon: {
    marginRight: Spacing.xxs,
  },
  confirmationsText: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.textGray,
  },
  communityPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
  },
  communityPriceValue: {
    fontSize: Typography.fontSizeXLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.primary,
  },
  communityReporterText: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.textGray,
    marginLeft: Spacing.sm,
    flexShrink: 1,
  },
  infoText: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
    textAlign: 'center',
    marginVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  // --- Footer ---
  footerContainer: {
    flexDirection: 'row',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeFooterButton: {
    borderRightWidth: 1,
    borderRightColor: Colors.dividerGray,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.dividerGray,
    paddingVertical: Spacing.md - 1,
    borderBottomLeftRadius: BorderRadius.xl,
  },
  directionsFooterButton: {
    backgroundColor: Colors.primary,
    // Remove borderBottomRightRadius since it's no longer the last element
  },
  pricefooterButton: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.dividerGray,
    borderRightWidth: 1,
    borderRightColor: Colors.dividerGray,
  },
  reportFooterButton: {
    backgroundColor: Colors.white,
    // Add border radius to the last button
    borderBottomRightRadius: BorderRadius.xl,
  },
  footerButtonText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSizeSmall,
    fontWeight: Typography.fontWeightMedium,
  },
  closeFooterButtonText: {
    color: Colors.darkGray,
  },
  directionsFooterButtonText: {
    color: Colors.white,
  },
  priceFooterButtonText: {
    color: Colors.primary,
  },
  reportFooterButtonText: {
    color: Colors.warning,
  },
});
