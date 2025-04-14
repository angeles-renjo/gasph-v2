import 'expo-dev-client';
import { useEffect } from 'react';
// Re-add useRouter, useSegments, useRootNavigationState
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
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/hooks/stores/useAuthStore';
import { Colors } from '@/styles/theme'; // Import Colors

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Separate auth-aware navigation component
function AuthenticatedNavigator() {
  const { user, loading } = useAuth(); // Need loading state again
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState(); // Hook to check router readiness

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
          backgroundColor: Colors.primary, // Use theme primary color
        },
        headerTintColor: Colors.white, // Use theme white color
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

  useEffect(() => {
    if (!initialized) {
      initialize();
    }

    if (!loading && initialized) {
      SplashScreen.hideAsync();
    }
  }, [loading, initialized]);

  // Always render children, even if loading/uninitialized
  // The splash screen covers the content until hidden
  return children;
}

// Main app layout
export default function RootLayout() {
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
          <AuthenticatedNavigator />
        </SplashScreenHandler>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}
