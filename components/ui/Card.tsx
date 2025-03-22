import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

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
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  elevated: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  outline: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});
