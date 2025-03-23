import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/hooks/useAuth';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// This function will wrap our app and handle auth redirection
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Check if the user is authenticated
    // If not, redirect to the sign-in page
    // We only want to do this for protected routes (tabs)
    const inAuthGroup = segments[0] === '(tabs)';
    const inAuthScreens = segments[0] === 'auth';

    if (!user && inAuthGroup) {
      // Redirect to sign-in if accessing protected routes without auth
      router.replace('/auth/sign-in');
    } else if (user && inAuthScreens) {
      // Redirect to home if accessing auth screens while logged in
      router.replace('/');
    }
  }, [user, loading, segments]);

  return (
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
  );
}

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
        <RootLayoutNav />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
