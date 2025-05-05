import 'expo-dev-client';
import { useEffect, useCallback } from 'react';
import {
  Stack,
  useRouter,
  useSegments,
  useRootNavigationState,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as SplashScreen from 'expo-splash-screen';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { queryClient } from '@/lib/query-client';
import { setupReactQueryForReactNative } from '@/lib/react-query-native';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/hooks/stores/useAuthStore';
import { useLocationStore } from '@/hooks/stores/useLocationStore';
import { Colors } from '@/styles/theme';

// Tell the splash screen to remain visible
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore errors */
});

export default function RootLayout() {
  const { initialize, initialized } = useAuthStore();

  // Do initialization work on mount
  useEffect(() => {
    async function prepare() {
      try {
        // Initialize auth
        if (!initialized) {
          await initialize();
        }

        // Initialize location
        useLocationStore.getState().initializeLocation();

        // Set up React Query
        setupReactQueryForReactNative();
      } catch (e) {
        console.warn('Error preparing app:', e);
      }
    }

    prepare();
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
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='auth/sign-up'
        options={{
          title: 'Sign Up',
          presentation: 'modal',
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
