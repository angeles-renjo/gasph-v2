import { useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/hooks/stores/useAuthStore';
import { useAuth } from '@/hooks/useAuth';

/**
 * Handles navigation redirection based on user authentication status,
 * ensuring redirection only happens when auth state is initialized,
 * the router is ready, and the splash screen is hidden.
 * @param {boolean} isSplashHidden - Whether the splash screen has been hidden.
 */
export function useAuthRedirect(isSplashHidden: boolean) {
  const { user } = useAuth(); // Get user state
  const { loading } = useAuthStore(); // Get auth loading state
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState(); // Hook to check router readiness

  // --- Navigation Effect ---
  useEffect(() => {
    const isAuthLoading = loading;
    const isRouterReady = !!rootNavigationState?.key;
    const splashVisible = !isSplashHidden;

    // Nested Guard Clauses: Check each condition individually
    if (isAuthLoading) {
      return; // Exit if auth is loading
    }
    if (!isRouterReady) {
      return; // Exit if router isn't ready
    }
    if (splashVisible) {
      return; // Exit if splash is visible
    }

    // --- Navigation Logic --- (Only runs if all guards passed)
    const inTabsGroup = segments[0] === '(tabs)'; // Renamed for clarity
    const inAuthScreens = segments[0] === 'auth';

    // Imperative navigation logic
    if (!user && inTabsGroup) {
      // If not logged in and trying to access tabs, redirect to sign-in
      router.replace('/auth/sign-in');
    } else if (user && inAuthScreens) {
      // If logged in and on auth screens (sign-in/sign-up), redirect to home (tabs)
      router.replace('/');
    }
    // No action needed if user is logged in and in tabs, or not logged in and on auth screens
  }, [
    user,
    loading, // Removed 'initialized' as it's implicitly handled by splash screen state
    segments,
    rootNavigationState,
    router,
    isSplashHidden,
  ]);
}
