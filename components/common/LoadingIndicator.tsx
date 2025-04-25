import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing } from '@/styles/theme'; // Import theme constants

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
  color = Colors.primary, // Use theme color as default
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
    padding: Spacing.lg_xl, // Use theme spacing
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.white, // Use theme color
  },
  message: {
    marginTop: Spacing.inputPaddingHorizontal, // Use theme spacing (value 12)
    fontSize: Typography.fontSizeMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
    textAlign: 'center',
  },
});
