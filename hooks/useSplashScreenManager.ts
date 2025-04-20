import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/hooks/stores/useAuthStore';

/**
 * Manages the state and hiding logic for the splash screen based on authentication initialization.
 * @returns {boolean} isSplashHidden - Whether the splash screen has been hidden.
 */
export function useSplashScreenManager(): boolean {
  const { loading, initialized } = useAuthStore(); // Get auth loading/initialized state
  const [isSplashHidden, setIsSplashHidden] = useState(false); // State to track splash screen

  // --- Splash Screen Hiding Effect ---
  useEffect(() => {
    const isAuthLoading = loading;
    const isAuthNotInitialized = !initialized;
    const splashAlreadyHidden = isSplashHidden;

    // Nested Guard Clauses: Check each condition individually
    if (isAuthLoading) {
      return; // Exit if auth is loading
    }
    if (isAuthNotInitialized) {
      return; // Exit if auth not initialized
    }
    if (splashAlreadyHidden) {
      return; // Exit if splash already hidden
    }

    // --- Hide Splash Logic --- (Only runs if all guards passed)
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
        setIsSplashHidden(true);
      } catch (e) {
        console.warn('SplashScreen.hideAsync error:', e);
      }
    };
    hideSplash();
  }, [loading, initialized, isSplashHidden]);

  return isSplashHidden;
}
