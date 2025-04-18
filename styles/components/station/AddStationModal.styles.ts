import { StyleSheet, Platform } from 'react-native';
import theme, {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from '@/styles/theme';

export default StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    backgroundColor: Colors.modalBackdrop, // Semi-transparent backdrop
  },
  scrollViewContent: {
    flexGrow: 1, // Ensure content can scroll if needed
    justifyContent: 'center', // Center content within scrollview
    alignItems: 'center',
    paddingVertical: Spacing.xl, // Add padding for scroll
    paddingHorizontal: Spacing.md, // Add horizontal padding
    width: '100%', // Ensure ScrollView takes width
  },
  card: {
    width: '100%', // Make card take available width (within padding)
    // maxWidth: 500, // Removed max width for better responsiveness on small screens
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden', // Clip content to rounded corners
    marginVertical: Spacing.lg, // Add vertical margin
    // Shadow (consider platform differences)
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardHeader: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGray,
    alignItems: 'center', // Center title
  },
  cardTitle: {
    fontSize: Typography.fontSizeXLarge, // Adjust size as needed
    fontWeight: Typography.fontWeightBold,
    color: Colors.primary, // Teal color
    textAlign: 'center',
  },
  cardContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg, // Add top padding
    paddingBottom: Spacing.md, // Add bottom padding before required text
  },
  inputGroup: {
    marginBottom: Spacing.lg, // Space between form groups
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm, // Space below label
  },
  labelNumber: {
    fontSize: Typography.fontSizeMedium,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.primary, // Teal number
    marginRight: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSizeMedium,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.darkGray, // Standard label color
    flexShrink: 1, // Allow label text to wrap if needed
  },
  requiredIndicator: {
    color: Colors.danger,
    fontSize: Typography.fontSizeMedium,
    fontWeight: Typography.fontWeightMedium,
    marginLeft: Spacing.xxs,
  },
  locationButton: {
    // Use Button's internal styling + overrides if needed
    // Example override:
    // borderColor: Colors.primaryLightTint,
    // backgroundColor: Colors.white,
    height: 48, // Match input height
    justifyContent: 'center', // Center content vertically
  },
  locationButtonText: {
    // Style text if Button component allows
    color: Colors.primary,
    fontWeight: Typography.fontWeightMedium,
  },
  coordsText: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
    marginTop: Spacing.xs,
  },
  addressDisplayContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundGray, // Light background
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: Typography.fontSizeSmall,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.darkGray,
    marginRight: Spacing.xs,
  },
  addressText: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
    flex: 1, // Allow text to take remaining space
    marginLeft: Spacing.xs, // Space after indicator/label
  },
  addressDetailText: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.textGray,
    marginTop: Spacing.xxs,
  },
  errorText: {
    color: Colors.danger,
    fontWeight: Typography.fontWeightMedium,
  },
  // Input styling (assuming ui/Input handles base styles)
  // Add specific overrides if needed, e.g., for height
  // input: {
  //   height: Spacing.inputHeight,
  // },

  // Amenities Grid
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Distribute items
    marginTop: Spacing.xs,
  },
  checkboxItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%', // Roughly two columns with gap
    marginBottom: Spacing.sm, // Space between rows
  },
  checkbox: {
    marginRight: Spacing.sm,
    // Adjust size if needed (platform specific)
    width: 20,
    height: 20,
    borderColor: Colors.mediumGray, // Default border color
  },
  checkboxLabel: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.darkGray,
    flexShrink: 1, // Allow text to wrap
  },

  // Text Area (Operating Hours)
  textAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align icon to top
    borderColor: Colors.mediumGray,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.inputPaddingHorizontal,
    paddingTop: Spacing.sm, // Add padding top for icon/text
    paddingBottom: Spacing.sm,
    minHeight: 80, // Minimum height like web
    backgroundColor: Colors.white, // Ensure background for input
  },
  textAreaIcon: {
    marginRight: Spacing.sm,
    marginTop: Platform.OS === 'ios' ? 1 : 3, // Fine-tune icon vertical position
  },
  textAreaInput: {
    flex: 1, // Take remaining space
    fontSize: Typography.fontSizeMedium,
    color: Colors.darkGray,
    paddingTop: 0, // Remove default padding if any
    paddingBottom: 0,
    // No border here as it's on the container
    // height is managed by container's minHeight and content
  },

  // Required Text Note
  requiredText: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.textGray,
    textAlign: 'right',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs, // Align with content padding
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dividerGray,
  },
  footerButton: {
    flex: 1, // Make buttons share space
    // Use Button's internal styling + overrides
    height: 48,
    justifyContent: 'center',
  },
  cancelButton: {
    marginRight: Spacing.sm, // Space between buttons
    // Example overrides for outline variant:
    // backgroundColor: Colors.white,
    // borderColor: Colors.lightGray,
  },
  cancelButtonText: {
    // Style text if Button component allows
    color: Colors.textGray,
  },
  submitButton: {
    marginLeft: Spacing.sm, // Space between buttons
    // Example overrides for primary variant:
    // backgroundColor: Colors.primary,
  },
  submitButtonText: {
    // Style text if Button component allows
    color: Colors.white,
  },
});
