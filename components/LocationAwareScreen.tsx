import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocation } from '@/hooks/useLocation'; // Make sure this path matches your project structure
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme';

// This is a component that can be used to test the enhanced location hook
export default function LocationAwareScreen() {
  const {
    location,
    loading,
    error,
    permissionDenied,
    refreshLocation,
    getLocationWithFallback,
    openLocationSettings,
  } = useLocation();

  // Track how long we've been loading
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (loading) {
      // Start a timer when loading begins
      interval = setInterval(() => {
        setLoadingTime((prev) => prev + 1);
      }, 1000); // Update every second
    } else {
      // Reset when loading finishes
      setLoadingTime(0);
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

  // Get fallback location to ensure we always have coordinates
  const currentLocation = getLocationWithFallback();

  // Render based on current state
  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingIndicator
          message={`Getting your location... (${loadingTime}s)`}
        />

        {/* Show a bail-out option if loading takes too long */}
        {loadingTime > 5 && (
          <View style={styles.bailOutContainer}>
            <Text style={styles.bailOutText}>
              It's taking longer than expected to get your location.
            </Text>
            <Button
              title='Use Default Location'
              onPress={() => {
                // Force stop loading and use default location
                // This is handled by our enhanced hook's timeouts
                // but giving the user manual control is good UX
              }}
              variant='outline'
              style={styles.bailOutButton}
            />
          </View>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Location Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.locationText}>
          Using location: {currentLocation.latitude.toFixed(6)},{' '}
          {currentLocation.longitude.toFixed(6)}
          {currentLocation.isDefaultLocation ? ' (Default)' : ''}
        </Text>
        <Button
          title='Try Again'
          onPress={refreshLocation}
          style={styles.button}
        />
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Location Permission Required</Text>
        <Text style={styles.errorMessage}>
          Please grant location permission in settings to enable all features.
        </Text>
        <Text style={styles.locationText}>
          Using default location: {currentLocation.latitude.toFixed(6)},{' '}
          {currentLocation.longitude.toFixed(6)}
        </Text>
        <Button
          title='Open Settings'
          onPress={openLocationSettings}
          style={styles.button}
        />
      </View>
    );
  }

  // Success state
  return (
    <View style={styles.container}>
      <Text style={styles.successTitle}>Location Acquired!</Text>
      <Text style={styles.locationText}>
        Current location: {currentLocation.latitude.toFixed(6)},{' '}
        {currentLocation.longitude.toFixed(6)}
        {currentLocation.isDefaultLocation ? ' (Default)' : ' (GPS)'}
      </Text>
      <Button
        title='Refresh Location'
        onPress={refreshLocation}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.white,
  },
  errorTitle: {
    fontSize: Typography.fontSizeXLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.error,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: Typography.fontSizeMedium,
    color: Colors.textGray,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  successTitle: {
    fontSize: Typography.fontSizeXLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  locationText: {
    fontSize: Typography.fontSizeMedium,
    color: Colors.darkGray,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  button: {
    minWidth: 200,
  },
  bailOutContainer: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundGray,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  bailOutText: {
    fontSize: Typography.fontSizeMedium,
    color: Colors.textGray,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  bailOutButton: {
    marginTop: Spacing.sm,
  },
});
