import AdminDashboard from '../admin';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AdminDashboard />
    </SafeAreaView>
  );
}
