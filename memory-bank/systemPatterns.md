# System Patterns: GasPh

## System Architecture

- The app follows a modular architecture, primarily organized by feature and function. Key directories include:
  - `/app`: Screens and navigation (Expo Router). Includes `(tabs)`, `auth`, `station`, `admin`.
  - `/components`: Reusable UI components, categorized into `ui`, `common`, `price`, `station`, `admin`.
  - `/hooks`: Custom React hooks, including React Query (`/queries`) and Zustand stores (`/stores`).
  - `/utils`: Utility functions, including Supabase client setup (`/supabase`) and formatters.
  - `/lib`: Core library code (e.g., geospatial functions, query client setup).
  - `/constants`: Application-wide constants (e.g., static lists, default values).
    - `/constants/map`: Map-related constants, including location defaults, zoom levels, and animation durations.
  - `/assets`: Static assets like images and fonts.
  - `/docs`: Project documentation (this folder).
  - `/styles`: Contains centralized theme definitions (`theme.ts`) including colors, typography, spacing, and border radius constants used throughout the components.
- The UI is built with React Native and Expo.
- The backend is powered by Supabase (Auth, PostgreSQL DB, Storage).

## Key Technical Decisions

- Using Expo for cross-platform mobile development.
- Using Supabase for backend services (database, authentication, etc.).
- Implementing file-based routing with Expo Router.

## Design Patterns

- The app follows the KISS (Keep It Simple, Stupid) principle, with each component having a single responsibility.
- The app adheres to the SOLID principles, with components and hooks handling specific concerns.
- The app also adheres to the YAGNI (You Aren't Gonna Need It) principle.
- The app uses a centralized constants approach, with dedicated files for related constants to ensure consistency and maintainability.

## Component Relationships

- The app consists of several key components, including:
  - Map: Displays gas stations on a map.
  - PriceCard: Displays gas prices for a station.
  - StationInfoModal: Provides detailed information about a station.
  - Auth: Handles user authentication and authorization.
  - Admin: Provides admin functionality.

## Critical Implementation Paths

- The app's core functionality revolves around fetching and displaying gas price data.
- The app uses the Google Places API for importing station data.

## Database Schema

The application uses a Supabase PostgreSQL database. The key tables and views are:

### Views

- `active_price_reports`: Provides a consolidated view of user-reported prices that belong to the currently active or completed reporting cycles, including station details, reporter info, confirmation counts, and a calculated confidence score. Reports from archived cycles are excluded, and only reports that have not expired are included.
- `current_price_cycle`: Selects the details of the price reporting cycle that is currently marked as 'active'.
- `doe_price_view`: Determines the most relevant Department of Energy (DOE) price reference for each gas station and fuel type using a tiered fallback system (brand-specific, city overall, NCR prevailing). It now respects cycle status, only including data from active or completed cycles.

### Tables

- `gas_stations`: Stores information about individual gas stations, including a `place_id` for integration with external location services like Google Places.
- `price_confirmations`: Records user confirmations for specific price reports.
- `price_references`: Stores official DOE price reference data.
- `price_reporting_cycles`: Manages the cycles for community price reporting and DOE data imports.
- `profiles`: Stores user profile information, linked to Supabase Auth users.
- `user_price_reports`: Stores fuel prices reported by users for specific stations during a reporting cycle.

## State Management Approach

- **React Query (TanStack Query v5)**: Manages all server state, including data fetching from Supabase, caching, background updates, and mutations.

  - **React Native Optimizations**:
    - **Online Status Management**: Using `NetInfo` to automatically refetch queries when the device reconnects to the internet.
    - **App Focus Management**: Using `AppState` to automatically refetch queries when the app is brought back to the foreground.
    - **Screen Focus Awareness**: Using `useIsFocused` from React Navigation to disable queries when screens are not focused.
    - **Focus-Aware Query Hooks**: Custom hooks that only run queries when the screen is focused and automatically refresh data when the screen is focused again.
    - **Optimized Query Invalidation**: Targeted invalidation to reduce unnecessary refetches.
    - **Platform-Specific Settings**: Different staleTime, gcTime, and retry settings for web vs. mobile.
  - **Key Files**:
    - `lib/react-query-native.ts`: React Native specific implementations.
    - `hooks/queries/utils/createFocusAwareHooks.ts`: Utilities for creating focus-aware query hooks.
    - `hooks/queries/stations/useFocusAwareStationHooks.ts`: Example focus-aware hooks.
    - `hooks/queries/prices/useBestPricesOptimized.ts`: Optimized version of `useBestPrices`.
    - `hooks/queries/prices/usePriceConfirmationOptimized.ts`: Optimized version of `usePriceConfirmation`.
    - `docs/react-query-optimization.md`: Comprehensive documentation.

- **Zustand**: Manages global client-side state. Key stores include:
  - `useAuthStore`: Handles authentication state.
  - `usePreferencesStore`: Manages user preferences (e.g., default fuel type).
  - `useLocationStore`: Manages location state (`location`, `loading`, `error`, `permissionDenied`) and related actions (`initializeLocation`, `refreshLocation`). Initialized in `_layout.tsx` and consumed directly in components needing location data. This centralizes location logic and prevents redundant fetching.
- **Integration Pattern**: Zustand stores are often used to provide data to React Query hooks, creating a seamless integration between global state and server state. For example, `useLocationStore` provides location data to `useNearbyStations`, and `usePreferencesStore` provides the default fuel type to `useBestPrices`.

## Constants Management

- **Centralized Constants**: The app uses a centralized approach to constants management, with dedicated files for related constants.
  - **Location Constants**: `constants/map/locationConstants.ts` contains all location-related constants, including default locations, zoom levels, and animation durations.
  - **Theme Constants**: `styles/theme.ts` contains all theme-related constants, including colors, typography, spacing, and border radius.
  - **API Constants**: Various constants related to API endpoints and data structures are defined in their respective modules.
- **Benefits**:
  - **Consistency**: Ensures consistent values are used throughout the application.
  - **Maintainability**: Makes it easier to update values in a single place.
  - **Readability**: Improves code readability by using semantic names instead of magic numbers.
  - **Type Safety**: Provides TypeScript interfaces for complex data structures.
