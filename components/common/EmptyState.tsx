import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing } from '@/styles/theme';

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
  onSecondaryAction?: {
    label: string;
    onPress: () => void;
  };
  fullScreen?: boolean;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
}

export function EmptyState({
  title = 'No Data Found',
  message = "There's nothing to display here yet.",
  icon = 'info-circle',
  iconColor = Colors.primary,
  actionLabel,
  onAction,
  onSecondaryAction,
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

      {(actionProps || onSecondaryAction) && (
        <View style={styles.buttonContainer}>
          {actionProps && (
            <Button
              title={actionProps.label}
              onPress={actionProps.onPress}
              variant='primary'
              style={styles.actionButton}
            />
          )}
          {onSecondaryAction && (
            <Button
              title={onSecondaryAction.label}
              onPress={onSecondaryAction.onPress}
              variant='outline'
              style={styles.actionButton}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg_xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  title: {
    marginTop: Spacing.xl,
    fontSize: Typography.fontSizeLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.darkGray,
    textAlign: 'center',
  },
  message: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSizeMedium,
    color: Colors.textGray,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: Spacing.lg_xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    marginHorizontal: Spacing.sm,
    minWidth: 120,
  },
});
