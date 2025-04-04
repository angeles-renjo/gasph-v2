import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing } from '@/styles/theme'; // Import theme constants

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message = 'There was an error loading the data. Please try again.',
  onRetry,
  fullScreen = false,
  containerStyle,
  titleStyle,
  messageStyle,
}: ErrorDisplayProps) {
  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        containerStyle,
      ]}
    >
      <FontAwesome5
        name='exclamation-triangle'
        size={40}
        color={Colors.danger}
      />{' '}
      {/* Use theme color */}
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      <Text style={[styles.message, messageStyle]}>{message}</Text>
      {onRetry && (
        <View style={styles.buttonContainer}>
          <Button title='Try Again' onPress={onRetry} variant='primary' />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg_xl, // Use theme spacing
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.white, // Use theme color
  },
  title: {
    marginTop: Spacing.xl, // Use theme spacing
    fontSize: Typography.fontSizeLarge, // Use theme typography
    fontWeight: Typography.fontWeightBold, // Use theme typography
    color: Colors.darkGray, // Use theme color
    textAlign: 'center',
  },
  message: {
    marginTop: Spacing.sm, // Use theme spacing
    fontSize: Typography.fontSizeMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: Spacing.lg_xl, // Use theme spacing
  },
});
