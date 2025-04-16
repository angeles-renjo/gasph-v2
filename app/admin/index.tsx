import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { useAdminStats } from '@/hooks/queries/admin/useAdminStats';
import { formatDate } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/styles/theme'; // Updated import path

export default function AdminDashboard() {
  const { data: stats, isLoading, error, refetch } = useAdminStats();

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Failed to load dashboard stats. Please try again.
        </Text>
        <Button
          title='Retry'
          onPress={() => refetch()}
          variant='secondary'
        ></Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.dashboardTitle}>Admin Dashboard</Text>
          <Text style={styles.dashboardSubtitle}>
            Manage your GasPH application
          </Text>
        </View>

        <DashboardCard
          title='Gas Stations'
          value={stats?.stationsCount ?? 0}
          subtitle='Total registered stations'
          icon='location'
          href='/admin/stations'
          isLoading={isLoading}
        />

        <DashboardCard
          title='Price Cycles'
          value={stats?.activeCyclesCount ?? 0}
          subtitle='Active reporting cycles'
          icon='time'
          href='/admin/cycles'
          isLoading={isLoading}
        />

        <DashboardCard
          title='Users'
          value={stats?.usersCount ?? 0}
          subtitle='Registered users'
          icon='people'
          href='/admin/users'
          isLoading={isLoading}
        />

        <DashboardCard
          title='Import Stations'
          value={
            stats?.lastImportDate
              ? `Last import: ${formatDate(stats.lastImportDate)}`
              : 'No imports yet'
          }
          subtitle='Update station database'
          icon='cloud-download'
          href='/admin/import-stations'
          isLoading={isLoading}
        />

        <DashboardCard
          title='Station Reports'
          // We don't have a count for pending reports in useAdminStats yet,
          // so we'll just show a static subtitle for now.
          // value={stats?.pendingReportsCount ?? 0} // TODO: Add this to useAdminStats later
          value='View' // Use a string value
          subtitle='Review user-submitted reports'
          icon='alert-circle' // Try a different icon
          href={'/admin/reports' as any} // Cast href to any temporarily
          isLoading={isLoading} // Can reuse the main loading state for now
        />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  content: {
    padding: 20,
    paddingTop: 16,
  },
  titleContainer: {
    marginBottom: 24,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 16,
  },
});
