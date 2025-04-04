import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme'; // Import theme constants

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: ButtonProps) {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return styles.primary;
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'danger':
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      default:
        return styles.buttonText;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return styles.small;
      case 'large':
        return styles.large;
      default:
        return styles.medium;
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'small':
        return styles.smallText;
      case 'large':
        return styles.largeText;
      default:
        return styles.mediumText;
    }
  };

  const buttonStyles = [
    styles.button,
    getVariantStyle(),
    getSizeStyle(),
    fullWidth ? styles.fullWidth : undefined,
    disabled || loading ? styles.disabled : undefined,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles = [getTextStyle(), getTextSizeStyle(), textStyle].filter(
    Boolean
  ) as TextStyle[];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? Colors.primary : Colors.white} // Use theme colors
          size='small'
        />
      ) : (
        <>
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <Text style={textStyles}>{title}</Text>
          {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md, // Use theme border radius
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: Colors.primary, // Use theme color
  },
  secondary: {
    backgroundColor: Colors.secondary, // Use theme color
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary, // Use theme color
  },
  danger: {
    backgroundColor: Colors.danger, // Use theme color
  },
  small: {
    paddingVertical: Spacing.xs, // Use theme spacing
    paddingHorizontal: Spacing.md, // Use theme spacing
  },
  medium: {
    paddingVertical: Spacing.md, // Use theme spacing
    paddingHorizontal: Spacing.xl, // Use theme spacing
  },
  large: {
    paddingVertical: Spacing.lg, // Use theme spacing
    paddingHorizontal: Spacing.xxl, // Use theme spacing
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white, // Use theme color
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
    textAlign: 'center',
  },
  outlineText: {
    color: Colors.primary, // Use theme color
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
    textAlign: 'center',
  },
  smallText: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
  },
  mediumText: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
  },
  largeText: {
    fontSize: Typography.fontSizeLarge, // Use theme typography
  },
  iconContainer: {
    marginRight: Spacing.sm, // Use theme spacing
  },
});
