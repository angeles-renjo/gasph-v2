import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * Fix Google Maps dragging/panning not smooth on iOS (especially 120Hz displays).
 * This forces the UI thread to update at a higher frame rate by running
 * a continuous, non-impacting Reanimated animation in the background.
 * @see https://github.com/react-native-maps/react-native-maps/issues/4937#issuecomment-2393609394
 * @see https://github.com/react-native-maps/react-native-maps/issues/4937#issuecomment-2671939706
 */
export const useGoogleMapIosPerfFix = () => {
  const xPosition = useSharedValue(0);

  // This derived value creates a background animation loop.
  // It doesn't need to be connected to any view style.
  // Its purpose is to keep the UI thread active at a higher frame rate.
  useDerivedValue(() => {
    xPosition.value = 0; // Reset position
    xPosition.value = withRepeat(
      withTiming(100, {
        // Animate to an arbitrary value
        duration: 2000, // Over a longer duration
        easing: Easing.linear,
      }),
      -1, // Repeat indefinitely
      false // Do not reverse animation
    );
  }, []); // Empty dependency array ensures this runs once on mount

  // No return value needed, the hook's effect is the background animation.
};
