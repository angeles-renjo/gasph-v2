import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Assuming FuelType is exported from useBestPrices or a shared types file
// If not, we might need to define it here or import from the correct location.
// For now, assuming it's available via this path:
import type { FuelType } from '@/hooks/queries/prices/useBestPrices';

interface PreferencesState {
  defaultFuelType: FuelType | null;
  setDefaultFuelType: (fuelType: FuelType | null) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      // Default value: No specific fuel type preferred initially
      defaultFuelType: null,

      // Action to update the preference
      setDefaultFuelType: (fuelType) => set({ defaultFuelType: fuelType }),
    }),
    {
      name: 'user-preferences-storage', // Unique name for persistence
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the preference itself, not the setter function
      partialize: (state) => ({
        defaultFuelType: state.defaultFuelType,
      }),
    }
  )
);
