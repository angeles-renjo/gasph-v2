// app/auth/callback.tsx
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/hooks/stores/useAuthStore';
import { Colors } from '@/styles/theme';
import { supabase } from '@/utils/supabase/supabase';
import { Alert } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Auth callback processing...');
        console.log('Callback params:', params);

        // Ensure we have a session by getting it from Supabase
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error in callback:', sessionError);
          throw sessionError;
        }

        console.log(
          'Session in callback:',
          sessionData?.session ? 'Found session' : 'No session found'
        );

        // Force reinitialization of auth state
        await initialize();

        console.log('Auth initialized, redirecting to home...');

        // Explicitly navigate to the root route
        router.replace('/');
      } catch (error) {
        console.error('Error in auth callback:', error);
        Alert.alert(
          'Authentication Error',
          'There was a problem completing the authentication. Please try again.',
          [{ text: 'OK', onPress: () => router.replace('/auth/sign-in') }]
        );
      }
    };

    // Small delay to ensure the auth state is properly updated
    const timer = setTimeout(() => {
      handleCallback();
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size='large' color={Colors?.primary || '#2a9d8f'} />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
