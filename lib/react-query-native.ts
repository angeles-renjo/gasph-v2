import { AppState, AppStateStatus, Platform } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import React from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

/**
 * Sets up React Query for optimal usage in React Native
 *
 * This includes:
 * 1. Online status management using NetInfo
 * 2. App focus management using AppState
 */
export function setupReactQueryForReactNative() {
  // Online status management
  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state: NetInfoState) => {
      // Update online status based on connection state
      setOnline(!!state.isConnected);
    });
  });

  // App focus management
  function onAppStateChange(status: AppStateStatus) {
    // Only apply focus changes for non-web platforms
    if (Platform.OS !== 'web') {
      // Consider the app "focused" when it's in the foreground (active)
      focusManager.setFocused(status === 'active');
    }
  }

  // Subscribe to app state changes
  const subscription = AppState.addEventListener('change', onAppStateChange);

  // Return a cleanup function
  return () => {
    subscription.remove();
  };
}

/**
 * Custom hook to refresh queries when a screen is focused
 * To be used with React Navigation's useIsFocused
 */
export function useRefreshOnFocus<T>(refetch: () => Promise<T>) {
  // Use a ref to track if this is the first focus
  const firstTimeRef = React.useRef(true);

  useFocusEffect(
    React.useCallback(() => {
      // Skip first focus to avoid refetching on initial mount
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }

      // Refetch data when screen is focused
      refetch();
    }, [refetch])
  );
}

/**
 * Helper function to create a hook that disables queries when a screen is out of focus
 * To be used with React Navigation's useIsFocused
 */
export function createScreenFocusAwareQuery<TOptions, TResult>(
  useQueryHook: (options: TOptions) => TResult
) {
  return function useScreenFocusAwareQuery(options: TOptions): TResult {
    const isFocused = useIsFocused();

    // Use the original query hook but add the subscribed option
    return useQueryHook({
      ...options,
      subscribed: isFocused,
    });
  };
}
