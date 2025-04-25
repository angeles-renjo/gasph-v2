import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing } from '@/styles/theme'; // Import theme constants

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  iconColor?: string;
  actionLabel?: string;
  onAction?:
    | {
        label: string;
        onPress: () => void;
      }
    | (() => void);
  fullScreen?: boolean;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
}

export function EmptyState({
  title = 'No Data Found',
  message = "There's nothing to display here yet.",
  icon = 'info-circle',
  iconColor = Colors.primary, // Use theme color as default
  actionLabel,
  onAction,
  fullScreen = false,
  containerStyle,
  titleStyle,
  messageStyle,
}: EmptyStateProps) {
  // Normalize onAction to ensure it's in the correct format
  const actionProps =
    typeof onAction === 'function'
      ? { label: actionLabel || 'Action', onPress: onAction }
      : onAction;

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        containerStyle,
      ]}
    >
      <FontAwesome5 name={icon} size={40} color={iconColor} />
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      <Text style={[styles.message, messageStyle]}>{message}</Text>

      {actionProps && (
        <View style={styles.buttonContainer}>
          <Button
            title={actionProps.label}
            onPress={actionProps.onPress}
            variant='outline'
          />
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
