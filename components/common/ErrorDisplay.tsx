import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';

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
      <FontAwesome5 name='exclamation-triangle' size={40} color='#f44336' />
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 20,
  },
});
