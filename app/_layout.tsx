import 'expo-dev-client';
import { useEffect, useState } from 'react';
import {
  Stack,
  useRouter,
  useSegments,
  useRootNavigationState,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as SplashScreen from 'expo-splash-screen';
import { View, StyleSheet, AppState, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { queryClient } from '@/lib/query-client';
import { setupReactQueryForReactNative } from '@/lib/react-query-native';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/hooks/stores/useAuthStore';
import { useLocationStore } from '@/hooks/stores/useLocationStore';
import { Colors } from '@/styles/theme';

import * as Linking from 'expo-linking';

// Keep splash screen visible initially, but don't await
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore errors */
});

export default function RootLayout() {
  const { initialize, initialized } = useAuthStore();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('Deep link received in _layout:', event.url);
    });

    // Also try to get the initial URL if the app was opened with a URL
    Linking.getInitialURL().then((url) => {
      if (url) console.log('Initial URL in _layout:', url);
    });

    return () => subscription.remove();
  }, []);

  // --- Emergency Splash Screen Handler ---
  // This ensures the splash screen always hides, even if initialization hangs
  useEffect(() => {
    // Set a safety timeout to force-hide the splash screen after 3 seconds
    const emergencyTimeout = setTimeout(() => {
      console.log('[Emergency] Forcing splash screen to hide after timeout');
      SplashScreen.hideAsync().catch((e) => {
        console.warn('[Emergency] Error hiding splash screen:', e);
      });
    }, 3000); // 3 seconds max wait

    return () => clearTimeout(emergencyTimeout);
  }, []);

  // --- App State Listener ---
  // This handles cases where the app is backgrounded/foregrounded
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground - force-hide splash screen
        SplashScreen.hideAsync().catch(() => {});
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // --- Main Initialization Logic ---
  // This runs all initialization tasks OFF the main thread
  useEffect(() => {
    let isMounted = true;

    // Move initialization to a separate function to be run off the main thread
    const runInitialization = async () => {
      try {
        console.log('[Initialization] Starting app initialization');

        // If auth needs initialization, do it first
        if (!initialized) {
          await initialize();
        }

        // Start location services (don't wait for completion)
        useLocationStore.getState().initializeLocation();

        // Setup React Query
        setupReactQueryForReactNative();

        // Small delay for UI to render properly
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (isMounted) {
          console.log(
            '[Initialization] App fully initialized, ready to hide splash screen'
          );

          // Set app ready state
          setAppReady(true);

          // Hide splash screen
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('[Initialization] Error during initialization:', error);

        // Even on error, try to hide splash screen and mark app as ready
        if (isMounted) {
          setAppReady(true);
          SplashScreen.hideAsync().catch(() => {});
        }
      }
    };

    // Run initialization in a non-blocking way
    if (Platform.OS === 'android') {
      // On Android, use setTimeout with 0 delay to move work off main thread
      setTimeout(() => {
        runInitialization();
      }, 0);
    } else {
      // On iOS, we can directly run it (iOS handles threading differently)
      runInitialization();
    }

    return () => {
      isMounted = false;
    };
  }, [initialize, initialized]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: createAsyncStoragePersister({
          storage: AsyncStorage,
          key: 'GASPH_QUERY_CACHE',
          throttleTime: 1000,
        }),
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const queryKey = query.queryKey as string[];
            return (
              !queryKey.includes('realtime') && !queryKey.includes('session')
            );
          },
        },
      }}
    >
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style='auto' />
          <AuthenticatedNavigator />
        </View>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

// Separate auth-aware navigation component
function AuthenticatedNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Wait for auth loading AND router navigation state to be ready
    if (loading || !rootNavigationState?.key) {
      return;
    }

    const inAuthGroup = segments[0] === '(tabs)';
    const inAuthScreens = segments[0] === 'auth';

    // Imperative navigation logic
    if (!user && inAuthGroup) {
      router.replace('/auth/sign-in');
    } else if (user && inAuthScreens) {
      router.replace('/');
    }
  }, [user, loading, segments, rootNavigationState, router]);

  // Always render the full Stack navigator structure
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen
        name='station/[id]'
        options={{
          title: 'Station Details',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name='auth/sign-in'
        options={{
          title: 'Sign In',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='auth/sign-up'
        options={{
          title: 'Sign Up',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
