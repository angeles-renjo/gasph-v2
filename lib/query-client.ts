import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

// Create the query client with optimized settings for React Native
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes (reduced for mobile)
      gcTime: 1000 * 60 * 10, // 10 minutes (reduced for mobile)
      retry: Platform.OS === 'web' ? 1 : 2, // More retries on mobile
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: Platform.OS === 'web', // Only on web
      refetchOnReconnect: true, // Always refetch on reconnect
      // Default to false for React Native, will be managed by our custom hooks
      refetchOnMount: true,
    },
  },
});

export { queryClient };
