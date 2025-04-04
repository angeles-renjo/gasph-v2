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
}

export function TouchableCard({
  children,
  style,
  variant = 'default',
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

  return (
    <TouchableOpacity
      style={[styles.card, getVariantStyle(), style]}
      activeOpacity={0.7}
      {...props}
    >
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
    overflow: 'hidden',
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
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // Keep elevation for Android
  },
  outline: {
    // backgroundColor: Colors.white, // Already in card
    // borderRadius: BorderRadius.lg, // Already in card
    borderWidth: 1,
    borderColor: Colors.lightGray, // Use theme color
  },
});
