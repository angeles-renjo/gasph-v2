import { create } from 'zustand';
import {
  checkOrRequestLocationPermission,
  fetchCurrentLocation,
  openDeviceLocationSettings,
} from '@/utils/locationUtils';
import {
  LocationData,
  DEFAULT_LOCATION,
} from '@/constants/map/locationConstants';

// Re-export LocationData type
export type { LocationData };

interface LocationState {
  location: LocationData;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  initialized: boolean; // Track if initialization has been attempted
  initializeLocation: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  openLocationSettings: () => void;
  // Selector to get location with fallback (derived state)
  getLocationWithFallback: () => LocationData;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  location: DEFAULT_LOCATION,
  loading: false, // Start as not loading, initialization action will set it
  error: null,
  permissionDenied: false,
  initialized: false,

  // Action to initialize location on app start
  initializeLocation: async () => {
    console.log('LocationStore: initializeLocation called', {
      initialized: get().initialized,
      loading: get().loading,
      location: get().location,
    });

    if (get().initialized || get().loading) {
      console.log('LocationStore: Already initialized or loading, skipping');
      return; // Prevent multiple initializations
    }

    console.log('LocationStore: Setting loading state');
    set({ loading: true, error: null, initialized: true });

    // Set a safety timeout to ensure we don't get stuck in loading state
    const safetyTimeoutId = setTimeout(() => {
      console.log('LocationStore: Safety timeout triggered after 15 seconds');
      // Only update if we're still loading
      if (get().loading) {
        console.log(
          'LocationStore: Still loading after timeout, using default location'
        );
        set({
          loading: false,
          error: 'Location request timed out',
          location: DEFAULT_LOCATION,
        });
      }
    }, 15000); // 15 second safety timeout

    try {
      console.log('LocationStore: Checking location permission');
      const hasPermission = await checkOrRequestLocationPermission();
      console.log('LocationStore: Permission check result:', hasPermission);

      if (!hasPermission) {
        console.log('LocationStore: Permission denied, using default location');
        clearTimeout(safetyTimeoutId); // Clear safety timeout
        set({
          permissionDenied: true,
          location: DEFAULT_LOCATION,
          loading: false,
          error: 'Location permission denied.',
        });
        return;
      }

      // Permission granted, fetch location
      console.log('LocationStore: Permission granted, fetching location');
      set({ permissionDenied: false }); // Ensure permissionDenied is false if granted

      const fetchedLocation = await fetchCurrentLocation();
      console.log(
        'LocationStore: Location fetched successfully',
        fetchedLocation
      );

      clearTimeout(safetyTimeoutId); // Clear safety timeout
      set({ location: fetchedLocation, loading: false, error: null });
      console.log('LocationStore: State updated with fetched location');
    } catch (err: any) {
      console.error('LocationStore: Error in initializeLocation', err);
      clearTimeout(safetyTimeoutId); // Clear safety timeout
      set({
        error: err.message || 'Failed to get location',
        location: DEFAULT_LOCATION, // Fallback to default on error
        loading: false,
      });
      console.log('LocationStore: Set error state and default location');
    }
  },

  // Action to manually refresh location
  refreshLocation: async () => {
    console.log('LocationStore: refreshLocation called', {
      loading: get().loading,
      location: get().location,
    });

    if (get().loading) {
      console.log('LocationStore: Already loading, skipping refresh');
      return; // Prevent refresh while already loading
    }

    console.log('LocationStore: Setting loading state for refresh');
    set({ loading: true, error: null });

    // Set a safety timeout to ensure we don't get stuck in loading state
    const safetyTimeoutId = setTimeout(() => {
      console.log(
        'LocationStore: Refresh safety timeout triggered after 15 seconds'
      );
      // Only update if we're still loading
      if (get().loading) {
        console.log(
          'LocationStore: Still loading after refresh timeout, keeping existing location'
        );
        set({
          loading: false,
          error: 'Location refresh timed out',
          // Keep existing location on timeout
        });
      }
    }, 15000); // 15 second safety timeout

    try {
      console.log('LocationStore: Checking location permission for refresh');
      const hasPermission = await checkOrRequestLocationPermission();
      console.log(
        'LocationStore: Permission check result for refresh:',
        hasPermission
      );

      if (!hasPermission) {
        console.log(
          'LocationStore: Permission denied during refresh, using default location'
        );
        clearTimeout(safetyTimeoutId); // Clear safety timeout
        set({
          permissionDenied: true,
          location: DEFAULT_LOCATION,
          loading: false,
          error: 'Location permission denied.',
        });
        return;
      }

      // Permission granted, fetch location
      console.log(
        'LocationStore: Permission granted for refresh, fetching location'
      );
      set({ permissionDenied: false });

      const fetchedLocation = await fetchCurrentLocation();
      console.log(
        'LocationStore: Location refreshed successfully',
        fetchedLocation
      );

      clearTimeout(safetyTimeoutId); // Clear safety timeout
      set({ location: fetchedLocation, loading: false, error: null });
      console.log('LocationStore: State updated with refreshed location');
    } catch (err: any) {
      console.error('LocationStore: Error in refreshLocation', err);
      clearTimeout(safetyTimeoutId); // Clear safety timeout
      set({
        error: err.message || 'Failed to refresh location',
        // Keep existing location on refresh error, don't reset to default
        loading: false,
      });
      console.log('LocationStore: Set error state but kept existing location');
    }
  },

  // Action to open settings
  openLocationSettings: () => {
    openDeviceLocationSettings();
    // Optionally reset permissionDenied state here if desired,
    // but checkOrRequest will handle it on next load/refresh
    // set({ permissionDenied: false });
  },

  // Selector for getting location with fallback
  getLocationWithFallback: () => {
    // Zustand selectors automatically use the latest state
    return get().location || DEFAULT_LOCATION;
  },
}));
