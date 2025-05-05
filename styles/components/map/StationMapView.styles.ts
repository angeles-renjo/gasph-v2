import { StyleSheet } from 'react-native';
import theme from '@/styles/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // --- Revised Marker Styles ---
  markerContainer: {
    alignItems: 'center',
  },
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    marginBottom: 2,
  },
  starContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 8,
    paddingHorizontal: 2,
    paddingVertical: 0,
    zIndex: 2,
  },
  starText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  favoriteMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteStarIcon: {
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  favoriteMarkerPriceText: {
    fontSize: theme.Typography.fontSizeSmall,
    fontWeight: theme.Typography.fontWeightBold,
    color: '#FFD700',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: theme.Spacing.xs,
    paddingVertical: 1,
    borderRadius: theme.BorderRadius.sm,
    overflow: 'hidden',
    marginTop: -2,
  },
  markerRing: {
    width: 29, // Increased size (approx 1.2x)
    height: 29, // Increased size (approx 1.2x)
    borderRadius: 14.5, // Adjusted for new size
    backgroundColor: theme.Colors.white, // Default white background
    position: 'absolute',
    borderWidth: 2, // Make border slightly thicker
    borderColor: theme.Colors.primary, // Default primary border
    // Add centering for the child Text element
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMarkerRing: {
    // Style for selected state
    backgroundColor: theme.Colors.primary, // Primary background when selected
    borderColor: theme.Colors.darkGray, // Darker border when selected
  },
  marker: {
    // Central dot
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.Colors.primary, // Primary color dot
  },
  markerPriceText: {
    // Style for the price text below the marker
    fontSize: theme.Typography.fontSizeSmall,
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white background
    paddingHorizontal: theme.Spacing.xs,
    paddingVertical: 1,
    borderRadius: theme.BorderRadius.sm,
    overflow: 'hidden', // Clip background to border radius
  },
  selectedMarkerPriceText: {
    // Optional: Style changes for text when marker is selected
    // e.g., color: theme.Colors.white, backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  clusterCountText: {
    // Style for the count text inside the cluster circle
    fontSize: theme.Typography.fontSizeSmall, // Adjust size as needed
    fontWeight: theme.Typography.fontWeightBold,
    color: theme.Colors.primary, // Use primary color for the count text
    textAlign: 'center', // Ensure text is centered
  },
  // --- End Revised Marker Styles ---
});
