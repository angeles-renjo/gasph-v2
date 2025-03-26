import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card, TouchableCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { PriceCycleManagement } from '@/components/admin/PriceCycleManagement';
import { CreateCycleModal } from '@/components/admin/CreateCycleModal';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatters';
import { useRouter } from 'expo-router';

export default function AdminScreen() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [currentCycle, setCurrentCycle] = useState<any>(null);
  const [nextCycleNumber, setNextCycleNumber] = useState(1);
  const [stats, setStats] = useState({
    stationCount: 0,
    userCount: 0,
    priceReportCount: 0,
  });
  const [creatingCycle, setCreatingCycle] = useState(false);
  const [showCreateCycleModal, setShowCreateCycleModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasInitialized, setHasInitialized] = useState(false);

  const router = useRouter();

  const fetchAdminProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      // Redirect if not an admin
      if (!data.is_admin) {
        Alert.alert('Access Denied', 'You do not have admin privileges.');
        setTimeout(() => router.replace('/'), 100);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setTimeout(() => router.replace('/'), 100);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch current price cycle
      const { data: cycleData, error: cycleError } = await supabase
        .from('price_reporting_cycles')
        .select('*')
        .eq('status', 'active')
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

  const fetchNextCycleNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('price_reporting_cycles')
        .select('cycle_number')
        .order('cycle_number', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setNextCycleNumber((data?.cycle_number || 0) + 1);
    } catch (error) {
      console.error('Error fetching next cycle number:', error);
    }
  };

  const createNewPriceCycle = async (startDate: Date, endDate: Date) => {
    try {
      setCreatingCycle(true);

      // Create new cycle
      const { data, error } = await supabase
        .from('price_reporting_cycles')
        .insert({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          status: 'active',
          cycle_number: nextCycleNumber,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Success',
        `New price cycle #${nextCycleNumber} created successfully.`
      );
      setCurrentCycle(data);
      setNextCycleNumber((prev) => prev + 1);
      setShowCreateCycleModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create price cycle.');
    } finally {
      setCreatingCycle(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const initializeScreen = async () => {
        if (!user || authLoading) return;

        try {
          // Only set loading true if we haven't initialized yet
          if (!hasInitialized) {
            setLoading(true);
          }

          await fetchAdminProfile();

          // Only continue fetching if we're still mounted and user is admin
          if (isActive && profile?.is_admin) {
            await fetchDashboardData();
            await fetchNextCycleNumber();
            if (isActive) {
              setHasInitialized(true);
              setLoading(false);
            }
          }
        } catch (error) {
          console.error('Error initializing admin screen:', error);
          if (isActive) {
            setLoading(false);
          }
        }
      };

      initializeScreen();

      return () => {
        isActive = false;
      };
    }, [user, authLoading, hasInitialized, profile?.is_admin])
  );

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingIndicator size='large' color='#2a9d8f' />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <FontAwesome5
            name='tachometer-alt'
            size={16}
            color={activeTab === 'dashboard' ? '#2a9d8f' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'dashboard' && styles.activeTabText,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'cycles' && styles.activeTab]}
          onPress={() => setActiveTab('cycles')}
        >
          <FontAwesome5
            name='calendar-alt'
            size={16}
            color={activeTab === 'cycles' ? '#2a9d8f' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'cycles' && styles.activeTabText,
            ]}
          >
            Price Cycles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'stations' && styles.activeTab]}
          onPress={() => setActiveTab('stations')}
        >
          <FontAwesome5
            name='gas-pump'
            size={16}
            color={activeTab === 'stations' ? '#2a9d8f' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'stations' && styles.activeTabText,
            ]}
          >
            Stations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <FontAwesome5
            name='users'
            size={16}
            color={activeTab === 'users' ? '#2a9d8f' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'users' && styles.activeTabText,
            ]}
          >
            Users
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'dashboard' && (
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>
              Manage GasPH data and operations
            </Text>
          </View>

          {/* Price Cycle Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Price Cycle</Text>
            <Card style={styles.cycleCard}>
              {currentCycle ? (
                <>
                  <View style={styles.cycleHeader}>
                    <View>
                      <Text style={styles.cycleTitle}>
                        Active Cycle #{currentCycle.cycle_number}
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>ACTIVE</Text>
                    </View>
                  </View>
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
                  <TouchableOpacity
                    style={styles.viewAllLink}
                    onPress={() => setActiveTab('cycles')}
                  >
                    <Text style={styles.viewAllText}>Manage all cycles</Text>
                    <FontAwesome5
                      name='arrow-right'
                      size={12}
                      color='#2a9d8f'
                    />
                  </TouchableOpacity>
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
                    onPress={() => setShowCreateCycleModal(true)}
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
                    Import gas station data from Google Places API
                  </Text>
                </View>
              </View>
              <FontAwesome5 name='chevron-right' size={16} color='#999' />
            </TouchableCard>
          </View>
        </ScrollView>
      )}

      {activeTab === 'cycles' && <PriceCycleManagement />}

      {/* Create Cycle Modal */}
      <CreateCycleModal
        visible={showCreateCycleModal}
        onClose={() => setShowCreateCycleModal(false)}
        onSubmit={createNewPriceCycle}
        loading={creatingCycle}
        nextCycleNumber={nextCycleNumber}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2a9d8f',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#2a9d8f',
    fontWeight: 'bold',
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
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  statusBadge: {
    backgroundColor: '#e6f7f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2a9d8f',
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
  viewAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 8,
  },
  viewAllText: {
    color: '#2a9d8f',
    fontSize: 14,
    marginRight: 6,
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
});
