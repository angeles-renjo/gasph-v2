import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/hooks/useAuth';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loading } = useAuth();

  useEffect(() => {
    // Hide splash screen once authentication state is determined
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  // While authentication is loading, don't render anything
  if (loading) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style='auto' />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2a9d8f',
            },
            headerTintColor: '#fff',
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
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
