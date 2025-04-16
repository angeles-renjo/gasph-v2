import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2a9d8f',
        },
        headerShown: false,
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name='index'
        options={{
          title: 'Admin Dashboard',
        }}
      />
      <Stack.Screen
        name='stations'
        options={{
          title: 'Stations',
        }}
      />
      <Stack.Screen
        name='cycles'
        options={{
          title: 'Price Cycles',
        }}
      />
      <Stack.Screen
        name='users'
        options={{
          title: 'Users',
        }}
      />
      <Stack.Screen
        name='import-stations'
        options={{
          title: 'Import Stations',
        }}
      />
      <Stack.Screen
        name='reports'
        options={{
          title: 'Station Reports',
        }}
      />
    </Stack>
  );
}
