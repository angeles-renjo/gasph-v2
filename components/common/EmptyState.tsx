import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  iconColor?: string;
  actionLabel?: string;
  onAction?: {
    label: string;
    onPress: () => void;
  };
  fullScreen?: boolean;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
}

export function EmptyState({
  title = "No Data Found",
  message = "There's nothing to display here yet.",
  icon = "info-circle",
  iconColor = "#2a9d8f",
  actionLabel,
  onAction,
  fullScreen = false,
  containerStyle,
  titleStyle,
  messageStyle,
}: EmptyStateProps) {
  console.log("EmptyState props:", {
    title,
    message,
    onAction,
  });
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

      {onAction && (
        <View style={styles.buttonContainer}>
          <Button
            title={onAction.label}
            onPress={onAction.onPress}
            variant="outline"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 20,
  },
});
