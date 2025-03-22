import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface LoadingIndicatorProps {
  message?: string;
  fullScreen?: boolean;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'large';
  color?: string;
}

export function LoadingIndicator({
  message = 'Loading...',
  fullScreen = false,
  containerStyle,
  textStyle,
  size = 'large',
  color = '#2a9d8f',
}: LoadingIndicatorProps) {
  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        containerStyle,
      ]}
    >
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={[styles.message, textStyle]}>{message}</Text>}
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
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
