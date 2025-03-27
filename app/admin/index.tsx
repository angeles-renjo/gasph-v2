import { View, StyleSheet, ScrollView } from "react-native";
import { DashboardCard } from "@/components/admin/DashboardCard";
import { useAdminStats } from "@/hooks/queries/admin/useAdminStats";
import { formatDate } from "@/utils/formatters";
import Colors from "@/constants/Colors";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <DashboardCard
        title="Gas Stations"
        value={stats?.stationsCount ?? 0}
        subtitle="Total registered stations"
        icon="location"
        href="/admin/stations"
        isLoading={isLoading}
      />

      <DashboardCard
        title="Price Cycles"
        value={stats?.activeCyclesCount ?? 0}
        subtitle="Active reporting cycles"
        icon="time"
        href="/admin/cycles"
        isLoading={isLoading}
      />

      <DashboardCard
        title="Users"
        value={stats?.usersCount ?? 0}
        subtitle="Registered users"
        icon="people"
        href="/admin/users"
        isLoading={isLoading}
      />

      <DashboardCard
        title="Import Stations"
        value={
          stats?.lastImportDate
            ? `Last import: ${formatDate(stats.lastImportDate)}`
            : "No imports yet"
        }
        subtitle="Update station database"
        icon="cloud-download"
        href="/admin/import-stations"
        isLoading={isLoading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.tint,
  },
  content: {
    padding: 16,
  },
});
