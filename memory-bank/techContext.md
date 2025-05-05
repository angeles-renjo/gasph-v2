# Tech Context: GasPh

## Technologies Used

- React Native 0.76.7
- Expo 52.0.40
- TypeScript
- Supabase
- Google Places API
- Expo Router
- React Hook Form 7.54.2
- Zod 3.24.2
- TanStack React Query 5.69.0
  - React Query Optimizations for React Native:
    - Online status management with `@react-native-community/netinfo`
    - App focus management with React Native's `AppState`
    - Screen focus awareness with React Navigation's `useIsFocused`
    - Focus-aware query hooks with custom utilities
    - Targeted query invalidation
    - Platform-specific settings
- Zustand 5.0.3
  - Integration with React Query for state management
  - Centralized stores for auth, preferences, and location
- React Native Maps 1.18.0
- Expo Location 18.0.8
- React Navigation 6.x
- @react-native-community/netinfo

## Development Setup

- The project is developed using Expo.
- The project uses TypeScript for type safety.
- The project uses Supabase for backend services.

## Technical Constraints

- The app must be compatible with both iOS and Android.
- The app must be performant and responsive.
- The app must be secure and protect user data.

## Dependencies

- The project uses a variety of dependencies, including:
  - @react-navigation/native: For navigation and screen focus management
  - @supabase/supabase-js: For backend services
  - expo-location: For location services
  - react-native-maps: For map display
  - @tanstack/react-query: For server state management
  - @tanstack/query-async-storage-persister: For persisting query cache
  - @react-native-community/netinfo: For network status monitoring
  - zustand: For client state management

## Tool Usage Patterns

- The project uses VS Code for development.
- The project uses Git for version control.
- The project uses Expo CLI for building and deploying the app.
- The project uses EAS CLI and Google Play Console for publishing to the Google Play Store. The publishing process involves:
  - Configuring `app.config.js` with app metadata (name, package, version, icons, splash screen, permissions).
  - Building the app bundle (.aab) using `eas build -p android --profile production`.
  - Creating a Google Play Console account and setting up the app listing.
  - Completing the App Content section in the Google Play Console (privacy policy, ads, app access, content ratings, target audience, data safety).
  - Uploading the app bundle to the Google Play Console and submitting for review.

## Performance Optimization Strategies

- **React Query Optimizations:**

  - Implement online status management to automatically refetch queries when the device reconnects to the internet.
  - Use app focus management to automatically refetch queries when the app is brought back to the foreground.
  - Create focus-aware query hooks that only run when the screen is focused and automatically refresh data when the screen is focused again.
  - Implement targeted query invalidation to reduce unnecessary refetches.
  - Use platform-specific settings for staleTime, gcTime, and retry settings.
  - Refer to `docs/react-query-optimization.md` for comprehensive documentation.

- **Zustand Optimizations:**
  - Use centralized stores for global state.
  - Initialize stores at the root layout to prevent redundant initialization.
  - Use selectors to select individual state properties instead of returning objects to leverage Zustand's memoization.
  - Integrate Zustand with React Query for seamless state management.
