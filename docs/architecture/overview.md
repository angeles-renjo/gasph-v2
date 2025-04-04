# GasPH Architecture Overview

This document provides a high-level overview of the GasPH mobile application's architecture, structure, and development principles.

## Tech Stack Summary

- **Frontend**: React Native 0.76.7 / Expo 52.0.40
- **Navigation**: Expo Router 4.0.19
- **Forms**: React Hook Form 7.54.2 / Zod 3.24.2
- **State Management**:
  - Server State: TanStack React Query 5.69.0
  - Client State: Zustand 5.0.3
- **Backend**: Supabase (Auth, PostgreSQL DB, Storage)
- **Mapping**: React Native Maps 1.18.0
- **Location**: Expo Location 18.0.8

## Project Structure

The project follows a modular structure, primarily organized by feature and function:

- `/app`: Screens and navigation (Expo Router). Includes `(tabs)`, `auth`, `station`, `admin`.
- `/components`: Reusable UI components, categorized into `ui`, `common`, `price`, `station`, `admin`. Some complex display/logic has been extracted into sub-components (e.g., `PriceConfirmation`, `DOEPriceDisplay` within `/components/price`).
- `/hooks`: Custom React hooks, including React Query (`/queries`) and Zustand stores (`/stores`).
- `/utils`: Utility functions, including Supabase client setup (`/supabase`) and formatters.
- `/lib`: Core library code (e.g., geospatial functions, query client setup).
- `/constants`: Application-wide constants (e.g., static lists, default values).
- `/assets`: Static assets like images and fonts.
- `/docs`: Project documentation (this folder).
- `/styles`: Contains centralized theme definitions (`theme.ts`) including colors, typography, spacing, and border radius constants used throughout the components.

## Development Principles

The project aims to adhere to the following principles:

### KISS (Keep It Simple, Stupid)

- Components have a single, clear responsibility.
- Modular structure separates UI from logic.
- Straightforward navigation using Expo Router.
- Minimal external dependencies.

### SOLID

- **Single Responsibility**: Components/hooks focus on specific concerns.
- **Open/Closed**: Components are extensible via props.
- **Liskov Substitution**: Consistent interfaces for related components/hooks.
- **Interface Segregation**: Props are tailored to specific needs.
- **Dependency Inversion**: High-level components depend on abstractions (hooks).

### YAGNI (You Aren't Gonna Need It)

- Implement only necessary features and components.
- Use straightforward state management solutions (React Query, Zustand) without over-engineering.

## State Management Approach

- **React Query (TanStack Query v5)**:
  - **Purpose**: Manages all server state, including data fetching from Supabase, caching, background updates, and mutations.
  - **Implementation**:
    - Custom hooks (`useQuery`, `useInfiniteQuery`, `useMutation`) located in `/hooks/queries/` encapsulate all data fetching and mutation logic for specific features (e.g., `useBestPrices`, `useStationDetails`, `usePriceConfirmation`).
    - Standardized query keys are defined in `hooks/queries/utils/queryKeys.ts` for consistency and cache management.
    - Default query options (like `staleTime`, `gcTime`) are configured in `hooks/queries/utils/queryOptions.ts` to provide sensible defaults, which can be overridden in specific hooks if needed.
    - Mutations typically invalidate relevant queries using `queryClient.invalidateQueries` in `onSuccess` or `onSettled` callbacks to ensure UI consistency after data changes.
    - The `QueryClientProvider` is set up in `app/_layout.tsx` (assumed) via `/lib/query-client.ts`.
- **Zustand**:
  - **Purpose**: Manages minimal global client-side state that needs to be shared across different parts of the application and isn't derived from server state.
  - **Implementation**:
    - Stores are defined in `/hooks/stores/`. Key stores include:
      - `useAuthStore.ts`: Manages the user's session, user object, admin status, and related loading/initialization flags. Uses `persist` middleware with `AsyncStorage`. Integrates with React Query cache invalidation.
      - `usePreferencesStore.ts`: Manages user-specific application preferences (e.g., default fuel type). Uses `persist` middleware with `AsyncStorage`.
    - Actions within stores handle state updates.

This approach separates server state concerns (React Query) from global client state concerns (Zustand), following best practices. Local component state (`useState`) is used for UI state that doesn't need to be shared globally.

This overview provides a starting point for understanding the project's design. Further details on specific areas can be found in relevant subdirectories or documentation files.
