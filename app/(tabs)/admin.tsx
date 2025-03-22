import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, TouchableCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/formatters';

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [currentCycle, setCurrentCycle] = useState<any>(null);
  const [stats, setStats] = useState({
    stationCount: 0,
    userCount: 0,
    priceReportCount: 0,
  });
  const [creatingCycle, setCreatingCycle] = useState(false);

  useEffect(() => {
    // Skip admin check for development, but still fetch data
    setProfile({ is_admin: true }); // Set dummy admin profile
    fetchDashboardData();
  }, []);

  // Original fetchDashboardData function kept intact
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch current price cycle
      const { data: cycleData, error: cycleError } = await supabase
        .from('price_reporting_cycles')
        .select('*')
        .eq('is_active', true)
        .single();

      if (cycleError && cycleError.code !== 'PGRST116') {
        throw cycleError;
      }

      setCurrentCycle(cycleData || null);

      // Fetch station count
      const { count: stationCount, error: stationError } = await supabase
        .from('gas_stations')
        .select('*', { count: 'exact', head: true });

      if (stationError) throw stationError;

      // Fetch user count
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      // Fetch price report count
      const { count: reportCount, error: reportError } = await supabase
        .from('user_price_reports')
        .select('*', { count: 'exact', head: true });

      if (reportError) throw reportError;

      setStats({
        stationCount: stationCount || 0,
        userCount: userCount || 0,
        priceReportCount: reportCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Original createNewPriceCycle function kept intact
  const createNewPriceCycle = async () => {
    try {
      setCreatingCycle(true);

      // Set dates for new cycle
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // 1 week cycle

      // Create new cycle
      const { data, error } = await supabase
        .from('price_reporting_cycles')
        .insert({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true, // This will automatically deactivate other cycles due to the trigger
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'New price cycle created successfully.');
      setCurrentCycle(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create price cycle.');
    } finally {
      setCreatingCycle(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#2a9d8f' />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  // Keep the rest of the component unchanged
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Manage GasPH data and operations</Text>
        </View>

        {/* Price Cycle Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Cycle Management</Text>
          <Card style={styles.cycleCard}>
            {currentCycle ? (
              <>
                <Text style={styles.cycleTitle}>Current Active Cycle</Text>
                <View style={styles.cycleDates}>
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <Text style={styles.dateValue}>
                      {formatDate(currentCycle.start_date)}
                    </Text>
                  </View>
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <Text style={styles.dateValue}>
                      {formatDate(currentCycle.end_date)}
                    </Text>
                  </View>
                </View>
                {/* <Button
                  title='Manage Price Cycle'
                  onPress={() => router.push('/admin/manage-cycle')}
                  variant='outline'
                  style={styles.cycleButton}
                /> */}
              </>
            ) : (
              <>
                <Text style={styles.cycleTitle}>No Active Price Cycle</Text>
                <Text style={styles.cycleDescription}>
                  Create a new price cycle to start collecting community price
                  reports.
                </Text>
                <Button
                  title='Create New Cycle'
                  onPress={createNewPriceCycle}
                  loading={creatingCycle}
                  style={styles.cycleButton}
                />
              </>
            )}
          </Card>
        </View>

        {/* System Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Statistics</Text>
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <FontAwesome5
                name='gas-pump'
                size={24}
                color='#2a9d8f'
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>{stats.stationCount}</Text>
              <Text style={styles.statLabel}>Gas Stations</Text>
            </Card>

            <Card style={styles.statCard}>
              <FontAwesome5
                name='users'
                size={24}
                color='#f4a261'
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>{stats.userCount}</Text>
              <Text style={styles.statLabel}>Users</Text>
            </Card>

            <Card style={styles.statCard}>
              <FontAwesome5
                name='chart-line'
                size={24}
                color='#e76f51'
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>{stats.priceReportCount}</Text>
              <Text style={styles.statLabel}>Price Reports</Text>
            </Card>
          </View>
        </View>

        {/* Admin Functions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administrative Functions</Text>

          <TouchableCard
            style={styles.functionCard}
            onPress={() => router.push('/admin/import-stations')}
          >
            <View style={styles.functionContent}>
              <FontAwesome5
                name='file-import'
                size={20}
                color='#2a9d8f'
                style={styles.functionIcon}
              />
              <View style={styles.functionTextContainer}>
                <Text style={styles.functionTitle}>Import Gas Stations</Text>
                <Text style={styles.functionDescription}>
                  Import gas station data from CSV or manually add stations
                </Text>
              </View>
            </View>
            <FontAwesome5 name='chevron-right' size={16} color='#999' />
          </TouchableCard>

          {/* <TouchableCard
            style={styles.functionCard}
            onPress={() => router.push('/admin/add-station')}
          >
            <View style={styles.functionContent}>
              <FontAwesome5
                name='plus-circle'
                size={20}
                color='#2a9d8f'
                style={styles.functionIcon}
              />
              <View style={styles.functionTextContainer}>
                <Text style={styles.functionTitle}>Add New Station</Text>
                <Text style={styles.functionDescription}>
                  Manually add a new gas station to the database
                </Text>
              </View>
            </View>
            <FontAwesome5 name='chevron-right' size={16} color='#999' />
          </TouchableCard>

          <TouchableCard
            style={styles.functionCard}
            onPress={() => router.push('/admin/manage-users')}
          >
            <View style={styles.functionContent}>
              <FontAwesome5
                name='user-cog'
                size={20}
                color='#2a9d8f'
                style={styles.functionIcon}
              />
              <View style={styles.functionTextContainer}>
                <Text style={styles.functionTitle}>User Management</Text>
                <Text style={styles.functionDescription}>
                  Manage user accounts and permissions
                </Text>
              </View>
            </View>
            <FontAwesome5 name='chevron-right' size={16} color='#999' />
          </TouchableCard> */}
        </View>

        {/* Development mode notice - will be removed in production */}
        <View style={styles.devNotice}>
          <Text style={styles.devNoticeText}>
            Running in development mode with bypassed authentication
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Keep all the original styles
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#2a9d8f',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#e6f7f5',
    marginTop: 4,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  cycleCard: {
    padding: 16,
  },
  cycleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cycleDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  cycleDates: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  cycleButton: {
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  functionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
  },
  functionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  functionIcon: {
    marginRight: 16,
  },
  functionTextContainer: {
    flex: 1,
  },
  functionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  functionDescription: {
    fontSize: 14,
    color: '#666',
  },
  // Add a development notice style
  devNotice: {
    padding: 10,
    margin: 16,
    backgroundColor: '#ffe8cc',
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 20,
  },
  devNoticeText: {
    color: '#d96c00',
    fontSize: 12,
    textAlign: 'center',
  },
});
