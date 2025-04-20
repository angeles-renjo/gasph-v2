import 'expo-dev-client';
import { useEffect, useCallback, useState } from 'react'; // Add useState
import { View, LogBox } from 'react-native'; // Add LogBox to import
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
// Removed LogBox call from top level

// Separate auth-aware navigation component
function AuthenticatedNavigator() {
  const { user } = useAuth(); // Keep user from useAuth
  const { loading, initialized } = useAuthStore(); // Get loading/initialized state here
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState(); // Hook to check router readiness
  const [isSplashHidden, setIsSplashHidden] = useState(false); // State to track splash screen

  useEffect(() => {
    // Wait for auth loading, router navigation state AND splash screen to be hidden
    if (loading || !rootNavigationState?.key || !isSplashHidden) {
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
  }, [
    user,
    loading,
    initialized,
    segments,
    rootNavigationState,
    router,
    isSplashHidden, // Add dependency
  ]);

  // Callback to hide splash screen after layout
  const onLayoutRootView = useCallback(async () => {
    // Hide splash only when auth is initialized and not loading
    if (!loading && initialized) {
      await SplashScreen.hideAsync();
      setIsSplashHidden(true); // Set state after hiding
    }
  }, [loading, initialized]);

  // Removed conditional return null based on loading/initialized state.
  // The splash screen covers the UI, and navigation logic waits for initialization.

  // Always render the full Stack navigator structure inside a View for onLayout
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
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
    </View>
  );
}

// Main app layout
export default function RootLayout() {
  // Ignore the specific harmless warning from React Navigation
  // Moved inside the component function
  LogBox.ignoreLogs([
    'Sending `onAnimatedValueUpdate` with no listeners registered.',
  ]);

  // Initialize auth store state here if needed, or ensure it's done elsewhere
  const { initialize } = useAuthStore();
  useEffect(() => {
    initialize(); // Ensure auth state is initialized early
  }, [initialize]);

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
        {/* Removed SplashScreenHandler wrapper */}
        <AuthenticatedNavigator />
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}
