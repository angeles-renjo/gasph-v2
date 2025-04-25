import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NAVIGATION_APP_KEY = '@preferred_navigation_app';

const APPS = {
  GOOGLE_MAPS: {
    name: 'Google Maps',
    ios: 'comgooglemaps://',
    android: 'google.navigation:',
    web: 'https://www.google.com/maps/dir/?api=1',
    getDirections: (lat: number, lng: number, label: string) => {
      if (Platform.OS === 'ios') {
        return `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
      }
      return `google.navigation:q=${lat},${lng}`;
    },
  },
  WAZE: {
    name: 'Waze',
    ios: 'waze://',
    android: 'waze://',
    getDirections: (lat: number, lng: number) => {
      return `waze://?ll=${lat},${lng}&navigate=yes`;
    },
  },
  DEFAULT_MAPS: {
    name: Platform.OS === 'ios' ? 'Apple Maps' : 'Device Maps',
    ios: 'maps://',
    android: 'geo:',
    getDirections: (lat: number, lng: number, label: string) => {
      if (Platform.OS === 'ios') {
        return `maps://?daddr=${lat},${lng}&directionsmode=driving`;
      }
      return `geo:${lat},${lng}?q=${encodeURIComponent(label)}`;
    },
  },
};

export const openDirections = async (
  lat: number,
  lng: number,
  label: string
) => {
  try {
    // Check for saved preference
    const preferredApp = await AsyncStorage.getItem(NAVIGATION_APP_KEY);

    if (preferredApp && APPS[preferredApp as keyof typeof APPS]) {
      // Use preferred app
      const app = APPS[preferredApp as keyof typeof APPS];
      const url = app.getDirections(lat, lng, label);
      await Linking.openURL(url);
    } else {
      // No preference set - show selection
      const selectedApp = await showAppSelection();
      if (selectedApp) {
        await AsyncStorage.setItem(NAVIGATION_APP_KEY, selectedApp);
        const app = APPS[selectedApp as keyof typeof APPS];
        const url = app.getDirections(lat, lng, label);
        await Linking.openURL(url);
      }
    }
  } catch (error) {
    Alert.alert('Error', 'Could not open navigation app');
    console.error('Navigation error:', error);
  }
};

const showAppSelection = async (): Promise<string | null> => {
  // This would show a modal with app options
  // For now, we'll default to Google Maps but prompt to remember choice
  const remember = await new Promise<boolean>((resolve) => {
    Alert.alert(
      'Choose Navigation App',
      'Select your preferred navigation app',
      [
        {
          text: 'Google Maps',
          onPress: () => resolve(true),
        },
        {
          text: 'Waze',
          onPress: () => resolve(true),
        },
        {
          text: 'Device Maps',
          onPress: () => resolve(false), // Don't remember device maps
        },
      ]
    );
  });

  return remember ? 'GOOGLE_MAPS' : 'DEFAULT_MAPS';
};

export async function checkAppAvailability(appKey: string): Promise<boolean> {
  const app = APPS[appKey as keyof typeof APPS];
  if (!app) return false;

  const url = Platform.OS === 'ios' ? app.ios : app.android;
  return Linking.canOpenURL(url);
}

export async function getAvailableApps(): Promise<
  Array<{
    key: string;
    name: string;
  }>
> {
  const availableApps = [];

  for (const [key, app] of Object.entries(APPS)) {
    const isAvailable = await checkAppAvailability(key);
    if (isAvailable) {
      availableApps.push({ key, name: app.name });
    }
  }

  return availableApps;
}
