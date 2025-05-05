import 'dotenv/config'; // Ensure .env variables are loaded

export default {
  expo: {
    name: 'gasph-v2',
    slug: 'gasph-v2',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icons/adaptive-icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    // Removed legacy splash config, using plugin below
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
      icon: {
        light: './assets/icons/ios-light.png',
        dark: './assets/icons/ios-dark.png',
        tinted: './assets/icons/ios-tinted.png',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icons/adaptive-icon.png',
        monochromeImage: './assets/icons/adaptive-icon.png',
        backgroundColor: '#2A9D8F',
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
      [
        'expo-splash-screen',
        {
          image: './assets/icons/splash.png',
          backgroundColor: '#2A9D8F',
          resizeMode: 'contain', // or 'cover' depending on your needs
          imageResizeMode: 'contain', // For backward compatibility
          imageWidth: 300, // Increase this value to make the image larger
          // Optional platform-specific configurations
          ios: {
            image: './assets/icons/splash.png',
            resizeMode: 'contain',
            imageWidth: 300,
          },
          android: {
            image: './assets/icons/splash.png',
            resizeMode: 'contain',
            imageWidth: 300, // Android uses this to determine scaling
          },
        },
      ],
      ['expo-dev-client', { disableDevMenu: true }],
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
