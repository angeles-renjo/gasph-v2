import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { useLocationStore } from '@/hooks/stores/useLocationStore'; // Use Zustand store
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Create this file at app/location-test.tsx to test the location functionality
export default function LocationTestScreen() {
  // Get state and actions from Zustand store using individual selectors to prevent re-renders
  const location = useLocationStore((state) => state.location);
  const loading = useLocationStore((state) => state.loading);
  const error = useLocationStore((state) => state.error);
  const permissionDenied = useLocationStore((state) => state.permissionDenied);
  const refreshLocation = useLocationStore((state) => state.refreshLocation);
  const getLocationWithFallback = useLocationStore(
    (state) => state.getLocationWithFallback
  );
  const openLocationSettings = useLocationStore(
    (state) => state.openLocationSettings
  );

  const [logs, setLogs] = useState<string[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const currentLocation = getLocationWithFallback();

  // Add a log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev]);
  };

  // Clear location permission from storage
  const clearLocationPermission = async () => {
    try {
      await AsyncStorage.removeItem('gasph_location_permission_status');
      addLog('Cleared location permission from storage');
    } catch (err) {
      addLog(`Error clearing permission: ${err}`);
    }
  };

  // Track elapsed time during loading
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (loading) {
      addLog('Location loading started');

      interval = setInterval(() => {
        setTimeElapsed((prev) => {
          const newTime = prev + 1;
          if (newTime % 5 === 0) {
            addLog(`Still loading after ${newTime} seconds`);
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timeElapsed > 0) {
        addLog(`Location loading finished after ${timeElapsed} seconds`);
      }
      setTimeElapsed(0);

      if (interval) {
        clearInterval(interval);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [loading]);

  // Log state changes
  useEffect(() => {
    if (error) {
      addLog(`Location error: ${error}`);
    }

    if (permissionDenied) {
      addLog('Location permission denied');
    }

    if (location && !loading) {
      addLog(
        `Location acquired: ${location.latitude.toFixed(
          6
        )}, ${location.longitude.toFixed(6)}${
          location.isDefaultLocation ? ' (Default)' : ' (GPS)'
        }`
      );
    }
  }, [error, permissionDenied, location, loading]);

  return (
    <>
      <Stack.Screen options={{ title: 'Location Test' }} />

      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <Text style={styles.title}>Location Status</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Loading:</Text>
            <Text
              style={[
                styles.statusValue,
                { color: loading ? Colors.warning : Colors.success },
              ]}
            >
              {loading ? `Yes (${timeElapsed}s)` : 'No'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Permission Denied:</Text>
            <Text
              style={[
                styles.statusValue,
                { color: permissionDenied ? Colors.error : Colors.success },
              ]}
            >
              {permissionDenied ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Error:</Text>
            <Text
              style={[
                styles.statusValue,
                { color: error ? Colors.error : Colors.success },
              ]}
            >
              {error ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Using Default:</Text>
            <Text
              style={[
                styles.statusValue,
                {
                  color: currentLocation?.isDefaultLocation
                    ? Colors.warning
                    : Colors.success,
                },
              ]}
            >
              {currentLocation?.isDefaultLocation ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Coordinates:</Text>
            <Text style={styles.statusValue}>
              {currentLocation
                ? `${currentLocation.latitude.toFixed(
                    6
                  )}, ${currentLocation.longitude.toFixed(6)}`
                : 'None'}
            </Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionContainer}>
          <Button
            title='Refresh Location'
            onPress={() => {
              addLog('Manual refresh requested');
              refreshLocation();
            }}
            style={styles.button}
            disabled={loading}
          />

          <Button
            title='Open Settings'
            onPress={() => {
              addLog('Opening location settings');
              openLocationSettings();
            }}
            style={styles.button}
            variant='outline'
          />

          <Button
            title='Clear Permission Cache'
            onPress={clearLocationPermission}
            style={styles.button}
            variant='outline'
          />
        </View>

        <View style={styles.logContainer}>
          <View style={styles.logHeader}>
            <Text style={styles.logTitle}>Activity Log</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setLogs([])}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.logScroll}>
            {logs.length === 0 ? (
              <Text style={styles.emptyLog}>No activity yet</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logEntry}>
                  {log}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundGray2,
  },
  title: {
    fontSize: Typography.fontSizeXLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.darkGray,
    marginBottom: Spacing.md,
  },
  statusContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGray,
  },
  statusLabel: {
    fontSize: Typography.fontSizeMedium,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.textGray,
  },
  statusValue: {
    fontSize: Typography.fontSizeMedium,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.darkGray,
  },
  errorBox: {
    backgroundColor: Colors.error + '15', // 15% opacity
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.error,
  },
  actionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  button: {
    flex: 1,
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
    minWidth: '45%',
  },
  logContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  logTitle: {
    fontSize: Typography.fontSizeLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.darkGray,
  },
  clearButton: {
    backgroundColor: Colors.lightGray2,
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  clearButtonText: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
  },
  logScroll: {
    flex: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundGray2,
    padding: Spacing.sm,
  },
  logEntry: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.darkGray,
    marginBottom: Spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyLog: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
