import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

export default function TabsLayout() {
  const { user } = useAuth();

  return (
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
        // TODO: Uncomment this line when authentication is implemented
        // redirect={!user}
      />

      {/* TODO: Uncomment this conditional rendering when authentication is implemented
        Replace the Admin tab below with this code:
        
        {user && user.email === 'admin@gasph.app' && (
          <Tabs.Screen
            name='admin'
            options={{
              title: 'Admin',
              tabBarIcon: ({ color, size }) => (
                <FontAwesome5 name='shield-alt' size={size} color={color} />
              ),
            }}
          />
        )}
      */}

      {/* Remove this tab and use the conditional rendering above when authentication is implemented */}
      <Tabs.Screen
        name='admin'
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name='shield-alt' size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
