# Active Context: GasPh

## Current Work Focus

- Improving location permission handling for the favorite stations feature.
- Ensuring the Home screen is accessible regardless of location permission status.
- Optimizing React Query and Zustand implementation for React Native to improve performance and battery usage.
- Implementing React Native specific features for React Query to ensure optimal performance.
- Creating focus-aware query hooks to optimize data fetching based on screen focus.
- Optimizing query invalidation to reduce unnecessary refetches.

Previous focus:

- Investigating persistent map performance lag (stuttering/choppiness) during panning and zooming gestures, specifically the glide animation after finger release, on iOS standalone builds (especially high-refresh-rate devices).
- Testing the impact of marker rendering complexity by using temporarily simplified markers.

## Recent Changes

- **Location Permission Handling for Favorite Stations:**

  - Modified `app/(tabs)/home.tsx` to no longer block rendering based on initial location status. The main content (Welcome, Contributions, FAQ) will now always be displayed.
  - Updated `hooks/queries/stations/useFavoriteStationPrices.ts` to disable the data fetching query if location permission is denied.
  - Updated `app/(tabs)/home.tsx` to check the `permissionDenied` status from the location store. If denied, it now displays an informative message within the "Favorite Stations" area instead of the station pager.
  - Updated `app/favorites.tsx` to also check the `permissionDenied` status. If denied, it displays a full-screen message requesting permission instead of the list of favorite stations.

- **React Query and Zustand Optimizations:**

  - Created `lib/react-query-native.ts` with React Native specific implementations:
    - Online status management using `NetInfo` to automatically refetch queries when the device reconnects to the internet.
    - App focus management using `AppState` to automatically refetch queries when the app is brought back to the foreground.
    - Screen focus utilities (`useRefreshOnFocus` and `createScreenFocusAwareQuery`) to optimize queries based on screen focus.
  - Created utilities in `hooks/queries/utils/createFocusAwareHooks.ts` to:
    - Create focus-aware versions of query hooks that only run when the screen is focused.
    - Automatically refresh data when the screen is focused again.
    - Disable queries when the screen is not focused to save resources.
  - Implemented example focus-aware hooks in `hooks/queries/stations/useFocusAwareStationHooks.ts`.
  - Updated `lib/query-client.ts` with:
    - Reduced staleTime and gcTime for mobile.
    - Implemented exponential backoff for retries.
    - Platform-specific settings for web vs. mobile.
  - Created optimized versions of key hooks:
    - `hooks/queries/prices/useBestPricesOptimized.ts` with screen focus awareness.
    - `hooks/queries/prices/usePriceConfirmationOptimized.ts` with targeted query invalidation.
  - Created comprehensive documentation in `docs/react-query-optimization.md`.

- **Map Performance Optimizations (Attempted):**
  - Adjusted `react-native-clusterer` options (`radius`, `maxZoom`) in `StationMapView.tsx`.
  - Simplified `StationMarker` `tracksViewChanges` prop to `isSelected`.
  - Added `removeClippedSubviews={true}` prop to `MapView` (iOS).
  - Fixed marker tap zoom behavior to preserve current zoom level instead of using a fixed delta.
  - Applied `onPanDrag={() => {}}` workaround to `MapView` (improved active drag but not glide).
  - Implemented and subsequently reverted, then re-implemented the `useGoogleMapIosPerfFix` Reanimated hack (did not resolve glide lag).
  - Replaced deprecated `min/maxZoomLevel` with `cameraZoomRange` prop for iOS in `MapView`.
  - Temporarily simplified `StationMarker` and `ClusterMarker` components in `StationMapView.tsx` to basic `<View>` elements to diagnose if rendering complexity is the primary cause of the remaining glide lag.

## Next Steps

- **Favorite Stations UI Improvements:**

  - Consider adding active state to the pagination indicators to show the current page.
  - Explore adding animations for smoother transitions between pages in the slider.
  - Add sorting options for the favorite stations list.
  - Consider adding filtering options for the favorite stations list.

- **React Query and Zustand Optimizations:**

  - Replace existing query hooks with their focus-aware versions where appropriate.
  - Apply the optimized query invalidation patterns to other mutation hooks.
  - Consider server-side optimizations to reduce client-side data processing.
  - Monitor the performance impact of the optimizations and make further adjustments as needed.

- **Map Performance:**

  - **Evaluate Marker Simplification Test:** Build and test the app on an iOS device with the simplified markers to observe the impact on the glide animation lag.
  - **Based on Test Results:**
    - **If lag is gone:** Revert the temporary marker simplification and begin meticulously optimizing the original `StationMarker` and `ClusterMarker` components (e.g., reduce view nesting, optimize styles, consider image-based markers).
    - **If lag persists:** Revert the temporary marker simplification. Strongly consider switching the map provider to Apple Maps for iOS (`provider={undefined}`) as the next most likely solution for performance issues related to `react-native-maps` + Google Maps SDK on iOS.

- **Location Constants Refactoring:**
  - Update any remaining files that might still be using hardcoded location constants.
  - Consider adding more zoom level presets for different use cases.
  - Add documentation for the location constants to help developers understand their purpose and usage.

## Active Decisions and Considerations

- **React Query and Zustand:**

  - Determining the optimal balance between data freshness and performance by fine-tuning staleTime and gcTime values.
  - Deciding when to use focus-aware queries vs. regular queries based on the importance and frequency of data updates.
  - Evaluating the trade-offs between client-side and server-side data processing.

- **Map Performance:**

  - Determining the root cause of the iOS map glide animation lag (Marker complexity vs. deeper library/SDK issue).
  - Weighing the trade-offs between optimizing complex markers, using workarounds like `onPanDrag`/Reanimated, or switching map providers for iOS.

- **Location Management:**
  - Centralized location constants in `constants/map/locationConstants.ts` to ensure consistency across the application.
  - Standardized default locations, zoom levels, and animation durations.
  - Improved boundary enforcement logic to work with the default location.

## Important Patterns and Preferences

- Follow the KISS and SOLID principles.
- Maintain a modular structure with clear separation of concerns.
- Use a consistent commenting style.
- Prioritize smooth user experience, especially for core interactions like map navigation.
- Optimize React Query usage for React Native:
  - Use focus-aware queries to save battery and network resources.
  - Implement targeted query invalidation to reduce unnecessary refetches.
  - Use the `subscribed` option to disable queries when screens are not focused.
  - Implement proper error handling for offline scenarios.
- Centralize constants in dedicated files to ensure consistency and maintainability:
  - Location-related constants in `constants/map/locationConstants.ts`
  - Use these constants throughout the application instead of hardcoding values

## Learnings and Project Insights

- **React Query and Zustand:**

  - React Query requires specific optimizations for React Native to ensure optimal performance and battery usage.
  - The `subscribed` option in React Query is particularly useful for React Native to disable queries when screens are not focused.
  - Zustand works well with React Query for managing global state and can be used to provide data to React Query hooks.
  - Targeted query invalidation can significantly reduce unnecessary refetches and improve performance.
  - Screen focus awareness is critical for optimizing data fetching in React Native applications.

- **Map Performance:**

  - iOS map performance with `react-native-maps` using the Google Maps provider can be problematic, especially on high-refresh-rate (ProMotion) displays. This is a known issue in the community (GitHub #4937).
  - Workarounds like `onPanDrag` or Reanimated hacks may offer partial improvements but might not fully resolve glide/inertia animation lag.
  - Marker rendering complexity can significantly impact map performance during interactions.
  - Using deprecated props like `min/maxZoomLevel` should be avoided; `cameraZoomRange` is the preferred alternative for iOS 13+.

- **Location Management:**

  - Centralizing location constants in a dedicated file helps ensure consistency across the application.
  - Different default locations were being used in different parts of the app, causing inconsistent user experiences.
  - Standardizing zoom levels and animation durations improves the user experience by providing consistent interactions.
  - Using a single source of truth for location-related constants makes the code more maintainable and easier to update.

- **General:**
  - The GasPh app is a mobile application built with Expo/React Native that aims to provide users with accurate and up-to-date gas price information.
  - Review the `docs/architecture/overview.md` file for a comprehensive understanding of the project's architecture and tech stack.
  - Review the `docs/react-query-optimization.md` file for detailed information on React Query optimizations.
