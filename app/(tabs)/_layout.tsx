import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { View } from '@/components/Themed';

export default function TabsLayout() {
  const { isAdmin } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2a9d8f',
          tabBarInactiveTintColor: '#333333',
          tabBarStyle: {
            paddingBottom: 5,
            // Removed justifyContent
          },
          tabBarItemStyle: {
            // Add this style
            flex: 1, // Make each item flexible
          },
          headerStyle: {
            backgroundColor: '#2a9d8f',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
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
          name='profile'
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name='user' size={size} color={color} />
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
