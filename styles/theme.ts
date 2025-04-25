// This file will contain centralized theme definitions,
// starting with colors and potentially expanding to typography, spacing, etc.

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    // Add other specific light theme colors if needed
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    // Add other specific dark theme colors if needed
  },
  // Common colors (can be used in both themes or independently)
  primary: '#2a9d8f', // From constants/Colors.ts & Button
  secondary: '#f4a261', // From Button
  accent: '#FFC107', // Keeping example, adjust if project has an accent
  danger: '#f44336', // From Button
  error: '#dc3545', // From constants/Colors.ts
  success: '#28a745', // From constants/Colors.ts
  successDark: '#4caf50', // From CycleInfoBadge completed
  successLightTint: '#e8f5e9', // From CycleInfoBadge completed bg
  warning: '#ffc107', // From constants/Colors.ts
  warningDark: '#f57c00', // From PriceCycleCard completed text
  warningLightTint: '#fff3e0', // From PriceCycleCard completed bg
  gray: '#6c757d', // From constants/Colors.ts
  iconGray: '#777', // From Input icon
  placeholderGray: '#999', // From Input placeholder & PriceCard date
  mediumGray: '#ccc', // From Input border
  mediumGray2: '#9e9e9e', // From CycleInfoBadge archived
  mediumLightGray: '#888', // From BestPriceCard DOE header
  mediumLightGray2: '#ddd', // From DOEPriceTable divider
  lightGray: '#e0e0e0', // From Card border & BestPriceCard badge bg
  lightGray2: '#f0f0f0', // From StationCard distance bg & CycleInfoBadge default bg
  dividerGray: '#eee', // From PriceCard divider & BestPriceCard/StationCard borderTop
  backgroundGray: '#f9f9f9', // From BestPriceCard DOE table bg
  backgroundGray2: '#f5f5f5', // From DOEPriceTable even row bg
  textGray: '#666', // From LoadingIndicator message & PriceCard/BestPriceCard/DOEPriceTable labels
  mediumDarkGray: '#444', // From BestPriceCard DOE text
  darkGray: '#333', // From Input label/text & PriceCard/BestPriceCard text
  primaryLightTint: '#e6f7f5', // From BestPriceCard fuel type bg
  white: '#ffffff', // From Button & Card & Input & LoadingIndicator & Modal
  black: '#000000', // Common & Card shadow
  modalBackdrop: 'rgba(0, 0, 0, 0.5)', // From CreateCycleModal
  // Note: tabIconDefault is already defined within light/dark themes
};

export const Typography = {
  // Font Weights
  fontWeightRegular: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const, // From Button
  fontWeightBold: '700' as const,

  // Font Sizes
  fontSizeXXSmall: 10, // From PriceCard tag
  fontSizeXSmall: 11, // From BestPriceCard DOE badge/header text (adjusted from 11)
  fontSizeSmall: 12, // From PriceCard labels/counts (adjusted from 12)
  fontSizeSmallMedium: 13, // From BestPriceCard DOE value/confirmation/benchmark text
  fontSizeMedium: 14, // From Button & PriceCard labels & BestPriceCard fuelType/stationBrand/infoText (adjusted from 14)
  fontSizeLarge: 16, // From Button & PriceCard text & BestPriceCard stationName (adjusted from 16)
  fontSizeXLarge: 18, // From Button & PriceCard price (adjusted from 18)
  fontSizeXXLarge: 20, // From BestPriceCard price
  // Add more as needed (e.g., heading sizes)

  // Example combinations (can be expanded)
  // bodySmall: { fontSize: fontSizeSmall, fontWeight: fontWeightRegular },
  // bodyMedium: { fontSize: fontSizeMedium, fontWeight: fontWeightRegular },
  // buttonText: { fontSize: fontSizeMedium, fontWeight: fontWeightSemiBold },
};

export const Spacing = {
  xxxs: 2, // From PriceCard tag marginTop & BestPriceCard DOE header marginBottom
  xxs: 4, // From PriceCard label marginBottom & confirm text marginLeft & BestPriceCard stationRow/confirmationRow marginBottom
  xs: 6, // From Button paddingVertical small & BestPriceCard DOE container marginTop & badge paddingHorizontal & infoText marginLeft & buttonText marginLeft
  sm: 8, // From Button borderRadius & marginRight & Card marginVertical & PriceCard marginBottom/marginRight & BestPriceCard priceRow/DOE container/confirmationRow/doeTableRow paddingHorizontal marginBottom
  md: 10, // From Button paddingVertical medium & paddingHorizontal small & BestPriceCard fuelTypeContainer paddingHorizontal
  inputPaddingHorizontal: 12, // From Input & LoadingIndicator marginTop & PriceCard padding/marginVertical & BestPriceCard infoRow/buttonContainer marginBottom/paddingTop & directionButton paddingHorizontal
  lg: 14, // From Button paddingVertical large
  xl: 16, // From Button paddingHorizontal medium & Card padding & Input marginBottom & BestPriceCard card padding
  lg_xl: 20, // From LoadingIndicator padding
  xxl: 24, // From Button paddingHorizontal large
  inputHeight: 48, // From Input
  // Add more as needed
};

// Define Border Radius
export const BorderRadius = {
  sm: 4, // From BestPriceCard DOE badge borderRadius
  xs: 6, // From BestPriceCard DOE table borderRadius (adjusted from 6)
  md: 8, // From Button
  lg: 10, // From Card
  lg_xl: 12, // From BestPriceCard fuelTypeContainer borderRadius & UserListItem admin badge
  xl: 16, // Example
  xl_xxl: 20, // From CreateCycleModal modalView
  round: 25, // From UserListItem avatar
};

// Combine all theme elements if needed
const theme = {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
};

export default theme;
