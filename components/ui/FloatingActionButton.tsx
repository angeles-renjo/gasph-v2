import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Using Ionicons for the '+' icon
import { useThemeColor } from '../Themed'; // Corrected import path

type FloatingActionButtonProps = {
  onPress: () => void;
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  style?: StyleProp<ViewStyle>;
  size?: number;
  color?: string;
  backgroundColor?: string;
};

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  iconName = 'add', // Default to '+' icon
  style,
  size = 24,
  color: customColor,
  backgroundColor: customBackgroundColor,
}) => {
  const defaultBackgroundColor = useThemeColor({}, 'tint');
  const defaultColor = useThemeColor({}, 'background'); // Icon color contrasts with background

  const fabBackgroundColor = customBackgroundColor || defaultBackgroundColor;
  const iconColor = customColor || defaultColor;

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { backgroundColor: fabBackgroundColor },
        style, // Allow overriding styles
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={iconName} size={size} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28, // Makes it circular
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default FloatingActionButton;
