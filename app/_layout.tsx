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
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { queryClient } from '@/lib/query-client';
import { setupReactQueryForReactNative } from '@/lib/react-query-native';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/hooks/stores/useAuthStore';
import { useLocationStore } from '@/hooks/stores/useLocationStore'; // Import Zustand store
import { Colors } from '@/styles/theme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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
  }, [user, loading, segments, rootNavigationState, router]); // Add dependencies

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
      {/* Define all screens directly, navigation logic is in useEffect */}
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

// Splash screen handler component
function SplashScreenHandler({ children }: { children: React.ReactNode }) {
  const { loading, initialized, initialize } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Define async function for initialization
    const initApp = async () => {
      // Initialize auth if not already done
      if (!initialized) {
        await initialize();
      }

      // Mark initialization as complete
      setIsInitialized(true);

      // Hide splash screen if auth is done loading
      if (!loading) {
        await SplashScreen.hideAsync().catch((err) => {
          console.warn('Error hiding splash screen:', err);
        });
      }
    };

    // Start initialization
    initApp();
  }, [loading, initialized]);

  // Hide splash screen whenever loading completes if we're already initialized
  useEffect(() => {
    if (isInitialized && !loading) {
      SplashScreen.hideAsync().catch((err) => {
        console.warn('Error hiding splash screen:', err);
      });
    }
  }, [loading, isInitialized]);

  // Always render children, even if loading/uninitialized
  // The splash screen covers the content until hidden
  return children;
}

// Main app layout
export default function RootLayout() {
  // Initialize location store and React Query for React Native on mount
  useEffect(() => {
    // Initialize location
    useLocationStore.getState().initializeLocation();

    // Setup React Query for React Native
    const cleanup = setupReactQueryForReactNative();

    // Return cleanup function
    return cleanup;
  }, []);

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
        <StatusBar style='auto' />
        <SplashScreenHandler>
          {/* LocationProvider removed, store is initialized above */}
          <AuthenticatedNavigator />
        </SplashScreenHandler>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}
