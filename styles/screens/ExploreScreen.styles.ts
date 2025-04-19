import { Colors, Spacing, Typography, BorderRadius } from '@/styles/theme'; // Import theme constants
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray2, // Use theme color
  },
  defaultLocationBanner: {
    backgroundColor: Colors.secondary, // Use theme color (secondary or warning)
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm, // Use theme spacing
    paddingHorizontal: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  bannerIcon: {
    marginRight: Spacing.sm, // Use theme spacing
  },
  bannerText: {
    flex: 1,
    color: Colors.white, // Use theme color
    fontSize: Typography.fontSizeSmall, // Use theme typography
  },
  bannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Keep semi-transparent white
    paddingVertical: Spacing.xxs, // Use theme spacing
    paddingHorizontal: Spacing.sm, // Use theme spacing
    borderRadius: BorderRadius.sm, // Use theme border radius
    marginLeft: Spacing.sm, // Use theme spacing
  },
  bannerButtonText: {
    color: Colors.white, // Use theme color
    fontSize: Typography.fontSizeSmall, // Use theme typography
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
  },
  searchContainer: {
    backgroundColor: Colors.white, // Use theme color
    padding: Spacing.xl, // Use theme spacing
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGray, // Use theme color
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.inputPaddingHorizontal, // Use theme spacing
    borderRadius: BorderRadius.xl, // Make more rounded
    borderWidth: 3,
    borderColor: Colors.dividerGray, // Use subtle border color
  },
  searchIcon: {
    marginRight: Spacing.sm, // Use theme spacing
    color: Colors.iconGray, // Use specific icon color
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md, // Use theme spacing
    fontSize: Typography.fontSizeLarge, // Use theme typography
    color: Colors.darkGray, // Use theme color
    // placeholderTextColor is a TextInput prop, not a style
  },
  brandFilterContainer: {
    backgroundColor: Colors.white, // Use theme color
    paddingVertical: Spacing.inputPaddingHorizontal, // Use theme spacing
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGray, // Use theme color
  },
  brandList: {
    paddingHorizontal: Spacing.xl, // Use theme spacing
  },
  brandChip: {
    paddingHorizontal: Spacing.inputPaddingHorizontal, // Use theme spacing
    paddingVertical: Spacing.xs, // Use theme spacing
    borderRadius: BorderRadius.round, // Make pill-shaped
    backgroundColor: 'transparent', // Remove background fill for unselected
    marginRight: Spacing.md, // Increase space between chips
    borderWidth: 1, // Keep border
    borderColor: Colors.mediumGray, // Use a slightly darker border for unselected
  },
  selectedBrandChip: {
    backgroundColor: Colors.primaryLightTint, // Use light tint for selected background
    borderColor: Colors.primary, // Keep primary border for selected
  },
  brandChipText: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    color: Colors.textGray, // Use theme color for unselected text
  },
  selectedBrandChipText: {
    color: Colors.primary, // Use primary color for selected text
    fontWeight: Typography.fontWeightMedium, // Use theme typography
  },
  stationList: {
    padding: Spacing.xl, // Use theme spacing
  },
});
