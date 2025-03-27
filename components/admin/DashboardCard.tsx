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
      <Pressable
        style={styles.card}
        android_ripple={{ color: Colors.light.tint + "20" }}
      >
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
          color="#9CA3AF"
          style={styles.chevron}
        />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.tint + "12",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.tint,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  loadingValue: {
    height: 24,
    width: 80,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
  },
  chevron: {
    marginLeft: 8,
  },
});
