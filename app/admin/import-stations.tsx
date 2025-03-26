import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import GooglePlacesImportScreen from '@/components/admin/GooglePlacesImportScreen';
import { useEffect, useState } from 'react';

function ImportGasStationsScreen() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Wait for auth to complete
    if (authLoading) {
      return; // Don't do anything while auth is loading
    }

    // No authenticated user
    if (!user) {
      console.log('No authenticated user, redirecting to home');
      router.replace('/');
      return;
    }

    // User is authenticated but not admin
    if (!isAdmin) {
      console.log('User is not an admin, redirecting to home');
      router.replace('/');
      return;
    }

    // User is authenticated and is admin
    setLoading(false);
  }, [user, authLoading, isAdmin, router]);

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Checking permissions...</Text>
      </View>
    );
  }

  // This will only render if the user is authenticated and is admin
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Import Gas Stations',
          headerStyle: {
            backgroundColor: '#2a9d8f',
          },
          headerTintColor: '#fff',
        }}
      />

      <GooglePlacesImportScreen />
    </>
  );
}

const styles = StyleSheet.create({
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  unauthorizedMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    minWidth: 150,
  },
});

export default ImportGasStationsScreen;
