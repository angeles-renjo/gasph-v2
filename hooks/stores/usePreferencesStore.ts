import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices';

// Define navigation app type
export type NavAppKey = 'GOOGLE_MAPS' | 'WAZE' | 'DEFAULT_MAPS' | null;

interface PreferencesState {
  defaultFuelType: FuelType | null;
  setDefaultFuelType: (fuelType: FuelType | null) => void;

  // Add navigation app preference
  preferredNavApp: NavAppKey;
  setPreferredNavApp: (app: NavAppKey) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      // Default value: No specific fuel type preferred initially
      defaultFuelType: null,

      // Add navigation app preference with null default
      preferredNavApp: null,

      // Action to update the fuel type preference
      setDefaultFuelType: (fuelType) => set({ defaultFuelType: fuelType }),

      // Action to update navigation app preference
      setPreferredNavApp: (app) => set({ preferredNavApp: app }),
    }),
    {
      name: 'user-preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Include preferredNavApp in persisted state
      partialize: (state) => ({
        defaultFuelType: state.defaultFuelType,
        preferredNavApp: state.preferredNavApp,
      }),
    }
  )
);
