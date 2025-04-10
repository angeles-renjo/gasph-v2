import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
// Removed SafeAreaView import as it's not used
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
          },
          headerStyle: {
            backgroundColor: '#2a9d8f',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            // Removed fontSize: theme.Typography.fontSizeLarge
          },
        }}
      >
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
          name='map' // New map tab
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
        <Tabs.Screen
          name='admin'
          options={{
            title: 'Admin',
            headerShown: false, // Add this line to hide the tab header
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name='shield-alt' size={size} color={color} />
            ),
            tabBarButton: isAdmin ? undefined : () => null,
          }}
        />
      </Tabs>
    </View>
  );
}
