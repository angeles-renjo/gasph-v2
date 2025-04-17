import 'dotenv/config'; // Ensure .env variables are loaded

export default {
  expo: {
    name: 'gasph-v2',
    slug: 'gasph-v2',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.angeles-renjo.gasph-v2',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'GasPH needs access to your location to find gas stations near you and show the most relevant fuel prices.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'GasPH needs access to your location to find gas stations near you and show the most relevant fuel prices.',
        ITSAppUsesNonExemptEncryption: false,
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
      package: 'com.angelesrenjo.gasphv2',
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID,
        },
      },
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUseUsageDescription:
            'Allow GasPH to use your location to find nearby gas stations and fuel prices.',
        },
      ],
      // Note: Removed "react-native-maps" from here if it was added previously, as it's not a valid plugin name.
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: '7fcba43f-9d20-44b2-b733-e2a65a5fe666',
      },
      googleApiKey: process.env.GOOGLE_API_KEY, // Expose the general Google API Key
    },
    owner: 'angeles-renjo',
  },
};
