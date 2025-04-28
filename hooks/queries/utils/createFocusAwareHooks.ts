import { useIsFocused } from '@react-navigation/native';
import { useRefreshOnFocus } from '@/lib/react-query-native';

// Define a type for query results that might have a refetch function
interface QueryResultWithRefetch {
  refetch: () => Promise<unknown>;
  [key: string]: any;
}

/**
 * Creates a focus-aware version of a query hook
 *
 * This will:
 * 1. Only enable the query when the screen is focused
 * 2. Refresh the query when the screen is focused again
 *
 * @param useQueryHook The original query hook
 * @returns A focus-aware version of the query hook
 */
export function createFocusAwareQueryHook<
  TOptions extends object,
  TResult extends Record<string, any>
>(useQueryHook: (options: TOptions) => TResult) {
  return function useFocusAwareQuery(
    options: TOptions & { enabled?: boolean }
  ): TResult {
    const isFocused = useIsFocused();

    // Only enable the query when the screen is focused
    const enabled = options.enabled !== false && isFocused;

    // Call the original hook with modified options
    const result = useQueryHook({
      ...options,
      enabled,
      // Add subscribed option to disable query when screen is not focused
      subscribed: isFocused,
    });

    // Add refresh on focus behavior
    if (
      result &&
      typeof result === 'object' &&
      'refetch' in result &&
      typeof result.refetch === 'function'
    ) {
      // Type assertion to ensure TypeScript knows refetch returns a Promise
      const refetch = result.refetch as () => Promise<unknown>;
      useRefreshOnFocus(refetch);
    }

    return result;
  };
}

/**
 * Creates focus-aware versions of multiple query hooks
 *
 * @param hooks Object containing query hooks
 * @returns Object containing focus-aware versions of the query hooks
 */
export function createFocusAwareQueryHooks<
  T extends Record<string, (options: any) => any>
>(
  hooks: T
): {
  [K in keyof T]: ReturnType<
    typeof createFocusAwareQueryHook<Parameters<T[K]>[0], ReturnType<T[K]>>
  >;
} {
  const result: any = {};

  for (const key in hooks) {
    result[key] = createFocusAwareQueryHook(hooks[key]);
  }

  return result;
}

/**
 * Example usage:
 *
 * // Original hooks
 * const stationHooks = {
 *   useNearbyStations,
 *   useStationDetails,
 *   useFavoriteStations,
 * };
 *
 * // Create focus-aware versions
 * export const {
 *   useNearbyStations: useFocusAwareNearbyStations,
 *   useStationDetails: useFocusAwareStationDetails,
 *   useFavoriteStations: useFocusAwareFavoriteStations,
 * } = createFocusAwareQueryHooks(stationHooks);
 */
