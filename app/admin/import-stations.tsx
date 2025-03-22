// app/admin/import-stations.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import GooglePlacesImportScreen from '@/components/admin/GooglePlacesImportScreen';

function ImportGasStationsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // For development: bypass admin check
  // TODO: Uncomment this check when authentication is implemented
  // const isAdmin = user?.email === 'admin@gasph.app';
  const isAdmin = true; // Bypass for development

  // For development: always allow access
  // TODO: Restore this check when authentication is implemented
  /*
  if (!user || !isAdmin) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Text style={styles.unauthorizedTitle}>Access Denied</Text>
        <Text style={styles.unauthorizedMessage}>
          You need administrator permissions to access this page.
        </Text>
        <Button
          title='Go Back'
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
    );
  }
  */

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

      {/* Development mode notice */}
      <View style={styles.devNotice}>
        <Text style={styles.devNoticeText}>
          Development Mode - Admin check bypassed
        </Text>
      </View>

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
  // Development notice styles
  devNotice: {
    padding: 8,
    backgroundColor: '#ffe8cc',
    alignItems: 'center',
  },
  devNoticeText: {
    color: '#d96c00',
    fontSize: 12,
  },
});

export default ImportGasStationsScreen;
