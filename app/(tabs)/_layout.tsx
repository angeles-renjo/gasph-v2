import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth'; // Corrected import path
import { Colors } from '@/styles/theme'; // Import Colors
import { View } from 'react-native';
import Constants from 'expo-constants'; // Make sure to import Constants
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabsLayout() {
  const { isAdmin } = useAuth();
  const statusBarHeight = Constants.statusBarHeight;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary, // Use theme primary color
          tabBarInactiveTintColor: Colors.gray, // Use theme gray color

          tabBarItemStyle: {
            // Add this style
            flex: 1, // Make each item flexible
          },
          headerStyle: {
            backgroundColor: Colors.primary, // Use theme primary color
          },
          headerTintColor: Colors.white, // Use theme white color
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Home Tab - Added as the first tab */}
        <Tabs.Screen
          name='home' // Corresponds to app/(tabs)/home.tsx
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name='home' size={size} color={color} /> // Use 'home' icon
            ),
          }}
        />

        {/* Common Tabs */}
        <Tabs.Screen
          name='index'
          options={{
            title: 'Best Prices',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name='gas-pump' size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name='explore'
          options={{
            title: 'Stations',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name='search' size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name='map'
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name='map-marked-alt' size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name='settings'
          options={{
            title: 'settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name='settings' size={size} color={color} />
            ),
          }}
        />
        {/* Always include the Admin Tab Screen */}
        <Tabs.Screen
          name='admin'
          options={{
            title: 'Admin',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name='shield-alt' size={size} color={color} />
            ),
            // Conditionally hide the tab link itself based on GitHub issue #518
            href: isAdmin ? undefined : null,
          }}
        />
      </Tabs>
    </View>
  );
}
