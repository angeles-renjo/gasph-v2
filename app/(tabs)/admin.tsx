import AdminDashboard from "../admin";
import StationsScreen from "../admin/stations";
import { View } from "react-native";

export default function AdminScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AdminDashboard />
    </View>
  );
}
