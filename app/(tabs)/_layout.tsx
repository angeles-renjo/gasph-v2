import { Tabs } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { user, isAdmin } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#2a9d8f",
          tabBarInactiveTintColor: "#333333",
          tabBarStyle: {
            paddingBottom: 5,
          },
          headerStyle: {
            backgroundColor: "#2a9d8f",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Best Prices",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="gas-pump" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Stations",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="search" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="user" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: "Admin",
            headerShown: false, // Add this line to hide the tab header
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="shield-alt" size={size} color={color} />
            ),
            tabBarButton: isAdmin ? undefined : () => null,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
