import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme'; // Import theme constants

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  isPassword = false,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!isPassword);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const togglePasswordVisibility = () =>
    setIsPasswordVisible(!isPasswordVisible);

  // Password icon overrides rightIcon if isPassword is true
  const passwordIcon = isPassword ? (
    <TouchableOpacity onPress={togglePasswordVisibility}>
      <FontAwesome5
        name={isPasswordVisible ? 'eye-slash' : 'eye'}
        size={18} // Keep size hardcoded for now, or add to theme if needed
        color={Colors.iconGray} // Use theme color
      />
    </TouchableOpacity>
  ) : null;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedInput,
          error && styles.errorInput,
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon || isPassword ? styles.inputWithRightIcon : undefined,
            inputStyle,
          ].filter(Boolean)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword ? !isPasswordVisible : secureTextEntry}
          placeholderTextColor={Colors.placeholderGray} // Use theme color
          {...props}
        />
        {(rightIcon || isPassword) && (
          <View style={styles.iconContainer}>
            {isPassword ? passwordIcon : rightIcon}
          </View>
        )}
      </View>
      {error && <Text style={[styles.errorText, errorStyle]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl, // Use theme spacing
    width: '100%',
  },
  label: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    marginBottom: Spacing.xs, // Use theme spacing
    fontWeight: Typography.fontWeightMedium, // Use theme typography
    color: Colors.darkGray, // Use theme color
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.mediumGray, // Use theme color
    borderRadius: BorderRadius.md, // Use theme border radius
    backgroundColor: Colors.white, // Use theme color
  },
  focusedInput: {
    borderColor: Colors.primary, // Use theme color
  },
  errorInput: {
    borderColor: Colors.danger, // Use theme color
  },
  input: {
    flex: 1,
    height: Spacing.inputHeight, // Use theme spacing
    paddingHorizontal: Spacing.inputPaddingHorizontal, // Use theme spacing
    fontSize: Typography.fontSizeMedium, // Use theme typography
    color: Colors.darkGray, // Use theme color
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  iconContainer: {
    paddingHorizontal: Spacing.inputPaddingHorizontal, // Use theme spacing
    height: Spacing.inputHeight, // Use theme spacing
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.danger, // Use theme color
    fontSize: Typography.fontSizeSmall, // Use theme typography
    marginTop: Spacing.xxs, // Use theme spacing
  },
});
