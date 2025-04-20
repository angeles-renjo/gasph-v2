import 'expo-dev-client';
import { useEffect } from 'react'; // Add useState
import { View, LogBox } from 'react-native'; // Add LogBox to import
// Re-add useRouter, useSegments, useRootNavigationState
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/hooks/stores/useAuthStore';
import { Colors } from '@/styles/theme'; // Import Colors
import { useAppInitialization } from '@/hooks/useAppInitialization'; // Import the new hook

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();
// Removed LogBox call from top level

// Separate auth-aware navigation component
function AuthenticatedNavigator() {
  // Call the custom hook to handle initialization side effects
  useAppInitialization();

  // This component now only focuses on rendering the navigator structure.
  // The splash screen hiding and navigation redirection are handled by the hook.

  // Always render the full Stack navigator structure
  // Removed onLayout prop from View as splash hiding is handled by useEffect
  return (
    <View style={{ flex: 1 }}>
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
