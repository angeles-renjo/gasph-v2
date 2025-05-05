# React Query Optimization for React Native

This document outlines the optimizations made to improve the efficiency of React Query in our React Native application.

## Table of Contents

1. [Introduction](#introduction)
2. [React Native Specific Implementations](#react-native-specific-implementations)
3. [Focus-Aware Queries](#focus-aware-queries)
4. [Optimized Query Invalidation](#optimized-query-invalidation)
5. [Best Practices](#best-practices)

## Introduction

React Query is a powerful library for managing server state in React applications. However, it requires some specific optimizations for React Native to ensure optimal performance and battery usage. This document outlines the improvements made to our implementation.

## React Native Specific Implementations

We've implemented React Native specific features as recommended in the [React Query documentation](https://tanstack.com/query/latest/docs/framework/react/react-native):

### Online Status Management

We've implemented online status management using `NetInfo` to automatically refetch queries when the device reconnects to the internet:

```typescript
// lib/react-query-native.ts
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state: NetInfoState) => {
    setOnline(!!state.isConnected);
  });
});
```

### App Focus Management

We've implemented app focus management using `AppState` to automatically refetch queries when the app is brought back to the foreground:

```typescript
// lib/react-query-native.ts
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

const subscription = AppState.addEventListener('change', onAppStateChange);
```

## Focus-Aware Queries

We've created focus-aware versions of our query hooks to optimize performance by:

1. Only running queries when the screen is focused
2. Automatically refreshing data when the screen is focused again
3. Disabling queries when the screen is not focused to save resources

### Using Focus-Aware Hooks

```typescript
// Instead of:
const { data: nearbyStations } = useNearbyStations({ radiusKm: 5 });

// Use:
const { data: nearbyStations } = useFocusAwareNearbyStations({ radiusKm: 5 });
```

### Creating Focus-Aware Hooks

We've created a utility function to easily create focus-aware versions of query hooks:

```typescript
// hooks/queries/utils/createFocusAwareHooks.ts
export function createFocusAwareQueryHook<
  TOptions extends object,
  TResult extends Record<string, any>
>(useQueryHook: (options: TOptions) => TResult) {
  return function useFocusAwareQuery(
    options: TOptions & { enabled?: boolean }
  ): TResult {
    const isFocused = useIsFocused();
    const enabled = options.enabled !== false && isFocused;

    const result = useQueryHook({
      ...options,
      enabled,
      subscribed: isFocused,
    });

    if (result && typeof result === 'object' && 'refetch' in result) {
      useRefreshOnFocus(result.refetch as () => Promise<unknown>);
    }

    return result;
  };
}
```

## Optimized Query Invalidation

We've optimized query invalidation to reduce unnecessary refetches:

1. More targeted invalidation based on specific query keys
2. Better optimistic updates to improve user experience
3. Reduced unnecessary refetches by only invalidating affected queries

### Example: Optimized Price Confirmation

```typescript
// hooks/queries/prices/usePriceConfirmationOptimized.ts
onSuccess: (_, { reportId, stationId, fuelType }) => {
  // Create an array of queries to invalidate
  const queriesToInvalidate = [
    // Only invalidate the specific station detail
    queryKeys.stations.detail(stationId),
    // Only invalidate the specific best prices query if we have a fuel type
    fuelType
      ? queryKeys.prices.best.list({
          fuelType,
          location,
        })
      : queryKeys.prices.best.all(),
  ];

  // Invalidate all queries in parallel
  queriesToInvalidate.forEach((queryKey) => {
    queryClient.invalidateQueries({
      queryKey,
    });
  });
};
```

## Best Practices

Here are some best practices for using React Query in React Native:

1. **Use Focus-Aware Queries**: Always use focus-aware queries for screens that are not always visible to save battery and network resources.

2. **Optimize Query Keys**: Use specific query keys to avoid over-invalidation and unnecessary refetches.

3. **Use the `subscribed` Option**: The `subscribed` option allows you to control whether a query stays subscribed to updates. Use it to disable queries when a screen is not focused.

4. **Implement Proper Error Handling**: Always handle errors properly to provide a good user experience, especially for offline scenarios.

5. **Use Optimistic Updates**: Implement optimistic updates for mutations to provide a responsive user experience.

6. **Avoid Over-Fetching**: Be mindful of the amount of data you're fetching, especially on mobile networks.

7. **Use Proper Caching Strategies**: Configure appropriate `staleTime` and `gcTime` values based on the nature of your data.

8. **Monitor Performance**: Regularly monitor the performance of your queries and optimize as needed.

## Conclusion

By implementing these optimizations, we've significantly improved the performance and battery usage of our React Native application. These improvements ensure a better user experience and more efficient use of device resources.
