import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/styles/theme'; // Import theme constants

interface CardProps extends ViewProps {
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outline';
}

export function Card({
  children,
  style,
  variant = 'default',
  ...props
}: CardProps) {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return styles.elevated;
      case 'outline':
        return styles.outline;
      default:
        return styles.default;
    }
  };

  return (
    <View style={[styles.card, getVariantStyle(), style]} {...props}>
      {children}
    </View>
  );
}

interface TouchableCardProps extends TouchableOpacityProps {
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outline';
  isSelected?: boolean; // Add isSelected prop
}

export function TouchableCard({
  children,
  style,
  variant = 'default',
  isSelected = false, // Receive isSelected prop
  ...props
}: TouchableCardProps) {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return styles.elevated;
      case 'outline':
        return styles.outline;
      default:
        return styles.default;
    }
  };

  // Combine base, variant, custom, and conditional selected styles
  const combinedStyle = [
    styles.card,
    getVariantStyle(),
    style,
    isSelected && styles.selected, // Apply selected style conditionally
  ];

  return (
    <TouchableOpacity style={combinedStyle} activeOpacity={0.7} {...props}>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, // Use theme color
    borderRadius: BorderRadius.lg, // Use theme border radius
    padding: Spacing.xl, // Use theme spacing
    marginVertical: Spacing.sm, // Use theme spacing
    // overflow: 'hidden', // Removed: This clips shadows on iOS
    // Base shadow/elevation removed - handled by variants
  },
  default: {
    // Base styles are in 'card', specific variant styles can override if needed
    // backgroundColor: Colors.white, // Already in card
    // borderRadius: BorderRadius.lg, // Already in card
  },
  elevated: {
    // backgroundColor: Colors.white, // Already in card
    // borderRadius: BorderRadius.lg, // Already in card
    shadowColor: Colors.black, // Use theme color
    shadowOffset: {
      width: 0,
      height: 5, // Adjusted height slightly
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4, // Adjusted elevation slightly for Android consistency
  },
  outline: {
    // backgroundColor: Colors.white, // Already in card
    // borderRadius: BorderRadius.lg, // Already in card
    borderWidth: 1,
    borderColor: Colors.lightGray, // Use theme color
  },
  selected: {
    // Define the style for the selected state
    borderWidth: 2,
    borderColor: Colors.primary,
    // Optional: Adjust shadow slightly if needed when selected, but be careful not to override variant styles unintentionally
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.15,
  },
});
