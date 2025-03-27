import { View, Text, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

type AdminRoute =
  | "/admin/stations"
  | "/admin/cycles"
  | "/admin/users"
  | "/admin/import-stations";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: AdminRoute;
  isLoading?: boolean;
}

export function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  href,
  isLoading,
}: DashboardCardProps) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color={Colors.light.tint} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {isLoading ? (
            <View style={styles.loadingValue} />
          ) : (
            <Text style={styles.value}>{value}</Text>
          )}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#9CA3AF" // Using a literal color for the chevron
        />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tint + "10", // Adding transparency to the tint color
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.tint,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280", // Using a literal color for subtitle
    marginTop: 2,
  },
  loadingValue: {
    height: 24,
    width: 80,
    backgroundColor: "#E5E7EB", // Using a literal color for loading state
    borderRadius: 4,
  },
});
