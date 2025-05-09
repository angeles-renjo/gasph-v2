# Progress: GasPh

## What Works

- The project is in the initial stages of development.
- The basic project structure is in place.
- The development environment is set up.

## What's Left to Build

- Implement the core functionality of the app, including:
  - Fetching and displaying gas price data using the updated `active_price_reports` and `doe_price_view`.
  - Allowing users to report gas prices, integrated with the enhanced price cycle management.
  - Implementing user authentication and authorization.
  - Providing admin functionality, including the enhanced price cycle management interface.

## Current Status

- The project is in the planning and initial setup phase.

## Known Issues

- **Resolved (2025-04-29): Price Report Modal Keyboard Overlap and UI Improvements:** The keyboard overlapped the input fields and buttons in the `PriceReportModal`, making it difficult to submit reports on mobile devices.

  - _Fix:_ Completely redesigned the modal in `components/price/PriceReportModal.tsx`:
    - Wrapped content with `KeyboardAvoidingView` and `ScrollView` to handle keyboard appearance
    - Moved action buttons (Submit/Cancel) to the header area to ensure they're always visible
    - Converted fuel type selector to a horizontal scrollable list using `FlatList` for better space utilization
    - Improved overall modal layout and responsiveness

- **React Query Performance (Resolved 2025-04-28):** Identified inefficiencies in React Query implementation for React Native, including lack of focus awareness and over-invalidation.

  - _Fix:_ Implemented React Native specific optimizations for React Query:
    - Created `lib/react-query-native.ts` with online status management using `NetInfo` and app focus management using `AppState`.
    - Created utilities in `hooks/queries/utils/createFocusAwareHooks.ts` for focus-aware query hooks.
    - Implemented example focus-aware hooks in `hooks/queries/stations/useFocusAwareStationHooks.ts`.
    - Updated `lib/query-client.ts` with platform-specific settings.
    - Created optimized versions of key hooks with targeted query invalidation.
    - Created comprehensive documentation in `docs/react-query-optimization.md`.

- **Resolved (2025-04-29): Location Constants Inconsistencies:** Identified inconsistencies in default location coordinates, zoom levels, and animation durations across different files.

  - _Fix:_ Created a centralized constants file (`constants/map/locationConstants.ts`) with standardized values:
    - Defined `DEFAULT_LOCATION` for Metro Manila (`14.5995, 120.9842`) as the single source of truth.
    - Defined `PHILIPPINES_CENTER` (`12.8797, 121.774`) for country-wide view.
    - Standardized zoom levels with semantic names (`COUNTRY`, `REGION`, `CITY`, `NEIGHBORHOOD`, `STREET`).
    - Standardized animation durations (`SHORT`, `MEDIUM`, `LONG`).
  - Updated all relevant files to use these constants.

- **Resolved (2025-04-29): Incorrect Favorite Stations Display on Permission Deny:** The favorite stations list was still being displayed (using default location) even when the user had denied location permission.

  - _Fix:_ Updated `hooks/queries/stations/useFavoriteStationPrices.ts` to disable the data fetching query if location permission is denied. Updated `app/(tabs)/home.tsx` and `app/favorites.tsx` to check the `permissionDenied` status from the location store and display an informative message instead of the station list when permission is denied.

- **Android Location Timeout:** Users may still experience `Location error: Inner location request timed out` on Android if location acquisition takes longer than 20 seconds, even with granted permissions.

  - _Attempted Fix 1 (2025-04-24):_ Increased the `Promise.race` timeout in `hooks/useLocation.ts` from 10 seconds to 20 seconds.
  - _Attempted Fix 2 (2025-04-24):_ Changed location accuracy request to `Location.Accuracy.Low` and simplified timeout logic in `hooks/useLocation.ts`.
  - _Attempted Fix 3 (2025-04-29):_ Centralized timeout values in `constants/map/locationConstants.ts` to ensure consistency.

- **Resolved (2025-04-24): Multiple Location Hook Calls:** The `useLocation` hook was being called multiple times (in `_layout.tsx` and individual tab screens), causing redundant location requests and excessive logging.

  - _Fix:_ Refactored to use a centralized Zustand store (`useLocationStore`) initialized in `_layout.tsx`. Screens now consume state directly from the store, ensuring location logic runs only once.

- **Resolved (2025-04-24): Maximum Update Depth Exceeded Error:** An infinite update loop occurred in components consuming the `useLocationStore` due to returning a new object from the Zustand selector on every render.

  - _Fix:_ Modified the Zustand selectors in consuming components (`index.tsx`, `map.tsx`, `explore.tsx`, `location-test.tsx`) to select individual state properties instead of returning an object. This leverages Zustand's memoization to prevent unnecessary re-renders.

- **iOS Map Performance Lag (Ongoing):** Persistent stuttering/lag observed during map panning/zooming (especially glide animation) on iOS standalone builds (high-refresh-rate devices).
  - _Attempted Fix 1 (2025-04-25):_ Tuned clustering parameters (`radius`, `maxZoom`) in `StationMapView.tsx`.
  - _Attempted Fix 2 (2025-04-25):_ Simplified `StationMarker` `tracksViewChanges` prop.
  - _Attempted Fix 3 (2025-04-25):_ Added `removeClippedSubviews` prop to `MapView` (iOS).
  - _Attempted Fix 4 (2025-04-25):_ Fixed marker tap zoom behavior to preserve current zoom level.
  - _Attempted Fix 5 (2025-04-25):_ Applied `onPanDrag={() => {}}` workaround (improved active drag, not glide).
  - _Attempted Fix 6 (2025-04-25):_ Implemented Reanimated hack (`useGoogleMapIosPerfFix`) (did not resolve glide lag, reverted, then re-applied).
  - _Attempted Fix 7 (2025-04-26):_ Replaced deprecated `min/maxZoomLevel` with `cameraZoomRange` prop (iOS).
  - _Current Test (2025-04-26):_ Temporarily simplified marker components (`StationMarker`, `ClusterMarker`) to diagnose if rendering complexity is the primary cause of glide lag.

## Evolution of Project Decisions

- The project is following the KISS and SOLID principles.
- **Enhanced Price Cycle Management (2025-09-05):** Implemented enhanced price cycle management in the database schema, including cycle numbering, status transitions (active, completed, archived), and a trigger for automatic status updates. Updated the `active_price_reports` and `doe_price_view` to respect cycle status. This provides a more robust system for managing price data over time.
- **Location Management (2025-04-24):** Refactored location state management from direct hook usage in multiple screens to a centralized Zustand store (`useLocationStore`) initialized at the root layout. This aligns with the project's preference for Zustand for global state and resolves issues with redundant hook calls.
- **Map Performance Strategy (2025-04-26):** Due to persistent iOS lag with Google Maps provider (known community issue #4937), current strategy involves testing marker simplification. If unsuccessful, the next step is likely switching to Apple Maps provider for iOS.
- **React Query Optimization (2025-04-28):** Implemented React Native specific optimizations for React Query to improve performance and battery usage. This includes online status management, app focus management, screen focus awareness, and targeted query invalidation. Created utilities for focus-aware query hooks and optimized versions of key hooks. This aligns with the project's focus on performance and user experience.
- **Favorite Stations UI Improvements (2025-04-28):** Implemented a horizontal slider for favorite stations in the home tab using `react-native-pager-view` and added a "View All" button that navigates to a dedicated screen. Created a new screen (`app/favorites.tsx`) to display all favorite stations in a list. This improves the user experience by providing a more intuitive way to browse favorite stations.
- **Location Constants Centralization (2025-04-29):** Created a centralized constants file (`constants/map/locationConstants.ts`) to ensure consistency across the application. This aligns with the project's focus on maintainability and code quality. Standardized default locations, zoom levels, and animation durations to provide a consistent user experience.
