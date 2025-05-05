import { Alert, Linking, Platform } from 'react-native';
import {
  usePreferencesStore,
  NavAppKey,
} from '@/hooks/stores/usePreferencesStore';

// Navigation app definitions
const APPS = {
  GOOGLE_MAPS: {
    name: 'Google Maps',
    ios: 'comgooglemaps://',
    android: 'google.navigation:',
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

// Check if an app is available on the device
export const checkAppAvailability = async (
  appKey: keyof typeof APPS
): Promise<boolean> => {
  const app = APPS[appKey];
  if (!app) return false;

  const url = Platform.OS === 'ios' ? app.ios : app.android;

  try {
    // Important: On iOS, canOpenURL may require listing URL schemes in Info.plist
    const canOpen = await Linking.canOpenURL(url);
    console.log(
      `App availability check for ${appKey}: ${
        canOpen ? 'Available' : 'Not available'
      }`
    );
    return canOpen;
  } catch (error) {
    console.error(`Error checking availability for ${appKey}:`, error);
    return false;
  }
};

// Get all available navigation apps
export const getAvailableNavApps = async (): Promise<
  Array<{ key: keyof typeof APPS; name: string }>
> => {
  const availableApps = [];

  // Always include DEFAULT_MAPS as it should be available on all devices
  availableApps.push({
    key: 'DEFAULT_MAPS' as keyof typeof APPS,
    name: APPS.DEFAULT_MAPS.name,
  });

  // Check for Google Maps
  if (await checkAppAvailability('GOOGLE_MAPS')) {
    availableApps.push({
      key: 'GOOGLE_MAPS' as keyof typeof APPS,
      name: APPS.GOOGLE_MAPS.name,
    });
  }

  // Check for Waze
  if (await checkAppAvailability('WAZE')) {
    availableApps.push({
      key: 'WAZE' as keyof typeof APPS,
      name: APPS.WAZE.name,
    });
  }

  console.log('Available navigation apps:', availableApps);
  return availableApps;
};

// Show app selection dialog with only available apps
export const showAppSelection = async (): Promise<NavAppKey | null> => {
  try {
    const availableApps = await getAvailableNavApps();

    // If only default maps is available, return it immediately without prompting
    if (availableApps.length === 1) {
      console.log('Only default maps available, returning it without prompt');
      return availableApps[0].key as NavAppKey;
    }

    // Otherwise, show selection dialog with available options
    return new Promise<NavAppKey | null>((resolve) => {
      // Create buttons for each available app
      const buttons = availableApps.map((app) => ({
        text: app.name,
        onPress: () => resolve(app.key as NavAppKey),
      }));

      // Add cancel button
      buttons.push({
        text: 'Cancel',
        onPress: () => resolve(null), // Return null if canceled
      });

      Alert.alert(
        'Choose Navigation App',
        'Select your preferred navigation app',
        buttons
      );
    });
  } catch (error) {
    console.error('Error in showAppSelection:', error);
    return 'DEFAULT_MAPS'; // Fallback to default maps on error
  }
};

// Allow changing navigation preference - separate function for settings
export const changeNavigationPreference = async (): Promise<void> => {
  try {
    const selectedApp = await showAppSelection();
    if (selectedApp) {
      // Update preference store
      usePreferencesStore.getState().setPreferredNavApp(selectedApp);

      // Find the app name for display
      const appName = APPS[selectedApp]?.name || 'Default Maps';

      Alert.alert(
        'Preference Updated',
        `${appName} will now be used for directions.`
      );
    }
  } catch (error) {
    console.error('Error changing navigation preference:', error);
    Alert.alert('Error', 'Could not update navigation preference');
  }
};

// Main function to open directions
export const openDirections = async (
  lat: number,
  lng: number,
  label: string
): Promise<void> => {
  try {
    // Get preference from Zustand store
    const preferredNavApp = usePreferencesStore.getState().preferredNavApp;
    const setPreferredNavApp =
      usePreferencesStore.getState().setPreferredNavApp;

    let appKey: NavAppKey = preferredNavApp;

    // If no preference is set, or it needs validation
    if (!appKey || !(await checkAppAvailability(appKey as keyof typeof APPS))) {
      // First time using directions or preferred app not available

      // Check what's available before showing selection
      const availableApps = await getAvailableNavApps();

      // If only one app available (usually just the default), use it without asking
      if (availableApps.length === 1) {
        appKey = availableApps[0].key as NavAppKey;
        setPreferredNavApp(appKey); // Save this as preference
      } else {
        // Show first-time prompt
        Alert.alert(
          'Navigation Apps',
          'Choose your preferred navigation app:',
          [
            ...availableApps.map((app) => ({
              text: app.name,
              onPress: () => {
                // Set this app as the preference and open it
                setPreferredNavApp(app.key as NavAppKey);
                // Now open the directions with this app
                openAppDirections(app.key as NavAppKey, lat, lng, label);
              },
            })),
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                // User canceled, use default maps just this once
                openAppDirections('DEFAULT_MAPS', lat, lng, label);
              },
            },
          ]
        );
        return; // Exit early as directions will be handled by the alert callbacks
      }
    }

    // If code gets here, we have a valid app preference
    await openAppDirections(appKey, lat, lng, label);
  } catch (error) {
    console.error('Navigation error:', error);
    Alert.alert('Error', 'Could not open navigation app');

    // Fallback to default maps
    try {
      const defaultUrl = APPS.DEFAULT_MAPS.getDirections(lat, lng, label);
      await Linking.openURL(defaultUrl);
    } catch (fallbackError) {
      console.error('Fallback navigation error:', fallbackError);
    }
  }
};

// Helper function to open a specific app with directions
const openAppDirections = async (
  appKey: NavAppKey,
  lat: number,
  lng: number,
  label: string
): Promise<void> => {
  if (!appKey || !APPS[appKey as keyof typeof APPS]) {
    // Fallback to default maps if app key is invalid
    appKey = 'DEFAULT_MAPS';
  }

  const app = APPS[appKey as keyof typeof APPS];
  const url = app.getDirections(lat, lng, label);

  console.log(`Opening ${appKey} with URL: ${url}`);

  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error(`Error opening ${appKey}:`, error);

    // If the preferred app fails to open, try falling back to default maps
    if (appKey !== 'DEFAULT_MAPS') {
      const defaultUrl = APPS.DEFAULT_MAPS.getDirections(lat, lng, label);
      await Linking.openURL(defaultUrl);
    } else {
      // Re-throw the error if we're already trying to use default maps
      throw error;
    }
  }
};

// Export types and constants for use elsewhere
export type { NavAppKey };
export { APPS };
