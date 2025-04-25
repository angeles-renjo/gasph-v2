// Import the new hooks
import { useSplashScreenManager } from './useSplashScreenManager';
import { useAuthRedirect } from './useAuthRedirect';

/**
 * Custom hook to orchestrate app initialization logic by calling specialized hooks.
 */
export function useAppInitialization() {
  // Manage splash screen visibility
  const isSplashHidden = useSplashScreenManager();

  // Handle authentication-based redirection, passing splash screen state
  useAuthRedirect(isSplashHidden);

  // This hook now acts as a coordinator and doesn't need its own complex logic.
}
