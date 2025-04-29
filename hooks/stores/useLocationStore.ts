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
    if (get().initialized || get().loading) return; // Prevent multiple initializations

    set({ loading: true, error: null, initialized: true });
    try {
      const hasPermission = await checkOrRequestLocationPermission();
      if (!hasPermission) {
        set({
          permissionDenied: true,
          location: DEFAULT_LOCATION,
          loading: false,
          error: 'Location permission denied.',
        });
        return;
      }

      // Permission granted, fetch location
      set({ permissionDenied: false }); // Ensure permissionDenied is false if granted
      const fetchedLocation = await fetchCurrentLocation();
      set({ location: fetchedLocation, loading: false, error: null });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to get location',
        location: DEFAULT_LOCATION, // Fallback to default on error
        loading: false,
      });
    }
  },

  // Action to manually refresh location
  refreshLocation: async () => {
    if (get().loading) return; // Prevent refresh while already loading

    set({ loading: true, error: null });
    try {
      const hasPermission = await checkOrRequestLocationPermission();
      if (!hasPermission) {
        set({
          permissionDenied: true,
          location: DEFAULT_LOCATION,
          loading: false,
          error: 'Location permission denied.',
        });
        return;
      }

      // Permission granted, fetch location
      set({ permissionDenied: false });
      const fetchedLocation = await fetchCurrentLocation();
      set({ location: fetchedLocation, loading: false, error: null });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to refresh location',
        // Keep existing location on refresh error, don't reset to default
        loading: false,
      });
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
